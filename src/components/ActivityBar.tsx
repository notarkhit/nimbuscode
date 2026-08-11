import { Files, Settings } from "lucide-react"

interface ActivityBarProps {
	activeView: "explorer" | "settings" | null
	onViewChange: (view: "explorer" | "settings" | null) => void
	onSettingsClick: () => void
}

export function ActivityBar({ activeView, onViewChange, onSettingsClick }: ActivityBarProps) {
	return (
		<div className="activity-bar">
			<div className="activity-bar-top">
				<button
					type="button"
					className={`activity-btn ${activeView === "explorer" ? "active" : ""}`}
					onClick={() => {
						onViewChange(activeView === "explorer" ? null : "explorer")
					}}
					title="Explorer"
				>
					<Files size={24} />
				</button>
			</div>
			<div className="activity-bar-bottom">
				<button
					type="button"
					className="activity-btn"
					onClick={onSettingsClick}
					title="Settings"
				>
					<Settings size={24} />
				</button>
			</div>
		</div>
	)
}
