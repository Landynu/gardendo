import {
  type SaveAiApiKey,
  type GetAiKeyStatus,
  type DeleteAiApiKey,
  type UpdateAiSystemPrompt,
} from "wasp/server/operations";
import { HttpError } from "wasp/server";
import { encrypt } from "./crypto";
import { requirePropertyMember } from "../lib/auth";

// ─── API KEY MANAGEMENT ────────────────────

type SaveKeyArgs = { apiKey: string; provider: string };

export const saveAiApiKey: SaveAiApiKey<SaveKeyArgs, void> = async (
  args,
  context,
) => {
  if (!context.user) throw new HttpError(401);

  const key = args.apiKey.trim();
  const provider = args.provider === "openrouter" ? "openrouter" : "anthropic";

  // Validate key format
  if (provider === "anthropic" && !key.startsWith("sk-ant-")) {
    throw new HttpError(400, "Invalid Anthropic API key format (should start with sk-ant-)");
  }
  if (provider === "openrouter" && !key.startsWith("sk-or-")) {
    throw new HttpError(400, "Invalid OpenRouter API key format (should start with sk-or-)");
  }

  const encrypted = encrypt(key);

  await context.entities.User.update({
    where: { id: context.user.id },
    data: { aiApiKey: encrypted, aiProvider: provider },
  });
};

type KeyStatusResult = {
  hasKey: boolean;
  provider: string;
};

export const getAiKeyStatus: GetAiKeyStatus<void, KeyStatusResult> = async (
  _args,
  context,
) => {
  if (!context.user) throw new HttpError(401);

  const user = await context.entities.User.findUnique({
    where: { id: context.user.id },
    select: { aiApiKey: true, aiProvider: true },
  });

  if (!user?.aiApiKey) {
    return { hasKey: false, provider: "anthropic" };
  }

  return { hasKey: true, provider: user.aiProvider };
};

export const deleteAiApiKey: DeleteAiApiKey<void, void> = async (
  _args,
  context,
) => {
  if (!context.user) throw new HttpError(401);

  await context.entities.User.update({
    where: { id: context.user.id },
    data: { aiApiKey: null, aiProvider: "anthropic" },
  });
};

// ─── SYSTEM PROMPT ─────────────────────────

type UpdatePromptArgs = { propertyId: string; prompt: string | null };

export const updateAiSystemPrompt: UpdateAiSystemPrompt<
  UpdatePromptArgs,
  void
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);
  await requirePropertyMember(context, args.propertyId);

  await context.entities.Property.update({
    where: { id: args.propertyId },
    data: { aiSystemPrompt: args.prompt },
  });
};
