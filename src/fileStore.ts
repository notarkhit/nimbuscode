export type WorkspaceFileEntry = {
	path: string
	kind: "file"
	content: string
	updatedAt: number
}

export type WorkspaceFolderEntry = {
	path: string
	kind: "folder"
	updatedAt: number
}

export type WorkspaceEntry = WorkspaceFileEntry | WorkspaceFolderEntry

const DB_NAME = "nimbuscode-workspace"
const STORE_NAME = "entries"
const DB_VERSION = 1

const requestToPromise = <T>(request: IDBRequest<T>): Promise<T> =>
	new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result)
		request.onerror = () =>
			reject(request.error ?? new Error("IndexedDB request failed"))
	})

const transactionDone = (transaction: IDBTransaction): Promise<void> =>
	new Promise((resolve, reject) => {
		transaction.oncomplete = () => resolve()
		transaction.onerror = () =>
			reject(transaction.error ?? new Error("IndexedDB transaction failed"))
		transaction.onabort = () =>
			reject(transaction.error ?? new Error("IndexedDB transaction aborted"))
	})

const openWorkspaceDB = (): Promise<IDBDatabase> =>
	new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION)

		request.onupgradeneeded = () => {
			const db = request.result
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME, { keyPath: "path" })
			}
		}

		request.onsuccess = () => resolve(request.result)
		request.onerror = () =>
			reject(request.error ?? new Error("Failed to open IndexedDB"))
	})

export const listWorkspaceEntries = async (): Promise<WorkspaceEntry[]> => {
	const db = await openWorkspaceDB()
	try {
		const transaction = db.transaction(STORE_NAME, "readonly")
		const store = transaction.objectStore(STORE_NAME)
		const entries = await requestToPromise(store.getAll())
		await transactionDone(transaction)
		return (entries as WorkspaceEntry[]).sort((a, b) =>
			a.path.localeCompare(b.path),
		)
	} finally {
		db.close()
	}
}

export const putWorkspaceEntries = async (
	entries: WorkspaceEntry[],
): Promise<void> => {
	if (entries.length === 0) return

	const db = await openWorkspaceDB()
	try {
		const transaction = db.transaction(STORE_NAME, "readwrite")
		const store = transaction.objectStore(STORE_NAME)

		for (const entry of entries) {
			store.put(entry)
		}

		await transactionDone(transaction)
	} finally {
		db.close()
	}
}

export const deleteWorkspacePaths = async (paths: string[]): Promise<void> => {
	if (paths.length === 0) return

	const db = await openWorkspaceDB()
	try {
		const transaction = db.transaction(STORE_NAME, "readwrite")
		const store = transaction.objectStore(STORE_NAME)

		for (const path of paths) {
			store.delete(path)
		}

		await transactionDone(transaction)
	} finally {
		db.close()
	}
}
