"use client";

import { Moon, Sun } from "lucide-react";
import { resolve, setThemePref, useThemePref } from "@/lib/theme";

/** Small sun/moon button that flips between light and dark. */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const pref = useThemePref();
  // Resolved on the client only; the server render shows the dark-mode icon.
  const isLight = typeof window !== "undefined" && resolve(pref) === "light";

  return (
    <button
      type="button"
      onClick={() => setThemePref(isLight ? "dark" : "light")}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      title={isLight ? "Dark mode" : "Light mode"}
      suppressHydrationWarning
      className={`flex h-9 w-9 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white ${className}`}
    >
      {isLight ? <Moon size={17} /> : <Sun size={17} />}
    </button>
  );
}
