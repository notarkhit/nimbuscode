import { useEffect, useMemo, useRef, useState } from "react"
import {
	listWorkspaceEntries,
	putWorkspaceEntries,
	deleteWorkspacePaths,
	type WorkspaceEntry,
	type WorkspaceFileEntry,
	type WorkspaceFolderEntry,
} from "../fileStore"
import {
	isFileEntry,
	sortWorkspaceEntries,
	buildFolderPathSet,
	getParentPath,
	getParentFolders,
	getAncestors,
	joinPath,
	normalizePathInput,
	getTemplateForPath,
	unique,
} from "../lib/helpers"
import { initialWorkspace, SETTINGS_TAB_ID } from "../lib/constants"
import { getBaseName } from "../lib/helpers"
import type { PendingCreation, PendingRename } from "../lib/types"

/* ───────── Return type ───────── */

export interface UseWorkspaceReturn {
	// State
	entries: WorkspaceEntry[]
	selectedPath: string | null
	activeFilePath: string | null
	openTabs: string[]
	expandedFolders: string[]
	pendingCreation: PendingCreation | null
	pendingRename: PendingRename | null
	workspaceError: string | null
	isWorkspaceReady: boolean
	// Derived
	fileEntries: WorkspaceFileEntry[]
	fileByPath: Map<string, WorkspaceFileEntry>
	folderPathSet: Set<string>
	folderPaths: string[]
	// Setters (for cross-component needs)
	setPendingCreation: React.Dispatch<React.SetStateAction<PendingCreation | null>>
	setPendingRename: React.Dispatch<React.SetStateAction<PendingRename | null>>
	setWorkspaceError: React.Dispatch<React.SetStateAction<string | null>>
	// Actions
	selectPath: (path: string) => void
	activateTab: (path: string) => void
	openSettingsTab: () => void
	closeTab: (path: string) => void
	toggleFolder: (path: string) => void
	beginCreateEntry: (kind: "file" | "folder") => void
	commitPendingCreation: (overrideValue?: string) => Promise<void>
	beginRename: () => void
	commitRename: (overrideValue?: string) => Promise<void>
	deleteSelected: () => Promise<void>
	onEditorChange: (value: string | undefined) => void
}

/* ───────── Hook ───────── */

export function useWorkspace(): UseWorkspaceReturn {
	const saveTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

	const [entries, setEntries] = useState<WorkspaceEntry[]>([])
	const [selectedPath, setSelectedPath] = useState<string | null>(() => localStorage.getItem("nimbus_selectedPath"))
	const [activeFilePath, setActiveFilePath] = useState<string | null>(() => localStorage.getItem("nimbus_activeFilePath"))
	const [openTabs, setOpenTabs] = useState<string[]>(() => {
		try {
			const saved = localStorage.getItem("nimbus_openTabs")
			return saved ? JSON.parse(saved) : []
		} catch { return [] }
	})
	const [expandedFolders, setExpandedFolders] = useState<string[]>(() => {
		try {
			const saved = localStorage.getItem("nimbus_expandedFolders")
			return saved ? JSON.parse(saved) : ["/"]
		} catch { return ["/"] }
	});
	const [pendingCreation, setPendingCreation] = useState<PendingCreation | null>(null)
	const [pendingRename, setPendingRename] = useState<PendingRename | null>(null)
	const [workspaceError, setWorkspaceError] = useState<string | null>(null)
	const [isWorkspaceReady, setIsWorkspaceReady] = useState(false)

	/* ── State persistence ── */
	useEffect(() => {
		if (selectedPath !== null) localStorage.setItem("nimbus_selectedPath", selectedPath)
		else localStorage.removeItem("nimbus_selectedPath")
	}, [selectedPath])

	useEffect(() => {
		if (activeFilePath !== null) localStorage.setItem("nimbus_activeFilePath", activeFilePath)
		else localStorage.removeItem("nimbus_activeFilePath")
	}, [activeFilePath])

	useEffect(() => {
		localStorage.setItem("nimbus_openTabs", JSON.stringify(openTabs))
	}, [openTabs])

	useEffect(() => {
		localStorage.setItem("nimbus_expandedFolders", JSON.stringify(expandedFolders))
	}, [expandedFolders])

	/* ── Derived ── */

	const fileEntries = useMemo(
		() => entries.filter(isFileEntry).sort((a, b) => a.path.localeCompare(b.path)),
		[entries],
	)

	const fileByPath = useMemo(
		() => new Map(fileEntries.map((entry) => [entry.path, entry])),
		[fileEntries],
	)

	const folderPathSet = useMemo(() => buildFolderPathSet(entries), [entries])

	const folderPaths = useMemo(
		() => Array.from(folderPathSet).sort((a, b) => a.localeCompare(b)),
		[folderPathSet],
	)

	/* ── Initial load ── */

	useEffect(() => {
		let cancelled = false

		const loadWorkspace = async () => {
			try {
				const persisted = await listWorkspaceEntries()
				const source = persisted.length > 0 ? persisted : initialWorkspace

				if (persisted.length === 0) {
					await putWorkspaceEntries(source)
				}

				if (cancelled) return

				setEntries(sortWorkspaceEntries(source))
				
				// Only initialize state if we don't have persisted UI state
				const hasPersistedState = localStorage.getItem("nimbus_openTabs") !== null
				if (!hasPersistedState) {
					const firstFilePath = source.find(isFileEntry)?.path ?? null
					setSelectedPath(firstFilePath)
					setActiveFilePath(firstFilePath)
					setOpenTabs(firstFilePath ? [firstFilePath] : [])
					setExpandedFolders(["/"])
				}
				setWorkspaceError(null)
				setIsWorkspaceReady(true)
			} catch (error) {
				if (cancelled) return
				setWorkspaceError(`Failed to load workspace: ${String(error)}`)
			}
		}

		void loadWorkspace()

		return () => {
			cancelled = true
		}
	}, [])

	/* ── Cleanup save timers on unmount ── */

	useEffect(() => {
		const timers = saveTimersRef.current
		return () => {
			for (const timer of Object.values(timers)) {
				clearTimeout(timer)
			}
		}
	}, [])

	/* ── Keep tabs in sync when files are deleted ── */

	useEffect(() => {
		const existingFilePaths = new Set(fileEntries.map((entry) => entry.path))
		const filteredTabs = openTabs.filter(
			(path) => path === SETTINGS_TAB_ID || existingFilePaths.has(path),
		)

		if (filteredTabs.length !== openTabs.length) {
			setOpenTabs(filteredTabs)
		}

		if (
			activeFilePath &&
			activeFilePath !== SETTINGS_TAB_ID &&
			!existingFilePaths.has(activeFilePath)
		) {
			setActiveFilePath(filteredTabs[0] ?? null)
		}
	}, [fileEntries, openTabs, activeFilePath])

	/* ── Actions ── */

	const selectPath = (path: string) => {
		const nextExpanded = unique([
			...expandedFolders,
			...getAncestors(path),
			...(folderPathSet.has(path) ? [path] : []),
		])
		setSelectedPath(path)
		setExpandedFolders(nextExpanded)
		if (fileByPath.has(path)) {
			setOpenTabs((prev) => (prev.includes(path) ? prev : [...prev, path]))
			setActiveFilePath(path)
		}
	}

	const activateTab = (path: string) => {
		if (path === SETTINGS_TAB_ID) {
			setActiveFilePath(path)
			return
		}
		if (!fileByPath.has(path)) return
		setActiveFilePath(path)
		setSelectedPath(path)
	}

	const openSettingsTab = () => {
		setOpenTabs((prev) =>
			prev.includes(SETTINGS_TAB_ID) ? prev : [...prev, SETTINGS_TAB_ID],
		)
		setActiveFilePath(SETTINGS_TAB_ID)
	}

	const closeTab = (path: string) => {
		const tabIndex = openTabs.indexOf(path)
		if (tabIndex < 0) return
		const nextTabs = openTabs.filter((tabPath) => tabPath !== path)
		setOpenTabs(nextTabs)
		if (activeFilePath === path) {
			const fallbackPath = nextTabs[tabIndex] ?? nextTabs[tabIndex - 1] ?? null
			setActiveFilePath(fallbackPath)
			if (fallbackPath && fileByPath.has(fallbackPath)) {
				setSelectedPath(fallbackPath)
			}
		}
	}

	const toggleFolder = (path: string) => {
		setExpandedFolders((prev) =>
			prev.includes(path) ? prev.filter((value) => value !== path) : [...prev, path],
		)
	}

	const beginCreateEntry = (kind: "file" | "folder") => {
		const selectedIsFolder = selectedPath
			? folderPathSet.has(selectedPath) && !fileByPath.has(selectedPath)
			: false
		const baseFolder = selectedPath
			? selectedIsFolder
				? selectedPath
				: (getParentPath(selectedPath) ?? "/")
			: "/"
		setPendingCreation({ kind, parentPath: baseFolder, value: "" })
		setExpandedFolders((prev) =>
			unique([...prev, ...getAncestors(baseFolder), baseFolder]),
		)
		setWorkspaceError(null)
	}

	const commitPendingCreation = async (overrideValue?: string) => {
		if (!pendingCreation) return

		const rawInput = overrideValue ?? pendingCreation.value
		const kind = pendingCreation.kind
		const baseFolder = pendingCreation.parentPath

		setPendingCreation(null)

		const normalized = normalizePathInput(rawInput)
		if (!normalized) return

		const nextPath = joinPath(baseFolder, normalized)
		if (fileByPath.has(nextPath) || folderPathSet.has(nextPath)) {
			setWorkspaceError(`Path already exists: ${nextPath}`)
			return
		}

		const now = Date.now()
		const missingParents = getParentFolders(nextPath).filter(
			(folderPath) => !folderPathSet.has(folderPath),
		)
		const parentFolders: WorkspaceFolderEntry[] = missingParents.map((path) => ({
			path,
			kind: "folder",
			updatedAt: now,
		}))

		const newEntry: WorkspaceEntry =
			kind === "file"
				? { path: nextPath, kind: "file", content: getTemplateForPath(nextPath), updatedAt: now }
				: { path: nextPath, kind: "folder", updatedAt: now }

		const additions = [...parentFolders, newEntry]
		setEntries((prev) => sortWorkspaceEntries([...prev, ...additions]))
		setExpandedFolders((prev) =>
			unique([
				...prev,
				...getAncestors(nextPath),
				...missingParents,
				...(kind === "folder" ? [nextPath] : []),
			]),
		)
		setSelectedPath(nextPath)
		if (kind === "file") {
			setOpenTabs((prev) => (prev.includes(nextPath) ? prev : [...prev, nextPath]))
			setActiveFilePath(nextPath)
		}
		setWorkspaceError(null)

		try {
			await putWorkspaceEntries(additions)
		} catch (error) {
			setWorkspaceError(`Failed to save ${nextPath}: ${String(error)}`)
		}
	}

	const deleteSelected = async () => {
		if (!selectedPath || selectedPath === "/") return

		const isFile = fileByPath.has(selectedPath)
		const isFolder = !isFile && folderPathSet.has(selectedPath)
		if (!isFile && !isFolder) return

		const prefix = `${selectedPath}/`
		const pathsToDelete = isFile
			? [selectedPath]
			: entries
					.filter((entry) => entry.path === selectedPath || entry.path.startsWith(prefix))
					.map((entry) => entry.path)

		for (const path of pathsToDelete) {
			const timer = saveTimersRef.current[path]
			if (timer) {
				clearTimeout(timer)
				delete saveTimersRef.current[path]
			}
		}

		const nextEntries = entries.filter((entry) =>
			isFile
				? entry.path !== selectedPath
				: !(entry.path === selectedPath || entry.path.startsWith(prefix)),
		)
		const deletePathSet = new Set(pathsToDelete)
		const nextTabs = openTabs.filter((path) => !deletePathSet.has(path))

		const nextFolderSet = buildFolderPathSet(nextEntries)
		const nextExpanded = expandedFolders.filter(
			(path) => path === "/" || nextFolderSet.has(path),
		)
		const fallbackSelectedFile = nextEntries.filter(isFileEntry)[0] ?? null
		let nextActivePath = activeFilePath
		if (nextActivePath && deletePathSet.has(nextActivePath)) {
			nextActivePath = nextTabs[0] ?? fallbackSelectedFile?.path ?? null
		}
		const nextSelectedPath =
			nextActivePath ??
			(getParentPath(selectedPath) && nextFolderSet.has(getParentPath(selectedPath) ?? "")
				? getParentPath(selectedPath)
				: fallbackSelectedFile?.path ?? null)

		setEntries(nextEntries)
		setExpandedFolders(nextExpanded)
		setOpenTabs(nextTabs)
		setActiveFilePath(nextActivePath)
		setSelectedPath(nextSelectedPath)
		setWorkspaceError(null)

		try {
			await deleteWorkspacePaths(pathsToDelete)
		} catch (error) {
			setWorkspaceError(`Failed to delete ${selectedPath}: ${String(error)}`)
		}
	}


	const onEditorChange = (value: string | undefined) => {
		setEntries((prevEntries) => {
			const currentFile = prevEntries
				.filter(isFileEntry)
				.find((e) => e.path === activeFilePath) as WorkspaceFileEntry | undefined

			if (!currentFile) return prevEntries

			const nextContent = value ?? ""
			const updatedEntry: WorkspaceFileEntry = {
				...currentFile,
				content: nextContent,
				updatedAt: Date.now(),
			}

			const existing = saveTimersRef.current[currentFile.path]
			if (existing) clearTimeout(existing)

			saveTimersRef.current[currentFile.path] = setTimeout(() => {
				delete saveTimersRef.current[currentFile.path]
				void putWorkspaceEntries([updatedEntry]).catch(() => {
					setWorkspaceError(`Failed to save ${currentFile.path}`)
				})
			}, 250)

			return prevEntries.map((entry) =>
				entry.path === currentFile.path ? updatedEntry : entry,
			)
		})
	}


	const beginRename = () => {
		if (!selectedPath || selectedPath === "/") return
		setPendingRename({ path: selectedPath, value: getBaseName(selectedPath) })
		setWorkspaceError(null)
	}

	const commitRename = async (overrideValue?: string) => {
		if (!pendingRename) return
		const rawInput = (overrideValue ?? pendingRename.value).trim()
		const oldPath = pendingRename.path
		setPendingRename(null)

		if (!rawInput || rawInput === getBaseName(oldPath)) return

		const parentPath = getParentPath(oldPath) ?? "/"
		const newPath = joinPath(parentPath, rawInput)

		if (fileByPath.has(newPath) || folderPathSet.has(newPath)) {
			setWorkspaceError(`Path already exists: ${newPath}`)
			return
		}

		const isFile = fileByPath.has(oldPath)
		const now = Date.now()

		if (isFile) {
			const file = fileByPath.get(oldPath)
			if (!file) return
			const renamedFile: WorkspaceFileEntry = { ...file, path: newPath, updatedAt: now }
			setEntries((prev) =>
				sortWorkspaceEntries(prev.map((e) => (e.path === oldPath ? renamedFile : e))),
			)
			setOpenTabs((prev) => prev.map((t) => (t === oldPath ? newPath : t)))
			setActiveFilePath((prev) => (prev === oldPath ? newPath : prev))
			setSelectedPath((prev) => (prev === oldPath ? newPath : prev))
			try {
				await deleteWorkspacePaths([oldPath])
				await putWorkspaceEntries([renamedFile])
			} catch (error) {
				setWorkspaceError(`Failed to rename: ${String(error)}`)
			}
		} else {
			// Folder rename: update the folder and all descendant paths
			const prefix = `${oldPath}/`
			const renamePath = (p: string) =>
				p === oldPath ? newPath : newPath + p.slice(oldPath.length)

			const toRename = entries.filter(
				(e) => e.path === oldPath || e.path.startsWith(prefix),
			)
			const renamedEntries = toRename.map((e) => ({
				...e,
				path: renamePath(e.path),
				updatedAt: now,
			}))
			const oldPaths = toRename.map((e) => e.path)

			setEntries((prev) => {
				const unchanged = prev.filter(
					(e) => e.path !== oldPath && !e.path.startsWith(prefix),
				)
				return sortWorkspaceEntries([...unchanged, ...renamedEntries])
			})
			setOpenTabs((prev) =>
				prev.map((t) =>
					t === oldPath || t.startsWith(prefix) ? renamePath(t) : t,
				),
			)
			setActiveFilePath((prev) =>
				prev && (prev === oldPath || prev.startsWith(prefix)) ? renamePath(prev) : prev,
			)
			setSelectedPath((prev) =>
				prev && (prev === oldPath || prev.startsWith(prefix)) ? renamePath(prev) : prev,
			)
			setExpandedFolders((prev) =>
				prev.map((f) =>
					f === oldPath || f.startsWith(prefix) ? renamePath(f) : f,
				),
			)
			try {
				await deleteWorkspacePaths(oldPaths)
				await putWorkspaceEntries(renamedEntries)
			} catch (error) {
				setWorkspaceError(`Failed to rename: ${String(error)}`)
			}
		}
	}

	return {
		entries,
		selectedPath,
		activeFilePath,
		openTabs,
		expandedFolders,
		pendingCreation,
		pendingRename,
		workspaceError,
		isWorkspaceReady,
		fileEntries,
		fileByPath,
		folderPathSet,
		folderPaths,
		setPendingCreation,
		setPendingRename,
		setWorkspaceError,
		selectPath,
		activateTab,
		openSettingsTab,
		closeTab,
		toggleFolder,
		beginCreateEntry,
		commitPendingCreation,
		beginRename,
		commitRename,
		deleteSelected,
		onEditorChange,
	}
}
