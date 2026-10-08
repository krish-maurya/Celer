import { Poppins } from "next/font/google";

const poppins = Poppins({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
});

/**
 * Celer wordmark — a red-orange gradient bar to the left of the word "celer".
 * Used on the login page.
 *
 * size = font size of the wordmark in px; the bar scales relative to it.
 */
export function CelerMark({
  size = 20,
  tone = "light",
}: {
  size?: number;
  tone?: "light" | "dark";
}) {
  return (
    <span
      aria-label="Celer"
      className="inline-flex select-none items-center"
      style={{ gap: size * 0.19 }}
    >
      <CelerBar size={size} />
      <span
        className={poppins.className}
        style={{
          fontSize: size,
          fontWeight: 400,
          lineHeight: 1,
          letterSpacing: "-0.01em",
          color: tone === "dark" ? "#fff" : "var(--ink)",
        }}
      >
        celer
      </span>
    </span>
  );
}

/**
 * The gradient bar on its own — the exact bar from the wordmark, with no text.
 * Same gradient and proportions as the logo bar (size = wordmark font size).
 */
export function CelerBar({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-label="Celer"
      role="img"
      className={`inline-block shrink-0 ${className ?? ""}`}
      style={{
        width: size * 0.62,
        height: size * 0.15,
        borderRadius: Math.max(2, size * 0.04),
        background: "linear-gradient(90deg, var(--brand-start), var(--brand-end))",
      }}
    />
  );
}
