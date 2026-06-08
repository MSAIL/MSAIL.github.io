"use client";

import { useSyncExternalStore } from "react";
import { SunIcon, MoonIcon } from "./icons";

type Theme = "dark" | "light";

/**
 * Dark-first theme toggle. The theme lives on <html data-theme> (set before
 * paint by the no-FOUC script in the root layout); this component reads it as
 * an external store via useSyncExternalStore — the idiomatic way to subscribe
 * to DOM/localStorage state without effects or hydration mismatches.
 */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function getSnapshot(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

function getServerSnapshot(): Theme {
  return "dark"; // dark is the default on the server / first paint
}

function setTheme(next: Theme) {
  if (next === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  try {
    localStorage.setItem("msail-theme", next);
  } catch {
    /* storage may be unavailable; the toggle still works for the session */
  }
  listeners.forEach((l) => l());
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border text-muted transition-colors duration-200 hover:border-border-strong hover:text-foreground ${className}`}
    >
      {theme === "light" ? (
        <MoonIcon className="h-4 w-4" />
      ) : (
        <SunIcon className="h-4 w-4" />
      )}
    </button>
  );
}
