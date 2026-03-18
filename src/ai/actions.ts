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

type SaveKeyArgs = { apiKey: string };

export const saveAiApiKey: SaveAiApiKey<SaveKeyArgs, void> = async (
  args,
  context,
) => {
  if (!context.user) throw new HttpError(401);

  const key = args.apiKey.trim();
  if (!key.startsWith("sk-ant-")) {
    throw new HttpError(400, "Invalid Anthropic API key format");
  }

  const encrypted = encrypt(key);

  await context.entities.User.update({
    where: { id: context.user.id },
    data: { aiApiKey: encrypted },
  });
};

type KeyStatusResult = { hasKey: boolean; keyHint: string | null };

export const getAiKeyStatus: GetAiKeyStatus<void, KeyStatusResult> = async (
  _args,
  context,
) => {
  if (!context.user) throw new HttpError(401);

  const user = await context.entities.User.findUnique({
    where: { id: context.user.id },
    select: { aiApiKey: true },
  });

  if (!user?.aiApiKey) {
    return { hasKey: false, keyHint: null };
  }

  // Show last 4 chars of the original key as a hint
  // We can't decrypt just for a hint, so store the hint separately or just show "configured"
  return { hasKey: true, keyHint: "sk-ant-...configured" };
};

export const deleteAiApiKey: DeleteAiApiKey<void, void> = async (
  _args,
  context,
) => {
  if (!context.user) throw new HttpError(401);

  await context.entities.User.update({
    where: { id: context.user.id },
    data: { aiApiKey: null },
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
