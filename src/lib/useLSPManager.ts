import { useState, useEffect } from "react"
import type { LSPState } from "./types"

const INITIAL_LSPS: LSPState[] = [
	{
		id: "pyright",
		name: "Pyright (Python)",
		language: "python",
		status: "not_downloaded",
		enabled: false,
		sizeEstimate: "~25MB",
	},
	{
		id: "clangd",
		name: "clangd (C/C++)",
		language: "cpp",
		status: "not_downloaded",
		enabled: false,
		sizeEstimate: "~30MB",
	},
]

export function useLSPManager() {
	const [lsps, setLsps] = useState<LSPState[]>(() => {
		try {
			const stored = localStorage.getItem("nimbus_lsp_state")
			if (stored) {
				const parsed = JSON.parse(stored) as LSPState[]
				return INITIAL_LSPS.map((initial) => {
					const existing = parsed.find((p) => p.id === initial.id)
					return existing ? { ...initial, ...existing } : initial
				})
			}
		} catch (e) {
			console.error("Failed to load LSP state", e)
		}
		return INITIAL_LSPS
	})

	// Save to local storage when changed
	useEffect(() => {
		localStorage.setItem("nimbus_lsp_state", JSON.stringify(lsps))
	}, [lsps])

	const downloadLSP = (id: string) => {
		setLsps((prev) =>
			prev.map((lsp) =>
				lsp.id === id ? { ...lsp, status: "downloading" } : lsp
			)
		)

		// Mock download for Phase 2 UI demonstration
		setTimeout(() => {
			setLsps((prev) =>
				prev.map((lsp) =>
					lsp.id === id ? { ...lsp, status: "ready", enabled: true } : lsp
				)
			)
		}, 3000) // 3 seconds mock download
	}

	const toggleLSP = (id: string, enabled: boolean) => {
		setLsps((prev) =>
			prev.map((lsp) => (lsp.id === id ? { ...lsp, enabled } : lsp))
		)
	}

	const deleteLSP = (id: string) => {
		setLsps((prev) =>
			prev.map((lsp) =>
				lsp.id === id
					? { ...lsp, status: "not_downloaded", enabled: false }
					: lsp
			)
		)
	}

	return {
		lsps,
		downloadLSP,
		toggleLSP,
		deleteLSP,
	}
}
