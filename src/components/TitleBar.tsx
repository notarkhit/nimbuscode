import { CloudLightning, Play } from "lucide-react"

interface TitleBarProps {
	onRun?: () => void
	isRunning?: boolean
	isDisabled?: boolean
}

export function TitleBar({ onRun, isRunning, isDisabled }: TitleBarProps) {
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
					<button
						type="button"
						className="run-btn"
						onClick={onRun}
						disabled={isDisabled || isRunning}
						title="Run (Ctrl+Enter)"
					>
						<Play size={14} className="inline-icon" />
						{isRunning ? "Running..." : "Run"}
					</button>
				)}
			</div>
		</div>
	)
}
