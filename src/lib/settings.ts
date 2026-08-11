import type { KeybindingMode, ThemeMode } from "./types"

export const THEME_STORAGE_KEY = "nimbuscode:settings:theme"
export const KEYBINDING_STORAGE_KEY = "nimbuscode:settings:keybinding"
export const COMPLETIONS_STORAGE_KEY = "nimbuscode:settings:completions"
export const RELATIVE_LINE_NUMBERS_STORAGE_KEY =
	"nimbuscode:settings:relative-line-numbers"

export function readStoredTheme(): ThemeMode {
	if (typeof window === "undefined") return "vs-dark"
	try {
		const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
		const validThemes = ["vs-dark", "vs-light", "tokyo-night", "catppuccin-latte", "github-dark", "github-light"]
		return validThemes.includes(storedTheme as string) ? (storedTheme as ThemeMode) : "vs-dark"
	} catch (error) {
		return "vs-dark"
	}
}

export const readStoredKeybinding = (): KeybindingMode => {
	if (typeof window === "undefined") return "default"
	try {
		const storedValue = window.localStorage.getItem(KEYBINDING_STORAGE_KEY)
		return storedValue === "vim" || storedValue === "default" ? storedValue : "default"
	} catch {
		return "default"
	}
}

export const readStoredCompletionsEnabled = (): boolean => {
	if (typeof window === "undefined") return true
	try {
		const storedValue = window.localStorage.getItem(COMPLETIONS_STORAGE_KEY)
		return storedValue === null ? true : storedValue === "true"
	} catch {
		return true
	}
}

export const readStoredRelativeLineNumbers = (): boolean => {
	if (typeof window === "undefined") return false
	try {
		return window.localStorage.getItem(RELATIVE_LINE_NUMBERS_STORAGE_KEY) === "true"
	} catch {
		return false
	}
}
