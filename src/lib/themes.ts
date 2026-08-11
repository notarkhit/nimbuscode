import type { Monaco } from "@monaco-editor/react"
import type { TerminalTheme, ThemeMode } from "./types"

/* ───────── Theme IDs ───────── */

export const TOKYO_NIGHT_THEME = "tokyonight-nimbus"
export const CATPPUCCIN_LATTE_THEME = "catppuccin-latte-nimbus"
export const VS_DARK_THEME = "vs-dark" // Built-in monaco theme, but we might customize it
export const VS_LIGHT_THEME = "vs" // Built-in monaco theme
export const GITHUB_DARK_THEME = "github-dark-nimbus"
export const GITHUB_LIGHT_THEME = "github-light-nimbus"

export const getMonacoTheme = (mode: ThemeMode): string => {
	switch (mode) {
		case "tokyo-night":
			return TOKYO_NIGHT_THEME
		case "catppuccin-latte":
			return CATPPUCCIN_LATTE_THEME
		case "vs-dark":
			return VS_DARK_THEME
		case "vs-light":
			return VS_LIGHT_THEME
		case "github-dark":
			return GITHUB_DARK_THEME
		case "github-light":
			return GITHUB_LIGHT_THEME
		default:
			return VS_DARK_THEME
	}
}

export const getTerminalTheme = (mode: ThemeMode): TerminalTheme => {
	switch (mode) {
		case "tokyo-night":
			return TOKYO_NIGHT_TERMINAL_THEME
		case "catppuccin-latte":
			return CATPPUCCIN_LATTE_TERMINAL_THEME
		case "vs-dark":
			return VS_DARK_TERMINAL_THEME
		case "vs-light":
			return VS_LIGHT_TERMINAL_THEME
		case "github-dark":
			return GITHUB_DARK_TERMINAL_THEME
		case "github-light":
			return GITHUB_LIGHT_TERMINAL_THEME
		default:
			return VS_DARK_TERMINAL_THEME
	}
}

/* ───────── Terminal themes ───────── */

export const TOKYO_NIGHT_TERMINAL_THEME: TerminalTheme = {
	background: "#1a1b26",
	foreground: "#c0caf5",
	cursor: "#7aa2f7",
	cursorAccent: "#1a1b26",
	selection: "#33467c66",
	black: "#15161e",
	red: "#f7768e",
	green: "#9ece6a",
	yellow: "#e0af68",
	blue: "#7aa2f7",
	magenta: "#bb9af7",
	cyan: "#7dcfff",
	white: "#a9b1d6",
	brightBlack: "#414868",
	brightRed: "#f7768e",
	brightGreen: "#9ece6a",
	brightYellow: "#e0af68",
	brightBlue: "#7aa2f7",
	brightMagenta: "#bb9af7",
	brightCyan: "#7dcfff",
	brightWhite: "#c0caf5",
}

export const CATPPUCCIN_LATTE_TERMINAL_THEME: TerminalTheme = {
	background: "#eff1f5",
	foreground: "#4c4f69",
	cursor: "#1e66f5",
	cursorAccent: "#eff1f5",
	selection: "#bcc0cc66",
	black: "#5c5f77",
	red: "#d20f39",
	green: "#40a02b",
	yellow: "#df8e1d",
	blue: "#1e66f5",
	magenta: "#8839ef",
	cyan: "#179299",
	white: "#acb0be",
	brightBlack: "#6c6f85",
	brightRed: "#d20f39",
	brightGreen: "#40a02b",
	brightYellow: "#df8e1d",
	brightBlue: "#1e66f5",
	brightMagenta: "#8839ef",
	brightCyan: "#179299",
	brightWhite: "#4c4f69",
}

export const VS_DARK_TERMINAL_THEME: TerminalTheme = {
	background: "#1e1e1e",
	foreground: "#cccccc",
	cursor: "#cccccc",
	cursorAccent: "#1e1e1e",
	selection: "#264f78",
	black: "#000000",
	red: "#cd3131",
	green: "#0dbc79",
	yellow: "#e5e510",
	blue: "#2472c8",
	magenta: "#bc3fbc",
	cyan: "#11a8cd",
	white: "#e5e5e5",
	brightBlack: "#666666",
	brightRed: "#f14c4c",
	brightGreen: "#23d18b",
	brightYellow: "#f5f543",
	brightBlue: "#3b8eea",
	brightMagenta: "#d670d6",
	brightCyan: "#29b8db",
	brightWhite: "#e5e5e5",
}

export const VS_LIGHT_TERMINAL_THEME: TerminalTheme = {
	background: "#ffffff",
	foreground: "#333333",
	cursor: "#333333",
	cursorAccent: "#ffffff",
	selection: "#add6ff",
	black: "#000000",
	red: "#cd3131",
	green: "#00bc00",
	yellow: "#949800",
	blue: "#0451a5",
	magenta: "#bc05bc",
	cyan: "#0598bc",
	white: "#555555",
	brightBlack: "#666666",
	brightRed: "#cd3131",
	brightGreen: "#14ce14",
	brightYellow: "#b5ba00",
	brightBlue: "#0451a5",
	brightMagenta: "#bc05bc",
	brightCyan: "#0598bc",
	brightWhite: "#a5a5a5",
}

export const GITHUB_DARK_TERMINAL_THEME: TerminalTheme = {
	background: "#0d1117",
	foreground: "#c9d1d9",
	cursor: "#c9d1d9",
	cursorAccent: "#0d1117",
	selection: "#3b5070",
	black: "#484f58",
	red: "#ff7b72",
	green: "#3fb950",
	yellow: "#d29922",
	blue: "#58a6ff",
	magenta: "#bc8cff",
	cyan: "#39c5cf",
	white: "#b1bac4",
	brightBlack: "#6e7681",
	brightRed: "#ffa198",
	brightGreen: "#56d364",
	brightYellow: "#e3b341",
	brightBlue: "#79c0ff",
	brightMagenta: "#d2a8ff",
	brightCyan: "#56d4dd",
	brightWhite: "#f0f6fc",
}

export const GITHUB_LIGHT_TERMINAL_THEME: TerminalTheme = {
	background: "#ffffff",
	foreground: "#24292f",
	cursor: "#24292f",
	cursorAccent: "#ffffff",
	selection: "#0366d625",
	black: "#24292f",
	red: "#cf222e",
	green: "#116329",
	yellow: "#4d2d00",
	blue: "#0969da",
	magenta: "#8250df",
	cyan: "#1b7c83",
	white: "#6e7781",
	brightBlack: "#57606a",
	brightRed: "#a40e26",
	brightGreen: "#1a7f37",
	brightYellow: "#633c01",
	brightBlue: "#218bff",
	brightMagenta: "#a371f7",
	brightCyan: "#3192aa",
	brightWhite: "#8c959f",
}

/* ───────── Monaco theme registration ───────── */

export const defineMonacoThemes = (monaco: Monaco) => {
	monaco.editor.defineTheme(TOKYO_NIGHT_THEME, {
		base: "vs-dark",
		inherit: true,
		rules: [
			{ token: "", foreground: "C0CAF5", background: "1A1B26" },
			{ token: "comment", foreground: "565F89" },
			{ token: "keyword", foreground: "BB9AF7" },
			{ token: "operator", foreground: "89DDFF" },
			{ token: "string", foreground: "9ECE6A" },
			{ token: "number", foreground: "FF9E64" },
			{ token: "constant", foreground: "FF9E64" },
			{ token: "type", foreground: "2AC3DE" },
			{ token: "function", foreground: "7AA2F7" },
			{ token: "variable", foreground: "C0CAF5" },
		],
		colors: {
			"editor.background": "#1A1B26",
			"editor.foreground": "#C0CAF5",
			"editorLineNumber.foreground": "#565F89",
			"editorLineNumber.activeForeground": "#7AA2F7",
			"editorCursor.foreground": "#C0CAF5",
			"editor.selectionBackground": "#2E3C64",
			"editor.inactiveSelectionBackground": "#283457",
			"editor.selectionHighlightBackground": "#2E3C64AA",
			"editor.wordHighlightBackground": "#2E3C6477",
			"editor.wordHighlightStrongBackground": "#7AA2F733",
			"editor.findMatchBackground": "#33467CAA",
			"editor.findMatchHighlightBackground": "#33467C66",
			"editorIndentGuide.background1": "#292E42",
			"editorIndentGuide.activeBackground1": "#3B4261",
			"editorBracketMatch.background": "#33467C66",
			"editorBracketMatch.border": "#7AA2F7",
			"editorGutter.background": "#1A1B26",
			"editorWhitespace.foreground": "#3B426180",
			"editorWidget.background": "#1F2335",
			"editorWidget.border": "#3B4261",
			"scrollbarSlider.background": "#3B426188",
			"scrollbarSlider.hoverBackground": "#565F89AA",
			"scrollbarSlider.activeBackground": "#7AA2F7AA",
		},
	})

	monaco.editor.defineTheme(CATPPUCCIN_LATTE_THEME, {
		base: "vs",
		inherit: true,
		rules: [
			{ token: "", foreground: "4C4F69", background: "EFF1F5" },
			{ token: "comment", foreground: "8C8FA1" },
			{ token: "keyword", foreground: "8839EF" },
			{ token: "operator", foreground: "179299" },
			{ token: "string", foreground: "40A02B" },
			{ token: "number", foreground: "FE640B" },
			{ token: "constant", foreground: "FE640B" },
			{ token: "type", foreground: "DF8E1D" },
			{ token: "function", foreground: "1E66F5" },
			{ token: "variable", foreground: "4C4F69" },
		],
		colors: {
			"editor.background": "#EFF1F5",
			"editor.foreground": "#4C4F69",
			"editorLineNumber.foreground": "#8C8FA1",
			"editorLineNumber.activeForeground": "#1E66F5",
			"editorCursor.foreground": "#4C4F69",
			"editor.selectionBackground": "#CCD0DA",
			"editor.inactiveSelectionBackground": "#DCE0E8",
			"editor.selectionHighlightBackground": "#BCC0CCAA",
			"editor.wordHighlightBackground": "#BCC0CC77",
			"editor.wordHighlightStrongBackground": "#1E66F533",
			"editor.findMatchBackground": "#1E66F544",
			"editor.findMatchHighlightBackground": "#1E66F522",
			"editorIndentGuide.background1": "#CCD0DA",
			"editorIndentGuide.activeBackground1": "#ACB0BE",
			"editorBracketMatch.background": "#1E66F522",
			"editorBracketMatch.border": "#1E66F5",
			"editorGutter.background": "#EFF1F5",
			"editorWhitespace.foreground": "#ACB0BE",
			"editorWidget.background": "#E6E9EF",
			"editorWidget.border": "#ACB0BE",
			"scrollbarSlider.background": "#ACB0BE88",
			"scrollbarSlider.hoverBackground": "#8C8FA1AA",
			"scrollbarSlider.activeBackground": "#1E66F5AA",
		},
	})

	monaco.editor.defineTheme(GITHUB_DARK_THEME, {
		base: "vs-dark",
		inherit: true,
		rules: [
			{ token: "", foreground: "C9D1D9", background: "0D1117" },
			{ token: "comment", foreground: "8B949E" },
			{ token: "keyword", foreground: "FF7B72" },
			{ token: "string", foreground: "A5D6FF" },
			{ token: "number", foreground: "79C0FF" },
			{ token: "type", foreground: "FF7B72" },
		],
		colors: {
			"editor.background": "#0D1117",
			"editor.foreground": "#C9D1D9",
			"editorLineNumber.foreground": "#484F58",
			"editor.selectionBackground": "#3392FF44",
		},
	})

	monaco.editor.defineTheme(GITHUB_LIGHT_THEME, {
		base: "vs",
		inherit: true,
		rules: [
			{ token: "", foreground: "24292F", background: "FFFFFF" },
			{ token: "comment", foreground: "6E7781" },
			{ token: "keyword", foreground: "CF222E" },
			{ token: "string", foreground: "0A3069" },
			{ token: "number", foreground: "0550AE" },
			{ token: "type", foreground: "CF222E" },
		],
		colors: {
			"editor.background": "#FFFFFF",
			"editor.foreground": "#24292F",
			"editorLineNumber.foreground": "#8C959F",
			"editor.selectionBackground": "#0366D625",
		},
	})
}
