import type { KeybindingMode, ThemeMode, VimInteractionMode } from "../lib/types"

interface SettingsPanelProps {
	settingsKeybinding: KeybindingMode
	settingsTheme: ThemeMode
	settingsCompletionsEnabled: boolean
	settingsRelativeLineNumbers: boolean
	vimMode: VimInteractionMode
	onChangeKeybinding: (mode: KeybindingMode) => void
	onChangeTheme: (theme: ThemeMode) => void
	onChangeCompletions: (enabled: boolean) => void
	onChangeRelativeLineNumbers: (enabled: boolean) => void
}

export function SettingsPanel({
	settingsKeybinding,
	settingsTheme,
	settingsCompletionsEnabled,
	settingsRelativeLineNumbers,
	vimMode,
	onChangeKeybinding,
	onChangeTheme,
	onChangeCompletions,
	onChangeRelativeLineNumbers,
}: SettingsPanelProps) {
	return (
		<div className="settings-panel">
			<div className="settings-title">Editor Settings</div>
			<p className="settings-subtitle">
				Theme applies to site, editor, and output console. Other controls remain
				experimental.
			</p>

			<div className="settings-group">
				<label className="settings-label" htmlFor="keybinding-mode">
					Keybindings
				</label>
				<select
					id="keybinding-mode"
					className="settings-select"
					value={settingsKeybinding}
					onChange={(event) => {
						onChangeKeybinding(event.target.value as KeybindingMode)
					}}
				>
					<option value="default">Default</option>
					<option value="vim">Vim</option>
				</select>
				{settingsKeybinding === "vim" && (
					<span className="settings-meta">
						Vim mode: {vimMode === "normal" ? "NORMAL" : "INSERT"}
					</span>
				)}
			</div>

			<div className="settings-group">
				<label className="settings-label" htmlFor="theme-select">
					Theme
				</label>
				<select
					id="theme-select"
					className="settings-select"
					value={settingsTheme}
					onChange={(event) => {
						onChangeTheme(event.target.value as ThemeMode)
					}}
				>
					<option value="vs-dark">VS Code Dark</option>
					<option value="vs-light">VS Code Light</option>
					<option value="tokyo-night">Tokyo Night</option>
					<option value="catppuccin-latte">Catppuccin Latte</option>
					<option value="github-dark">GitHub Dark</option>
					<option value="github-light">GitHub Light</option>
				</select>
			</div>

			<div className="settings-group">
				<div className="settings-toggle-row">
					<span className="settings-label">Completions</span>
					<label className="settings-switch" htmlFor="completions-toggle">
						<input
							id="completions-toggle"
							type="checkbox"
							className="settings-switch-input"
							checked={settingsCompletionsEnabled}
							onChange={(event) => {
								onChangeCompletions(event.target.checked)
							}}
						/>
						<span className="settings-switch-track" aria-hidden="true">
							<span className="settings-switch-thumb" />
						</span>
					</label>
				</div>
			</div>

			<div className="settings-group">
				<div className="settings-toggle-row">
					<span className="settings-label">Relative line numbers</span>
					<label className="settings-switch" htmlFor="relative-lines-toggle">
						<input
							id="relative-lines-toggle"
							type="checkbox"
							className="settings-switch-input"
							checked={settingsRelativeLineNumbers}
							onChange={(event) => {
								onChangeRelativeLineNumbers(event.target.checked)
							}}
						/>
						<span className="settings-switch-track" aria-hidden="true">
							<span className="settings-switch-thumb" />
						</span>
					</label>
				</div>
				<span className="settings-meta">
					{settingsRelativeLineNumbers ? "Enabled" : "Disabled"}
				</span>
			</div>
		</div>
	)
}
