export type KeybindingMode = "default" | "vim"
export type ThemeMode =
	| "vs-dark"
	| "vs-light"
	| "tokyo-night"
	| "catppuccin-latte"
	| "github-dark"
	| "github-light"
export type VimInteractionMode = "insert" | "normal"
export type EditorCursorPosition = { lineNumber: number; column: number }
export type TerminalTheme = Record<string, string>

export type SimpleCompletionKind =
	| "keyword"
	| "function"
	| "snippet"
	| "class"
	| "variable"
	| "module"

export type SimpleCompletionItem = {
	label: string
	kind: SimpleCompletionKind
	insertText?: string
	detail?: string
	isSnippet?: boolean
}

export type LanguageCompletionConfig = {
	language: string
	triggerCharacters?: string[]
	items: SimpleCompletionItem[]
}

export type PendingCreation = {
	kind: "file" | "folder"
	parentPath: string
	value: string
}

export type PendingRename = {
	path: string
	value: string
}

export type CompiledRuntime = "clang" | "clangpp"

export type BinaryCommand = {
	binaryURL: string
	binaryName: string
	args?: string[]
	env?: Record<string, string>
	baseFSURL?: string
}

export type LSPStatus = "not_downloaded" | "downloading" | "ready"

export interface LSPState {
	id: string
	name: string
	language: string
	status: LSPStatus
	enabled: boolean
	sizeEstimate: string
}
