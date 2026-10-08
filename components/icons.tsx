import type { SVGProps } from "react";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "strokeWidth"> & {
  size?: number;
  strokeWidth?: number;
};

export type IconType = React.FC<IconProps>;

function base({ size = 22, strokeWidth = 1.6, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export const InboxIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 13h5l1.5 2.5h5L16 13h5" />
    <path d="M5.5 5.5h13a2 2 0 0 1 2 2L21 16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7.5a2 2 0 0 1 2-2Z" />
  </svg>
);

export const InboxPlusIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 13h5l1.5 2.5h5L16 13h5" />
    <path d="M5.5 5.5h13a2 2 0 0 1 2 2L21 16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7.5a2 2 0 0 1 2-2Z" />
    <path d="M8.6 3.6v3M7.1 5.1h3" />
  </svg>
);

export const ComposeIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="15" rx="2" />
    <path d="M3 8.5h18" />
    <path d="M10.5 11.5v5M8 14h5" />
  </svg>
);

export const SendIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M21 4 10.5 14.5" />
    <path d="M21 4 14 21l-3.5-6.5L4 11 21 4Z" />
  </svg>
);

export const DraftsIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 19V5a2 2 0 0 1 2-2h8l4 4v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2Z" />
    <path d="M14 3v4h4" />
    <path d="M8.5 13h7M8.5 16.5h5" />
  </svg>
);

export const StarIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m12 3.5 2.55 5.17 5.7.83-4.12 4.02.97 5.68L12 16.55l-5.1 2.68.97-5.68L3.75 9.5l5.7-.83L12 3.5Z" />
  </svg>
);

export const MailOpenIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3.5 9.5 12 4.5l8.5 5" />
    <path d="M4.5 9.2V18a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V9.2L12 14.5 4.5 9.2Z" />
  </svg>
);

export const FolderIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3.5 6.5A1.5 1.5 0 0 1 5 5h4l2 2.2h8a1.5 1.5 0 0 1 1.5 1.5V18a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18V6.5Z" />
  </svg>
);

export const UsersIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8.5" r="3.2" />
    <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" />
    <path d="M16 5.7a3.2 3.2 0 0 1 0 6M17.5 14.4a5.5 5.5 0 0 1 3 5.1" />
  </svg>
);

export const NotesIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="5" y="3.5" width="14" height="17" rx="2" />
    <path d="M8.5 8h7M8.5 12h7M8.5 16h4.5" />
  </svg>
);

export const FileIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 3.5h7.5L19 9V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
    <path d="M13.5 3.5V9H19" />
  </svg>
);

export const ArchiveIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3.5" y="4" width="17" height="4" rx="1" />
    <path d="M5 8v11a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19V8" />
    <path d="M10 12h4" />
  </svg>
);

export const TrashIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4.5 6.5h15" />
    <path d="M9 6V4.8A1.3 1.3 0 0 1 10.3 3.5h3.4A1.3 1.3 0 0 1 15 4.8V6" />
    <path d="M6.5 6.5 7.3 20a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.8-13.5" />
    <path d="M10 10.5v6M14 10.5v6" />
  </svg>
);

export const MailReplyIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3.5" y="5" width="17" height="14.5" rx="2" />
    <path d="M12 12.5h4.5a2 2 0 0 1 2 2V17" />
    <path d="m12 9.5-2.8 3 2.8 3" />
  </svg>
);

export const FilterIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 6.5h16M7 12h10M10 17.5h4" />
  </svg>
);

export const CheckIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const SparkIcon = (p: IconProps) => (
  <svg {...base(p)} strokeWidth={1.5}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
  </svg>
);

export const PaperclipIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20 11.5 12.6 19a4.2 4.2 0 0 1-6-6l7-7a2.9 2.9 0 0 1 4.1 4.1l-7 7a1.5 1.5 0 0 1-2.1-2.1l6.3-6.3" />
  </svg>
);

export const CloseIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const ChevronDownIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m6 9.5 6 6 6-6" />
  </svg>
);

export const SearchIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="5.5" />
    <path d="m15.5 15.5 3.5 3.5" />
  </svg>
);

export const RestoreIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
    <path d="M3.5 4.5v4h4" />
  </svg>
);

export const PencilIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
    <path d="m13.5 6.5 4 4" />
  </svg>
);

export const PlusIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const MailIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
  </svg>
);
