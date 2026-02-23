import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import Editor, { type Monaco } from "@monaco-editor/react"
import { fetchWASIFS, type RunElement, type Runtime } from "@runno/runtime"
import { WASI, type WASIFile, type WASIFS } from "@runno/wasi"
import {
	Cloud,
	ChevronDown,
	Database,
	Eraser,
	File,
	FileCode2,
	FileJson2,
	FilePlus2,
	Folder,
	FolderOpen,
	FolderPlus,
	FolderTree,
	Gem,
	Languages,
	LoaderCircle,
	Play,
	Settings,
	TerminalSquare,
	Trash2,
	X,
	type LucideIcon,
} from "lucide-react"
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
	".phtml": "php-cgi",
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
	".phtml": "PHP",
	".sql": "SQLite",
	".rb": "Ruby",
}

const languageIconByLabel: Record<string, LucideIcon> = {
	JavaScript: FileCode2,
	Python: FileCode2,
	C: FileCode2,
	"C++": FileCode2,
	PHP: FileCode2,
	SQLite: Database,
	Ruby: Gem,
}

const fileIconByExtension: Record<string, LucideIcon> = {
	".js": FileJson2,
	".mjs": FileJson2,
	".cjs": FileJson2,
	".py": FileCode2,
	".c": FileCode2,
	".cpp": FileCode2,
	".cc": FileCode2,
	".cxx": FileCode2,
	".php": FileCode2,
	".phtml": FileCode2,
	".sql": Database,
	".rb": Gem,
}

const supportedLanguages: Array<{ label: string; extensions: string[] }> = [
	{ label: "JavaScript", extensions: [".js", ".mjs", ".cjs"] },
	{ label: "Python", extensions: [".py"] },
	{ label: "C", extensions: [".c"] },
	{ label: "C++", extensions: [".cpp", ".cc", ".cxx"] },
	{ label: "PHP", extensions: [".php", ".phtml"] },
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
	".phtml": "php",
	".sql": "sql",
	".rb": "ruby",
}

const templateByExtension: Record<string, string> = {
	".js": `const name = "friend"
console.log("Hello, " + name + "!")
`,
	".mjs": `const name = "friend"
console.log("Hello, " + name + "!")
`,
	".cjs": `const name = "friend"
console.log("Hello, " + name + "!")
`,
	".py": `name = input("What's your name? ").strip()
print(f"Hello, {name or 'friend'}!")
`,
	".c": `#include <stdio.h>

int main(void) {
  printf("Hello, World!\\n");
  return 0;
}
`,
	".cpp": `#include <iostream>
#include <string>

int main() {
  std::string name;
  std::cout << "What's your name? ";
  std::getline(std::cin, name);

  if (name.empty()) {
    name = "friend";
  }

  std::cout << "Hello, " << name << "!\\n";
  return 0;
}
`,
	".cc": `#include <iostream>
#include <string>

int main() {
  std::string name;
  std::cout << "What's your name? ";
  std::getline(std::cin, name);

  if (name.empty()) {
    name = "friend";
  }

  std::cout << "Hello, " << name << "!\\n";
  return 0;
}
`,
	".cxx": `#include <iostream>
#include <string>

int main() {
  std::string name;
  std::cout << "What's your name? ";
  std::getline(std::cin, name);

  if (name.empty()) {
    name = "friend";
  }

  std::cout << "Hello, " << name << "!\\n";
  return 0;
}
`,
	".php": `<?php
echo "What's your name? ";
$stream = fopen("php://stdin", "r");
$name = $stream ? trim((string) fgets($stream)) : "";
if (is_resource($stream)) {
    fclose($stream);
}

if ($name === "") {
    $name = "friend";
}

echo "Hello, {$name}!\\n";
`,
	".phtml": `<?php
echo "What's your name? ";
$stream = fopen("php://stdin", "r");
$name = $stream ? trim((string) fgets($stream)) : "";
if (is_resource($stream)) {
    fclose($stream);
}

if ($name === "") {
    $name = "friend";
}

echo "Hello, {$name}!\\n";
`,
	".sql": `-- On Run, NimbusCode prompts for a name and replaces {{name}}.
WITH person(name) AS (VALUES ('{{name}}'))
SELECT 'Hello, ' || name || '!' AS greeting
FROM person;
`,
	".rb": `print "What's your name? "
name = STDIN.gets&.strip.to_s
name = "friend" if name.empty?
puts "Hello, #{name}!"
`,
}

const initialWorkspace: WorkspaceEntry[] = [
	{
		path: "/main.py",
		kind: "file",
		content: `name = input("What's your name? ").strip()
print(f"Hello, {name or 'friend'}!")
`,
		updatedAt: Date.now(),
	},
]

const TOKYO_NIGHT_THEME = "tokyonight-nimbus"
const SETTINGS_TAB_ID = "__nimbus_settings__"

type KeybindingMode = "default" | "vim" | "emacs"

type SimpleCompletionKind =
	| "keyword"
	| "function"
	| "snippet"
	| "class"
	| "variable"
	| "module"

type SimpleCompletionItem = {
	label: string
	kind: SimpleCompletionKind
	insertText?: string
	detail?: string
	isSnippet?: boolean
}

type LanguageCompletionConfig = {
	language: string
	triggerCharacters?: string[]
	items: SimpleCompletionItem[]
}

const SIMPLE_LANGUAGE_COMPLETIONS: LanguageCompletionConfig[] = [
	{
		language: "javascript",
		triggerCharacters: [".", "_"],
		items: [
			{ label: "const", kind: "keyword" },
			{ label: "let", kind: "keyword" },
			{ label: "function", kind: "keyword" },
			{ label: "return", kind: "keyword" },
			{ label: "if", kind: "keyword" },
			{ label: "else", kind: "keyword" },
			{ label: "for", kind: "keyword" },
			{ label: "while", kind: "keyword" },
			{ label: "class", kind: "class" },
			{ label: "import", kind: "keyword" },
			{ label: "export", kind: "keyword" },
			{ label: "async", kind: "keyword" },
			{ label: "await", kind: "keyword" },
			{ label: "console.log", kind: "function", insertText: "console.log(${1:value})", isSnippet: true },
		],
	},
	{
		language: "python",
		triggerCharacters: [".", "_"],
		items: [
			{ label: "def", kind: "keyword", insertText: "def ${1:name}(${2:args}):\n\t${3:pass}", isSnippet: true },
			{ label: "class", kind: "class", insertText: "class ${1:Name}:\n\tdef __init__(self, ${2:args}):\n\t\t${3:pass}", isSnippet: true },
			{ label: "if", kind: "keyword" },
			{ label: "elif", kind: "keyword" },
			{ label: "else", kind: "keyword" },
			{ label: "for", kind: "keyword", insertText: "for ${1:item} in ${2:iterable}:\n\t${3:pass}", isSnippet: true },
			{ label: "while", kind: "keyword" },
			{ label: "import", kind: "keyword" },
			{ label: "from", kind: "keyword" },
			{ label: "return", kind: "keyword" },
			{ label: "print", kind: "function" },
			{ label: "len", kind: "function" },
		],
	},
	{
		language: "cpp",
		triggerCharacters: [".", ":", "_"],
		items: [
			{ label: "#include <stdio.h>", kind: "snippet", insertText: "#include <stdio.h>", isSnippet: true },
			{ label: "#include <iostream>", kind: "snippet", insertText: "#include <iostream>", isSnippet: true },
			{
				label: "main",
				kind: "snippet",
				insertText: "int main() {\n\t${1:// code}\n\treturn 0;\n}",
				isSnippet: true,
			},
			{ label: "if", kind: "keyword" },
			{ label: "else", kind: "keyword" },
			{ label: "for", kind: "keyword", insertText: "for (int ${1:i} = 0; ${1:i} < ${2:n}; ++${1:i}) {\n\t${3}\n}", isSnippet: true },
			{ label: "while", kind: "keyword" },
			{ label: "return", kind: "keyword" },
			{ label: "int", kind: "keyword" },
			{ label: "char", kind: "keyword" },
			{ label: "double", kind: "keyword" },
			{ label: "void", kind: "keyword" },
			{ label: "std::cout", kind: "variable" },
			{ label: "std::cin", kind: "variable" },
			{ label: "printf", kind: "function" },
		],
	},
	{
		language: "php",
		triggerCharacters: ["$", ":", ">"],
		items: [
			{ label: "<?php", kind: "snippet", insertText: "<?php\n${1:// code}\n", isSnippet: true },
			{ label: "echo", kind: "keyword" },
			{ label: "function", kind: "keyword", insertText: "function ${1:name}(${2:$args}) {\n\t${3}\n}", isSnippet: true },
			{ label: "if", kind: "keyword" },
			{ label: "else", kind: "keyword" },
			{ label: "foreach", kind: "keyword", insertText: "foreach (${1:$items} as ${2:$item}) {\n\t${3}\n}", isSnippet: true },
			{ label: "return", kind: "keyword" },
			{ label: "class", kind: "class" },
			{ label: "public", kind: "keyword" },
			{ label: "private", kind: "keyword" },
		],
	},
	{
		language: "ruby",
		triggerCharacters: [".", ":"],
		items: [
			{ label: "def", kind: "keyword", insertText: "def ${1:name}(${2:args})\n\t${3}\nend", isSnippet: true },
			{ label: "class", kind: "class", insertText: "class ${1:Name}\n\t${2}\nend", isSnippet: true },
			{ label: "module", kind: "module" },
			{ label: "if", kind: "keyword" },
			{ label: "elsif", kind: "keyword" },
			{ label: "else", kind: "keyword" },
			{ label: "end", kind: "keyword" },
			{ label: "require", kind: "keyword" },
			{ label: "puts", kind: "function" },
			{ label: "each do", kind: "snippet", insertText: "${1:items}.each do |${2:item}|\n\t${3}\nend", isSnippet: true },
		],
	},
	{
		language: "sql",
		triggerCharacters: [" "],
		items: [
			{ label: "SELECT", kind: "keyword" },
			{ label: "FROM", kind: "keyword" },
			{ label: "WHERE", kind: "keyword" },
			{ label: "INSERT INTO", kind: "keyword" },
			{ label: "UPDATE", kind: "keyword" },
			{ label: "DELETE", kind: "keyword" },
			{ label: "CREATE TABLE", kind: "snippet", insertText: "CREATE TABLE ${1:table_name} (\n\t${2:id} INTEGER PRIMARY KEY,\n\t${3:name} TEXT NOT NULL\n);", isSnippet: true },
			{ label: "JOIN", kind: "keyword" },
			{ label: "GROUP BY", kind: "keyword" },
			{ label: "ORDER BY", kind: "keyword" },
			{ label: "LIMIT", kind: "keyword" },
		],
	},
]

const toMonacoCompletionKind = (monaco: Monaco, kind: SimpleCompletionKind): number => {
	switch (kind) {
		case "function":
			return monaco.languages.CompletionItemKind.Function
		case "snippet":
			return monaco.languages.CompletionItemKind.Snippet
		case "class":
			return monaco.languages.CompletionItemKind.Class
		case "variable":
			return monaco.languages.CompletionItemKind.Variable
		case "module":
			return monaco.languages.CompletionItemKind.Module
		case "keyword":
		default:
			return monaco.languages.CompletionItemKind.Keyword
	}
}

const registerSimpleLanguageCompletions = (
	monaco: Monaco,
): Array<{ dispose: () => void }> =>
	SIMPLE_LANGUAGE_COMPLETIONS.map((config) =>
		monaco.languages.registerCompletionItemProvider(config.language, {
			triggerCharacters: config.triggerCharacters,
			provideCompletionItems(
				model: Monaco["editor"]["ITextModel"],
				position: Monaco["Position"],
			) {
				const word = model.getWordUntilPosition(position)
				const range = {
					startLineNumber: position.lineNumber,
					endLineNumber: position.lineNumber,
					startColumn: word.startColumn,
					endColumn: word.endColumn,
				}

				const suggestions = config.items.map((item) => ({
					label: item.label,
					kind: toMonacoCompletionKind(monaco, item.kind),
					insertText: item.insertText ?? item.label,
					insertTextRules: item.isSnippet
						? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
						: undefined,
					detail: item.detail,
					range,
				}))

				return { suggestions }
			},
		}),
	)

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

type CompiledRuntime = "clang" | "clangpp"

type BinaryCommand = {
	binaryURL: string
	binaryName: string
	args?: string[]
	env?: Record<string, string>
	baseFSURL?: string
}

const RUNNO_LANG_BASE_URL = "https://runno.dev/langs"

const getCrossOriginIsolationError = (): string | null => {
	if (typeof window === "undefined") return null

	if (window.crossOriginIsolated && typeof SharedArrayBuffer !== "undefined") {
		return null
	}

	return [
		"SharedArrayBuffer is unavailable in this deployment.",
		"Set HTTP response headers:",
		"Cross-Origin-Opener-Policy: same-origin",
		"Cross-Origin-Embedder-Policy: require-corp",
		"Then verify window.crossOriginIsolated === true.",
	].join(" ")
}

const buildCompiledCommands = (
	runtime: CompiledRuntime,
	entryPath: string,
): {
	prepare: BinaryCommand[]
	run: { fsPath: string; binaryName: string; args?: string[]; env?: Record<string, string> }
} => {
	if (runtime === "clangpp") {
		return {
			prepare: [
				{
					binaryURL: `${RUNNO_LANG_BASE_URL}/clang.wasm`,
					binaryName: "clang",
					args: [
						"-cc1",
						"-emit-obj",
						"-disable-free",
						"-isysroot",
						"/sys",
						"-internal-isystem",
						"/sys/include/c++/v1",
						"-internal-isystem",
						"/sys/include",
						"-internal-isystem",
						"/sys/lib/clang/8.0.1/include",
						"-ferror-limit",
						"8",
						"-fmessage-length",
						"80",
						"-fcolor-diagnostics",
						"-O2",
						"-o",
						"/program.o",
						"-x",
						"c++",
						entryPath,
					],
					env: {},
					baseFSURL: `${RUNNO_LANG_BASE_URL}/clang-fs.tar.gz`,
				},
				{
					binaryURL: `${RUNNO_LANG_BASE_URL}/wasm-ld.wasm`,
					binaryName: "wasm-ld",
					args: [
						"--no-threads",
						"--export-dynamic",
						"-z",
						"stack-size=1048576",
						"-L/sys/lib/wasm32-wasi",
						"/sys/lib/wasm32-wasi/crt1.o",
						"/program.o",
						"-lc",
						"-lc++",
						"-lc++abi",
						"-o",
						"/program.wasm",
					],
					env: {},
				},
			],
			run: {
				fsPath: "/program.wasm",
				binaryName: "program",
				args: [],
				env: {},
			},
		}
	}

	return {
		prepare: [
			{
				binaryURL: `${RUNNO_LANG_BASE_URL}/clang.wasm`,
				binaryName: "clang",
				args: [
					"-cc1",
					"-triple",
					"wasm32-unknown-wasi",
					"-isysroot",
					"/sys",
					"-internal-isystem",
					"/sys/include",
					"-internal-isystem",
					"/sys/lib/clang/8.0.1/include",
					"-ferror-limit",
					"8",
					"-fmessage-length",
					"80",
					"-fcolor-diagnostics",
					"-O2",
					"-emit-obj",
					"-o",
					"/program.o",
					entryPath,
				],
				env: {},
				baseFSURL: `${RUNNO_LANG_BASE_URL}/clang-fs.tar.gz`,
			},
			{
				binaryURL: `${RUNNO_LANG_BASE_URL}/wasm-ld.wasm`,
				binaryName: "wasm-ld",
				args: [
					"--no-threads",
					"--export-dynamic",
					"-z",
					"stack-size=1048576",
					"-L/sys/lib/wasm32-wasi",
					"/sys/lib/wasm32-wasi/crt1.o",
					"/program.o",
					"-lc",
					"-o",
					"/program.wasm",
				],
				env: {},
			},
		],
		run: {
			fsPath: "/program.wasm",
			binaryName: "program",
			args: [],
			env: {},
		},
	}
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

const getFileIconForPath = (path: string): LucideIcon =>
	fileIconByExtension[getExtension(path)] ?? File

const getRuntimeForPath = (path: string): Runtime | null =>
	runtimeByExtension[getExtension(path)] ?? null

const getLanguageLabelForPath = (path: string): string =>
	languageByExtension[getExtension(path)] ?? "Unsupported"

const getEditorLanguageForPath = (path: string): string =>
	editorLanguageByExtension[getExtension(path)] ?? "plaintext"

const getTemplateForPath = (path: string): string =>
	templateByExtension[getExtension(path)] ?? ""

const getTabLabel = (path: string): string =>
	path === SETTINGS_TAB_ID ? "Settings" : getBaseName(path)

const getTabIconForPath = (path: string): LucideIcon =>
	path === SETTINGS_TAB_ID ? Settings : getFileIconForPath(path)

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

const createStringFile = (path: string, content: string): WASIFile => ({
	path,
	mode: "string",
	content,
	timestamps: {
		access: new Date(),
		modification: new Date(),
		change: new Date(),
	},
})

const getBinaryURLFromFS = (fs: WASIFS, fsPath: string): string | null => {
	const file = fs[fsPath]
	if (!file || file.mode !== "binary") return null
	const wasmBytes = new Uint8Array(file.content.byteLength)
	wasmBytes.set(file.content)
	return URL.createObjectURL(new Blob([wasmBytes], { type: "application/wasm" }))
}

const escapeSqlLiteral = (value: string): string => value.replace(/'/g, "''")

/* ───────── App ───────── */

function App() {
	const runnoRef = useRef<RunElement | null>(null)
	const saveTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
	const monacoRef = useRef<Monaco | null>(null)
	const editorRef = useRef<Monaco["editor"]["IStandaloneCodeEditor"] | null>(null)
	const completionDisposablesRef = useRef<Array<{ dispose: () => void }>>([])

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
	const [settingsKeybinding, setSettingsKeybinding] =
		useState<KeybindingMode>("default")
	const [settingsCompletionsEnabled, setSettingsCompletionsEnabled] =
		useState(true)
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

	const isSettingsTabActive = activeFilePath === SETTINGS_TAB_ID
	const selectedFile = activeFilePath ? fileByPath.get(activeFilePath) ?? null : null
	const selectedTabLabel = isSettingsTabActive
		? "Settings"
		: (selectedFile?.path ?? "Select a file")
	const selectedRuntime = selectedFile ? getRuntimeForPath(selectedFile.path) : null
	const selectedLanguageLabel = selectedFile
		? getLanguageLabelForPath(selectedFile.path)
		: "No file"
	const selectedEditorLanguage = selectedFile
		? getEditorLanguageForPath(selectedFile.path)
		: "plaintext"

	const disposeSimpleCompletionProviders = () => {
		for (const disposable of completionDisposablesRef.current) {
			disposable.dispose()
		}
		completionDisposablesRef.current = []
	}

	const applyCompletionEditorOptions = (
		enabled: boolean,
		editorOverride?: Monaco["editor"]["IStandaloneCodeEditor"],
	) => {
		const editor = editorOverride ?? editorRef.current
		if (!editor) return

		editor.updateOptions({
			quickSuggestions: enabled,
			suggestOnTriggerCharacters: enabled,
			snippetSuggestions: enabled ? "inline" : "none",
		})
	}

	const refreshSimpleCompletionProviders = (
		enabled: boolean,
		monacoOverride?: Monaco,
	) => {
		if (monacoOverride) {
			monacoRef.current = monacoOverride
		}

		disposeSimpleCompletionProviders()
		if (!enabled || !monacoRef.current) return

		completionDisposablesRef.current = registerSimpleLanguageCompletions(
			monacoRef.current,
		)
	}

	const handleEditorMount = (
		editor: Monaco["editor"]["IStandaloneCodeEditor"],
		monaco: Monaco,
	) => {
		editorRef.current = editor
		refreshSimpleCompletionProviders(settingsCompletionsEnabled, monaco)
		applyCompletionEditorOptions(settingsCompletionsEnabled, editor)
	}

	const fitRunnoTerminal = () => {
		const terminal = runnoRef.current?.shadowRoot?.querySelector("runno-terminal") as
			| (HTMLElement & {
					onResize?: () => void
					run?: (
						binaryPath: string,
						binaryName: string,
						fs: WASIFS,
						args: string[],
						env: Record<string, string>,
					) => Promise<{
						resultType: "complete" | "crash" | "terminated" | "timeout"
						exitCode?: number
						error?: { message: string }
					}>
				})
			| null

		terminal?.onResize?.()
	}

	const getTerminalWriter = () => {
		const terminalElement = runnoRef.current?.shadowRoot?.querySelector(
			"runno-terminal",
		) as (HTMLElement & { terminal?: { clear: () => void; write: (text: string) => void } }) | null

		return {
			clear: () => terminalElement?.terminal?.clear(),
			write: (text: string) => terminalElement?.terminal?.write(text),
		}
	}

	const getInteractiveRunTerminal = () =>
		runnoRef.current?.shadowRoot?.querySelector("runno-terminal") as
			| (HTMLElement & {
					run: (
						binaryPath: string,
						binaryName: string,
						fs: WASIFS,
						args: string[],
						env: Record<string, string>,
					) => Promise<{
						resultType: "complete" | "crash" | "terminated" | "timeout"
						exitCode?: number
						error?: { message: string }
					}>
				})
			| null

	const runCompiledCode = async (
		runtime: CompiledRuntime,
		code: string,
	): Promise<{ ok: boolean; error?: string }> => {
		const terminal = getTerminalWriter()
		const entryPath = runtime === "clangpp" ? "/program.cpp" : "/program.c"
		const commands = buildCompiledCommands(runtime, entryPath)
		let fs: WASIFS = {
			[entryPath]: createStringFile(entryPath, code),
		}
		let stderrBuffer = ""

		terminal.clear()
		terminal.write("Preparing environment...\r\n")

		for (const command of commands.prepare) {
			try {
				if (command.baseFSURL) {
					const baseFS = await fetchWASIFS(command.baseFSURL)
					fs = { ...fs, ...baseFS }
				}

				const result = await WASI.start(fetch(command.binaryURL), {
					args: [command.binaryName, ...(command.args ?? [])],
					env: command.env ?? {},
					fs,
					stdout: (text) => {
						terminal.write(text.replace(/\n/g, "\r\n"))
					},
					stderr: (text) => {
						stderrBuffer += text
						terminal.write(text.replace(/\n/g, "\r\n"))
					},
				})

				fs = result.fs

				if (result.exitCode !== 0) {
					if (!stderrBuffer.trim()) {
						terminal.write(
							`\r\n[Error] Compile step failed with exit code ${result.exitCode}.\r\n`,
						)
					}
					return {
						ok: false,
						error:
							stderrBuffer.trim() ||
							`Compile step failed with exit code ${result.exitCode}.`,
					}
				}
			} catch (error) {
				terminal.write(`\r\n[Error] Failed to prepare ${runtime}: ${String(error)}\r\n`)
				return {
					ok: false,
					error: `Failed to prepare ${runtime}: ${String(error)}`,
				}
			}
		}

		const binaryURL = getBinaryURLFromFS(fs, commands.run.fsPath)
		if (!binaryURL) {
			terminal.write("\r\n[Error] Build did not produce /program.wasm.\r\n")
			return {
				ok: false,
				error: "Build did not produce /program.wasm.",
			}
		}

		try {
			const runTerminal = getInteractiveRunTerminal()
			if (!runTerminal?.run) {
				return {
					ok: false,
					error: "Interactive terminal is unavailable for compiled runtime.",
				}
			}

			const result = await runTerminal.run(
				binaryURL,
				commands.run.binaryName,
				fs,
				commands.run.args ?? [],
				commands.run.env ?? {},
			)

			if (result.resultType === "crash") {
				terminal.write(
					`\r\n[Error] ${result.error?.message ?? `Runtime failed for ${runtime}.`}\r\n`,
				)
				return {
					ok: false,
					error: result.error?.message ?? `Runtime failed for ${runtime}.`,
				}
			}

			if (result.resultType === "complete" && result.exitCode !== 0) {
				terminal.write(`\r\n[exit code: ${result.exitCode}]\r\n`)
			}
		} catch (error) {
			terminal.write(`\r\n[Error] Runtime failed for ${runtime}: ${String(error)}\r\n`)
			return {
				ok: false,
				error: `Runtime failed for ${runtime}: ${String(error)}`,
			}
		} finally {
			URL.revokeObjectURL(binaryURL)
		}

		return { ok: true }
	}

	useEffect(() => {
		const frame = requestAnimationFrame(() => {
			fitRunnoTerminal()
		})

		return () => cancelAnimationFrame(frame)
	}, [selectedRuntime, terminalKey])

	useEffect(() => {
		if (!runError) return

		const terminal = getTerminalWriter()
		terminal.write(`\r\n[Error] ${runError}\r\n`)
		setRunError(null)
	}, [runError])

	useEffect(() => {
		const monacoInstance = monacoRef.current
		for (const disposable of completionDisposablesRef.current) {
			disposable.dispose()
		}
		completionDisposablesRef.current = []

		if (monacoInstance && settingsCompletionsEnabled) {
			completionDisposablesRef.current =
				registerSimpleLanguageCompletions(monacoInstance)
		}

		const editor = editorRef.current
		if (editor) {
			editor.updateOptions({
				quickSuggestions: settingsCompletionsEnabled,
				suggestOnTriggerCharacters: settingsCompletionsEnabled,
				snippetSuggestions: settingsCompletionsEnabled ? "inline" : "none",
			})
		}
	}, [settingsCompletionsEnabled])

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
			for (const disposable of completionDisposablesRef.current) {
				disposable.dispose()
			}
			completionDisposablesRef.current = []
		}
	}, [])

	useEffect(() => {
		const existingFilePaths = new Set(fileEntries.map((entry) => entry.path))
		const filteredTabs = openTabs.filter(
			(path) => path === SETTINGS_TAB_ID || existingFilePaths.has(path),
		)

		if (filteredTabs.length !== openTabs.length) {
			setOpenTabs(filteredTabs)
		}

		if (
			activeFilePath &&
			activeFilePath !== SETTINGS_TAB_ID &&
			!existingFilePaths.has(activeFilePath)
		) {
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
		if (path === SETTINGS_TAB_ID) {
			setActiveFilePath(path)
			return
		}

		if (!fileByPath.has(path)) return
		setActiveFilePath(path)
		setSelectedPath(path)
	}

	const openSettingsTab = () => {
		setOpenTabs((prev) =>
			prev.includes(SETTINGS_TAB_ID) ? prev : [...prev, SETTINGS_TAB_ID],
		)
		setActiveFilePath(SETTINGS_TAB_ID)
	}

	const closeTab = (path: string) => {
		const tabIndex = openTabs.indexOf(path)
		if (tabIndex < 0) return

		const nextTabs = openTabs.filter((tabPath) => tabPath !== path)
		setOpenTabs(nextTabs)

		if (activeFilePath === path) {
			const fallbackPath = nextTabs[tabIndex] ?? nextTabs[tabIndex - 1] ?? null
			setActiveFilePath(fallbackPath)
			if (fallbackPath && fileByPath.has(fallbackPath)) {
				setSelectedPath(fallbackPath)
			}
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

		const crossOriginIsolationError = getCrossOriginIsolationError()
		if (crossOriginIsolationError) {
			setRunError(crossOriginIsolationError)
			return
		}

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
			if (selectedRuntime === "clang" || selectedRuntime === "clangpp") {
				const result = await runCompiledCode(selectedRuntime, selectedFile.content)
				if (!result.ok) return
				return
			}

			const codeToRun =
				selectedRuntime === "sqlite"
					? (() => {
						if (!selectedFile.content.includes("{{name}}")) return selectedFile.content
						const safeName = escapeSqlLiteral("friend")
						return selectedFile.content.replaceAll("{{name}}", safeName)
					})()
					: selectedFile.content

			await runnoRef.current.interactiveRunCode(selectedRuntime, codeToRun)
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
								{expanded ? (
									<FolderOpen size={14} className="inline-icon tree-icon" />
								) : (
									<Folder size={14} className="inline-icon tree-icon" />
								)}
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
						{pendingCreation?.kind === "folder" ? (
							<FolderPlus size={14} className="inline-icon tree-icon" />
						) : (
							<FilePlus2 size={14} className="inline-icon tree-icon" />
						)}
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
								{(() => {
									const FileIcon = getFileIconForPath(fileEntry.path)
									return <FileIcon size={14} className="inline-icon tree-icon" />
								})()}
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
					<span className="logo">
						<Cloud size={14} className="logo-icon" />
						NimbusCode
					</span>
				</div>

				<div className="navbar-right">
					<span className="active-file-pill">
						<FileCode2 size={14} className="inline-icon" />
						{selectedTabLabel}
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
							{(() => {
								const LanguageIcon =
									languageIconByLabel[selectedLanguageLabel] ?? Languages
								return <LanguageIcon size={14} className="inline-icon" />
							})()}
							{selectedLanguageLabel}
							<ChevronDown size={14} className="inline-icon" />
						</button>
						{showSupportedLanguages && (
							<div className="language-menu-popup">
								<div className="language-menu-title">Supported Languages</div>
								<ul className="language-menu-list">
									{supportedLanguages.map((language) => (
										<li key={language.label} className="language-menu-item">
											<span className="language-name">
												{(() => {
													const LanguageIcon =
														languageIconByLabel[language.label] ?? FileCode2
													return (
														<LanguageIcon
															size={14}
															className="inline-icon"
														/>
													)
												})()}
												{language.label}
											</span>
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
						{isRunning ? (
							<LoaderCircle size={14} className="inline-icon spin" />
						) : (
							<Play size={14} className="inline-icon" />
						)}
						{isRunning ? "Running..." : "▶ Run"}
					</button>
					<button
						className="settings-btn"
						type="button"
						aria-label="Settings"
						title="Open settings"
						onClick={openSettingsTab}
					>
						<Settings size={14} className="inline-icon" />
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
						<span className="explorer-title">
							<FolderTree size={14} className="inline-icon" />
							EXPLORER
						</span>
						<div className="explorer-actions">
							<button
								type="button"
								className="explorer-btn"
								onClick={() => {
									beginCreateEntry("file")
								}}
							>
								<FilePlus2 size={14} className="inline-icon" />
								+File
							</button>
							<button
								type="button"
								className="explorer-btn"
								onClick={() => {
									beginCreateEntry("folder")
								}}
							>
								<FolderPlus size={14} className="inline-icon" />
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
								<Trash2 size={14} className="inline-icon" />
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
										const tabLabel = getTabLabel(path)
										const TabIcon = getTabIconForPath(path)

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
												<TabIcon size={14} className="inline-icon" />
												{tabLabel}
											</button>
											<button
												type="button"
												className="editor-tab-close"
												aria-label={`Close ${tabLabel}`}
												onClick={(event) => {
													event.stopPropagation()
													closeTab(path)
												}}
											>
												<X size={13} className="inline-icon" />
											</button>
										</div>
									)
								})}
							</div>
							<div className="editor-content">
								{isSettingsTabActive ? (
									<div className="settings-panel">
										<div className="settings-title">Editor Settings</div>
										<p className="settings-subtitle">
											These controls are placeholders for now and do not change
											editor behavior yet.
										</p>
										<div className="settings-group">
											<label className="settings-label" htmlFor="keybinding-mode">
												Keybindings
											</label>
											<select
												id="keybinding-mode"
												className="settings-select"
												value={settingsKeybinding}
												onChange={(event) => {
													setSettingsKeybinding(
														event.target.value as KeybindingMode,
													)
												}}
											>
												<option value="default">Default</option>
												<option value="vim">Vim</option>
												<option value="emacs">Emacs</option>
											</select>
										</div>
										<div className="settings-group">
											<div className="settings-toggle-row">
												<span className="settings-label">Completions</span>
												<label
													className="settings-switch"
													htmlFor="completions-toggle"
												>
													<input
														id="completions-toggle"
														type="checkbox"
														className="settings-switch-input"
														checked={settingsCompletionsEnabled}
														onChange={(event) => {
															setSettingsCompletionsEnabled(event.target.checked)
														}}
													/>
													<span
														className="settings-switch-track"
														aria-hidden="true"
													>
														<span className="settings-switch-thumb" />
													</span>
												</label>
											</div>
										</div>
									</div>
								) : (
										<Editor
											path={selectedFile?.path}
											height="100%"
											theme={TOKYO_NIGHT_THEME}
											beforeMount={applyTokyoNightMonacoTheme}
											onMount={handleEditorMount}
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
								)}
							</div>
							{!selectedFile && !isSettingsTabActive && (
								<div className="editor-empty">
									Select a file in the explorer to open it in a tab.
								</div>
							)}
						</div>

						<div className="console">
							<div className="console-title-row">
								<div className="console-title">
									<TerminalSquare size={14} className="inline-icon" />
									OUTPUT
								</div>
								<button
									className="console-clear-btn"
									type="button"
									onClick={clearTerminal}
								>
									<Eraser size={14} className="inline-icon" />
									Clear
								</button>
							</div>
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
