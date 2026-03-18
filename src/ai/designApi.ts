import { type AiDesignBed } from "wasp/server/api";
import { HttpError } from "wasp/server";
import { getAnthropicClient, type AiProvider } from "./client";
import { buildBedDesignContext } from "./context";
import { DEFAULT_SYSTEM_PROMPT, GENERATE_LAYOUT_TOOL } from "./prompts";
import { requirePropertyMember } from "../lib/auth";

export const aiDesignBed: AiDesignBed = async (req, res, context) => {
  if (!context.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { bedId, propertyId, year, season, messages } = req.body;

  if (!bedId || !propertyId || !year || !season || !messages) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  // Verify property membership
  try {
    await requirePropertyMember(context, propertyId);
  } catch {
    res.status(403).json({ error: "Not a member of this property" });
    return;
  }

  // Get user's encrypted API key
  const user = await context.entities.User.findUnique({
    where: { id: context.user.id },
    select: { aiApiKey: true, aiProvider: true },
  });

  if (!user?.aiApiKey) {
    res.status(400).json({
      error: "No AI API key configured. Add your API key in Settings.",
    });
    return;
  }

  // Build context
  let contextText: string;
  try {
    const result = await buildBedDesignContext(
      context.entities,
      propertyId,
      bedId,
      year,
      season,
    );
    contextText = result.contextText;
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to build context" });
    return;
  }

  // Get custom system prompt or use default
  const property = await context.entities.Property.findUnique({
    where: { id: propertyId },
    select: { aiSystemPrompt: true },
  });

  const basePrompt = property?.aiSystemPrompt || DEFAULT_SYSTEM_PROMPT;
  const systemPrompt = `${basePrompt}\n\n---\n\n# Garden Data\n\n${contextText}`;

  // Set up SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    const anthropic = getAnthropicClient(
      user.aiApiKey,
      (user.aiProvider ?? "anthropic") as AiProvider,
    );

    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      tools: [GENERATE_LAYOUT_TOOL],
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    // Track tool use input accumulation
    let currentToolInput = "";
    let inToolUse = false;

    stream.on("text", (text: string) => {
      res.write(`data: ${JSON.stringify({ type: "text", content: text })}\n\n`);
    });

    stream.on("inputJson", (_delta: string, snapshot: unknown) => {
      inToolUse = true;
      currentToolInput = typeof snapshot === "string" ? snapshot : JSON.stringify(snapshot);
    });

    stream.on("message", (message: any) => {
      // Check for tool use in the final message
      for (const block of message.content) {
        if (block.type === "tool_use" && block.name === "generate_bed_layout") {
          const input = block.input as {
            layout: { row: number; col: number; plantId: string }[];
            explanation: string;
            successionNotes?: {
              cells: string;
              timing: string;
              plantId: string;
            }[];
          };

          res.write(
            `data: ${JSON.stringify({
              type: "layout",
              layout: input.layout,
              explanation: input.explanation,
              successionNotes: input.successionNotes ?? [],
            })}\n\n`,
          );
        }
      }
    });

    stream.on("error", (err: any) => {
      const message =
        err?.status === 401
          ? "Invalid API key. Please check your Anthropic API key in Settings."
          : err?.message || "AI request failed";
      res.write(`data: ${JSON.stringify({ type: "error", message })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
      res.end();
    });

    stream.on("end", () => {
      res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
      res.end();
    });

    // Handle client disconnect
    req.on("close", () => {
      stream.abort();
    });
  } catch (err: any) {
    const message = err?.message || "Failed to connect to AI";
    res.write(`data: ${JSON.stringify({ type: "error", message })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    res.end();
  }
};
