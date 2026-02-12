import { useRef, useState } from "react"
import Editor from "@monaco-editor/react"
import Split from "react-split"
import "./App.css"

/* ───────── Types ───────── */

type Language = "javascript" | "python"

type Pyodide = {
	runPython: (code: string) => any
	runPythonAsync: (code: string) => Promise<any>
}

/* ───────── App ───────── */

function App() {
	const editorRef = useRef<any>(null)
	const pyodideRef = useRef<Pyodide | null>(null)

	const [language, setLanguage] = useState<Language>("javascript")
	const [output, setOutput] = useState<string>("> ready\n")
	const [isRunning, setIsRunning] = useState(false)

	/* ───────── Pyodide Loader ───────── */

	const ensurePyodide = async () => {
		if (pyodideRef.current) return pyodideRef.current

		setOutput((o) => o + "> loading python runtime...\n")

		// @ts-ignore – provided globally by pyodide.js
		const pyodide = await window.loadPyodide({
			indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/",
		})

		pyodideRef.current = pyodide
		setOutput((o) => o + "> python ready\n")
		return pyodide
	}

	/* ───────── JavaScript Runner ───────── */

	const runJavaScript = (code: string) => {
		let result = ""

		const fakeConsole = {
			log: (...args: any[]) => {
				result += args.join(" ") + "\n"
			},
			error: (...args: any[]) => {
				result += args.join(" ") + "\n"
			},
			warn: (...args: any[]) => {
				result += args.join(" ") + "\n"
			},
		}

		try {
			new Function("console", code)(fakeConsole)
		} catch (err) {
			result += String(err) + "\n"
		}

		return result
	}

	/* ───────── Run Code ───────── */

	const runCode = async () => {
		if (!editorRef.current) return

		const code = editorRef.current.getValue()
		setIsRunning(true)

		if (language === "python") {
			try {
				const pyodide = await ensurePyodide()

				pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = sys.stderr = StringIO()
`)

				await pyodide.runPythonAsync(code)

				const result = pyodide.runPython("sys.stdout.getvalue()")
				setOutput((o) => o + result + "\n")
			} catch (err) {
				setOutput((o) => o + String(err) + "\n")
			}
		} else {
			const result = runJavaScript(code)
			setOutput((o) => o + result + "\n")
		}

		setIsRunning(false)
	}

	/* ───────── Render ───────── */

	return (
		<div className="app-root">
			{/* ───── Navbar ───── */}
			<header className="navbar">
				<div className="navbar-left">
					<span className="logo">NimbusCode</span>
				</div>

				<div className="navbar-right">
					<select
						className="lang-select"
						value={language}
						onChange={(e) => setLanguage(e.target.value as Language)}
					>
						<option value="javascript">JavaScript</option>
						<option value="python">Python</option>
					</select>

					<button
						className="run-btn"
						onClick={runCode}
						disabled={isRunning}
					>
						▶ Run
					</button>

					<button className="icon-btn">⚙</button>
				</div>
			</header>

			{/* ───── Editor + Output ───── */}
			<Split
				direction="vertical"
				sizes={[75, 25]}
				minSize={[200, 80]}
				gutterSize={6}
				className="editor-area"
			>
				{/* Editor Pane */}
				<div>
					<Editor
						height="100%"
						theme="vs-dark"
						language={language}
						defaultValue={
							language === "python"
								? `print("Hello from Python")`
								: `console.log("Hello from JavaScript")`
						}
						onMount={(editor) => {
							editorRef.current = editor
						}}
					/>
				</div>

				{/* Output Pane */}
				<div className="console">
					<div className="console-title">OUTPUT</div>
					<pre>{output}</pre>
				</div>
			</Split>
		</div>
	)
}

export default App

