import { config } from "wasp/client";
import { getSessionId } from "wasp/client/api";

export type LayoutCell = {
  row: number;
  col: number;
  plantId: string;
};

export type SuccessionNote = {
  cells: string;
  timing: string;
  plantId: string;
};

type SseEvent =
  | { type: "text"; content: string }
  | {
      type: "layout";
      layout: LayoutCell[];
      explanation: string;
      successionNotes: SuccessionNote[];
    }
  | { type: "error"; message: string }
  | { type: "done" };

export async function streamAiDesign(opts: {
  bedId: string;
  propertyId: string;
  year: number;
  season: string;
  messages: { role: string; content: string }[];
  onText: (chunk: string) => void;
  onLayout: (data: {
    layout: LayoutCell[];
    explanation: string;
    successionNotes: SuccessionNote[];
  }) => void;
  onError: (msg: string) => void;
  onDone: () => void;
}): Promise<AbortController> {
  const controller = new AbortController();

  try {
    const sessionId = getSessionId();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (sessionId) {
      headers["Authorization"] = `Bearer ${sessionId}`;
    }

    const response = await fetch(`${config.apiUrl}/api/ai/design-bed`, {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        bedId: opts.bedId,
        propertyId: opts.propertyId,
        year: opts.year,
        season: opts.season,
        messages: opts.messages,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: "Request failed" }));
      opts.onError(err.error || `HTTP ${response.status}`);
      opts.onDone();
      return controller;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      opts.onError("No response stream");
      opts.onDone();
      return controller;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Parse SSE events from buffer
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // Keep incomplete line in buffer

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;

        try {
          const event: SseEvent = JSON.parse(line.slice(6));

          switch (event.type) {
            case "text":
              opts.onText(event.content);
              break;
            case "layout":
              opts.onLayout({
                layout: event.layout,
                explanation: event.explanation,
                successionNotes: event.successionNotes,
              });
              break;
            case "error":
              opts.onError(event.message);
              break;
            case "done":
              opts.onDone();
              return controller;
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    }

    opts.onDone();
  } catch (err: any) {
    if (err.name !== "AbortError") {
      opts.onError(err.message || "Connection failed");
      opts.onDone();
    }
  }

  return controller;
}
