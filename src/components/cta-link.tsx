import Link from "next/link";

type Variant = "maize" | "navy" | "outline" | "glass";

/**
 * Shell call-to-action, always a glass pill; the tint carries the identity.
 * - maize   : maize glass, navy text: THE primary action
 * - navy    : navy glass, white text: compact chrome actions (nav Join)
 * - outline : clear glass, navy text: secondary everywhere
 * - glass   : alias of outline (kept for call sites)
 */
const VARIANTS: Record<Variant, string> = {
  maize: "btn-glass btn-glass-maize font-semibold",
  navy: "btn-glass btn-glass-navy",
  outline: "btn-glass btn-glass-clear",
  glass: "btn-glass btn-glass-clear",
};

export function CtaLink({
  href,
  children,
  variant = "maize",
  external = false,
  className = "",
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  external?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  const externalProps = external ? { target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 py-2.5 text-label font-medium transition-colors duration-150 ease-standard ${VARIANTS[variant]} ${className}`}
      {...externalProps}
    >
      {children}
    </Link>
  );
}
