import { useEffect, useMemo, useRef, useState } from "react"
import type { Monaco } from "@monaco-editor/react"
import { fetchWASIFS, type RunElement } from "@runno/runtime"
import { WASI, type WASIFS } from "@runno/wasi"
import Split from "react-split"

import { useWorkspace } from "./hooks/useWorkspace"
import { useVim } from "./hooks/useVim"

import { TitleBar } from "./components/TitleBar"
import { ActivityBar } from "./components/ActivityBar"
import { StatusBar } from "./components/StatusBar"
import { Explorer } from "./components/Explorer"
import { EditorPane } from "./components/EditorPane"
import { ConsolePane } from "./components/ConsolePane"

import { getMonacoTheme } from "./lib/themes"
import {
	COMPLETIONS_STORAGE_KEY,
	KEYBINDING_STORAGE_KEY,
	RELATIVE_LINE_NUMBERS_STORAGE_KEY,
	THEME_STORAGE_KEY,
	readStoredCompletionsEnabled,
	readStoredKeybinding,
	readStoredRelativeLineNumbers,
	readStoredTheme,
} from "./lib/settings"
import {
	getCrossOriginIsolationError,
	buildCompiledCommands,
} from "./lib/runtime"
import {
	createStringFile,
	getBinaryURLFromFS,
	escapeSqlLiteral,
	getLanguageLabelForPath,
	getEditorLanguageForPath,
	getRuntimeForPath,
} from "./lib/helpers"
import { SETTINGS_TAB_ID } from "./lib/constants"
import {
	registerSimpleLanguageCompletions,
} from "./lib/completions"
import { useLSPManager } from "./lib/useLSPManager"
import type { KeybindingMode, ThemeMode, CompiledRuntime, EditorCursorPosition } from "./lib/types"
import "./App.css"

/* ───────── App ───────── */

function App() {
	const runnoRef = useRef<RunElement>(null)
	const monacoRef = useRef<Monaco | null>(null)


	const editorRef = useRef<Monaco["editor"]["IStandaloneCodeEditor"] | null>(null)
	const completionDisposablesRef = useRef<Array<{ dispose: () => void }>>([])
	const runCodeRef = useRef<() => void>(() => {})

	/* ── Settings state ── */
	const [settingsKeybinding, setSettingsKeybinding] =
		useState<KeybindingMode>(readStoredKeybinding)
	const [settingsTheme, setSettingsTheme] = useState<ThemeMode>(readStoredTheme)
	const [settingsCompletionsEnabled, setSettingsCompletionsEnabled] =
		useState(readStoredCompletionsEnabled)
	const [settingsRelativeLineNumbers, setSettingsRelativeLineNumbers] = useState(
		readStoredRelativeLineNumbers,
	)

	/* ── Run state ── */
	const [activeActivityView, setActiveActivityView] = useState<"explorer" | "settings" | null>(() => {
		return (localStorage.getItem("nimbus_activeActivityView") as "explorer" | "settings" | null) ?? "explorer"
	})

	useEffect(() => {
		if (activeActivityView !== null) localStorage.setItem("nimbus_activeActivityView", activeActivityView)
		else localStorage.removeItem("nimbus_activeActivityView")
	}, [activeActivityView])
	const [terminalKey, setTerminalKey] = useState(0)
	const [runError, setRunError] = useState<string | null>(null)
	const [isRunning, setIsRunning] = useState(false)
	const [editorCursor, setEditorCursor] = useState<EditorCursorPosition>({
		lineNumber: 1,
		column: 1,
	})

	const { lsps, downloadLSP, toggleLSP, deleteLSP } = useLSPManager()

	/* ── Workspace hook ── */
	const workspace = useWorkspace()
	const {
		selectedPath,
		activeFilePath,
		openTabs,
		expandedFolders,
		fileEntries,
		fileByPath,
		folderPathSet,
		folderPaths,
		pendingCreation,
		pendingRename,
		workspaceError,
		setPendingCreation,
		setPendingRename,
		selectPath,
		activateTab,
		openSettingsTab,
		closeTab,
		toggleFolder,
		beginCreateEntry,
		commitPendingCreation,
		beginRename,
		commitRename,
		deleteSelected,
		onEditorChange,
	} = workspace

	/* ── Vim hook ── */
	const vim = useVim(monacoRef, editorRef, settingsKeybinding)
	const { vimMode, stopVimKeybindings, applyKeybindingMode } = vim

	/* ── Derived ── */
	const isSettingsTabActive = activeFilePath === SETTINGS_TAB_ID
	const selectedFile = activeFilePath ? fileByPath.get(activeFilePath) ?? null : null
	const selectedLanguageLabel = selectedFile
		? getLanguageLabelForPath(selectedFile.path)
		: "No file"
	const selectedEditorLanguage = selectedFile
		? getEditorLanguageForPath(selectedFile.path)
		: "plaintext"
	const selectedMonacoTheme = getMonacoTheme(settingsTheme)
	const selectedRuntime = selectedFile ? getRuntimeForPath(selectedFile.path) : null

	const editorStats = useMemo(() => {
		if (!selectedFile) return { lines: 0, words: 0, chars: 0 }
		const content = selectedFile.content
		const lines = content.length === 0 ? 1 : content.split(/\r\n|\r|\n/u).length
		const words = content.trim().length === 0 ? 0 : content.trim().split(/\s+/u).length
		const chars = content.length
		return { lines, words, chars }
	}, [selectedFile])

	/* ── Completion helpers ── */

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

	const applyLineNumberMode = (
		relativeLineNumbersEnabled: boolean,
		editorOverride?: Monaco["editor"]["IStandaloneCodeEditor"],
	) => {
		const editor = editorOverride ?? editorRef.current
		if (!editor) return
		editor.updateOptions({
			lineNumbers: relativeLineNumbersEnabled ? "relative" : "on",
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
		completionDisposablesRef.current = registerSimpleLanguageCompletions(monacoRef.current)
	}

	/* ── Editor mount ── */

	const handleEditorMount = (
		editor: Monaco["editor"]["IStandaloneCodeEditor"],
		monaco: Monaco,
	) => {
		editorRef.current = editor
		refreshSimpleCompletionProviders(settingsCompletionsEnabled, monaco)
		applyCompletionEditorOptions(settingsCompletionsEnabled, editor)
		applyLineNumberMode(settingsRelativeLineNumbers, editor)
		applyKeybindingMode(settingsKeybinding, editor)

		editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
			runCodeRef.current()
		})

		const initialPosition = editor.getPosition()
		if (initialPosition) {
			setEditorCursor({
				lineNumber: initialPosition.lineNumber,
				column: initialPosition.column,
			})
		}

		const cursorDisposable = editor.onDidChangeCursorPosition((event: {
			position: { lineNumber: number; column: number }
		}) => {
			setEditorCursor({
				lineNumber: event.position.lineNumber,
				column: event.position.column,
			})
		})

		editor.onDidDispose(() => {
			cursorDisposable.dispose()
			if (editorRef.current === editor) {
				editorRef.current = null
			}
			stopVimKeybindings()
		})
	}

	/* ── Terminal helpers ── */

	const fitRunnoTerminal = () => {
		const terminal = runnoRef.current?.shadowRoot?.querySelector("runno-terminal") as
			| (HTMLElement & { onResize?: () => void }) | null
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

	/* ── Compiled code runner (C / C++) ── */

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
					stdout: (text) => { terminal.write(text.replace(/\n/g, "\r\n")) },
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
			return { ok: false, error: "Build did not produce /program.wasm." }
		}

		try {
			const runTerminal = getInteractiveRunTerminal()
			if (!runTerminal?.run) {
				return { ok: false, error: "Interactive terminal is unavailable for compiled runtime." }
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
			return { ok: false, error: `Runtime failed for ${runtime}: ${String(error)}` }
		} finally {
			URL.revokeObjectURL(binaryURL)
		}

		return { ok: true }
	}

	/* ── Run code ── */

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

	// Keep ref up to date for monaco bindings
	useEffect(() => {
		runCodeRef.current = runCode
	}, [runCode])

	const clearTerminal = () => {
		setRunError(null)
		setTerminalKey((prev) => prev + 1)
	}

	const stopTerminal = () => {
		if (runnoRef.current && typeof (runnoRef.current as any).stop === 'function') {
			try {
				(runnoRef.current as any).stop()
			} catch (e) {
				// Ignore errors from stop
			}
		}
		setIsRunning(false)
		setRunError("Process terminated by user.")
		setTerminalKey((prev) => prev + 1)
	}

	/* ── Effects: terminal resize ── */

	useEffect(() => {
		const frame = requestAnimationFrame(() => { fitRunnoTerminal() })
		return () => cancelAnimationFrame(frame)
	}, [selectedRuntime, terminalKey])

	/* ── Effects: localStorage sync ── */

	useEffect(() => {
		try { window.localStorage.setItem(THEME_STORAGE_KEY, settingsTheme) } catch { /* noop */ }
	}, [settingsTheme])

	useEffect(() => {
		try { window.localStorage.setItem(KEYBINDING_STORAGE_KEY, settingsKeybinding) } catch { /* noop */ }
	}, [settingsKeybinding])

	useEffect(() => {
		try {
			window.localStorage.setItem(
				COMPLETIONS_STORAGE_KEY,
				settingsCompletionsEnabled ? "true" : "false",
			)
		} catch { /* noop */ }
	}, [settingsCompletionsEnabled])

	useEffect(() => {
		try {
			window.localStorage.setItem(
				RELATIVE_LINE_NUMBERS_STORAGE_KEY,
				settingsRelativeLineNumbers ? "true" : "false",
			)
		} catch { /* noop */ }
	}, [settingsRelativeLineNumbers])

	/* ── Effects: run error output ── */

	useEffect(() => {
		if (!runError) return
		const terminal = getTerminalWriter()
		terminal.write(`\r\n[Error] ${runError}\r\n`)
		setRunError(null)
	}, [runError])

	/* ── Effects: completions sync ── */

	useEffect(() => {
		const monacoInstance = monacoRef.current
		for (const disposable of completionDisposablesRef.current) {
			disposable.dispose()
		}
		completionDisposablesRef.current = []

		if (monacoInstance && settingsCompletionsEnabled) {
			completionDisposablesRef.current = registerSimpleLanguageCompletions(monacoInstance)
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
		applyKeybindingMode(settingsKeybinding)
	}, [settingsKeybinding])

	useEffect(() => {
		applyLineNumberMode(settingsRelativeLineNumbers)
	}, [settingsRelativeLineNumbers])

	useEffect(() => {
		const editor = editorRef.current
		const position = editor?.getPosition()
		if (position) {
			setEditorCursor({ lineNumber: position.lineNumber, column: position.column })
			return
		}
		setEditorCursor({ lineNumber: 1, column: 1 })
	}, [activeFilePath])

	/* ── Effects: cleanup ── */

	useEffect(() => {
		return () => {
			stopVimKeybindings()
			for (const disposable of completionDisposablesRef.current) {
				disposable.dispose()
			}
			completionDisposablesRef.current = []
		}
	}, [])

	/* ── Render ── */

	return (
		<div
			className={`ide-root theme-${settingsTheme}`}
		>
			<TitleBar
				onRun={runCode}
				isRunning={isRunning}
				isDisabled={isRunning || !selectedFile || !selectedRuntime}
			/>

			<div className="ide-main">
				<ActivityBar
					activeView={activeActivityView}
					onViewChange={setActiveActivityView}
					onSettingsClick={() => {
						openSettingsTab()
					}}
				/>

				<div className="workspace-area" style={{ display: "flex", flex: 1, width: "100%", overflow: "hidden" }}>
					{activeActivityView === "explorer" && (
						<div
							style={{
								width: "250px",
								flexShrink: 0,
								borderRight: "1px solid var(--tn-border)",
								display: "flex",
								flexDirection: "column",
								overflow: "hidden",
							}}
						>
							<Explorer
								fileEntries={fileEntries}
								folderPaths={folderPaths}
								folderPathSet={folderPathSet}
								fileByPath={fileByPath}
								selectedPath={selectedPath}
								expandedFolders={expandedFolders}
								pendingCreation={pendingCreation}
								pendingRename={pendingRename}
								workspaceError={workspaceError}
								onSelectPath={selectPath}
								onToggleFolder={toggleFolder}
								onBeginCreateFile={() => beginCreateEntry("file")}
								onBeginCreateFolder={() => beginCreateEntry("folder")}
								onBeginRename={beginRename}
								onDeleteSelected={() => void deleteSelected()}
								onSetPendingCreation={setPendingCreation}
								onCommitPendingCreation={(value) => void commitPendingCreation(value)}
								onSetPendingRename={setPendingRename}
								onCommitRename={(value) => void commitRename(value)}
							/>
						</div>
					)}

					<div className="main-pane" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
						<Split
							direction="vertical"
							sizes={[72, 28]}
							minSize={[220, 120]}
							gutterSize={6}
							className="editor-area"
						>
							<EditorPane
								openTabs={openTabs}
								activeFilePath={activeFilePath}
								selectedFile={selectedFile}
								isSettingsTabActive={isSettingsTabActive}
								selectedMonacoTheme={selectedMonacoTheme}
								selectedEditorLanguage={selectedEditorLanguage}
								settingsKeybinding={settingsKeybinding}
								settingsTheme={settingsTheme}
								settingsCompletionsEnabled={settingsCompletionsEnabled}
								settingsRelativeLineNumbers={settingsRelativeLineNumbers}
								lsps={lsps}
								onTabClick={activateTab}
								onTabClose={closeTab}
								onEditorChange={onEditorChange}
								onEditorMount={handleEditorMount}
								onChangeKeybinding={setSettingsKeybinding}
								onChangeTheme={setSettingsTheme}
								onChangeCompletions={setSettingsCompletionsEnabled}
								onChangeRelativeLineNumbers={setSettingsRelativeLineNumbers}
								onDownloadLSP={downloadLSP}
								onToggleLSP={toggleLSP}
								onDeleteLSP={deleteLSP}
							/>

							<ConsolePane
								selectedRuntime={selectedRuntime}
								terminalKey={terminalKey}
								runnoRef={runnoRef}
								isRunning={isRunning}
								theme={settingsTheme}
								onStop={stopTerminal}
								onClear={clearTerminal}
							/>
						</Split>
					</div>
				</div>

			</div>

			<StatusBar
				vimMode={vimMode}
				editorCursor={editorCursor}
				editorStats={editorStats}
				selectedLanguageLabel={selectedLanguageLabel}
				selectedRuntime={selectedRuntime}
			/>
		</div>
	)
}

export default App
