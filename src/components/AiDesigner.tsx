import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { type Plant } from "wasp/entities";
import {
  useQuery,
  getAiChatSession,
  saveAiChatSession,
  saveDesignHistory,
} from "wasp/client/operations";
import {
  Sparkles,
  Send,
  X,
  Check,
  RefreshCw,
  MessageSquare,
  Loader2,
  Clock,
} from "lucide-react";
import {
  streamAiDesign,
  type LayoutCell,
  type SuccessionNote,
} from "../lib/aiStream";
import { AiGridPreview } from "./AiGridPreview";

type Message = {
  role: "user" | "assistant";
  content: string;
  layout?: LayoutCell[];
  explanation?: string;
  successionNotes?: SuccessionNote[];
};

type AiDesignerProps = {
  bed: {
    id: string;
    name: string;
    widthFt: number;
    lengthFt: number;
    shape: string | null;
    zone: { propertyId: string };
  };
  year: number;
  season: string;
  plants: Plant[];
  onAcceptLayout: (squares: Map<string, Plant>) => void;
  onClose: () => void;
};

export function AiDesigner({
  bed,
  year,
  season,
  plants,
  onAcceptLayout,
  onClose,
}: AiDesignerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [latestLayout, setLatestLayout] = useState<{
    layout: LayoutCell[];
    explanation: string;
    successionNotes: SuccessionNote[];
  } | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load previous chat session
  const { data: chatSession } = useQuery(getAiChatSession, {
    bedId: bed.id,
    year,
    season,
  });

  useEffect(() => {
    if (chatSession && !sessionLoaded) {
      try {
        const loaded = JSON.parse(chatSession.messagesJson) as Message[];
        if (loaded.length > 0) {
          setMessages(loaded);
          // Restore latest layout from loaded messages
          const lastWithLayout = [...loaded]
            .reverse()
            .find((m) => m.layout);
          if (lastWithLayout?.layout) {
            setLatestLayout({
              layout: lastWithLayout.layout,
              explanation: lastWithLayout.explanation ?? "",
              successionNotes: lastWithLayout.successionNotes ?? [],
            });
          }
        }
      } catch {
        // Ignore malformed JSON
      }
      setSessionLoaded(true);
    }
  }, [chatSession, sessionLoaded]);

  // Plant lookup map
  const plantLookup = useRef<Record<string, Plant>>({});
  useEffect(() => {
    const lookup: Record<string, Plant> = {};
    for (const p of plants) {
      lookup[p.id] = p;
    }
    plantLookup.current = lookup;
  }, [plants]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim() || isStreaming) return;

      const newUserMsg: Message = { role: "user", content: userMessage.trim() };
      const updatedMessages = [...messages, newUserMsg];
      setMessages(updatedMessages);
      setInput("");
      if (inputRef.current) inputRef.current.style.height = "auto";
      setIsStreaming(true);

      // Add empty assistant message for streaming
      const assistantMsg: Message = { role: "assistant", content: "" };
      setMessages((prev) => [...prev, assistantMsg]);

      const controller = await streamAiDesign({
        bedId: bed.id,
        propertyId: bed.zone.propertyId,
        year,
        season,
        messages: updatedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        onText: (chunk) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === "assistant") {
              updated[updated.length - 1] = {
                ...last,
                content: last.content + chunk,
              };
            }
            return updated;
          });
        },
        onLayout: (data) => {
          setLatestLayout(data);
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === "assistant") {
              updated[updated.length - 1] = {
                ...last,
                layout: data.layout,
                explanation: data.explanation,
                successionNotes: data.successionNotes,
              };
            }
            return updated;
          });
        },
        onError: (msg) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === "assistant") {
              updated[updated.length - 1] = {
                ...last,
                content:
                  last.content + `\n\n**Error:** ${msg}`,
              };
            }
            return updated;
          });
        },
        onDone: () => {
          setIsStreaming(false);
          // Persist chat session after each AI response
          setMessages((current) => {
            saveAiChatSession({
              bedId: bed.id,
              year,
              season,
              messagesJson: JSON.stringify(current),
            }).catch(console.error);
            return current;
          });
        },
      });

      abortRef.current = controller;
    },
    [messages, isStreaming, bed.id, bed.zone.propertyId, year, season],
  );

  function handleAcceptLayout() {
    if (!latestLayout) return;

    const squares = new Map<string, Plant>();
    for (const cell of latestLayout.layout) {
      const plant = plantLookup.current[cell.plantId];
      if (plant) {
        squares.set(`${cell.row}-${cell.col}`, plant);
      }
    }

    // Save design history with AI explanation
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    saveDesignHistory({
      bedId: bed.id,
      year,
      season,
      layoutJson: JSON.stringify(latestLayout.layout),
      prompt: lastUserMsg?.content ?? "",
      explanation: latestLayout.explanation,
      successionNotes: JSON.stringify(latestLayout.successionNotes),
    }).catch(console.error);

    onAcceptLayout(squares);
    onClose();
  }

  function handleStartOver() {
    abortRef.current?.abort();
    setMessages([]);
    setLatestLayout(null);
    setIsStreaming(false);
    setInput("");
    inputRef.current?.focus();
    // Clear saved session
    saveAiChatSession({
      bedId: bed.id,
      year,
      season,
      messagesJson: "[]",
    }).catch(console.error);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative flex w-full max-w-lg flex-col bg-white shadow-2xl sm:w-[28rem] md:w-[32rem]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent-600" />
            <h2 className="text-sm font-semibold text-neutral-900">
              Design with AI
            </h2>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
              {bed.name} &middot; {season} {year}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Sparkles className="mb-3 h-10 w-10 text-accent-300" />
              <p className="text-sm font-medium text-neutral-700">
                AI Garden Designer
              </p>
              <p className="mt-1 max-w-xs text-xs text-neutral-400">
                Describe what you'd like to grow and I'll design an
                optimized bed layout considering companions, rotation, and
                succession planting.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {[
                  "Design a salad garden",
                  "Maximize yield for this bed",
                  "Plan a Three Sisters garden",
                  "Pollinator-friendly layout",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => sendMessage(suggestion)}
                    className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs text-neutral-600 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary-600 text-white"
                    : "bg-neutral-100 text-neutral-800"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="space-y-2">
                    {msg.content && (
                      <div className="prose-chat">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}

                    {/* Layout preview */}
                    {msg.layout && (
                      <div className="mt-3 rounded-lg border border-accent-200 bg-white p-3">
                        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-accent-700">
                          <Sparkles className="h-3.5 w-3.5" />
                          AI Suggested Layout
                        </div>
                        <AiGridPreview
                          widthFt={bed.widthFt}
                          lengthFt={bed.lengthFt}
                          shape={bed.shape ?? "RECTANGLE"}
                          layout={msg.layout}
                          plantLookup={plantLookup.current}
                        />
                        {msg.explanation && (
                          <p className="mt-2 text-xs text-neutral-500">
                            {msg.explanation}
                          </p>
                        )}

                        {/* Succession notes */}
                        {msg.successionNotes &&
                          msg.successionNotes.length > 0 && (
                            <div className="mt-3 border-t border-neutral-100 pt-2">
                              <div className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-neutral-600">
                                <Clock className="h-3 w-3" />
                                Succession Planting
                              </div>
                              <div className="space-y-1">
                                {msg.successionNotes.map((note, j) => (
                                  <div
                                    key={j}
                                    className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-800"
                                  >
                                    <span className="font-medium">
                                      {note.cells}:
                                    </span>{" "}
                                    {note.timing}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    )}

                    {/* Streaming indicator */}
                    {isStreaming && i === messages.length - 1 && !msg.content && !msg.layout && (
                      <div className="flex items-center gap-1.5 text-neutral-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span className="text-xs">Thinking...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <span>{msg.content}</span>
                )}
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Accept/Modify bar when layout is available */}
        {latestLayout && !isStreaming && (
          <div className="flex items-center gap-2 border-t border-neutral-200 bg-accent-50 px-4 py-3">
            <button
              onClick={handleAcceptLayout}
              className="btn-primary flex-1"
            >
              <Check className="h-4 w-4" />
              Accept Layout
            </button>
            <button
              onClick={() => {
                inputRef.current?.focus();
              }}
              className="btn-secondary"
            >
              <MessageSquare className="h-4 w-4" />
              Modify
            </button>
            <button
              onClick={handleStartOver}
              className="btn-secondary"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-neutral-200 px-4 py-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                const el = e.target;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 160) + "px";
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                messages.length === 0
                  ? "What would you like to grow?"
                  : "Refine your design..."
              }
              rows={2}
              className="max-h-40 min-h-[3.5rem] flex-1 resize-none rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-800 placeholder-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isStreaming}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white transition-colors hover:bg-primary-700 disabled:bg-neutral-200 disabled:text-neutral-400"
            >
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleStartOver}
              className="mt-1.5 text-xs text-neutral-400 hover:text-neutral-600"
            >
              Start over
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
