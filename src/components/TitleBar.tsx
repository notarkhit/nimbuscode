import { CloudLightning, Play, X } from "lucide-react"

interface TitleBarProps {
	onRun?: () => void
	onStop?: () => void
	isRunning?: boolean
	isDisabled?: boolean
}

export function TitleBar({ onRun, onStop, isRunning, isDisabled }: TitleBarProps) {
	return (
		<div className="title-bar">
			<div className="title-bar-left">
				<CloudLightning size={16} className="title-bar-icon" />
				<span className="title-bar-text">NimbusCode</span>
			</div>
			{/* Future: Command Palette / Search input could go here in title-bar-center */}
			<div className="title-bar-center"></div>
			<div className="title-bar-right">
				{onRun && (
					isRunning ? (
						<div className="run-btn-group">
							<div className="run-btn running-state">
								Running
							</div>
							<button
								type="button"
								className="run-btn terminate-btn"
								onClick={onStop}
								title="Terminate"
							>
								Terminate <X size={14} className="inline-icon" />
							</button>
						</div>
					) : (
						<button
							type="button"
							className="run-btn"
							onClick={onRun}
							disabled={isDisabled}
							title="Run (Ctrl+Enter)"
						>
							<Play size={14} className="inline-icon" />
							Run
						</button>
					)
				)}
			</div>
		</div>
	)
}
