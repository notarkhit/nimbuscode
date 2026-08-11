import type { ReactNode } from "react"
import {
	FilePlus2,
	Folder,
	FolderOpen,
	FolderPlus,
	FolderTree,
	Trash2,
} from "lucide-react"
import type { WorkspaceFileEntry } from "../fileStore"
import type { PendingCreation } from "../lib/types"
import { getBaseName, getFileIconForPath } from "../lib/helpers"

interface ExplorerProps {
	fileEntries: WorkspaceFileEntry[]
	folderPaths: string[]
	folderPathSet: Set<string>
	fileByPath: Map<string, WorkspaceFileEntry>
	selectedPath: string | null
	expandedFolders: string[]
	pendingCreation: PendingCreation | null
	workspaceError: string | null
	onSelectPath: (path: string) => void
	onToggleFolder: (path: string) => void
	onBeginCreateFile: () => void
	onBeginCreateFolder: () => void
	onDeleteSelected: () => void
	onSetPendingCreation: (pending: PendingCreation | null) => void
	onCommitPendingCreation: (value?: string) => void
}

/* ── Recursive tree renderer ── */

function renderTree(
	parentPath: string,
	depth: number,
	props: ExplorerProps,
): ReactNode {
	const {
		folderPaths,
		fileEntries,
		selectedPath,
		expandedFolders,
		pendingCreation,
		onSelectPath,
		onToggleFolder,
		onSetPendingCreation,
		onCommitPendingCreation,
	} = props

	const folders = folderPaths
		.filter((folderPath) => folderPath !== "/" && getParentPathLocal(folderPath) === parentPath)
		.sort((a, b) => a.localeCompare(b))
	const files = fileEntries
		.filter((fileEntry) => getParentPathLocal(fileEntry.path) === parentPath)
		.sort((a, b) => a.path.localeCompare(b.path))
	const isCreatingHere = pendingCreation?.parentPath === parentPath

	return (
		<>
			{folders.map((folderPath) => {
				const expanded = expandedFolders.includes(folderPath)
				const active = selectedPath === folderPath

				return (
					<div key={folderPath}>
						<div
							className={`tree-row ${active ? "active" : ""}`}
							style={{ paddingLeft: `${8 + depth * 14}px` }}
						>
							<button
								type="button"
								className="tree-toggle"
								onClick={() => onToggleFolder(folderPath)}
							>
								{expanded ? "▾" : "▸"}
							</button>
							<button
								type="button"
								className="tree-entry folder"
								onClick={() => onSelectPath(folderPath)}
							>
								{expanded ? (
									<FolderOpen size={14} className="inline-icon tree-icon" />
								) : (
									<Folder size={14} className="inline-icon tree-icon" />
								)}
								{getBaseName(folderPath)}
							</button>
						</div>
						{expanded ? renderTree(folderPath, depth + 1, props) : null}
					</div>
				)
			})}

			{isCreatingHere && (
				<div
					className="tree-row creating"
					style={{ paddingLeft: `${8 + depth * 14}px` }}
				>
					<span className="tree-spacer" aria-hidden="true" />
					{pendingCreation?.kind === "folder" ? (
						<FolderPlus size={14} className="inline-icon tree-icon" />
					) : (
						<FilePlus2 size={14} className="inline-icon tree-icon" />
					)}
					<input
						className="tree-create-input"
						value={pendingCreation?.value ?? ""}
						autoFocus
						placeholder={pendingCreation?.kind === "folder" ? "new-folder" : "new-file.ext"}
						onChange={(event) => {
							const nextValue = event.target.value
							onSetPendingCreation(
								pendingCreation
									? { ...pendingCreation, value: nextValue }
									: null,
							)
						}}
						onBlur={() => {
							onSetPendingCreation(null)
						}}
						onKeyDown={(event) => {
							if (event.key === "Escape") {
								event.preventDefault()
								onSetPendingCreation(null)
								return
							}
							if (event.key === "Enter") {
								event.preventDefault()
								onCommitPendingCreation(event.currentTarget.value)
							}
						}}
					/>
				</div>
			)}

			{files.map((fileEntry) => {
				const active = selectedPath === fileEntry.path
				const FileIcon = getFileIconForPath(fileEntry.path)

				return (
					<div
						key={fileEntry.path}
						className={`tree-row ${active ? "active" : ""}`}
						style={{ paddingLeft: `${8 + depth * 14}px` }}
					>
						<span className="tree-spacer" aria-hidden="true" />
						<button
							type="button"
							className="tree-entry file"
							onClick={() => onSelectPath(fileEntry.path)}
						>
							<FileIcon size={14} className="inline-icon tree-icon" />
							{getBaseName(fileEntry.path)}
						</button>
					</div>
				)
			})}
		</>
	)
}

/* Local helper to avoid importing from helpers to keep this file self-contained */
function getParentPathLocal(path: string): string | null {
	if (path === "/") return null
	const slashIndex = path.lastIndexOf("/")
	if (slashIndex <= 0) return "/"
	return path.slice(0, slashIndex)
}

/* ── Component ── */

export function Explorer(props: ExplorerProps) {
	const { selectedPath, workspaceError, onBeginCreateFile, onBeginCreateFolder, onDeleteSelected } = props

	return (
		<aside className="explorer-pane">
			<div className="explorer-header">
				<span className="explorer-title">
					<FolderTree size={14} className="inline-icon" />
					EXPLORER
				</span>
				<div className="explorer-actions">
					<button
						type="button"
						className="explorer-btn"
						onClick={onBeginCreateFile}
					>
						<FilePlus2 size={14} className="inline-icon" />
						+File
					</button>
					<button
						type="button"
						className="explorer-btn"
						onClick={onBeginCreateFolder}
					>
						<FolderPlus size={14} className="inline-icon" />
						+Folder
					</button>
					<button
						type="button"
						className="explorer-btn danger"
						onClick={onDeleteSelected}
						disabled={!selectedPath || selectedPath === "/"}
					>
						<Trash2 size={14} className="inline-icon" />
						Delete
					</button>
				</div>
			</div>
			<div className="explorer-tree">{renderTree("/", 0, props)}</div>
			{workspaceError && (
				<div className="explorer-error">{workspaceError}</div>
			)}
		</aside>
	)
}
