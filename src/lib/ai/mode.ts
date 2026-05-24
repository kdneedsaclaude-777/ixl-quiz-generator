export type AiProviderMode = "mock" | "claude";

// Phase 6: live Claude generation is strictly opt-in. Even with a valid
// ANTHROPIC_API_KEY present, the deterministic mock generator stays the
// default so demos and tests are reproducible and cost nothing. Set
// AI_PROVIDER=claude (and provide the key) to use the live model.
export function aiProviderMode(
  env: NodeJS.ProcessEnv = process.env,
): AiProviderMode {
  const requested = (env.AI_PROVIDER ?? "mock").trim().toLowerCase();
  const hasKey = (env.ANTHROPIC_API_KEY ?? "").trim().length > 0;
  return requested === "claude" && hasKey ? "claude" : "mock";
}
