"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Send } from "lucide-react";
import {
  OPENROUTER_URL,
  OPENROUTER_KEY,
  tools,
  SYSTEM_PROMPT,
  processToolCallsAndFollowUp,
} from "@/lib/ai";

type Role = "system" | "user" | "assistant" | "tool";

type ChatMessage = {
  role: Role;
  content: string;
  name?: string;
  tool_call_id?: string;
};

type ToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };
type APIMsg =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; tool_calls?: ToolCall[] }
  | { role: "tool"; content: string; tool_call_id: string };
type ChatCompletionResponse = { choices?: Array<{ message?: { content?: string; tool_calls?: ToolCall[] } }> };

export default function Chat() {
  const [apiKey, setApiKey] = useState<string>("");
  const [apiKeyDraft, setApiKeyDraft] = useState<string>("");
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // OpenAI-compatible message history for API calls (system is added per request)
  const [apiHistory, setApiHistory] = useState<APIMsg[]>([]);
  const [showButton, setShowButton] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(OPENROUTER_KEY);
    if (stored) {
      setApiKey(stored);
    } else {
      setShowKeyModal(true);
    }
  }, []);

  useEffect(() => {
    // Autoscroll on new messages
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  const systemPrompt = SYSTEM_PROMPT;

  function openKeyModal() {
    setApiKeyDraft(apiKey || "");
    setShowKeyModal(true);
  }

  function handleSaveKey() {
    const val = apiKeyDraft.trim();
    if (!val) return;
    localStorage.setItem(OPENROUTER_KEY, val);
    setApiKey(val);
    setShowKeyModal(false);
  }

  async function sendMessage() {
    if (!apiKey || !input.trim()) return;
    setError(null);
    setBusy(true);
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    const referer = typeof window !== "undefined" ? window.location.origin : "";

    try {
      const payload = {
        model: "x-ai/grok-code-fast-1",
        messages: [
          { role: "system", content: systemPrompt },
          ...apiHistory,
          { role: "user", content: userMsg.content },
        ],
        tools,
        tool_choice: "auto" as const,
        temperature: 0.3,
      };

      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          ...(referer ? { "HTTP-Referer": referer, "X-Title": "DEF Habits - Jocko Chat" } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const data: ChatCompletionResponse = await res.json();
      const choice = data.choices?.[0];
      const msg = choice?.message;

      // Handle tool calls via shared helper
      if (msg?.tool_calls?.length) {
        // Record assistant tool call message in both UI and API history
        const assistantToolCall: ChatMessage = {
          role: "assistant",
          content: msg.content || "",
        };
        setMessages((m) => [...m, assistantToolCall]);
        setApiHistory((h) => [
          ...h,
          { role: "user", content: userMsg.content },
          { role: "assistant", content: msg.content || "", tool_calls: msg.tool_calls },
        ]);

        const { toolApiMsgs, toolResults, finalContent: finalMsg } = await processToolCallsAndFollowUp({
          initialAssistant: { content: msg.content || "", tool_calls: msg.tool_calls },
          systemPrompt,
          userMsg: userMsg.content,
          apiKey,
          referer,
          xTitle: "DEF Habits - Jocko Chat",
          model: "x-ai/grok-code-fast-1",
          history: apiHistory,
        });

        // Show tool results in UI and add to API history
        const toolMessagesForUI: ChatMessage[] = toolResults.map((t) => ({
          role: "tool",
          content: t.content,
          tool_call_id: t.tool_call_id,
          name: t.name,
        }));
        setMessages((m) => [...m, ...toolMessagesForUI]);
        setApiHistory((h) => [...h, ...toolApiMsgs]);

        // Final assistant response
        setMessages((m) => [...m, { role: "assistant", content: finalMsg }]);
        setApiHistory((h) => [...h, { role: "assistant", content: finalMsg }]);
      } else {
        // Regular assistant response
        const content = msg?.content ?? "";
        setMessages((m) => [...m, { role: "assistant", content }]);
        setApiHistory((h) => [
          ...h,
          { role: "user", content: userMsg.content },
          { role: "assistant", content },
        ]);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg || "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 bg-black h-full">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-white flex items-center gap-2"><Image src="/jocko-no-bg.png" alt="Jocko" width={40} height={40} className="rounded-xs h-10" /> Chat w/ Jocko</div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openKeyModal}>
            {apiKey ? "Change key" : "Set key"}
          </Button>
        </div>
      </div>

      <div
        ref={listRef}
        className="flex-1 max-h-[50vh] overflow-y-auto border border-border rounded p-3 space-y-6 bg-neutral-950"
      >
        {messages.length === 0 && (
          <div className="text-sm text-gray-400">
            Ask me about your progress, discipline, or priorities.
          </div>
        )}
        {messages.filter(m => m.content.trim()).map((m, idx) => (
          <div key={idx} className={`space-y-2 ${m.role === "user" ? "flex flex-col items-end" : ""}`}>
            <div className="text-xs text-gray-500 flex items-center gap-2 uppercase">
              {m.role === "assistant" && (
                <Image src="/jocko-no-bg.png" alt="Jocko" width={20} height={20} className="rounded-xs h-5" />
              )}{m.role === "tool" && (
                <Image src="/hammer.png" alt="Hammer" width={20} height={20} className="rounded-xs h-5" />
              )}{m.role === "user"
                ? "You"
                : m.role === "assistant"
                ? "Jocko"
                : m.role === "tool"
                ? `Tool: ${m.name ?? "result"}`
                : m.role}
            </div>
            {m.role === "tool" ? null : (
              <div className="text-xs whitespace-pre-wrap leading-relaxed break-words">{m.content}</div>
            )}
          </div>
        ))}
        {busy && (
          <div className="space-y-1">
            <div className="text-xs text-gray-500 uppercase flex items-center gap-2"><Image src="/jocko-no-bg.png" alt="Jocko" width={20} height={20} className="rounded-xs h-5" /> Jocko</div>
            <div className="text-xs whitespace-pre-wrap break-words italic text-gray-400">Thinking...</div>
          </div>
        )}
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div className="relative">
        <textarea
          placeholder="Type your message"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowButton(e.target.value.trim().length > 0);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (input.trim()) {
                sendMessage();
              }
            }
          }}
          disabled={!apiKey || busy}
          className="w-full min-h-[80px] resize-none rounded-md border border-input bg-background px-3 py-2 pr-12 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          rows={3}
        />
        {showButton && (
          <Button
            onClick={sendMessage}
            disabled={!apiKey || busy}
            className="absolute bottom-4 right-2 h-8 w-8 rounded-full p-0"
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => apiKey ? setShowKeyModal(false) : null} />
          <div className="relative z-10 w-full max-w-xs rounded-lg border border-border bg-neutral-900 p-4 shadow-xl">
            <div className="text-lg font-semibold mb-2">Enter OpenRouter API Key</div>
            <p className="text-xs text-gray-400 mb-3">Stored locally only. You can create a key on openrouter.ai.</p>
            <Input
              placeholder="sk-or-v1-..."
              type={showKey ? "text" : "password"}
              value={apiKeyDraft}
              onChange={(e) => setApiKeyDraft(e.target.value)}
            />
            <div className="mt-2 flex items-center gap-2">
              <Checkbox id="show-key" checked={showKey} onCheckedChange={(v) => setShowKey(v === true)} />
              <Label htmlFor="show-key">Show key</Label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              {apiKey && (
                <Button variant="ghost" onClick={() => setShowKeyModal(false)}>Cancel</Button>
              )}
              <Button onClick={handleSaveKey} disabled={!apiKeyDraft.trim()}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
