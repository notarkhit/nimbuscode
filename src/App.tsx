import Editor from "@monaco-editor/react"
import Split from "react-split"
import "./App.css"

function App() {
	return (
		<Split
			direction="vertical"
			sizes={[75, 25]}          // editor / console (%)
			minSize={[200, 80]}       // px
			gutterSize={6}
			style={{ height: "100vh", width: "100vw" }}
		>
			{/* Editor pane */}
			<div>
				<Editor
					height="100%"
					defaultLanguage="typescript"
					defaultValue={`function hello() {\n  console.log("Hello, Monaco");\n}`}
					theme="vs-dark"
				/>
			</div>

			{/* Bottom console pane */}
			<div className="console">
				<div className="console-title">OUTPUT</div>
				<pre>{"> program started\n> hello world"}</pre>
			</div>
		</Split>
	)
}

export default App

