import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, MarineForecast } from "../types";
import { Send, Sparkles, Anchor, HelpCircle, ArrowRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface OceanicChatProps {
  forecast: MarineForecast;
}

const PRESET_QUESTIONS = [
  "Is it safe to swim or surf here today?",
  "How do the swell period & wind direction align?",
  "What active marine life might I spot today?",
  "What thickness wetsuit do I need for this water temperature?",
];

export const OceanicChat: React.FC<OceanicChatProps> = ({ forecast }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize chat with a custom welcome from Oceanic AI
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "model",
        content: `Ahoy, maritime adventurer! 🌊 I'm **Oceanic AI**, your personal surf forecaster, divemaster, and seasoned marine biologist. 

I've analyzed the conditions for **${forecast.locationName}** (${forecast.coordinates}). 

Ask me anything! Whether you're wondering if a groundswell is hitting, want a safety recommendation for snorkeling, or want to know what wetsuit you'll need for ${forecast.current.tempWater}°F water, I've got your back.`,
        timestamp: new Date(),
      },
    ]);
  }, [forecast.locationName, forecast.coordinates, forecast.current.tempWater]);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Map history for API
      const historyPayload = messages.slice(1).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location: forecast.locationName,
          forecast: forecast,
          message: text,
          history: historyPayload,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to consult Oceanic AI.");
      }

      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "model",
        content: data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "model",
        content: `Blimey! ⛈️ I seem to have hit rough weather and lost connection with my sensors. Please try again! (Error: ${err.message})`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  return (
    <div className="flex flex-col h-full rounded-2xl glass-panel p-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-cyan-500/10 rounded-full border border-cyan-500/20 text-cyan-400">
            <Anchor className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-display">Consult Oceanic AI</h3>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono font-semibold">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              <span>Marine Science Advisor Active</span>
            </p>
          </div>
        </div>
        <HelpCircle className="w-4 h-4 text-slate-500" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4 text-xs leading-relaxed max-h-[350px] lg:max-h-[none]">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3.5 py-2.5 border ${
                  msg.role === "user"
                    ? "bg-cyan-500/10 text-cyan-100 border-cyan-500/20"
                    : "bg-slate-900/60 text-slate-300 border-slate-800"
                }`}
              >
                {/* Process bold lines and markdown bullets smoothly */}
                <div className="whitespace-pre-wrap space-y-1.5">
                  {msg.content.split("\n").map((line, lIdx) => {
                    // Check for markdown list items
                    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
                      const text = line.replace(/^[-*]\s+/, "");
                      return (
                        <div key={lIdx} className="flex items-start gap-1.5 ml-1">
                          <span className="text-cyan-400 mt-1">•</span>
                          <span>{parseMarkdownBold(text)}</span>
                        </div>
                      );
                    }
                    return <p key={lIdx}>{parseMarkdownBold(line)}</p>;
                  })}
                </div>
                <div className="text-[9px] font-mono text-slate-500 mt-2 text-right">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span className="text-[11px] text-slate-400 font-mono animate-pulse">Oceanic AI is consulting charts...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Prompts */}
      {messages.length <= 2 && !loading && (
        <div className="mb-3.5">
          <p className="text-[10px] text-slate-500 font-semibold mb-2 uppercase font-mono tracking-wider">Suggested Questions</p>
          <div className="flex flex-col gap-1.5">
            {PRESET_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="flex items-center justify-between text-[11px] text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/5 border border-slate-800 hover:border-cyan-500/20 rounded-lg p-2 text-left transition-all"
              >
                <span>{q}</span>
                <ArrowRight className="w-3 h-3 text-slate-600 flex-shrink-0 ml-1.5" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative mt-auto">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about current drift, wetsuits, swell periods...`}
          disabled={loading}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-4 pr-12 text-xs text-white focus:outline-none focus:border-cyan-500/70 placeholder-slate-600 focus:ring-1 focus:ring-cyan-500/20"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className={`absolute right-2 top-2 p-1.5 rounded-lg transition-colors ${
            input.trim() && !loading
              ? "bg-cyan-500 hover:bg-cyan-400 text-slate-950"
              : "text-slate-600 bg-slate-900"
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

// Simple custom helper to parse **bold** texts into JSX elements
function parseMarkdownBold(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="text-white font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
}
