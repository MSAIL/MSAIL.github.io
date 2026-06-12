"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { site } from "@/data/site";
import { Wordmark } from "./wordmark";
import { CtaLink } from "./cta-link";
import { ArrowIcon, MenuIcon, CloseIcon } from "./icons";
import { ChannelIcon, channelAriaLabel, channelLinkProps } from "./channel-icon";

function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}

/** Desktop nav item with a thick maize underline that draws in on hover / active. */
function NavLink({ href, label }: { href: string; label: string }) {
  const isActive = useIsActive();
  const active = isActive(href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      data-active={active}
      className="group relative px-3 py-2 text-label text-muted transition-colors duration-200 hover:text-ink data-[active=true]:text-ink"
    >
      {label}
      <span
        className={`pointer-events-none absolute inset-x-3 -bottom-0.5 h-0.5 origin-left bg-maize transition-transform duration-300 ease-expo ${
          active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
        }`}
      />
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isActive = useIsActive();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Close on any route change (overlay Wordmark, back/forward, etc.). The
  // header never unmounts on navigation, so without this the overlay + scroll
  // lock would survive onto the new page. State-adjustment-during-render is
  // the sanctioned pattern for "reset state when a prop/context changes".
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  // The menu trigger only exists below lg; if the viewport grows past it while
  // the menu is open (resize / rotation), the overlay turns invisible but would
  // keep the scroll lock — so close it.
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(min-width: 64rem)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) close();
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [open, close]);

  // Lock scroll while the mobile overlay is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Modal behavior: make everything behind the dialog inert, move focus into
  // it on open, trap Tab inside it, close on Escape, and restore focus to the
  // trigger on close. (The overlay lives inside <header>, so inert goes on the
  // header bar + the page chrome siblings, not on <header> itself.)
  useEffect(() => {
    if (!open) return;
    const overlay = overlayRef.current;
    if (!overlay) return;
    const trigger = triggerRef.current; // persistent header button to restore focus to

    const background = [
      document.querySelector<HTMLElement>('a[href="#main"]'),
      barRef.current,
      document.getElementById("main"),
      document.querySelector<HTMLElement>("body > footer"),
    ].filter((el): el is HTMLElement => el !== null);
    background.forEach((el) => {
      el.inert = true;
    });

    const focusables = () =>
      Array.from(
        overlay.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);

    focusables()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      // Focus escaped the dialog (e.g. a tap on non-interactive chrome moved it
      // to <body>): pull it back in, whichever direction Tab is heading.
      if (!active || !overlay.contains(active)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
        return;
      }
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      background.forEach((el) => {
        el.inert = false;
      });
      trigger?.focus();
    };
  }, [open, close]);

  return (
    <header className="sticky top-0 z-50">
      {/* The collegiate maize rule across the very top. */}
      <div className="h-1 bg-maize" />

      <div ref={barRef} className="border-b border-border bg-paper/85 backdrop-blur-md">
        <div className="container-bleed flex h-18 items-center justify-between gap-6 py-3">
          <Wordmark />

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {site.nav.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} />
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Wrapper owns `hidden` so it isn't fighting CtaLink's base
                `inline-flex`; the Join CTA only appears at >= sm. */}
            <span className="hidden sm:inline-flex">
              <CtaLink href={site.cta.href}>
                {site.cta.label}
                <ArrowIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </CtaLink>
            </span>
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              aria-haspopup="dialog"
              className="inline-flex h-11 w-11 items-center justify-center rounded-sm border border-border-strong text-ink transition-colors hover:bg-paper-deep lg:hidden"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile overlay menu */}
      {open ? (
        <div
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="fixed inset-0 z-50 flex flex-col bg-paper lg:hidden"
        >
          <div className="h-1 bg-maize" />
          <div className="container-bleed flex h-18 items-center justify-between border-b border-border py-3">
            <Wordmark onClick={close} />
            <button
              type="button"
              onClick={close}
              aria-label="Close menu"
              className="inline-flex h-11 w-11 items-center justify-center rounded-sm border border-border-strong text-ink transition-colors hover:bg-paper-deep"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Each link closes the overlay itself; route changes also close it
              via the pathname effect above. Whitespace taps do nothing. */}
          <nav
            className="container-bleed flex flex-1 flex-col overflow-y-auto overscroll-contain py-8"
            aria-label="Mobile"
          >
            {site.nav.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  aria-current={active ? "page" : undefined}
                  data-active={active}
                  className="group flex flex-col gap-1 border-b border-border py-5 data-[active=true]:border-l-4 data-[active=true]:border-l-maize data-[active=true]:pl-4"
                >
                  <span className="font-display text-h3 text-ink">{link.label}</span>
                  <span className="text-meta text-faint">{link.blurb}</span>
                </Link>
              );
            })}

            <div className="mt-8 flex flex-col gap-4">
              <CtaLink href={site.cta.href} onClick={close} className="justify-center">
                {site.cta.label} MSAIL
                <ArrowIcon className="h-4 w-4" />
              </CtaLink>
              <div className="-mx-2 flex flex-wrap font-mono text-meta text-muted">
                {site.channels.map((c) => (
                  <a
                    key={c.key}
                    href={c.href}
                    onClick={close}
                    {...channelLinkProps(c)}
                    aria-label={channelAriaLabel(c)}
                    className="inline-flex min-h-11 items-center gap-2 px-2 transition-colors hover:text-ink"
                  >
                    <ChannelIcon name={c.key} className="h-4 w-4 shrink-0" />
                    {c.label}
                  </a>
                ))}
              </div>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
