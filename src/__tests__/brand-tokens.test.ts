import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const css = readFileSync(resolve(__dirname, "../styles.css"), "utf8");
const rootBlock = css.match(/:root\s*\{([\s\S]*?)\}/)?.[1] ?? "";
const themeBlock = css.match(/@theme inline\s*\{([\s\S]*?)\}/)?.[1] ?? "";
const root = readFileSync(resolve(__dirname, "../routes/__root.tsx"), "utf8");

function token(block: string, name: string) {
  return block.match(new RegExp(`${name}\\s*:\\s*([^;]+);`))?.[1].trim();
}

describe("Skyport brand palette", () => {
  it("primary is the SkyportHospitality blue", () => {
    expect(token(rootBlock, "--primary")).toBe("oklch(0.52 0.14 245)");
  });
  it("primary-dark is the navy", () => {
    expect(token(rootBlock, "--primary-dark")).toBe("oklch(0.36 0.09 245)");
  });
  it("accent is the orange/gold", () => {
    expect(token(rootBlock, "--accent")).toBe("oklch(0.78 0.17 75)");
  });
  it("hero gradient blends navy → blue", () => {
    const g = token(rootBlock, "--gradient-hero") ?? "";
    expect(g).toContain("oklch(0.36 0.09 245)");
    expect(g).toContain("oklch(0.52 0.14 245)");
  });
});

describe("Skyport typography", () => {
  it("registers Jost as the display font", () => {
    expect(token(themeBlock, "--font-display")).toMatch(/^"Jost"/);
  });
  it("registers Inter as the body font", () => {
    expect(token(themeBlock, "--font-body")).toMatch(/^"Inter"/);
  });
  it("body uses the body font", () => {
    expect(css).toMatch(/body\s*\{[^}]*font-family:\s*var\(--font-body\)/);
  });
  it("headings use the display font", () => {
    expect(css).toMatch(/h1,\s*h2,\s*h3[^{]*\{[^}]*font-family:\s*var\(--font-display\)/);
  });
  it("Google Fonts link loads Jost + Inter", () => {
    expect(root).toMatch(/fonts\.googleapis\.com\/css2\?family=Jost[^"]*Inter/);
  });
});

describe("Pages use semantic tokens (no stray Tailwind color literals)", () => {
  const files = [
    "../routes/index.tsx",
    "../routes/auth.tsx",
    "../routes/_authenticated/dashboard.tsx",
    "../routes/_authenticated/courses.$courseId.tsx",
    "../routes/_authenticated/learn.$chapterId.tsx",
    "../routes/_authenticated/quiz.$quizId.tsx",
    "../routes/_authenticated/certificate.$courseId.tsx",
  ];
  // off-brand palette classes: amber/blue/indigo/slate/gray/green/red/yellow/rose/emerald with a numeric step
  const offBrand =
    /\b(?:bg|text|border|ring|from|to|via)-(?:amber|blue|indigo|slate|gray|green|red|yellow|rose|emerald|sky|cyan|teal|violet|purple|pink|fuchsia|lime|orange|stone|zinc|neutral)-\d{2,3}\b/;
  for (const f of files) {
    it(`${f} uses only semantic color tokens`, () => {
      const src = readFileSync(resolve(__dirname, f), "utf8");
      const m = src.match(offBrand);
      expect(m, `Off-brand color class found: ${m?.[0]}`).toBeNull();
    });
  }
});