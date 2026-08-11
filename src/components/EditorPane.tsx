import Editor, { type Monaco } from "@monaco-editor/react"
import { X } from "lucide-react"
import type { WorkspaceFileEntry } from "../fileStore"
import type { KeybindingMode, ThemeMode } from "../lib/types"
import { getTabLabel, getTabIconForPath } from "../lib/helpers"
import { defineMonacoThemes } from "../lib/themes"
import { SettingsPanel } from "./SettingsPanel"

interface EditorPaneProps {
	openTabs: string[]
	activeFilePath: string | null
	selectedFile: WorkspaceFileEntry | null
	isSettingsTabActive: boolean
	selectedMonacoTheme: string
	selectedEditorLanguage: string
	settingsKeybinding: KeybindingMode
	settingsTheme: ThemeMode
	settingsCompletionsEnabled: boolean
	settingsRelativeLineNumbers: boolean
	onTabClick: (path: string) => void
	onTabClose: (path: string) => void
	onEditorChange: (value: string | undefined) => void
	onEditorMount: (editor: Monaco["editor"]["IStandaloneCodeEditor"], monaco: Monaco) => void
	onChangeKeybinding: (mode: KeybindingMode) => void
	onChangeTheme: (theme: ThemeMode) => void
	onChangeCompletions: (enabled: boolean) => void
	onChangeRelativeLineNumbers: (enabled: boolean) => void
	lsps: import("../lib/types").LSPState[]
	onDownloadLSP: (id: string) => void
	onToggleLSP: (id: string, enabled: boolean) => void
	onDeleteLSP: (id: string) => void
}

export function EditorPane({
	openTabs,
	activeFilePath,
	selectedFile,
	isSettingsTabActive,
	selectedMonacoTheme,
	selectedEditorLanguage,
	settingsKeybinding,
	settingsTheme,
	settingsCompletionsEnabled,
	settingsRelativeLineNumbers,
	lsps,
	onTabClick,
	onTabClose,
	onEditorChange,
	onEditorMount,
	onChangeKeybinding,
	onChangeTheme,
	onChangeCompletions,
	onChangeRelativeLineNumbers,
	onDownloadLSP,
	onToggleLSP,
	onDeleteLSP,
}: EditorPaneProps) {

	return (
		<div className="editor-pane">
			{/* Tab bar */}
			<div className="editor-tabs" role="tablist" aria-label="Open files">
				{openTabs.map((path) => {
					const isActive = activeFilePath === path
					const tabLabel = getTabLabel(path)
					const TabIcon = getTabIconForPath(path)

					return (
						<div key={path} className={`editor-tab ${isActive ? "active" : ""}`}>
							<button
								type="button"
								className="editor-tab-button"
								onClick={() => onTabClick(path)}
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
									onTabClose(path)
								}}
							>
								<X size={13} className="inline-icon" />
							</button>
						</div>
					)
				})}
				<div className="editor-tab-spacer" />
			</div>

			{/* Editor content */}
			<div className="editor-content">
				{isSettingsTabActive ? (
					<SettingsPanel
						settingsKeybinding={settingsKeybinding}
						settingsTheme={settingsTheme}
						settingsCompletionsEnabled={settingsCompletionsEnabled}
						settingsRelativeLineNumbers={settingsRelativeLineNumbers}
						vimMode="insert"
						onChangeKeybinding={onChangeKeybinding}
						onChangeTheme={onChangeTheme}
						onChangeCompletions={onChangeCompletions}
						onChangeRelativeLineNumbers={onChangeRelativeLineNumbers}
						lsps={lsps}
						onDownloadLSP={onDownloadLSP}
						onToggleLSP={onToggleLSP}
						onDeleteLSP={onDeleteLSP}
					/>
				) : (
					<Editor
						path={selectedFile?.path}
						height="100%"
						theme={selectedMonacoTheme}
						beforeMount={defineMonacoThemes}
						onMount={onEditorMount}
						language={selectedEditorLanguage}
						value={selectedFile?.content ?? ""}
						onChange={onEditorChange}
						options={{
							readOnly: !selectedFile,
							fontFamily:
								'"JetBrains Mono", "Fira Code", Menlo, Monaco, Consolas, monospace',
							fontLigatures: true,
							lineNumbers: settingsRelativeLineNumbers ? "relative" : "on",
						}}
					/>
				)}
			</div>

			{/* Empty state */}
			{!selectedFile && !isSettingsTabActive && (
				<div className="editor-empty">
					Select a file in the explorer to open it in a tab.
				</div>
			)}
		</div>
	)
}
