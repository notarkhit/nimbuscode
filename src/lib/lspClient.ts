import type { Monaco } from "@monaco-editor/react"

export class LSPClient {
	private worker: Worker
	private monaco: Monaco
	private messageId = 1
	private callbacks = new Map<number, (result: any) => void>()
	private documentUri: string
	private model: Monaco["editor"]["ITextModel"] | null = null
	private disposables: Array<{ dispose: () => void }> = []

	constructor(worker: Worker, monaco: Monaco, language: string) {
		this.worker = worker
		this.monaco = monaco
		this.documentUri = `file:///workspace/main.${language === "python" ? "py" : "cpp"}`

		this.worker.onmessage = (e) => this.handleMessage(e.data)

		// Initialize LSP
		this.sendRequest("initialize", {}).then(() => {
			console.log(`[LSPClient] ${language} initialized!`)
			this.setupProviders(language)
		})
	}

	public attachModel(model: Monaco["editor"]["ITextModel"]) {
		this.model = model
		
		// Send didOpen
		this.sendMessage("textDocument/didOpen", {
			textDocument: {
				uri: this.documentUri,
				text: model.getValue(),
			},
		})

		// Send didChange on typing
		this.disposables.push(
			model.onDidChangeContent(() => {
				this.sendMessage("textDocument/didChange", {
					textDocument: { uri: this.documentUri },
					contentChanges: [{ text: model.getValue() }],
				})
			})
		)
	}

	private setupProviders(language: string) {
		this.disposables.push(
			this.monaco.languages.registerCompletionItemProvider(language, {
				provideCompletionItems: async (_model: Monaco["editor"]["ITextModel"], position: Monaco["Position"]) => {
					const result = await this.sendRequest("textDocument/completion", {
						textDocument: { uri: this.documentUri },
						position: { line: position.lineNumber - 1, character: position.column - 1 },
					})
					return { suggestions: result || [] }
				},
			})
		)

		this.disposables.push(
			this.monaco.languages.registerHoverProvider(language, {
				provideHover: async (_model: Monaco["editor"]["ITextModel"], position: Monaco["Position"]) => {
					const result = await this.sendRequest("textDocument/hover", {
						textDocument: { uri: this.documentUri },
						position: { line: position.lineNumber - 1, character: position.column - 1 },
					})
					if (!result) return null
					return {
						contents: [{ value: result.contents }],
					}
				},
			})
		)
	}

	private handleMessage(message: any) {
		if (message.id && this.callbacks.has(message.id)) {
			this.callbacks.get(message.id)!(message.result)
			this.callbacks.delete(message.id)
		} else if (message.method === "textDocument/publishDiagnostics") {
			if (!this.model) return
			const diagnostics = message.params.diagnostics.map((d: any) => ({
				message: d.message,
				startLineNumber: d.range.start.line + 1,
				startColumn: d.range.start.character + 1,
				endLineNumber: d.range.end.line + 1,
				endColumn: d.range.end.character + 1,
				severity: d.severity === 1 ? this.monaco.MarkerSeverity.Error : this.monaco.MarkerSeverity.Warning,
			}))
			this.monaco.editor.setModelMarkers(this.model, "lsp", diagnostics)
		}
	}

	private sendRequest(method: string, params: any): Promise<any> {
		return new Promise((resolve) => {
			const id = this.messageId++
			this.callbacks.set(id, resolve)
			this.worker.postMessage({ id, method, params })
		})
	}

	private sendMessage(method: string, params: any) {
		this.worker.postMessage({ method, params })
	}

	public dispose() {
		this.worker.terminate()
		this.disposables.forEach((d) => d.dispose())
		if (this.model) {
			this.monaco.editor.setModelMarkers(this.model, "lsp", [])
		}
	}
}
