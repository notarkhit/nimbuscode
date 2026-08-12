import { CloudLightning } from "lucide-react"

interface TitleBarProps {}

export function TitleBar({}: TitleBarProps) {
	return (
		<div className="title-bar">
			<div className="title-bar-left">
				<CloudLightning size={16} className="title-bar-icon" />
				<span className="title-bar-text">NimbusCode</span>
			</div>
			{/* Future: Command Palette / Search input could go here in title-bar-center */}
			<div className="title-bar-center"></div>
			<div className="title-bar-right">
				{/* Run button moved to editor tabs */}
			</div>
		</div>
	)
}
