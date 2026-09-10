const PALETTES = [
  { bg: "#fde68a", fg: "#92400e" },
  { bg: "#bfdbfe", fg: "#1e40af" },
  { bg: "#bbf7d0", fg: "#166534" },
  { bg: "#fbcfe8", fg: "#9d174d" },
  { bg: "#ddd6fe", fg: "#5b21b6" },
  { bg: "#fed7aa", fg: "#9a3412" },
  { bg: "#a5f3fc", fg: "#155e75" },
  { bg: "#c4a6f5", fg: "#4b2f7d" },
  { bg: "#ff7a1a", fg: "#ffffff" },
];

// Deterministic color per email address so a sender always looks the same.
export function toneFor(email: string) {
  let h = 0;
  for (let i = 0; i < email.length; i++) h = (h * 31 + email.charCodeAt(i)) >>> 0;
  return PALETTES[h % PALETTES.length];
}
