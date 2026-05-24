import { describe, it, expect } from "vitest";
import { aiProviderMode } from "@/lib/ai/mode";

describe("aiProviderMode", () => {
  it("defaults to mock when AI_PROVIDER is unset", () => {
    expect(aiProviderMode({ ANTHROPIC_API_KEY: "sk-ant-x" })).toBe("mock");
  });

  it("stays mock when AI_PROVIDER=claude but no key is present", () => {
    expect(aiProviderMode({ AI_PROVIDER: "claude" })).toBe("mock");
    expect(aiProviderMode({ AI_PROVIDER: "claude", ANTHROPIC_API_KEY: "  " })).toBe("mock");
  });

  it("uses claude only with explicit opt-in AND a key", () => {
    expect(aiProviderMode({ AI_PROVIDER: "claude", ANTHROPIC_API_KEY: "sk-ant-x" })).toBe("claude");
    expect(aiProviderMode({ AI_PROVIDER: "CLAUDE", ANTHROPIC_API_KEY: "sk-ant-x" })).toBe("claude");
  });

  it("treats any other AI_PROVIDER value as mock", () => {
    expect(aiProviderMode({ AI_PROVIDER: "openai", ANTHROPIC_API_KEY: "sk-ant-x" })).toBe("mock");
    expect(aiProviderMode({ AI_PROVIDER: "", ANTHROPIC_API_KEY: "sk-ant-x" })).toBe("mock");
  });
});
