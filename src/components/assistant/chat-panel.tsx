"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatPanel({
  initialMessages,
  scopeType,
  scopeId,
  scopeLabel,
}: {
  initialMessages: Message[];
  scopeType: "firm" | "client" | "engagement";
  scopeId?: string;
  scopeLabel: string;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput("");
    setError(null);
    setMessages((m) => [...m, { role: "user", content: userMessage }]);
    setLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, message: userMessage, scopeType, scopeId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "The assistant could not respond.");
      setConversationId(json.conversationId);
      setMessages((m) => [...m, { role: "assistant", content: json.reply }]);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col rounded-md border border-neutral-200 bg-white shadow-elevation2">
      <div className="flex items-center gap-2 border-b border-neutral-200 px-4 py-3">
        <Sparkles className="h-4 w-4 text-ai" />
        <div>
          <p className="text-sm font-semibold text-neutral-900">Tax Assistant</p>
          <p className="text-xs text-neutral-400">Scoped to: {scopeLabel}</p>
        </div>
      </div>

      <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-sm text-neutral-400">
            Ask a question about this {scopeType === "firm" ? "firm" : scopeType}. Answers are grounded only in
            data you have access to and are drafts for your review, not filed positions.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[85%] rounded-md px-3 py-2 text-sm",
              m.role === "user"
                ? "ml-auto bg-primary-700 text-white"
                : "border border-ai/30 bg-ai/5 text-neutral-900"
            )}
          >
            {m.role === "assistant" && (
              <p className="mb-1 flex items-center gap-1 text-xs font-medium text-ai">
                <Sparkles className="h-3 w-3" /> AI-generated \u2014 review before relying on it
              </p>
            )}
            <p className="whitespace-pre-wrap">{m.content}</p>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Thinking\u2026
          </div>
        )}
        {error && <p className="text-sm text-status-danger">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 border-t border-neutral-200 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
          placeholder="Ask the Tax Assistant\u2026"
          className="h-10 flex-1 rounded-sm border border-neutral-200 px-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
        />
        <Button onClick={handleSend} disabled={loading} size="md" variant="ai">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
