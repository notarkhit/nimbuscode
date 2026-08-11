import { Download, Trash2, Loader2 } from "lucide-react"
import type { LSPState } from "../lib/types"

interface LSPManagerProps {
	lsps: LSPState[]
	onDownload: (id: string) => void
	onToggle: (id: string, enabled: boolean) => void
	onDelete: (id: string) => void
}

export function LSPManager({
	lsps,
	onDownload,
	onToggle,
	onDelete,
}: LSPManagerProps) {
	return (
		<div className="settings-group">
			<label className="settings-label">Language Servers (LSP)</label>
			<p className="settings-subtitle" style={{ marginBottom: "16px" }}>
				Enhance your editor with deep intellisense. These are large WebAssembly
				binaries that run locally in your browser.
			</p>

			<div className="lsp-list" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
				{lsps.map((lsp) => (
					<div
						key={lsp.id}
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							padding: "12px",
							background: "var(--tn-surface)",
							border: "1px solid var(--tn-border)",
							borderRadius: "6px",
						}}
					>
						<div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
							<span style={{ fontWeight: 500, color: "var(--tn-text)" }}>
								{lsp.name}
							</span>
							<span style={{ fontSize: "12px", color: "var(--tn-muted)" }}>
								{lsp.sizeEstimate}
							</span>
						</div>

						<div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
							{lsp.status === "not_downloaded" && (
								<button
									className="panel-action-btn"
									style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: "var(--tn-surface-2)" }}
									onClick={() => onDownload(lsp.id)}
								>
									<Download size={14} />
									<span>Download</span>
								</button>
							)}

							{lsp.status === "downloading" && (
								<div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--tn-blue)" }}>
									<Loader2 size={14} className="spin" style={{ animation: "spin 1s linear infinite" }} />
									<span style={{ fontSize: "13px" }}>Downloading...</span>
								</div>
							)}

							{lsp.status === "ready" && (
								<>
									<label className="settings-switch">
										<input
											type="checkbox"
											className="settings-switch-input"
											checked={lsp.enabled}
											onChange={(e) => onToggle(lsp.id, e.target.checked)}
										/>
										<span className="settings-switch-track" aria-hidden="true">
											<span className="settings-switch-thumb" />
										</span>
									</label>

									<button
										className="panel-action-btn"
										style={{ color: "var(--tn-red)", padding: "6px" }}
										title="Delete LSP"
										onClick={() => onDelete(lsp.id)}
									>
										<Trash2 size={16} />
									</button>
								</>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
