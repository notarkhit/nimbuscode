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
import type { PendingCreation } from "../lib/types"

/* ───────── Return type ───────── */

export interface UseWorkspaceReturn {
	// State
	entries: WorkspaceEntry[]
	selectedPath: string | null
	activeFilePath: string | null
	openTabs: string[]
	expandedFolders: string[]
	pendingCreation: PendingCreation | null
	workspaceError: string | null
	isWorkspaceReady: boolean
	// Derived
	fileEntries: WorkspaceFileEntry[]
	fileByPath: Map<string, WorkspaceFileEntry>
	folderPathSet: Set<string>
	folderPaths: string[]
	// Setters (for cross-component needs)
	setPendingCreation: React.Dispatch<React.SetStateAction<PendingCreation | null>>
	setWorkspaceError: React.Dispatch<React.SetStateAction<string | null>>
	// Actions
	selectPath: (path: string) => void
	activateTab: (path: string) => void
	openSettingsTab: () => void
	closeTab: (path: string) => void
	toggleFolder: (path: string) => void
	beginCreateEntry: (kind: "file" | "folder") => void
	commitPendingCreation: (overrideValue?: string) => Promise<void>
	deleteSelected: () => Promise<void>
	onEditorChange: (value: string | undefined) => void
}

/* ───────── Hook ───────── */

export function useWorkspace(): UseWorkspaceReturn {
	const saveTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

	const [entries, setEntries] = useState<WorkspaceEntry[]>([])
	const [selectedPath, setSelectedPath] = useState<string | null>(null)
	const [activeFilePath, setActiveFilePath] = useState<string | null>(null)
	const [openTabs, setOpenTabs] = useState<string[]>([])
	const [expandedFolders, setExpandedFolders] = useState<string[]>(["/"]);
	const [pendingCreation, setPendingCreation] = useState<PendingCreation | null>(null)
	const [workspaceError, setWorkspaceError] = useState<string | null>(null)
	const [isWorkspaceReady, setIsWorkspaceReady] = useState(false)

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

				const firstFilePath = source.find(isFileEntry)?.path ?? null
				setEntries(sortWorkspaceEntries(source))
				setSelectedPath(firstFilePath)
				setActiveFilePath(firstFilePath)
				setOpenTabs(firstFilePath ? [firstFilePath] : [])
				setExpandedFolders(["/"])
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


	return {
		entries,
		selectedPath,
		activeFilePath,
		openTabs,
		expandedFolders,
		pendingCreation,
		workspaceError,
		isWorkspaceReady,
		fileEntries,
		fileByPath,
		folderPathSet,
		folderPaths,
		setPendingCreation,
		setWorkspaceError,
		selectPath,
		activateTab,
		openSettingsTab,
		closeTab,
		toggleFolder,
		beginCreateEntry,
		commitPendingCreation,
		deleteSelected,
		onEditorChange,
	}
}
