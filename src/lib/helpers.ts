import { File, Settings, type LucideIcon } from "lucide-react"
import type { Runtime } from "@runno/runtime"
import type { WASIFile, WASIFS } from "@runno/wasi"
import type { WorkspaceEntry, WorkspaceFileEntry, WorkspaceFolderEntry } from "../fileStore"
import {
	runtimeByExtension,
	languageByExtension,
	fileIconByExtension,
	editorLanguageByExtension,
	templateByExtension,
	SETTINGS_TAB_ID,
} from "./constants"

/* ───────── Path utilities ───────── */

export const normalizePathInput = (rawPath: string): string =>
	rawPath
		.trim()
		.replace(/\\/g, "/")
		.replace(/^\/+/, "")
		.replace(/\/+/g, "/")
		.replace(/\/$/, "")

export const getParentPath = (path: string): string | null => {
	if (path === "/") return null
	const slashIndex = path.lastIndexOf("/")
	if (slashIndex <= 0) return "/"
	return path.slice(0, slashIndex)
}

export const getBaseName = (path: string): string => {
	if (path === "/") return "/"
	const slashIndex = path.lastIndexOf("/")
	return slashIndex < 0 ? path : path.slice(slashIndex + 1)
}

export const joinPath = (basePath: string, relativePath: string): string =>
	basePath === "/" ? `/${relativePath}` : `${basePath}/${relativePath}`

export const getExtension = (path: string): string => {
	const baseName = getBaseName(path)
	const dotIndex = baseName.lastIndexOf(".")
	if (dotIndex < 0) return ""
	return baseName.slice(dotIndex).toLowerCase()
}

/* ───────── File/language resolution ───────── */

export const getFileIconForPath = (path: string): LucideIcon =>
	fileIconByExtension[getExtension(path)] ?? File

export const getRuntimeForPath = (path: string): Runtime | null =>
	runtimeByExtension[getExtension(path)] ?? null

export const getLanguageLabelForPath = (path: string): string =>
	languageByExtension[getExtension(path)] ?? "Unsupported"

export const getEditorLanguageForPath = (path: string): string =>
	editorLanguageByExtension[getExtension(path)] ?? "plaintext"

export const getTemplateForPath = (path: string): string =>
	templateByExtension[getExtension(path)] ?? ""

/* ───────── Tab helpers ───────── */

export const getTabLabel = (path: string): string =>
	path === SETTINGS_TAB_ID ? "Settings" : getBaseName(path)

export const getTabIconForPath = (path: string): LucideIcon =>
	path === SETTINGS_TAB_ID ? Settings : getFileIconForPath(path)

/* ───────── Tree traversal ───────── */

export const getParentFolders = (path: string): string[] => {
	const folders: string[] = []
	let current = getParentPath(path)
	while (current && current !== "/") {
		folders.unshift(current)
		current = getParentPath(current)
	}
	return folders
}

export const getAncestors = (path: string): string[] => {
	const ancestors: string[] = ["/"]
	let current = getParentPath(path)
	while (current && current !== "/") {
		ancestors.push(current)
		current = getParentPath(current)
	}
	return ancestors
}

export const unique = (values: string[]): string[] => Array.from(new Set(values))

/* ───────── Entry predicates and sorts ───────── */

export const isFileEntry = (entry: WorkspaceEntry): entry is WorkspaceFileEntry =>
	entry.kind === "file"

export const isFolderEntry = (entry: WorkspaceEntry): entry is WorkspaceFolderEntry =>
	entry.kind === "folder"

export const sortWorkspaceEntries = (entries: WorkspaceEntry[]): WorkspaceEntry[] =>
	[...entries].sort((a, b) => a.path.localeCompare(b.path))

export const buildFolderPathSet = (entries: WorkspaceEntry[]): Set<string> => {
	const folders = new Set<string>(["/"]);
	for (const entry of entries) {
		if (isFolderEntry(entry)) {
			folders.add(entry.path)
		}
		for (const parent of getParentFolders(entry.path)) {
			folders.add(parent)
		}
	}
	return folders
}

/* ───────── WASI helpers ───────── */

export const createStringFile = (path: string, content: string): WASIFile => ({
	path,
	mode: "string",
	content,
	timestamps: {
		access: new Date(),
		modification: new Date(),
		change: new Date(),
	},
})

export const getBinaryURLFromFS = (fs: WASIFS, fsPath: string): string | null => {
	const file = fs[fsPath]
	if (!file || file.mode !== "binary") return null
	const wasmBytes = new Uint8Array(file.content.byteLength)
	wasmBytes.set(file.content)
	return URL.createObjectURL(new Blob([wasmBytes], { type: "application/wasm" }))
}

/* ───────── Misc ───────── */

export const escapeSqlLiteral = (value: string): string => value.replace(/'/g, "''")
