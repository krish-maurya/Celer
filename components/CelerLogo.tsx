import { Poppins } from "next/font/google";

const poppins = Poppins({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
});

/**
 * Celer wordmark — a red-orange gradient bar to the left of the word "celer".
 * Faithful port of the supplied standalone HTML/CSS logo.
 *
 * size = font size of the wordmark in px; the bar scales relative to it.
 * tone = "dark" renders the dark rounded tile with the white bar (as used for
 *        the active product switcher in the rail).
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
      <span
        aria-hidden
        style={{
          // Faithful to the supplied logo: a long thick horizontal bar (0.9em × 0.16em)
          width: size * 0.62,
          height: size * 0.15,
          marginTop: size * 0.18,
          borderRadius: Math.max(2, size * 0.04),
          background: "linear-gradient(90deg, var(--brand-start), var(--brand-end))",
          flexShrink: 0,
        }}
      />
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

/** The filled dark rounded tile from the rail, containing just the gradient bar. */
export function CelerTile() {
  return (
    <span
      aria-hidden
      className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1f1f1f]"
    >
      <span
        style={{
          width: 21,
          height: 12,
          borderRadius: 3,
          background: "linear-gradient(90deg, var(--brand-start), var(--brand-end))",
        }}
      />
    </span>
  );
}
