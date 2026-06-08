import Link from "next/link";

type Variant = "primary" | "ghost";

/**
 * Shell call-to-action. Navy structural fill for primary actions, hairline
 * outline for secondary — maize only ever appears as a small accent inside
 * (an arrow / mark), never as the button fill.
 */
export function CtaLink({
  href,
  children,
  variant = "primary",
  external = false,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  external?: boolean;
  className?: string;
}) {
  const base =
    "group inline-flex items-center gap-2 rounded-sm px-4 py-2.5 text-label font-medium transition-colors duration-200 ease-standard";
  const styles =
    variant === "primary"
      ? "bg-navy text-on-navy hover:bg-navy-tint focus-visible:bg-navy-tint"
      : "border border-border text-foreground hover:border-maize/60";

  const externalProps = external
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Link href={href} className={`${base} ${styles} ${className}`} {...externalProps}>
      {children}
    </Link>
  );
}
