import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import Editor, { type Monaco } from "@monaco-editor/react"
import type { RunElement, Runtime } from "@runno/runtime"
import Split from "react-split"
import {
	deleteWorkspacePaths,
	listWorkspaceEntries,
	putWorkspaceEntries,
	type WorkspaceEntry,
	type WorkspaceFileEntry,
	type WorkspaceFolderEntry,
} from "./fileStore"
import "./App.css"

/* ───────── Constants ───────── */

const runtimeByExtension: Record<string, Runtime> = {
	".js": "quickjs",
	".mjs": "quickjs",
	".cjs": "quickjs",
	".py": "python",
	".c": "clang",
	".cpp": "clangpp",
	".cc": "clangpp",
	".cxx": "clangpp",
	".php": "php-cgi",
	".sql": "sqlite",
	".rb": "ruby",
}

const languageByExtension: Record<string, string> = {
	".js": "JavaScript",
	".mjs": "JavaScript",
	".cjs": "JavaScript",
	".py": "Python",
	".c": "C",
	".cpp": "C++",
	".cc": "C++",
	".cxx": "C++",
	".php": "PHP",
	".sql": "SQLite",
	".rb": "Ruby",
}

const supportedLanguages: Array<{ label: string; extensions: string[] }> = [
	{ label: "JavaScript", extensions: [".js", ".mjs", ".cjs"] },
	{ label: "Python", extensions: [".py"] },
	{ label: "C", extensions: [".c"] },
	{ label: "C++", extensions: [".cpp", ".cc", ".cxx"] },
	{ label: "PHP", extensions: [".php"] },
	{ label: "SQLite", extensions: [".sql"] },
	{ label: "Ruby", extensions: [".rb"] },
]

const editorLanguageByExtension: Record<string, string> = {
	".js": "javascript",
	".mjs": "javascript",
	".cjs": "javascript",
	".py": "python",
	".c": "cpp",
	".cpp": "cpp",
	".cc": "cpp",
	".cxx": "cpp",
	".php": "php",
	".sql": "sql",
	".rb": "ruby",
}

const templateByExtension: Record<string, string> = {
	".js": 'console.log("Hello from JavaScript")\n',
	".py": 'print("Hello from Python")\n',
	".c": `#include <stdio.h>\n\nint main(void) {\n  printf("Hello from C\\n");\n  return 0;\n}\n`,
	".cpp": `#include <iostream>\n\nint main() {\n  std::cout << "Hello from C++" << std::endl;\n  return 0;\n}\n`,
	".cc": `#include <iostream>\n\nint main() {\n  std::cout << "Hello from C++" << std::endl;\n  return 0;\n}\n`,
	".cxx": `#include <iostream>\n\nint main() {\n  std::cout << "Hello from C++" << std::endl;\n  return 0;\n}\n`,
	".php": `<?php\necho "Hello from PHP\\n";\n`,
	".sql": "SELECT 'Hello from SQLite';\n",
	".rb": 'puts "Hello from Ruby"\n',
}

const initialWorkspace: WorkspaceEntry[] = [
	{
		path: "/main.py",
		kind: "file",
		content: 'print("Hello from NimbusCode")\n',
		updatedAt: Date.now(),
	},
]

const TOKYO_NIGHT_THEME = "tokyonight-nimbus"

const applyTokyoNightMonacoTheme = (monaco: Monaco) => {
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
}

type PendingCreation = {
	kind: "file" | "folder"
	parentPath: string
	value: string
}

/* ───────── Helpers ───────── */

const normalizePathInput = (rawPath: string): string =>
	rawPath
		.trim()
		.replace(/\\/g, "/")
		.replace(/^\/+/, "")
		.replace(/\/+/g, "/")
		.replace(/\/$/, "")

const getParentPath = (path: string): string | null => {
	if (path === "/") return null

	const slashIndex = path.lastIndexOf("/")
	if (slashIndex <= 0) return "/"
	return path.slice(0, slashIndex)
}

const getBaseName = (path: string): string => {
	if (path === "/") return "/"
	const slashIndex = path.lastIndexOf("/")
	return slashIndex < 0 ? path : path.slice(slashIndex + 1)
}

const joinPath = (basePath: string, relativePath: string): string =>
	basePath === "/" ? `/${relativePath}` : `${basePath}/${relativePath}`

const getExtension = (path: string): string => {
	const baseName = getBaseName(path)
	const dotIndex = baseName.lastIndexOf(".")
	if (dotIndex < 0) return ""
	return baseName.slice(dotIndex).toLowerCase()
}

const getRuntimeForPath = (path: string): Runtime | null =>
	runtimeByExtension[getExtension(path)] ?? null

const getLanguageLabelForPath = (path: string): string =>
	languageByExtension[getExtension(path)] ?? "Unsupported"

const getEditorLanguageForPath = (path: string): string =>
	editorLanguageByExtension[getExtension(path)] ?? "plaintext"

const getTemplateForPath = (path: string): string =>
	templateByExtension[getExtension(path)] ?? ""

const getParentFolders = (path: string): string[] => {
	const folders: string[] = []
	let current = getParentPath(path)

	while (current && current !== "/") {
		folders.unshift(current)
		current = getParentPath(current)
	}

	return folders
}

const getAncestors = (path: string): string[] => {
	const ancestors: string[] = ["/"]
	let current = getParentPath(path)

	while (current && current !== "/") {
		ancestors.push(current)
		current = getParentPath(current)
	}

	return ancestors
}

const unique = (values: string[]): string[] => Array.from(new Set(values))

const sortWorkspaceEntries = (entries: WorkspaceEntry[]): WorkspaceEntry[] =>
	[...entries].sort((a, b) => a.path.localeCompare(b.path))

const isFileEntry = (entry: WorkspaceEntry): entry is WorkspaceFileEntry =>
	entry.kind === "file"

const isFolderEntry = (entry: WorkspaceEntry): entry is WorkspaceFolderEntry =>
	entry.kind === "folder"

const buildFolderPathSet = (entries: WorkspaceEntry[]): Set<string> => {
	const folders = new Set<string>(["/"])

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

/* ───────── App ───────── */

function App() {
	const runnoRef = useRef<RunElement | null>(null)
	const saveTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

	const [entries, setEntries] = useState<WorkspaceEntry[]>([])
	const [selectedPath, setSelectedPath] = useState<string | null>(null)
	const [activeFilePath, setActiveFilePath] = useState<string | null>(null)
	const [openTabs, setOpenTabs] = useState<string[]>([])
	const [expandedFolders, setExpandedFolders] = useState<string[]>(["/"])
	const [pendingCreation, setPendingCreation] = useState<PendingCreation | null>(
		null,
	)
	const [workspaceError, setWorkspaceError] = useState<string | null>(null)
	const [isWorkspaceReady, setIsWorkspaceReady] = useState(false)

	const [terminalKey, setTerminalKey] = useState(0)
	const [runError, setRunError] = useState<string | null>(null)
	const [showSupportedLanguages, setShowSupportedLanguages] = useState(false)
	const [isRunning, setIsRunning] = useState(false)

	const fileEntries = useMemo(
		() => entries.filter(isFileEntry).sort((a, b) => a.path.localeCompare(b.path)),
		[entries],
	)

	const fileByPath = useMemo(
		() => new Map(fileEntries.map((entry) => [entry.path, entry])),
		[fileEntries],
	)

	const folderPathSet = useMemo(() => buildFolderPathSet(entries), [entries])
	const folderPaths = useMemo(
		() => Array.from(folderPathSet).sort((a, b) => a.localeCompare(b)),
		[folderPathSet],
	)

	const selectedFile = activeFilePath ? fileByPath.get(activeFilePath) ?? null : null
	const selectedRuntime = selectedFile ? getRuntimeForPath(selectedFile.path) : null
	const selectedLanguageLabel = selectedFile
		? getLanguageLabelForPath(selectedFile.path)
		: "No file"
	const selectedEditorLanguage = selectedFile
		? getEditorLanguageForPath(selectedFile.path)
		: "plaintext"

	const fitRunnoTerminal = () => {
		const terminal = runnoRef.current?.shadowRoot?.querySelector(
			"runno-terminal",
		) as (HTMLElement & { onResize?: () => void }) | null

		terminal?.onResize?.()
	}

	useEffect(() => {
		const frame = requestAnimationFrame(() => {
			fitRunnoTerminal()
		})

		return () => cancelAnimationFrame(frame)
	}, [selectedRuntime, terminalKey])

	useEffect(() => {
		let cancelled = false

		const loadWorkspace = async () => {
			try {
				const persisted = await listWorkspaceEntries()
				const source = persisted.length > 0 ? persisted : initialWorkspace

				if (persisted.length === 0) {
					await putWorkspaceEntries(source)
				}

				if (cancelled) return

				const firstFilePath = source.find(isFileEntry)?.path ?? null
				setEntries(sortWorkspaceEntries(source))
				setSelectedPath(firstFilePath)
				setActiveFilePath(firstFilePath)
				setOpenTabs(firstFilePath ? [firstFilePath] : [])
				setExpandedFolders(["/"])
				setWorkspaceError(null)
				setIsWorkspaceReady(true)
			} catch (error) {
				if (cancelled) return
				setWorkspaceError(`Failed to load workspace: ${String(error)}`)
			}
		}

		void loadWorkspace()

		return () => {
			cancelled = true
		}
	}, [])

	useEffect(() => {
		const timers = saveTimersRef.current

		return () => {
			for (const timer of Object.values(timers)) {
				clearTimeout(timer)
			}
		}
	}, [])

	useEffect(() => {
		const existingFilePaths = new Set(fileEntries.map((entry) => entry.path))
		const filteredTabs = openTabs.filter((path) => existingFilePaths.has(path))

		if (filteredTabs.length !== openTabs.length) {
			setOpenTabs(filteredTabs)
		}

		if (activeFilePath && !existingFilePaths.has(activeFilePath)) {
			setActiveFilePath(filteredTabs[0] ?? null)
		}
	}, [fileEntries, openTabs, activeFilePath])

	const selectPath = (path: string) => {
		const nextExpanded = unique([
			...expandedFolders,
			...getAncestors(path),
			...(folderPathSet.has(path) ? [path] : []),
		])

		setSelectedPath(path)
		setExpandedFolders(nextExpanded)

		if (fileByPath.has(path)) {
			setOpenTabs((prev) => (prev.includes(path) ? prev : [...prev, path]))
			setActiveFilePath(path)
		}
	}

	const activateTab = (path: string) => {
		if (!fileByPath.has(path)) return
		setActiveFilePath(path)
		setSelectedPath(path)
	}

	const closeTab = (path: string) => {
		const tabIndex = openTabs.indexOf(path)
		if (tabIndex < 0) return

		const nextTabs = openTabs.filter((tabPath) => tabPath !== path)
		setOpenTabs(nextTabs)

		if (activeFilePath === path) {
			const fallbackPath = nextTabs[tabIndex] ?? nextTabs[tabIndex - 1] ?? null
			setActiveFilePath(fallbackPath)
			setSelectedPath(fallbackPath)
		}
	}

	const beginCreateEntry = (kind: "file" | "folder") => {
		const selectedIsFolder = selectedPath
			? folderPathSet.has(selectedPath) && !fileByPath.has(selectedPath)
			: false
		const baseFolder = selectedPath
			? selectedIsFolder
				? selectedPath
				: (getParentPath(selectedPath) ?? "/")
			: "/"

		setPendingCreation({
			kind,
			parentPath: baseFolder,
			value: "",
		})
		setExpandedFolders((prev) =>
			unique([...prev, ...getAncestors(baseFolder), baseFolder]),
		)
		setWorkspaceError(null)
	}

	const commitPendingCreation = async (overrideValue?: string) => {
		if (!pendingCreation) return

		const rawInput = overrideValue ?? pendingCreation.value
		const kind = pendingCreation.kind
		const baseFolder = pendingCreation.parentPath

		setPendingCreation(null)

		const normalized = normalizePathInput(rawInput)
		if (!normalized) return

		const nextPath = joinPath(baseFolder, normalized)
		if (fileByPath.has(nextPath) || folderPathSet.has(nextPath)) {
			setWorkspaceError(`Path already exists: ${nextPath}`)
			return
		}

		const now = Date.now()
		const missingParents = getParentFolders(nextPath).filter(
			(folderPath) => !folderPathSet.has(folderPath),
		)
		const parentFolders: WorkspaceFolderEntry[] = missingParents.map((path) => ({
			path,
			kind: "folder",
			updatedAt: now,
		}))

		const newEntry: WorkspaceEntry =
			kind === "file"
				? {
					path: nextPath,
					kind: "file",
					content: getTemplateForPath(nextPath),
					updatedAt: now,
				}
				: {
					path: nextPath,
					kind: "folder",
					updatedAt: now,
				}

		const additions = [...parentFolders, newEntry]
		setEntries((prev) => sortWorkspaceEntries([...prev, ...additions]))
		setExpandedFolders((prev) =>
			unique([
				...prev,
				...getAncestors(nextPath),
				...missingParents,
				...(kind === "folder" ? [nextPath] : []),
			]),
		)
		setSelectedPath(nextPath)
		if (kind === "file") {
			setOpenTabs((prev) => (prev.includes(nextPath) ? prev : [...prev, nextPath]))
			setActiveFilePath(nextPath)
		}
		setWorkspaceError(null)

		try {
			await putWorkspaceEntries(additions)
		} catch (error) {
			setWorkspaceError(`Failed to save ${nextPath}: ${String(error)}`)
		}
	}

	const deleteSelected = async () => {
		if (!selectedPath || selectedPath === "/") return

		const isFile = fileByPath.has(selectedPath)
		const isFolder = !isFile && folderPathSet.has(selectedPath)
		if (!isFile && !isFolder) return

		const confirmation = window.confirm(
			isFile
				? `Delete file ${selectedPath}?`
				: `Delete folder ${selectedPath} and all nested files?`,
		)
		if (!confirmation) return

		const prefix = `${selectedPath}/`
		const pathsToDelete = isFile
			? [selectedPath]
			: entries
					.filter((entry) => entry.path === selectedPath || entry.path.startsWith(prefix))
					.map((entry) => entry.path)

		for (const path of pathsToDelete) {
			const timer = saveTimersRef.current[path]
			if (timer) {
				clearTimeout(timer)
				delete saveTimersRef.current[path]
			}
		}

		const nextEntries = entries.filter((entry) =>
			isFile
				? entry.path !== selectedPath
				: !(entry.path === selectedPath || entry.path.startsWith(prefix)),
		)
		const deletePathSet = new Set(pathsToDelete)
		const nextTabs = openTabs.filter((path) => !deletePathSet.has(path))

		const nextFolderSet = buildFolderPathSet(nextEntries)
		const nextExpanded = expandedFolders.filter(
			(path) => path === "/" || nextFolderSet.has(path),
		)
		const fallbackSelectedFile = nextEntries.filter(isFileEntry)[0] ?? null
		let nextActivePath = activeFilePath
		if (nextActivePath && deletePathSet.has(nextActivePath)) {
			nextActivePath = nextTabs[0] ?? fallbackSelectedFile?.path ?? null
		}
		const nextSelectedPath =
			nextActivePath ??
			(getParentPath(selectedPath) && nextFolderSet.has(getParentPath(selectedPath) ?? "")
				? getParentPath(selectedPath)
				: fallbackSelectedFile?.path ?? null)

		setEntries(nextEntries)
		setExpandedFolders(nextExpanded)
		setOpenTabs(nextTabs)
		setActiveFilePath(nextActivePath)
		setSelectedPath(nextSelectedPath)
		setWorkspaceError(null)

		try {
			await deleteWorkspacePaths(pathsToDelete)
		} catch (error) {
			setWorkspaceError(`Failed to delete ${selectedPath}: ${String(error)}`)
		}
	}

	const onEditorChange = (value: string | undefined) => {
		if (!selectedFile) return

		const nextContent = value ?? ""
		const updatedEntry: WorkspaceFileEntry = {
			...selectedFile,
			content: nextContent,
			updatedAt: Date.now(),
		}

		setEntries((prev) =>
			prev.map((entry) =>
				entry.path === selectedFile.path ? updatedEntry : entry,
			),
		)

		const existingTimer = saveTimersRef.current[selectedFile.path]
		if (existingTimer) {
			clearTimeout(existingTimer)
		}

		saveTimersRef.current[selectedFile.path] = setTimeout(() => {
			delete saveTimersRef.current[selectedFile.path]
			void putWorkspaceEntries([updatedEntry]).catch((error) => {
				setWorkspaceError(`Failed to save ${selectedFile.path}: ${String(error)}`)
			})
		}, 250)
	}

	const runCode = async () => {
		if (isRunning || !runnoRef.current) return

		if (!selectedFile) {
			setRunError("Select a file to run.")
			return
		}

		if (!selectedRuntime) {
			setRunError(
				`No runtime mapped for ${selectedFile.path}. Use .js, .py, .c, .cpp, .php, .sql, or .rb.`,
			)
			return
		}

		setIsRunning(true)
		setRunError(null)
		fitRunnoTerminal()

		try {
			await runnoRef.current.interactiveRunCode(selectedRuntime, selectedFile.content)
		} catch (error) {
			setRunError(String(error))
		} finally {
			setIsRunning(false)
		}
	}

	const clearTerminal = () => {
		setRunError(null)
		setTerminalKey((prev) => prev + 1)
	}

	const toggleFolder = (path: string) => {
		setExpandedFolders((prev) =>
			prev.includes(path) ? prev.filter((value) => value !== path) : [...prev, path],
		)
	}

	const getFolderChildren = (parentPath: string): {
		folders: string[]
		files: WorkspaceFileEntry[]
	} => {
		const folders = folderPaths
			.filter((folderPath) => folderPath !== "/" && getParentPath(folderPath) === parentPath)
			.sort((a, b) => a.localeCompare(b))
		const files = fileEntries
			.filter((fileEntry) => getParentPath(fileEntry.path) === parentPath)
			.sort((a, b) => a.path.localeCompare(b.path))

		return { folders, files }
	}

	const renderTree = (parentPath: string, depth: number): ReactNode => {
		const { folders, files } = getFolderChildren(parentPath)
		const isCreatingHere = pendingCreation?.parentPath === parentPath

		return (
			<>
				{folders.map((folderPath) => {
					const expanded = expandedFolders.includes(folderPath)
					const active = selectedPath === folderPath

					return (
						<div key={folderPath}>
							<div
								className={`tree-row ${active ? "active" : ""}`}
								style={{ paddingLeft: `${8 + depth * 14}px` }}
							>
								<button
									type="button"
									className="tree-toggle"
									onClick={() => toggleFolder(folderPath)}
								>
									{expanded ? "▾" : "▸"}
								</button>
								<button
									type="button"
									className="tree-entry folder"
									onClick={() => selectPath(folderPath)}
								>
									{getBaseName(folderPath)}
								</button>
							</div>
							{expanded ? renderTree(folderPath, depth + 1) : null}
						</div>
					)
				})}

				{isCreatingHere && (
					<div
						className="tree-row creating"
						style={{ paddingLeft: `${8 + depth * 14}px` }}
					>
						<span className="tree-spacer" aria-hidden="true" />
						<input
							className="tree-create-input"
							value={pendingCreation?.value ?? ""}
							autoFocus
							placeholder={
								pendingCreation?.kind === "folder"
									? "new-folder"
									: "new-file.ext"
							}
							onChange={(event) => {
								const nextValue = event.target.value
								setPendingCreation((prev) =>
									prev
										? {
											...prev,
											value: nextValue,
										}
										: null,
								)
							}}
							onBlur={() => {
								setPendingCreation(null)
							}}
							onKeyDown={(event) => {
								if (event.key === "Escape") {
									event.preventDefault()
									setPendingCreation(null)
									return
								}

								if (event.key === "Enter") {
									event.preventDefault()
									void commitPendingCreation(event.currentTarget.value)
								}
							}}
						/>
					</div>
				)}

				{files.map((fileEntry) => {
					const active = selectedPath === fileEntry.path

					return (
						<div
							key={fileEntry.path}
							className={`tree-row ${active ? "active" : ""}`}
							style={{ paddingLeft: `${8 + depth * 14}px` }}
						>
							<span className="tree-spacer" aria-hidden="true" />
							<button
								type="button"
								className="tree-entry file"
								onClick={() => selectPath(fileEntry.path)}
							>
								{getBaseName(fileEntry.path)}
							</button>
						</div>
					)
				})}
			</>
		)
	}

	/* ───────── Render ───────── */

	return (
		<div className="app-root">
			<header className="navbar">
				<div className="navbar-left">
					<span className="logo">NimbusCode</span>
				</div>

				<div className="navbar-right">
					<span className="active-file-pill">
						{selectedFile
							? selectedFile.path
							: "Select a file"}
					</span>
					<div
						className="language-menu"
						onBlur={(event) => {
							const related = event.relatedTarget as Node | null
							if (!event.currentTarget.contains(related)) {
								setShowSupportedLanguages(false)
							}
						}}
					>
						<button
							type="button"
							className="language-chip"
							aria-expanded={showSupportedLanguages}
							onClick={() => {
								setShowSupportedLanguages((prev) => !prev)
							}}
						>
							{selectedLanguageLabel}
						</button>
						{showSupportedLanguages && (
							<div className="language-menu-popup">
								<div className="language-menu-title">Supported Languages</div>
								<ul className="language-menu-list">
									{supportedLanguages.map((language) => (
										<li key={language.label} className="language-menu-item">
											<span>{language.label}</span>
											<span>{language.extensions.join(", ")}</span>
										</li>
									))}
								</ul>
							</div>
						)}
					</div>
					<button
						className="run-btn"
						type="button"
						onClick={runCode}
						disabled={
							isRunning || !isWorkspaceReady || !selectedFile || !selectedRuntime
						}
					>
						{isRunning ? "Running..." : "▶ Run"}
					</button>
				</div>
			</header>

			<Split
				direction="horizontal"
				sizes={[20, 80]}
				minSize={[180, 340]}
				gutterSize={6}
				className="workspace-area"
			>
				<aside className="explorer-pane">
					<div className="explorer-header">
						<span className="explorer-title">EXPLORER</span>
						<div className="explorer-actions">
							<button
								type="button"
								className="explorer-btn"
								onClick={() => {
									beginCreateEntry("file")
								}}
							>
								+File
							</button>
							<button
								type="button"
								className="explorer-btn"
								onClick={() => {
									beginCreateEntry("folder")
								}}
							>
								+Folder
							</button>
							<button
								type="button"
								className="explorer-btn danger"
								onClick={() => {
									void deleteSelected()
								}}
								disabled={!selectedPath || selectedPath === "/"}
							>
								Delete
							</button>
						</div>
					</div>
					<div className="explorer-tree">{renderTree("/", 0)}</div>
					{workspaceError && (
						<div className="explorer-error">{workspaceError}</div>
					)}
				</aside>

				<div className="main-pane">
					<Split
						direction="vertical"
						sizes={[72, 28]}
						minSize={[220, 120]}
						gutterSize={6}
						className="editor-area"
					>
						<div className="editor-pane">
							<div className="editor-tabs" role="tablist" aria-label="Open files">
								{openTabs.map((path) => {
									const isActive = activeFilePath === path

									return (
										<div
											key={path}
											className={`editor-tab ${isActive ? "active" : ""}`}
										>
											<button
												type="button"
												className="editor-tab-button"
												onClick={() => activateTab(path)}
											>
												{getBaseName(path)}
											</button>
											<button
												type="button"
												className="editor-tab-close"
												aria-label={`Close ${getBaseName(path)}`}
												onClick={(event) => {
													event.stopPropagation()
													closeTab(path)
												}}
											>
												×
											</button>
										</div>
									)
								})}
							</div>
							<div className="editor-content">
							<Editor
								path={selectedFile?.path}
								height="100%"
								theme={TOKYO_NIGHT_THEME}
								beforeMount={applyTokyoNightMonacoTheme}
								language={selectedEditorLanguage}
								value={selectedFile?.content ?? ""}
								onChange={onEditorChange}
								options={{
									readOnly: !selectedFile,
									fontFamily:
										'"JetBrains Mono", "Fira Code", Menlo, Monaco, Consolas, monospace',
										fontLigatures: true,
									}}
								/>
							</div>
							{!selectedFile && (
								<div className="editor-empty">
									Select a file in the explorer to open it in a tab.
								</div>
							)}
						</div>

						<div className="console">
							<div className="console-title-row">
								<div className="console-title">OUTPUT</div>
								<button
									className="console-clear-btn"
									type="button"
									onClick={clearTerminal}
								>
									Clear
								</button>
							</div>
							{runError && <div className="console-error">{runError}</div>}
							<div className="console-terminal">
								<runno-run
									key={`${selectedRuntime ?? "python"}-${terminalKey}`}
									className="runno-runner"
									runtime={selectedRuntime ?? "python"}
									style={{ width: "100%", height: "100%" }}
									ref={(element: HTMLElement | null) => {
										runnoRef.current = element as RunElement | null
									}}
								/>
							</div>
						</div>
					</Split>
				</div>
			</Split>
		</div>
	)
}

export default App
