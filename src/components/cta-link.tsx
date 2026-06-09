import Link from "next/link";

type Variant = "primary" | "ghost" | "maize";

/**
 * Shell call-to-action.
 * - primary : navy fill, cream text (the default action on paper)
 * - ghost   : hairline outline, ink text (secondary on paper)
 * - maize   : bold maize fill, navy text (for use on navy fields)
 */
const VARIANTS: Record<Variant, string> = {
  primary: "bg-navy text-on-navy hover:bg-navy-soft",
  ghost: "border border-border-strong text-ink hover:border-ink hover:bg-paper-deep",
  maize: "bg-maize text-navy font-semibold hover:bg-maize-deep",
};

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
  const externalProps = external
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Link
      href={href}
      className={`group inline-flex min-h-11 items-center justify-center gap-2 rounded-sm px-5 py-2.5 text-label font-medium transition-colors duration-200 ease-standard ${VARIANTS[variant]} ${className}`}
      {...externalProps}
    >
      {children}
    </Link>
  );
}
