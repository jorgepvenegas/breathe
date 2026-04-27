import { ref, readonly } from "vue";

type ThemeMode = "light" | "dark";

const STORAGE_KEY = "breath-theme";

const current = ref<ThemeMode>(loadMode());

function loadMode(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  // Default to system preference on first visit, but store an explicit value
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

function apply(mode: ThemeMode) {
  if (mode === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

function setMode(mode: ThemeMode) {
  current.value = mode;
  localStorage.setItem(STORAGE_KEY, mode);
  apply(mode);
}

function toggle() {
  setMode(current.value === "dark" ? "light" : "dark");
}

function init() {
  apply(current.value);
}

export function useTheme() {
  return {
    mode: readonly(current),
    setMode,
    toggle,
    init,
  };
}
