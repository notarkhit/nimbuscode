import {
	Database,
	File,
	FileCode2,
	FileJson2,
	Gem,
	type LucideIcon,
} from "lucide-react"
import type { Runtime } from "@runno/runtime"
import type { WorkspaceEntry } from "../fileStore"

/* ───────── Runtime / Language maps ───────── */

export const runtimeByExtension: Record<string, Runtime> = {
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

export const languageByExtension: Record<string, string> = {
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

export const languageIconByLabel: Record<string, LucideIcon> = {
	JavaScript: FileCode2,
	Python: FileCode2,
	C: FileCode2,
	"C++": FileCode2,
	PHP: FileCode2,
	SQLite: Database,
	Ruby: Gem,
}

export const fileIconByExtension: Record<string, LucideIcon> = {
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

export const supportedLanguages: Array<{ label: string; extensions: string[] }> = [
	{ label: "JavaScript", extensions: [".js", ".mjs", ".cjs"] },
	{ label: "Python", extensions: [".py"] },
	{ label: "C", extensions: [".c"] },
	{ label: "C++", extensions: [".cpp", ".cc", ".cxx"] },
	{ label: "PHP", extensions: [".php", ".phtml"] },
	{ label: "SQLite", extensions: [".sql"] },
	{ label: "Ruby", extensions: [".rb"] },
]

export const editorLanguageByExtension: Record<string, string> = {
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

/* ───────── File templates ───────── */

export const templateByExtension: Record<string, string> = {
	".js": `const name = "friend"\nconsole.log("Hello, " + name + "!")\n`,
	".mjs": `const name = "friend"\nconsole.log("Hello, " + name + "!")\n`,
	".cjs": `const name = "friend"\nconsole.log("Hello, " + name + "!")\n`,
	".py": `name = input("What's your name? ").strip()\nprint(f"Hello, {name or 'friend'}!")\n`,
	".c": `#include <stdio.h>\n\nint main(void) {\n  printf("Hello, World!\\n");\n  return 0;\n}\n`,
	".cpp": `#include <iostream>\n#include <string>\n\nint main() {\n  std::string name;\n  std::cout << "What's your name? ";\n  std::getline(std::cin, name);\n\n  if (name.empty()) {\n    name = "friend";\n  }\n\n  std::cout << "Hello, " << name << "!\\n";\n  return 0;\n}\n`,
	".cc": `#include <iostream>\n#include <string>\n\nint main() {\n  std::string name;\n  std::cout << "What's your name? ";\n  std::getline(std::cin, name);\n\n  if (name.empty()) {\n    name = "friend";\n  }\n\n  std::cout << "Hello, " << name << "!\\n";\n  return 0;\n}\n`,
	".cxx": `#include <iostream>\n#include <string>\n\nint main() {\n  std::string name;\n  std::cout << "What's your name? ";\n  std::getline(std::cin, name);\n\n  if (name.empty()) {\n    name = "friend";\n  }\n\n  std::cout << "Hello, " << name << "!\\n";\n  return 0;\n}\n`,
	".php": `<?php\necho "What's your name? ";\n$stream = fopen("php://stdin", "r");\n$name = $stream ? trim((string) fgets($stream)) : "";\nif (is_resource($stream)) {\n    fclose($stream);\n}\n\nif ($name === "") {\n    $name = "friend";\n}\n\necho "Hello, {$name}!\\n";\n`,
	".phtml": `<?php\necho "What's your name? ";\n$stream = fopen("php://stdin", "r");\n$name = $stream ? trim((string) fgets($stream)) : "";\nif (is_resource($stream)) {\n    fclose($stream);\n}\n\nif ($name === "") {\n    $name = "friend";\n}\n\necho "Hello, {$name}!\\n";\n`,
	".sql": `-- On Run, NimbusCode prompts for a name and replaces {{name}}.\nWITH person(name) AS (VALUES ('{{name}}'))\nSELECT 'Hello, ' || name || '!' AS greeting\nFROM person;\n`,
	".rb": `print "What's your name? "\nname = STDIN.gets&.strip.to_s\nname = "friend" if name.empty?\nputs "Hello, #{name}!"\n`,
}

/* ───────── Initial workspace ───────── */

export const initialWorkspace: WorkspaceEntry[] = [
	{
		path: "/main.py",
		kind: "file",
		content: `name = input("What's your name? ").strip()\nprint(f"Hello, {name or 'friend'}!")\n`,
		updatedAt: Date.now(),
	},
]

/* ───────── App constants ───────── */

export const SETTINGS_TAB_ID = "__nimbus_settings__"
export const RUNNO_LANG_BASE_URL = "https://runno.dev/langs"

// Fallback icon for unknown files
export { File as FallbackFileIcon }
