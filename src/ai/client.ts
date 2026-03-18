import Anthropic from "@anthropic-ai/sdk";
import { decrypt } from "./crypto";

/**
 * Creates an Anthropic SDK client using the user's encrypted API key.
 * Each request gets its own client instance (BYOK per user).
 */
export function getAnthropicClient(encryptedApiKey: string): Anthropic {
  const apiKey = decrypt(encryptedApiKey);
  return new Anthropic({ apiKey });
}
