import { describe, it, expect } from "vitest";
import { sanitizeSvg } from "@/lib/sanitize-svg";

describe("sanitizeSvg", () => {
  it("returns null for non-SVG or empty input", () => {
    expect(sanitizeSvg(null)).toBeNull();
    expect(sanitizeSvg("")).toBeNull();
    expect(sanitizeSvg("<div>nope</div>")).toBeNull();
  });

  it("keeps a clean math diagram intact", () => {
    const svg = `<svg viewBox="0 0 100 100"><rect x="10" y="10" width="20" height="20" fill="#3366ff"/><text x="5" y="50" font-size="12">3 + 4</text></svg>`;
    const out = sanitizeSvg(svg)!;
    expect(out).toContain("<rect");
    expect(out).toContain('fill="#3366ff"');
    expect(out).toContain("3 + 4");
  });

  it("strips <script> and its contents", () => {
    const out = sanitizeSvg(`<svg><script>alert(1)</script><circle cx="5" cy="5" r="3"/></svg>`)!;
    expect(out).not.toMatch(/script/i);
    expect(out).not.toContain("alert");
    expect(out).toContain("<circle");
  });

  it("removes on* event handler attributes", () => {
    const out = sanitizeSvg(`<svg><rect x="0" y="0" width="9" height="9" onload="alert(1)" onclick="x()"/></svg>`)!;
    expect(out).not.toMatch(/onload|onclick|alert/i);
    expect(out).toContain("<rect");
  });

  it("drops foreignObject subtrees and style/href vectors", () => {
    const out = sanitizeSvg(
      `<svg><foreignObject><body><img src=x onerror=alert(1)></body></foreignObject><a href="javascript:alert(1)">x</a><path d="M0 0L9 9"/></svg>`,
    )!;
    expect(out).not.toMatch(/foreignobject|javascript:|onerror/i);
    expect(out).toContain("<path");
    expect(out).toContain("x"); // <a> unwrapped, label text preserved
    expect(out).not.toContain("<a");
  });

  it("rejects markup that loses its svg root after cleaning", () => {
    expect(sanitizeSvg("<svg")).toBeNull();
  });
});
