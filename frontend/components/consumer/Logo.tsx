import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  className?: string;
  /** background context — controls which logo variant to use */
  variant?: "teal" | "transparent";
  /**
   * Recolors the mark to sit on any background:
   * "light" — white mark for dark surfaces / imagery,
   * "dark" — ink mark for light surfaces,
   * "auto" — ink in light theme, white in dark theme.
   */
  mono?: "light" | "dark" | "auto";
  showWord?: boolean;
  wordClassName?: string;
  imgClassName?: string;
}

const MONO_FILTERS: Record<NonNullable<LogoProps["mono"]>, string> = {
  light: "brightness-0 invert",
  dark: "brightness-0",
  auto: "brightness-0 dark:invert",
};

// Style Savant logo — uses the actual brand PNG asset.
// variant="teal" for the teal splash background, variant="transparent" for light surfaces.
export function Logo({
  size = 120,
  className,
  variant = "transparent",
  mono,
  showWord = false,
  wordClassName,
  imgClassName,
}: LogoProps) {
  const src = variant === "teal" ? "/style-s-logo-teal.png" : "/style-s-logo-transparent.png";
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <img
        src={src}
        alt="Style Savant"
        className={cn("h-auto w-auto object-contain", mono && MONO_FILTERS[mono], imgClassName)}
        style={imgClassName && /\b[wh]-/.test(imgClassName) ? undefined : { width: size, maxWidth: "100%" }}
      />
      {showWord && (
        <span
          className={cn(
            "mt-4 font-display font-bold tracking-tight text-white",
            wordClassName
          )}
          style={{ fontSize: Math.max(16, size * 0.3) }}
        >
          Style Savant
        </span>
      )}
    </div>
  );
}
