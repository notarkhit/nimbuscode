import { Eraser, TerminalSquare } from "lucide-react"
import type { Runtime } from "@runno/runtime"
import type { RunElement } from "@runno/runtime"

interface ConsolePaneProps {
	selectedRuntime: Runtime | null
	terminalKey: number
	runnoRef: React.RefObject<RunElement | null>
	onClear: () => void
}

export function ConsolePane({ selectedRuntime, terminalKey, runnoRef, onClear }: ConsolePaneProps) {
	return (
		<div className="console">
			<div className="console-title-row">
				<div className="console-title">
					<TerminalSquare size={14} className="inline-icon" />
					OUTPUT
				</div>
				<button className="console-clear-btn" type="button" onClick={onClear}>
					<Eraser size={14} className="inline-icon" />
					Clear
				</button>
			</div>
			<div className="console-terminal">
				<runno-run
					key={`${selectedRuntime ?? "python"}-${terminalKey}`}
					className="runno-runner"
					runtime={selectedRuntime ?? "python"}
					style={{ width: "100%", height: "100%" }}
					ref={(element: HTMLElement | null) => {
						runnoRef.current = element as RunElement | null
					}}
				/>
			</div>
		</div>
	)
}
