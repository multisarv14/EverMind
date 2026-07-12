"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type UITheme = "dark" | "light";

interface UIStateContextValue {
  theme: UITheme;
  toggleTheme: () => void;
  notificationsOpen: boolean;
  unreadCount: number;
  toggleNotifications: () => void;
}

const UIStateContext = createContext<UIStateContextValue | null>(null);

const STORAGE_KEY = "evermind-ui-theme";

export function UIStateProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [theme, setTheme] = useState<UITheme>(() => {
    if (typeof window === "undefined") {
      return "dark";
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (stored === "light" || stored === "dark") {
      return stored;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  function toggleNotifications() {
    setNotificationsOpen((prev) => {
      const next = !prev;

      if (next) {
        setUnreadCount(0);
      }

      return next;
    });
  }

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      notificationsOpen,
      unreadCount,
      toggleNotifications,
    }),
    [theme, notificationsOpen, unreadCount]
  );

  return (
    <UIStateContext.Provider value={value}>
      {children}
    </UIStateContext.Provider>
  );
}

export function useUIState() {
  const ctx = useContext(UIStateContext);

  if (!ctx) {
    throw new Error("useUIState must be used inside UIStateProvider");
  }

  return ctx;
}
