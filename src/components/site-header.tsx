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

/** Desktop nav item: quiet capsule text, navy when active or hovered; runs
    frost while the bar floats over an ink band (group data-ink). */
function NavLink({ href, label }: { href: string; label: string }) {
  const isActive = useIsActive();
  const active = isActive(href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      data-active={active}
      className="rounded-full px-3.5 py-1.5 text-label text-ink-2 transition-colors duration-150 hover:bg-navy/5 hover:text-navy data-[active=true]:font-semibold data-[active=true]:text-navy group-data-[ink=true]:text-on-navy-muted group-data-[ink=true]:hover:bg-white/10 group-data-[ink=true]:hover:text-on-navy group-data-[ink=true]:data-[active=true]:text-on-navy"
    >
      {label}
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [overInk, setOverInk] = useState(false);
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

  // The glass bar earns its bottom hairline only once content scrolls under
  // it, and runs frost text while ANY ink band (page top, hero stretch, the
  // talks band, the footer) is under the bar. A band may end in a dissolve
  // zone (attribute value = fade height in px): the theme flips where the
  // ink is still solid, not where it has already melted into the light
  // field. Re-bound per route: each page mounts its own bands.
  useEffect(() => {
    const bands = Array.from(document.querySelectorAll<HTMLElement>("[data-nav-ink]"));
    const NAV_BOTTOM = 76;
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      setOverInk(
        bands.some((band) => {
          const fade = parseInt(band.dataset.navInk || "", 10) || 0;
          const r = band.getBoundingClientRect();
          return r.top < NAV_BOTTOM && r.bottom - fade > NAV_BOTTOM;
        }),
      );
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  // The capsule's refraction is NOT built here. It is the #msail-lens filter in
  // the root layout, applied by a stylesheet rule so the reduced-transparency
  // and M-forming overrides can still switch it off. This component used to
  // build a second #msail-lens of its own and pin it on the bar as an inline
  // style: the duplicate id meant the browser never rendered it, while the
  // inline style beat both of those overrides.

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
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3">
      <div
        ref={barRef}
        data-scrolled={scrolled}
        data-ink={overInk}
        className="glass-island group pointer-events-auto flex h-12 items-center gap-1 rounded-full pl-4 pr-1.5"
      >
        <Wordmark className="mr-2" tone={overInk ? "cream" : "ink"} />

        <nav className="hidden items-center lg:flex" aria-label="Primary">
          {site.nav.map((link) => (
            <NavLink key={link.href} href={link.href} label={link.label} />
          ))}
        </nav>

        {/* Wrapper owns `hidden` so it isn't fighting CtaLink's base
            `inline-flex`; the Join CTA only appears at >= sm. */}
        <span className="ml-2 hidden sm:inline-flex">
          <CtaLink href={site.cta.href} variant="navy" className="!min-h-9 !px-4 !py-1">
            {site.cta.label}
          </CtaLink>
        </span>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          aria-haspopup="dialog"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-navy transition-colors duration-150 hover:bg-navy/5 group-data-[ink=true]:text-on-navy group-data-[ink=true]:hover:bg-white/10 lg:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile overlay menu */}
      {open ? (
        <div
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="overlay-ground pointer-events-auto fixed inset-0 z-50 flex flex-col lg:hidden"
        >
          <div className="container-bleed flex h-14 items-center justify-between border-b border-border">
            <Wordmark onClick={close} />
            <button
              type="button"
              onClick={close}
              aria-label="Close menu"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-navy transition-colors duration-150 hover:bg-navy/5"
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
                  className="flex flex-col gap-1 border-b border-border py-5 data-[active=true]:text-navy"
                >
                  <span className="font-display text-h3 text-navy">{link.label}</span>
                  <span className="text-meta text-ink-3">{link.blurb}</span>
                </Link>
              );
            })}

            <div className="mt-8 flex flex-col gap-4">
              <CtaLink href={site.cta.href} onClick={close} className="justify-center">
                {site.cta.label} MSAIL
                <ArrowIcon className="h-4 w-4" />
              </CtaLink>
              <div className="-mx-2 flex flex-wrap text-label text-ink-2">
                {site.channels.map((c) => (
                  <a
                    key={c.key}
                    href={c.href}
                    onClick={close}
                    {...channelLinkProps(c)}
                    aria-label={channelAriaLabel(c)}
                    className="inline-flex min-h-11 items-center gap-2 px-2 transition-colors duration-150 hover:text-navy"
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
