import { initials } from "@/lib/types";

export function Avatar({
  name,
  email,
  url,
  tone,
  size = 44,
}: {
  name?: string | null;
  email: string;
  url?: string;
  tone?: { bg: string; fg: string; label?: string };
  size?: number;
}) {
  const label = tone?.label ?? initials(name, email);
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full font-medium"
      style={{
        width: size,
        height: size,
        background: url ? "#e9e9e7" : tone?.bg ?? "#141414",
        color: tone?.fg ?? "#ffffff",
        fontSize: size * (tone?.label ? 0.3 : 0.36),
      }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name ?? email} className="h-full w-full object-cover" />
      ) : (
        <span className="leading-none tracking-tight">{label}</span>
      )}
    </span>
  );
}

export function VerifiedBadge({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-label="Verified" className="shrink-0">
      <path
        fill="#38a8e6"
        d="m12 1.6 2.2 1.8 2.8-.3 1.2 2.6 2.6 1.2-.3 2.8L22.4 12l-1.9 2.3.3 2.8-2.6 1.2-1.2 2.6-2.8-.3L12 22.4l-2.3-1.9-2.8.3-1.2-2.6-2.6-1.2.3-2.8L1.6 12l1.9-2.3-.3-2.8 2.6-1.2 1.2-2.6 2.8.3L12 1.6Z"
      />
      <path d="m8.4 12.2 2.4 2.4 4.8-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
