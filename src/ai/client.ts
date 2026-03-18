import Anthropic from "@anthropic-ai/sdk";
import { decrypt } from "./crypto";

export type AiProvider = "anthropic" | "openrouter";

const PROVIDER_CONFIG: Record<AiProvider, { baseURL?: string }> = {
  anthropic: {},
  openrouter: {
    baseURL: "https://openrouter.ai/api",
  },
};

/**
 * Creates an Anthropic SDK client for the user's provider + key.
 * OpenRouter supports the Anthropic API format natively.
 */
export function getAnthropicClient(
  encryptedApiKey: string,
  provider: AiProvider = "anthropic",
): Anthropic {
  const apiKey = decrypt(encryptedApiKey);
  const config = PROVIDER_CONFIG[provider] ?? {};

  return new Anthropic({
    apiKey,
    ...config,
  });
}
