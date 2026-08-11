import { useEffect, useRef, useState } from "react"
import { Eraser, Square } from "lucide-react"
import type { Runtime } from "@runno/runtime"
import type { RunElement } from "@runno/runtime"
import type { ThemeMode } from "../lib/types"
import { getTerminalTheme } from "../lib/themes"

interface ConsolePaneProps {
	selectedRuntime: Runtime | null
	terminalKey: number
	runnoRef: React.RefObject<RunElement | null>
	isRunning: boolean
	theme: ThemeMode
	onStop: () => void
	onClear: () => void
}

export function ConsolePane({ selectedRuntime, terminalKey, runnoRef, isRunning, theme, onStop, onClear }: ConsolePaneProps) {
	const containerRef = useRef<HTMLDivElement>(null)
	const [isThemeApplied, setIsThemeApplied] = useState(false)

	/* Resize the Runno xterm instance whenever the pane dimensions change
	   (e.g. the user drags the horizontal Split gutter). */
	useEffect(() => {
		const container = containerRef.current
		if (!container) return

		const resizeTerminal = () => {
			const terminal = runnoRef.current?.shadowRoot?.querySelector(
				"runno-terminal",
			) as (HTMLElement & { onResize?: () => void }) | null
			terminal?.onResize?.()
		}

		const observer = new ResizeObserver(resizeTerminal)
		observer.observe(container)

		return () => observer.disconnect()
	}, [runnoRef, terminalKey])

	/* Apply the selected theme to the terminal instance */
	useEffect(() => {
		setIsThemeApplied(false)
		const applyTheme = () => {
			const terminalElement = runnoRef.current?.shadowRoot?.querySelector(
				"runno-terminal",
			) as (HTMLElement & { terminal?: any }) | null

			if (terminalElement?.terminal) {
				terminalElement.terminal.options.theme = getTerminalTheme(theme)
				terminalElement.style.background = "transparent"
				terminalElement.style.padding = "0"
				terminalElement.style.margin = "0"
				if (runnoRef.current) {
					runnoRef.current.style.background = "transparent"
				}

				// Inject style to fix the scrollbar/white border inside xterm
				const shadow = terminalElement.shadowRoot
				if (shadow && !shadow.querySelector("#nimbus-xterm-overrides")) {
					const style = document.createElement("style")
					style.id = "nimbus-xterm-overrides"
					style.textContent = `
						.xterm-viewport::-webkit-scrollbar {
							width: 10px;
						}
						.xterm-viewport::-webkit-scrollbar-track {
							background: transparent;
						}
						.xterm-viewport::-webkit-scrollbar-thumb {
							background: rgba(255, 255, 255, 0.2);
							border-radius: 5px;
						}
						.xterm-viewport {
							background-color: transparent !important;
						}
						.xterm {
							padding: 10px !important;
						}
					`
					shadow.appendChild(style)
				}
				
				setIsThemeApplied(true)
			}
		}

		applyTheme()
		const interval = setInterval(applyTheme, 50)

		return () => {
			clearInterval(interval)
		}
	}, [theme, terminalKey, runnoRef, isRunning])

	return (
		<div className="console">
			<div className="panel-header" role="tablist">
				<div className="panel-tabs">
					<button type="button" className="panel-tab active" role="tab">
						TERMINAL
					</button>
					{/* Add more tabs here in the future if needed (e.g. OUTPUT, PROBLEMS) */}
				</div>
				<div className="panel-actions">
					<button 
						className="panel-action-btn" 
						type="button" 
						onClick={onStop} 
						title="Stop Process"
						disabled={!isRunning}
					>
						<Square size={14} className="inline-icon" />
					</button>
					<button className="panel-action-btn" type="button" onClick={onClear} title="Clear Terminal">
						<Eraser size={14} className="inline-icon" />
					</button>
				</div>
			</div>
			<div className="console-terminal" ref={containerRef} style={{ opacity: isThemeApplied ? 1 : 0, transition: 'opacity 0.1s ease-in' }}>
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
