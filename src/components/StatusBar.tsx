import type { VimInteractionMode } from "../lib/types"

interface StatusBarProps {
	vimMode: VimInteractionMode
	editorCursor: { lineNumber: number; column: number }
	editorStats: { lines: number; words: number; chars: number }
	selectedLanguageLabel: string
	selectedRuntime: string | null
}

// Ensure the helper gets the labels mapping if we put it in types, or just handle it here:
const VIM_LABELS: Record<VimInteractionMode, string> = {
	normal: "NORMAL",
	insert: "INSERT",
}

export function StatusBar({
	vimMode,
	editorCursor,
	editorStats,
	selectedLanguageLabel,
	selectedRuntime,
}: StatusBarProps) {
	return (
		<div className="status-bar">
			<div className="status-bar-left">
				<div className={`status-item vim-mode ${vimMode}`}>
					{VIM_LABELS[vimMode]}
				</div>
				{selectedRuntime && (
					<div className="status-item">
						Runtime: {selectedRuntime}
					</div>
				)}
			</div>
			<div className="status-bar-right">
				<div className="status-item">
					Ln {editorCursor.lineNumber}, Col {editorCursor.column}
				</div>
				<div className="status-item">
					{editorStats.lines} lines, {editorStats.words} words
				</div>
				<div className="status-item">
					{selectedLanguageLabel}
				</div>
			</div>
		</div>
	)
}
