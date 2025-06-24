import { useEffect, useState } from "react";

export function useDarkMode() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved !== null) return JSON.parse(saved);
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    // 1. Save to localStorage
    localStorage.setItem("darkMode", JSON.stringify(darkMode));

    // 2. Apply to document
    document.documentElement.classList.toggle("dark", darkMode);

    // 3. Sync across tabs
    const handler = (e: StorageEvent) => {
      if (e.key === "darkMode") {
        setDarkMode(JSON.parse(e.newValue || "false")); // Provide fallback for null
      }
    };
    window.addEventListener("storage", handler);

    return () => window.removeEventListener("storage", handler);
  }, [darkMode]);

  return [darkMode, setDarkMode];
}

// Usage in any component:
// const [darkMode, setDarkMode] = useDarkMode();
