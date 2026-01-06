/**
 * Theme Manager
 * Handles toggling between Light and Dark themes.
 * Persists preference to localStorage.
 */

const THEME_KEY = "polyvis-theme";

export const getPreferredTheme = () => {
	const stored = localStorage.getItem(THEME_KEY);
	if (stored) return stored;
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
};

export const setTheme = (theme) => {
	if (theme === "system") {
		localStorage.removeItem(THEME_KEY);
		document.documentElement.removeAttribute("data-theme");
	} else {
		localStorage.setItem(THEME_KEY, theme);
		document.documentElement.setAttribute("data-theme", theme);
	}
};

export const toggleTheme = () => {
	const current =
		document.documentElement.getAttribute("data-theme") || "light";
	const next = current === "dark" ? "light" : "dark";

	console.log("Theme toggled to:", next);
	setTheme(next);
	return next;
};

// Expose to window for inline onclick handlers (needed for x-html)
console.log("Exposing toggleTheme to window");
window.toggleTheme = toggleTheme;

// Initialize on load
export const initTheme = () => {
	const stored = localStorage.getItem(THEME_KEY);
	if (stored) {
		document.documentElement.setAttribute("data-theme", stored);
	}
};
