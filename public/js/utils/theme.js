// src/js/utils/theme.js
var THEME_KEY = "polyvis-theme";
var getPreferredTheme = () => {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored)
    return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};
var setTheme = (theme) => {
  if (theme === "system") {
    localStorage.removeItem(THEME_KEY);
    document.documentElement.removeAttribute("data-theme");
  } else {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.setAttribute("data-theme", theme);
  }
};
var toggleTheme = () => {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  const next = current === "dark" ? "light" : "dark";
  console.log("Theme toggled to:", next);
  setTheme(next);
  return next;
};
console.log("Exposing toggleTheme to window");
window.toggleTheme = toggleTheme;
var initTheme = () => {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored) {
    document.documentElement.setAttribute("data-theme", stored);
  }
};
export {
  toggleTheme,
  setTheme,
  initTheme,
  getPreferredTheme
};
