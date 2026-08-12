import type { PyodideInterface } from "pyodide"

let pyodide: PyodideInterface | null = null
let pyodideError: string | null = null
let pyodidePromise: Promise<void> | null = null

self.onmessage = async (e) => {
	const { id, method, params } = e.data

	if (method === "initialize") {
		// Initialize Pyodide via CDN to bypass Vite module resolution issues
		if (!pyodidePromise && !pyodideError) {
			pyodidePromise = (async () => {
				try {
					// @ts-ignore: TS doesn't support URL imports natively yet
					const module = await import("https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.mjs")
					pyodide = await module.loadPyodide()
					console.log("[LSP Worker] Pyodide initialized successfully!")
				} catch (err: any) {
					pyodideError = err.message
					console.error("[LSP Worker] Failed to load Pyodide:", err)
				}
			})();
		}
		await pyodidePromise;
		self.postMessage({
			id,
			result: {
				capabilities: {
					textDocumentSync: 1, // Full
					completionProvider: { resolveProvider: false, triggerCharacters: ["."] },
					hoverProvider: true,
				},
			},
		})
		return
	}

	if (method === "textDocument/didChange" || method === "textDocument/didOpen") {
		if (pyodidePromise) await pyodidePromise;
		if (!pyodide) return
		const text = method === "textDocument/didOpen" ? params.textDocument.text : params.contentChanges[0].text
		const uri = params.textDocument.uri

		// Run Python AST parser to check for syntax errors
		let diagnostics: any[] = []
		try {
			pyodide.globals.set("code_to_check", text)
			pyodide.runPython(`
import ast
try:
    ast.parse(code_to_check)
    error = None
except SyntaxError as e:
    error = {
        "line": e.lineno,
        "col": e.offset,
        "msg": e.msg,
        "end_line": e.end_lineno if hasattr(e, 'end_lineno') else e.lineno,
        "end_col": e.end_offset if hasattr(e, 'end_offset') else e.offset,
    }
			`)
			const error = pyodide.globals.get("error")
			if (error) {
				const errorObj = error.toJs()
				diagnostics = [
					{
						range: {
							start: { line: errorObj.get("line") - 1, character: (errorObj.get("col") || 1) - 1 },
							end: { line: errorObj.get("end_line") - 1, character: (errorObj.get("end_col") || 1) - 1 },
						},
						message: errorObj.get("msg"),
						severity: 1, // Error
					},
				]
			}
		} catch (err) {
			// Ignore execution errors, only AST parsing
		}

		self.postMessage({
			method: "textDocument/publishDiagnostics",
			params: {
				uri,
				diagnostics,
			},
		})
		return
	}

	if (method === "textDocument/completion") {
		// Just a basic example of True LSP returning dynamic completions
		self.postMessage({
			id,
			result: [
				{ label: "print", kind: 3, detail: "True LSP: built-in print" },
				{ label: "def", kind: 14, detail: "True LSP: define function" },
				{ label: "import", kind: 14, detail: "True LSP: import module" },
			],
		})
		return
	}

	if (method === "textDocument/hover") {
		self.postMessage({
			id,
			result: {
				contents: "Hover information provided by Pyodide WASM LSP",
			},
		})
		return
	}
}
