"use client";

import { useSyncExternalStore } from "react";

export type ThemePref = "light" | "dark" | "system";

const KEY = "evermind-theme";
const EVENT = "evermind:theme";

function read(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" || v === "system" ? v : "dark";
  } catch {
    return "dark";
  }
}

export function resolve(pref: ThemePref): "light" | "dark" {
  if (pref === "system") {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  return pref;
}

export function setThemePref(pref: ThemePref) {
  try {
    localStorage.setItem(KEY, pref);
  } catch {
    /* private mode: still apply for this page */
  }
  document.documentElement.dataset.theme = resolve(pref);
  window.dispatchEvent(new Event(EVENT));
}

const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
};

/** The saved preference (light / dark / system). Server renders as "dark". */
export function useThemePref(): ThemePref {
  return useSyncExternalStore(subscribe, read, () => "dark");
}

/** Inline script run before first paint so the page never flashes the wrong theme. */
export const THEME_INIT_SCRIPT = `(function(){try{var p=localStorage.getItem('${KEY}');if(p!=='light'&&p!=='dark'&&p!=='system')p='dark';var t=p==='system'?(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):p;document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='dark'}})()`;
