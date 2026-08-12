import type { Monaco } from "@monaco-editor/react"
import type { SimpleCompletionKind, SimpleCompletionItem, LanguageCompletionConfig } from "./types"

/* ───────── Completion data ───────── */

export const SIMPLE_LANGUAGE_COMPLETIONS: LanguageCompletionConfig[] = [
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
			{ label: "main", kind: "snippet", insertText: "int main() {\n\t${1:// code}\n\treturn 0;\n}", isSnippet: true },
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

/* ───────── Registration ───────── */

export const toMonacoCompletionKind = (monaco: Monaco, kind: SimpleCompletionKind): number => {
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

export const registerSimpleLanguageCompletions = (
	monaco: Monaco,
	excludeLanguages: string[] = []
): Array<{ dispose: () => void }> =>
	SIMPLE_LANGUAGE_COMPLETIONS
		.filter((config) => !excludeLanguages.includes(config.language))
		.map((config) =>
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
				const suggestions = config.items.map((item: SimpleCompletionItem) => ({
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
