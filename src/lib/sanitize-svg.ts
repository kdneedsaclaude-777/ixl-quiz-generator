// Question visuals are SVG strings produced by an LLM (or the mock). They are
// injected into the DOM, so they are an XSS surface and must be sanitized with
// a strict allowlist BEFORE rendering. This runs on the server (no DOM), so we
// tokenize tags rather than rely on DOMParser.
//
// Strategy: drop dangerous elements wholesale (script/style/foreignObject and
// their content), then walk every remaining tag and keep it only if both the
// element name and each attribute are allowlisted. Unknown elements are
// unwrapped (tag removed, inner text kept) so a stray <a> can't smuggle a
// handler while still showing its label.

const ELEMENT_ALLOWLIST = new Set([
  "svg", "g", "path", "rect", "circle", "ellipse", "line", "polyline",
  "polygon", "text", "tspan", "defs", "marker", "title", "desc", "use",
]);

// Elements whose entire subtree must be discarded.
const ELEMENT_BLOCKLIST = ["script", "style", "foreignobject", "iframe", "image"];

const ATTR_ALLOWLIST = new Set([
  "x", "y", "cx", "cy", "r", "rx", "ry", "x1", "y1", "x2", "y2", "d",
  "points", "width", "height", "fill", "stroke", "stroke-width",
  "stroke-dasharray", "stroke-linecap", "stroke-linejoin", "transform",
  "viewbox", "xmlns", "font-size", "font-family", "font-weight",
  "text-anchor", "dominant-baseline", "opacity", "fill-opacity",
  "stroke-opacity", "class", "id", "dx", "dy", "marker-end", "marker-start",
  "preserveaspectratio",
]);

function stripBlockedSubtrees(svg: string): string {
  let out = svg;
  for (const tag of ELEMENT_BLOCKLIST) {
    // Paired tags with content, and self-closing/standalone forms.
    out = out.replace(new RegExp(`<${tag}[\\s\\S]*?</${tag}\\s*>`, "gi"), "");
    out = out.replace(new RegExp(`<${tag}[^>]*/?>`, "gi"), "");
  }
  // Comments, CDATA, DOCTYPE, processing instructions / XML decls.
  out = out.replace(/<!--[\s\S]*?-->/g, "");
  out = out.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, "");
  out = out.replace(/<![^>]*>/g, "");
  out = out.replace(/<\?[\s\S]*?\?>/g, "");
  return out;
}

function sanitizeAttributes(rawAttrs: string): string {
  const kept: string[] = [];
  const attrRe = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("[^"]*"|'[^']*'|[^\s"'>]+)/g;
  let m: RegExpExecArray | null;
  while ((m = attrRe.exec(rawAttrs)) !== null) {
    const name = m[1].toLowerCase();
    let value = m[2];
    if (value[0] === '"' || value[0] === "'") value = value.slice(1, -1);
    if (!ATTR_ALLOWLIST.has(name)) continue; // drops every on*, href, style, data-*
    // Belt-and-suspenders: no script URIs even on allowlisted attrs.
    if (/(javascript:|data:text\/html|expression\s*\(|&#)/i.test(value)) continue;
    const safeValue = value.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    kept.push(`${name}="${safeValue}"`);
  }
  return kept.length ? " " + kept.join(" ") : "";
}

// Returns sanitized SVG markup, or null if the input has no usable <svg> root.
export function sanitizeSvg(input: string | null | undefined): string | null {
  if (!input || typeof input !== "string") return null;
  let svg = input.trim();
  if (!/<svg[\s>]/i.test(svg)) return null;

  svg = stripBlockedSubtrees(svg);

  svg = svg.replace(/<\/?([a-zA-Z][a-zA-Z0-9:-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g,
    (_full, rawName: string, rawAttrs: string, selfClose: string) => {
      const name = rawName.toLowerCase();
      const isClosing = _full.startsWith("</");
      if (!ELEMENT_ALLOWLIST.has(name)) return ""; // unwrap unknown elements
      if (isClosing) return `</${name}>`;
      return `<${name}${sanitizeAttributes(rawAttrs)}${selfClose ? " /" : ""}>`;
    },
  );

  // Must still contain a root <svg> after sanitization.
  if (!/<svg[\s\S]*<\/svg>/i.test(svg)) return null;
  return svg.trim();
}
