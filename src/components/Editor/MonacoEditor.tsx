import { useState } from 'react'
import Editor from '@monaco-editor/react'

const MonacoEditor: React.FC = () => {
  const [code, setCode] = useState(`// Welcome to nimbusCode
// Your online code editor

function hello() {
  console.log("Hello, world!");
  return "Welcome to nimbusCode";
}

// Start coding below...
`)

  return (
    <div className="h-[calc(100vh-64px)]">
      <Editor
        height="100%"
        defaultLanguage="javascript"
        theme="vs-dark"
        value={code}
        onChange={(value) => setCode(value || '')}
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          fontFamily: 'JetBrains Mono, Monaco, Consolas, monospace',
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: 'on',
          bracketPairColorization: { enabled: true },
          guides: {
            indentation: true,
            bracketPairs: true
          },
          suggest: {
            showKeywords: true,
            showSnippets: true
          }
        }}
      />
    </div>
  )
}

export default MonacoEditor