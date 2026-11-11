import { cn } from "@/lib/utils";

export type IconName =
  | "search"
  | "heart"
  | "user"
  | "bag"
  | "menu"
  | "close"
  | "arrow-right"
  | "arrow-left"
  | "chevron-down"
  | "chevron-right"
  | "eye"
  | "truck"
  | "shield"
  | "phone"
  | "mail"
  | "pin"
  | "clock"
  | "check"
  | "plus"
  | "minus"
  | "trash"
  | "edit"
  | "package"
  | "alert"
  | "star"
  | "sun"
  | "glasses"
  | "lens"
  | "case"
  | "logout"
  | "settings"
  | "dashboard"
  | "users"
  | "tag"
  | "box"
  | "upload"
  | "download"
  | "filter"
  | "grid"
  | "list"
  | "lock"
  | "whatsapp"
  | "calendar"
  | "store"
  | "info"
  | "file"
  | "sparkle"
  | "external";

const PATHS: Record<IconName, string> = {
  search: "M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z",
  heart:
    "M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 00-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 000-7.8z",
  user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  bag: "M6 2h12l1 20H5L6 2zM9 6V4a3 3 0 016 0v2",
  menu: "M3 6h18M3 12h18M3 18h18",
  close: "M18 6L6 18M6 6l12 12",
  "arrow-right": "M5 12h14M13 6l6 6-6 6",
  "arrow-left": "M19 12H5M11 18l-6-6 6-6",
  "chevron-down": "M6 9l6 6 6-6",
  "chevron-right": "M9 6l6 6-6 6",
  eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7zM12 15a3 3 0 100-6 3 3 0 000 6z",
  truck: "M1 3h13v13H1zM14 8h4l3 4v4h-7M4.5 19a2 2 0 100-4 2 2 0 000 4zM17.5 19a2 2 0 100-4 2 2 0 000 4z",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  phone:
    "M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 2 .7 2.9a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.2-1.2a2 2 0 012.1-.5c.9.3 1.9.6 2.9.7a2 2 0 011.7 2z",
  mail: "M4 4h16v16H4zM22 6l-10 7L2 6",
  pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1116 0zM12 13a3 3 0 100-6 3 3 0 000 6z",
  clock: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2",
  check: "M20 6L9 17l-5-5",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5",
  edit: "M11 4H4v16h16v-7M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  package: "M21 16V8l-9-5-9 5v8l9 5 9-5zM3.3 7L12 12l8.7-5M12 22V12",
  alert: "M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L14.7 3.9a2 2 0 00-3.4 0z",
  star: "M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3L7 14.2 2 9.3l6.9-1L12 2z",
  sun: "M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  glasses:
    "M2 9h4M18 9h4M6 9a4 4 0 108 0 4 4 0 00-8 0zM14 9a4 4 0 108 0 4 4 0 00-8 0zM10 9h4",
  lens: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 18a6 6 0 100-12 6 6 0 000 12z",
  case: "M3 7h18v13H3zM8 7V4h8v3M3 12h18",
  logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  settings:
    "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z",
  dashboard: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z",
  users:
    "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8",
  tag: "M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L2 12V2h10l8.6 8.6a2 2 0 010 2.8zM7 7h.01",
  box: "M21 16V8l-9-5-9 5v8l9 5 9-5zM3.3 7L12 12l8.7-5M12 22V12",
  upload: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12",
  download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  filter: "M22 3H2l8 9.5V19l4 2v-8.5L22 3z",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  lock: "M5 11h14v11H5zM8 11V7a4 4 0 118 0v4",
  whatsapp:
    "M20.5 3.5A11 11 0 003.6 17.2L2 22l4.9-1.6A11 11 0 1020.5 3.5zM12 20a8 8 0 01-4.1-1.1l-.3-.2-2.9 1 1-2.8-.2-.3A8 8 0 1112 20zM17 14.4c-.3-.1-1.6-.8-1.8-.9-.3-.1-.5-.1-.7.1l-1 1.2c-.2.2-.4.2-.6.1a6.5 6.5 0 01-3.3-2.9c-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.4.1-.6l-.9-2c-.2-.5-.4-.4-.6-.4h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.7s1.2 3.1 1.3 3.3c.2.2 2.3 3.5 5.5 4.9 2.7 1.1 3.3.9 3.9.9.6-.1 1.9-.8 2.1-1.6.3-.8.3-1.4.2-1.6-.1-.1-.3-.2-.5-.3z",
  calendar: "M4 4h16v18H4zM16 2v4M8 2v4M4 10h16",
  store:
    "M3 9l1.5-6h15L21 9M4 9v12h16V9M9 21v-7h6v7M2 9h20",
  info: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 16v-4M12 8h.01",
  file: "M14 2H6v20h12V8l-4-6zM14 2v6h4M9 13h6M9 17h6",
  sparkle: "M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z",
  external: "M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3",
};

const FILLED: IconName[] = ["star", "heart"];

export function Icon({
  name,
  className,
  size = 20,
  filled = false,
  strokeWidth = 1.5,
  "aria-hidden": ariaHidden = true,
}: {
  name: IconName;
  className?: string;
  size?: number;
  filled?: boolean;
  strokeWidth?: number;
  "aria-hidden"?: boolean;
}) {
  if (name === "whatsapp") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className={cn("shrink-0", className)}
        aria-hidden={ariaHidden}
        focusable="false"
      >
        <circle cx="16" cy="16" r="15" fill="#25D366" />
        <path
          d="M8.1 23.5 9.2 19a10.1 10.1 0 1 1 3.8 3.7l-4.9.8Z"
          fill="none"
          stroke="#fff"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M12.1 11.3c-.2-.5-.5-.5-.8-.5h-.7c-.3 0-.7.1-1 .5-.4.4-1.3 1.3-1.3 3.1s1.3 3.6 1.5 3.8c.2.3 2.5 4 6.2 5.4 3.1 1.2 3.7 1 4.4.9.7-.1 2.1-.9 2.4-1.8.3-.9.3-1.6.2-1.8-.1-.2-.4-.3-.8-.5l-2.5-1.2c-.3-.1-.6-.2-.8.2-.3.4-.9 1.2-1.1 1.4-.2.3-.4.3-.8.1-.4-.2-1.7-.6-3.2-2-.9-.8-1.5-1.8-1.7-2.2-.2-.4 0-.6.2-.8l.6-.7c.2-.2.3-.4.4-.6.1-.3 0-.5-.1-.7l-1.1-2.6Z"
          fill="#fff"
          transform="translate(2 -2) scale(.9)"
        />
      </svg>
    );
  }

  const isFilled = filled || FILLED.includes(name);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={isFilled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={isFilled ? 0 : strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
      aria-hidden={ariaHidden}
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
