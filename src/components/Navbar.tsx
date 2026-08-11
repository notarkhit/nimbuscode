import {
	ChevronDown,
	Cloud,
	FileCode2,
	Languages,
	LoaderCircle,
	Play,
	Settings,
} from "lucide-react"
import type { Runtime } from "@runno/runtime"
import type { WorkspaceFileEntry } from "../fileStore"
import { supportedLanguages, languageIconByLabel } from "../lib/constants"

interface NavbarProps {
	selectedTabLabel: string
	selectedLanguageLabel: string
	selectedRuntime: Runtime | null
	selectedFile: WorkspaceFileEntry | null
	isWorkspaceReady: boolean
	isRunning: boolean
	showSupportedLanguages: boolean
	onToggleSupportedLanguages: () => void
	onHideSupportedLanguages: () => void
	onRun: () => void
	onOpenSettings: () => void
}

export function Navbar({
	selectedTabLabel,
	selectedLanguageLabel,
	selectedRuntime,
	selectedFile,
	isWorkspaceReady,
	isRunning,
	showSupportedLanguages,
	onToggleSupportedLanguages,
	onHideSupportedLanguages,
	onRun,
	onOpenSettings,
}: NavbarProps) {
	const LanguageIcon = languageIconByLabel[selectedLanguageLabel] ?? Languages

	return (
		<header className="navbar">
			<div className="navbar-left">
				<span className="logo">
					<Cloud size={14} className="logo-icon" />
					NimbusCode
				</span>
			</div>

			<div className="navbar-right">
				<span className="active-file-pill">
					<FileCode2 size={14} className="inline-icon" />
					{selectedTabLabel}
				</span>

				<div
					className="language-menu"
					onBlur={(event) => {
						const related = event.relatedTarget as Node | null
						if (!event.currentTarget.contains(related)) {
							onHideSupportedLanguages()
						}
					}}
				>
					<button
						type="button"
						className="language-chip"
						aria-expanded={showSupportedLanguages}
						onClick={onToggleSupportedLanguages}
					>
						<LanguageIcon size={14} className="inline-icon" />
						{selectedLanguageLabel}
						<ChevronDown size={14} className="inline-icon" />
					</button>

					{showSupportedLanguages && (
						<div className="language-menu-popup">
							<div className="language-menu-title">Supported Languages</div>
							<ul className="language-menu-list">
								{supportedLanguages.map((language) => {
									const LangIcon = languageIconByLabel[language.label] ?? FileCode2
									return (
										<li key={language.label} className="language-menu-item">
											<span className="language-name">
												<LangIcon size={14} className="inline-icon" />
												{language.label}
											</span>
											<span>{language.extensions.join(", ")}</span>
										</li>
									)
								})}
							</ul>
						</div>
					)}
				</div>

				<button
					className="run-btn"
					type="button"
					onClick={onRun}
					disabled={isRunning || !isWorkspaceReady || !selectedFile || !selectedRuntime}
				>
					{isRunning ? (
						<LoaderCircle size={14} className="inline-icon spin" />
					) : (
						<Play size={14} className="inline-icon" />
					)}
					{isRunning ? "Running..." : "Run"}
				</button>

				<button
					className="settings-btn"
					type="button"
					aria-label="Settings"
					title="Open settings"
					onClick={onOpenSettings}
				>
					<Settings size={14} className="inline-icon" />
				</button>
			</div>
		</header>
	)
}
