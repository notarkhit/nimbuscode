import { useRef, useState } from "react"
import type { Monaco } from "@monaco-editor/react"
import type { KeybindingMode, VimInteractionMode } from "../lib/types"

/* ───────── Types ───────── */

export interface UseVimReturn {
	vimMode: VimInteractionMode
	vimModeRef: React.MutableRefObject<VimInteractionMode>
	startVimKeybindings: (editor: Monaco["editor"]["IStandaloneCodeEditor"]) => void
	stopVimKeybindings: () => void
	applyKeybindingMode: (
		mode: KeybindingMode,
		editorOverride?: Monaco["editor"]["IStandaloneCodeEditor"],
	) => void
	applyEditorCursorStyle: (
		keybindingOverride?: KeybindingMode,
		modeOverride?: VimInteractionMode,
		editorOverride?: Monaco["editor"]["IStandaloneCodeEditor"],
	) => void
}

/* ───────── Hook ───────── */

export function useVim(
	monacoRef: React.MutableRefObject<Monaco | null>,
	editorRef: React.MutableRefObject<Monaco["editor"]["IStandaloneCodeEditor"] | null>,
	settingsKeybinding: KeybindingMode,
): UseVimReturn {
	const vimKeydownDisposableRef = useRef<{ dispose: () => void } | null>(null)
	const vimModeRef = useRef<VimInteractionMode>("insert")
	const vimPendingActionRef = useRef<"d" | "y" | "c" | null>(null)
	const vimPendingPrefixRef = useRef<"g" | null>(null)
	const vimPendingTextObjectRef = useRef<"i" | "a" | null>(null)
	const vimCountBufferRef = useRef("")
	const vimYankedTextRef = useRef<string>("")
	const vimYankWasLineRef = useRef(false)

	const [vimMode, setVimMode] = useState<VimInteractionMode>("insert")

	/* ── Cursor style ── */

	const applyEditorCursorStyle = (
		keybindingOverride?: KeybindingMode,
		modeOverride?: VimInteractionMode,
		editorOverride?: Monaco["editor"]["IStandaloneCodeEditor"],
	) => {
		const editor = editorOverride ?? editorRef.current
		if (!editor) return
		const keybinding = keybindingOverride ?? settingsKeybinding
		const mode = modeOverride ?? vimModeRef.current
		const isVimNormalMode = keybinding === "vim" && mode === "normal"
		editor.updateOptions({
			cursorStyle: isVimNormalMode ? "block" : "line",
			cursorBlinking: isVimNormalMode ? "solid" : "blink",
		})
	}

	/* ── Mode management ── */

	const setVimInteractionMode = (mode: VimInteractionMode) => {
		vimModeRef.current = mode
		setVimMode(mode)
		applyEditorCursorStyle(undefined, mode)
	}

	const resetVimPendingState = () => {
		vimPendingActionRef.current = null
		vimPendingPrefixRef.current = null
		vimPendingTextObjectRef.current = null
		vimCountBufferRef.current = ""
	}

	const takeVimCount = (): number => {
		const rawCount = vimCountBufferRef.current
		vimCountBufferRef.current = ""
		const parsed = Number.parseInt(rawCount || "1", 10)
		return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed
	}

	const repeatByCount = (count: number, action: () => void) => {
		for (let index = 0; index < Math.max(1, count); index += 1) {
			action()
		}
	}

	/* ── Stop/start ── */

	const stopVimKeybindings = () => {
		vimKeydownDisposableRef.current?.dispose()
		vimKeydownDisposableRef.current = null
		resetVimPendingState()
		setVimInteractionMode("insert")
	}

	/* ── Cursor movement helpers ── */

	const moveCursorToLineStart = (
		editor: Monaco["editor"]["IStandaloneCodeEditor"],
		lineNumber: number,
	) => {
		const model = editor.getModel()
		if (!model) return
		editor.setPosition({ lineNumber, column: 1 })
	}

	const moveCursorToLineFirstNonWhitespace = (
		editor: Monaco["editor"]["IStandaloneCodeEditor"],
		lineNumber: number,
	) => {
		const model = editor.getModel()
		if (!model) return
		const firstNonWhitespaceColumn = model.getLineFirstNonWhitespaceColumn(lineNumber)
		editor.setPosition({
			lineNumber,
			column: firstNonWhitespaceColumn > 0 ? firstNonWhitespaceColumn : 1,
		})
	}

	/* ── Word object ── */

	const isVimWordCharacter = (value: string): boolean => /[A-Za-z0-9_]/u.test(value)

	const buildWordObjectRange = (
		editor: Monaco["editor"]["IStandaloneCodeEditor"],
		around: boolean,
	) => {
		const model = editor.getModel()
		const monaco = monacoRef.current
		const position = editor.getPosition()
		if (!model || !monaco || !position) return null

		const lineContent = model.getLineContent(position.lineNumber)
		if (lineContent.length === 0) return null

		let cursorIndex = Math.max(0, Math.min(position.column - 1, lineContent.length - 1))
		if (!isVimWordCharacter(lineContent[cursorIndex] ?? "")) {
			let rightIndex = cursorIndex
			while (
				rightIndex < lineContent.length &&
				!isVimWordCharacter(lineContent[rightIndex] ?? "")
			) {
				rightIndex += 1
			}
			if (rightIndex < lineContent.length) {
				cursorIndex = rightIndex
			} else {
				let leftIndex = cursorIndex - 1
				while (leftIndex >= 0 && !isVimWordCharacter(lineContent[leftIndex] ?? "")) {
					leftIndex -= 1
				}
				if (leftIndex < 0) return null
				cursorIndex = leftIndex
			}
		}

		let startIndex = cursorIndex
		while (startIndex > 0 && isVimWordCharacter(lineContent[startIndex - 1] ?? "")) {
			startIndex -= 1
		}
		let endIndex = cursorIndex + 1
		while (endIndex < lineContent.length && isVimWordCharacter(lineContent[endIndex] ?? "")) {
			endIndex += 1
		}

		if (around) {
			let trailingIndex = endIndex
			while (trailingIndex < lineContent.length && /\s/u.test(lineContent[trailingIndex])) {
				trailingIndex += 1
			}
			if (trailingIndex > endIndex) {
				endIndex = trailingIndex
			} else {
				while (startIndex > 0 && /\s/u.test(lineContent[startIndex - 1])) {
					startIndex -= 1
				}
			}
		}

		return new monaco.Range(
			position.lineNumber,
			startIndex + 1,
			position.lineNumber,
			endIndex + 1,
		)
	}

	/* ── Line operations ── */

	const deleteLineRange = (
		editor: Monaco["editor"]["IStandaloneCodeEditor"],
		lineCountToDelete: number,
	) => {
		const model = editor.getModel()
		const monaco = monacoRef.current
		if (!model || !monaco) return
		const position = editor.getPosition()
		if (!position) return

		const startLine = position.lineNumber
		const lastLine = model.getLineCount()
		const endLine = Math.min(startLine + lineCountToDelete - 1, lastLine)
		const yankRange = new monaco.Range(startLine, 1, endLine, model.getLineMaxColumn(endLine))
		const yankedText = model.getValueInRange(yankRange)
		vimYankedTextRef.current = `${yankedText}${endLine < lastLine ? "\n" : ""}`
		vimYankWasLineRef.current = true

		const deletionRange =
			endLine < lastLine
				? new monaco.Range(startLine, 1, endLine + 1, 1)
				: new monaco.Range(startLine, 1, endLine, model.getLineMaxColumn(endLine))

		editor.executeEdits("nimbus-vim", [{ range: deletionRange, text: "" }])
		const targetLine = Math.min(startLine, Math.max(1, model.getLineCount()))
		moveCursorToLineStart(editor, targetLine)
	}

	const yankLineRange = (
		editor: Monaco["editor"]["IStandaloneCodeEditor"],
		lineCountToYank: number,
	) => {
		const model = editor.getModel()
		const monaco = monacoRef.current
		const position = editor.getPosition()
		if (!model || !monaco || !position) return

		const startLine = position.lineNumber
		const lastLine = model.getLineCount()
		const endLine = Math.min(startLine + lineCountToYank - 1, lastLine)
		const range = new monaco.Range(startLine, 1, endLine, model.getLineMaxColumn(endLine))
		const text = model.getValueInRange(range)
		vimYankedTextRef.current = `${text}${endLine < lastLine ? "\n" : ""}`
		vimYankWasLineRef.current = true
	}

	/* ── Selection operations ── */

	const deleteSelectionRange = (
		editor: Monaco["editor"]["IStandaloneCodeEditor"],
		range: {
			startLineNumber: number
			startColumn: number
			endLineNumber: number
			endColumn: number
		},
	) => {
		const model = editor.getModel()
		if (model) {
			vimYankedTextRef.current = model.getValueInRange(range)
			vimYankWasLineRef.current = false
		}
		editor.executeEdits("nimbus-vim", [{ range, text: "" }])
		editor.setPosition({ lineNumber: range.startLineNumber, column: range.startColumn })
	}

	const yankSelectionRange = (
		editor: Monaco["editor"]["IStandaloneCodeEditor"],
		range: {
			startLineNumber: number
			startColumn: number
			endLineNumber: number
			endColumn: number
		},
	) => {
		const model = editor.getModel()
		if (!model) return
		vimYankedTextRef.current = model.getValueInRange(range)
		vimYankWasLineRef.current = false
		editor.setPosition({ lineNumber: range.endLineNumber, column: range.endColumn })
	}

	/* ── Paste ── */

	const pasteVimYank = (
		editor: Monaco["editor"]["IStandaloneCodeEditor"],
		before = false,
	) => {
		const text = vimYankedTextRef.current
		const monaco = monacoRef.current
		const model = editor.getModel()
		const position = editor.getPosition()
		if (!text || !monaco || !model || !position) return

		if (vimYankWasLineRef.current) {
			const insertLine = before
				? position.lineNumber
				: Math.min(position.lineNumber + 1, model.getLineCount() + 1)
			const insertRange = new monaco.Range(insertLine, 1, insertLine, 1)
			editor.executeEdits("nimbus-vim", [{ range: insertRange, text }])
			moveCursorToLineStart(editor, insertLine)
			return
		}

		const maxColumn = model.getLineMaxColumn(position.lineNumber)
		const insertColumn = before
			? position.column
			: Math.min(position.column + 1, maxColumn)
		const insertRange = new monaco.Range(
			position.lineNumber,
			insertColumn,
			position.lineNumber,
			insertColumn,
		)
		editor.executeEdits("nimbus-vim", [{ range: insertRange, text }])
		editor.setPosition({ lineNumber: position.lineNumber, column: insertColumn })
	}

	/* ── Character delete ── */

	const deleteCharacters = (
		editor: Monaco["editor"]["IStandaloneCodeEditor"],
		count: number,
		direction: "left" | "right",
	) => {
		const model = editor.getModel()
		const monaco = monacoRef.current
		const position = editor.getPosition()
		if (!model || !monaco || !position) return

		if (direction === "right") {
			const maxColumn = model.getLineMaxColumn(position.lineNumber)
			if (position.column < maxColumn) {
				const endColumn = Math.min(position.column + count, maxColumn)
				deleteSelectionRange(
					editor,
					new monaco.Range(position.lineNumber, position.column, position.lineNumber, endColumn),
				)
				return
			}
			if (position.lineNumber < model.getLineCount()) {
				deleteSelectionRange(
					editor,
					new monaco.Range(
						position.lineNumber,
						maxColumn,
						position.lineNumber + 1,
						1,
					),
				)
			}
			return
		}

		if (position.column <= 1) return
		const startColumn = Math.max(1, position.column - count)
		deleteSelectionRange(
			editor,
			new monaco.Range(position.lineNumber, startColumn, position.lineNumber, position.column),
		)
	}

	const deleteToLineEnd = (
		editor: Monaco["editor"]["IStandaloneCodeEditor"],
		enterInsertMode: boolean,
	) => {
		const model = editor.getModel()
		const monaco = monacoRef.current
		const position = editor.getPosition()
		if (!model || !monaco || !position) {
			if (enterInsertMode) setVimInteractionMode("insert")
			return
		}

		const maxColumn = model.getLineMaxColumn(position.lineNumber)
		if (position.column < maxColumn) {
			deleteSelectionRange(
				editor,
				new monaco.Range(position.lineNumber, position.column, position.lineNumber, maxColumn),
			)
		}
		if (enterInsertMode) setVimInteractionMode("insert")
	}

	/* ── Motion selection ── */

	const selectByMotion = (
		editor: Monaco["editor"]["IStandaloneCodeEditor"],
		motionKey: string,
		count: number,
	): boolean => {
		const model = editor.getModel()
		const monaco = monacoRef.current
		const position = editor.getPosition()
		if (!model || !monaco || !position) return false

		switch (motionKey) {
			case "w":
				repeatByCount(count, () => { editor.trigger("nimbus-vim", "cursorWordStartRightSelect", null) })
				return true
			case "b":
				repeatByCount(count, () => { editor.trigger("nimbus-vim", "cursorWordStartLeftSelect", null) })
				return true
			case "e":
				repeatByCount(count, () => { editor.trigger("nimbus-vim", "cursorWordEndRightSelect", null) })
				return true
			case "h":
				repeatByCount(count, () => { editor.trigger("nimbus-vim", "cursorLeftSelect", null) })
				return true
			case "j":
				repeatByCount(count, () => { editor.trigger("nimbus-vim", "cursorDownSelect", null) })
				return true
			case "k":
				repeatByCount(count, () => { editor.trigger("nimbus-vim", "cursorUpSelect", null) })
				return true
			case "l":
				repeatByCount(count, () => { editor.trigger("nimbus-vim", "cursorRightSelect", null) })
				return true
			case "$":
				editor.trigger("nimbus-vim", "cursorLineEndSelect", null)
				return true
			case "0":
				editor.trigger("nimbus-vim", "cursorLineStartSelect", null)
				return true
			case "^": {
				const firstNonWhitespaceColumn =
					model.getLineFirstNonWhitespaceColumn(position.lineNumber) || 1
				editor.setSelection(
					new monaco.Selection(
						position.lineNumber,
						position.column,
						position.lineNumber,
						firstNonWhitespaceColumn,
					),
				)
				return true
			}
			default:
				return false
		}
	}

	/* ── Operator application ── */

	const applyPendingOperator = (
		editor: Monaco["editor"]["IStandaloneCodeEditor"],
		key: string,
		lowerKey: string,
	): boolean => {
		const pendingAction = vimPendingActionRef.current
		const monaco = monacoRef.current
		const position = editor.getPosition()
		if (!pendingAction || !monaco || !position) return false

		const pendingTextObject = vimPendingTextObjectRef.current
		if (pendingTextObject) {
			vimPendingTextObjectRef.current = null
			if (lowerKey !== "w") {
				vimPendingActionRef.current = null
				takeVimCount()
				return true
			}
			const wordObjectRange = buildWordObjectRange(editor, pendingTextObject === "a")
			if (!wordObjectRange) {
				vimPendingActionRef.current = null
				takeVimCount()
				return true
			}
			if (pendingAction === "y") {
				yankSelectionRange(editor, wordObjectRange)
			} else {
				deleteSelectionRange(editor, wordObjectRange)
				if (pendingAction === "c") setVimInteractionMode("insert")
			}
			vimPendingActionRef.current = null
			takeVimCount()
			return true
		}

		if (lowerKey === "i" || lowerKey === "a") {
			vimPendingTextObjectRef.current = lowerKey
			return true
		}

		const count = takeVimCount()
		const isDoubleAction =
			(pendingAction === "d" && lowerKey === "d") ||
			(pendingAction === "y" && lowerKey === "y") ||
			(pendingAction === "c" && lowerKey === "c")

		if (isDoubleAction) {
			if (pendingAction === "d") deleteLineRange(editor, count)
			if (pendingAction === "y") yankLineRange(editor, count)
			if (pendingAction === "c") {
				deleteLineRange(editor, count)
				setVimInteractionMode("insert")
			}
			vimPendingActionRef.current = null
			vimPendingTextObjectRef.current = null
			return true
		}

		editor.setSelection(
			new monaco.Selection(
				position.lineNumber,
				position.column,
				position.lineNumber,
				position.column,
			),
		)

		const motionApplied = selectByMotion(editor, key, count)
		const selection = editor.getSelection()
		const hasSelection =
			selection &&
			!(
				selection.startLineNumber === selection.endLineNumber &&
				selection.startColumn === selection.endColumn
			)

		if (!motionApplied || !selection || !hasSelection) {
			vimPendingActionRef.current = null
			vimPendingTextObjectRef.current = null
			return true
		}

		if (pendingAction === "y") {
			yankSelectionRange(editor, selection)
		} else {
			deleteSelectionRange(editor, selection)
			if (pendingAction === "c") setVimInteractionMode("insert")
		}

		vimPendingActionRef.current = null
		vimPendingTextObjectRef.current = null
		return true
	}

	/* ── Start keybindings ── */

	const startVimKeybindings = (editor: Monaco["editor"]["IStandaloneCodeEditor"]) => {
		stopVimKeybindings()
		setVimInteractionMode("normal")

		vimKeydownDisposableRef.current = editor.onKeyDown((event: {
			browserEvent: KeyboardEvent
			preventDefault: () => void
			stopPropagation: () => void
		}) => {
			const browserEvent = event.browserEvent
			const key = browserEvent.key
			const lowerKey = key.toLowerCase()
			const ctrlOrMeta = browserEvent.ctrlKey || browserEvent.metaKey

			if (ctrlOrMeta && lowerKey !== "r") return

			if (key === "Escape") {
				event.preventDefault()
				event.stopPropagation()
				resetVimPendingState()
				setVimInteractionMode("normal")
				return
			}

			if (vimModeRef.current === "insert") return

			event.preventDefault()
			event.stopPropagation()

			if (/^[0-9]$/u.test(key)) {
				const zeroIsOperatorMotion =
					key === "0" &&
					vimCountBufferRef.current.length === 0 &&
					!!vimPendingActionRef.current
				if (zeroIsOperatorMotion) {
					// fall through to applyPendingOperator with "0"
				} else if (
					key === "0" &&
					vimCountBufferRef.current.length === 0 &&
					!vimPendingActionRef.current &&
					!vimPendingPrefixRef.current
				) {
					editor.trigger("nimbus-vim", "cursorLineStart", null)
					return
				} else {
					vimCountBufferRef.current += key
					return
				}
			}

			if (vimPendingPrefixRef.current === "g") {
				vimPendingPrefixRef.current = null
				if (lowerKey === "g") {
					const model = editor.getModel()
					if (!model) return
					const requestedLine = takeVimCount()
					const targetLine = Math.min(Math.max(1, requestedLine), model.getLineCount())
					moveCursorToLineStart(editor, targetLine)
				}
				return
			}

			if (applyPendingOperator(editor, key, lowerKey)) return

			if (ctrlOrMeta && lowerKey === "r") {
				const count = takeVimCount()
				repeatByCount(count, () => { editor.trigger("nimbus-vim", "redo", null) })
				return
			}

			switch (key) {
				case "i":
					resetVimPendingState()
					setVimInteractionMode("insert")
					return
				case "I": {
					const position = editor.getPosition()
					if (position) moveCursorToLineFirstNonWhitespace(editor, position.lineNumber)
					resetVimPendingState()
					setVimInteractionMode("insert")
					return
				}
				case "a": {
					const model = editor.getModel()
					const position = editor.getPosition()
					if (model && position) {
						const maxColumn = model.getLineMaxColumn(position.lineNumber)
						const nextColumn = position.column < maxColumn ? position.column + 1 : position.column
						editor.setPosition({ lineNumber: position.lineNumber, column: nextColumn })
					}
					resetVimPendingState()
					setVimInteractionMode("insert")
					return
				}
				case "A":
					editor.trigger("nimbus-vim", "cursorLineEnd", null)
					resetVimPendingState()
					setVimInteractionMode("insert")
					return
				case "o": {
					const model = editor.getModel()
					const monaco = monacoRef.current
					const position = editor.getPosition()
					if (model && monaco && position) {
						const maxColumn = model.getLineMaxColumn(position.lineNumber)
						const insertRange = new monaco.Range(position.lineNumber, maxColumn, position.lineNumber, maxColumn)
						editor.executeEdits("nimbus-vim", [{ range: insertRange, text: "\n" }])
						editor.setPosition({ lineNumber: position.lineNumber + 1, column: 1 })
					}
					resetVimPendingState()
					setVimInteractionMode("insert")
					return
				}
				case "O": {
					const monaco = monacoRef.current
					const position = editor.getPosition()
					if (monaco && position) {
						const insertRange = new monaco.Range(position.lineNumber, 1, position.lineNumber, 1)
						editor.executeEdits("nimbus-vim", [{ range: insertRange, text: "\n" }])
						editor.setPosition({ lineNumber: position.lineNumber, column: 1 })
					}
					resetVimPendingState()
					setVimInteractionMode("insert")
					return
				}
				case "h":
				case "ArrowLeft":
					repeatByCount(takeVimCount(), () => { editor.trigger("nimbus-vim", "cursorLeft", null) })
					return
				case "j":
				case "ArrowDown":
					repeatByCount(takeVimCount(), () => { editor.trigger("nimbus-vim", "cursorDown", null) })
					return
				case "k":
				case "ArrowUp":
					repeatByCount(takeVimCount(), () => { editor.trigger("nimbus-vim", "cursorUp", null) })
					return
				case "l":
				case "ArrowRight":
					repeatByCount(takeVimCount(), () => { editor.trigger("nimbus-vim", "cursorRight", null) })
					return
				case "w":
					repeatByCount(takeVimCount(), () => { editor.trigger("nimbus-vim", "cursorWordStartRight", null) })
					return
				case "b":
					repeatByCount(takeVimCount(), () => { editor.trigger("nimbus-vim", "cursorWordStartLeft", null) })
					return
				case "e":
					repeatByCount(takeVimCount(), () => { editor.trigger("nimbus-vim", "cursorWordEndRight", null) })
					return
				case "Home":
					editor.trigger("nimbus-vim", "cursorLineStart", null)
					return
				case "^": {
					const position = editor.getPosition()
					if (position) moveCursorToLineFirstNonWhitespace(editor, position.lineNumber)
					return
				}
				case "$":
				case "End":
					editor.trigger("nimbus-vim", "cursorLineEnd", null)
					return
				case "x":
				case "Delete":
					deleteCharacters(editor, takeVimCount(), "right")
					return
				case "X":
					deleteCharacters(editor, takeVimCount(), "left")
					return
				case "D":
					deleteToLineEnd(editor, false)
					resetVimPendingState()
					return
				case "C":
					deleteToLineEnd(editor, true)
					resetVimPendingState()
					return
				case "Y":
					yankLineRange(editor, takeVimCount())
					resetVimPendingState()
					return
				case "s":
					deleteCharacters(editor, takeVimCount(), "right")
					resetVimPendingState()
					setVimInteractionMode("insert")
					return
				case "S":
					deleteLineRange(editor, takeVimCount())
					resetVimPendingState()
					setVimInteractionMode("insert")
					return
				case "u":
					repeatByCount(takeVimCount(), () => { editor.trigger("nimbus-vim", "undo", null) })
					return
				case "p":
					pasteVimYank(editor)
					return
				case "P":
					pasteVimYank(editor, true)
					return
				case "d":
					vimPendingPrefixRef.current = null
					vimPendingActionRef.current = "d"
					return
				case "y":
					vimPendingPrefixRef.current = null
					vimPendingActionRef.current = "y"
					return
				case "c":
					vimPendingPrefixRef.current = null
					vimPendingActionRef.current = "c"
					return
				case "g":
					vimPendingPrefixRef.current = "g"
					return
				case "G": {
					const model = editor.getModel()
					if (!model) return
					const hasExplicitCount = vimCountBufferRef.current.length > 0
					const count = takeVimCount()
					const targetLine = hasExplicitCount
						? Math.min(Math.max(1, count), model.getLineCount())
						: model.getLineCount()
					moveCursorToLineStart(editor, targetLine)
					return
				}
				default:
					resetVimPendingState()
					return
			}
		})
	}

	/* ── Public API ── */

	const applyKeybindingMode = (
		mode: KeybindingMode,
		editorOverride?: Monaco["editor"]["IStandaloneCodeEditor"],
	) => {
		const editor = editorOverride ?? editorRef.current
		if (!editor) return
		if (mode === "vim") {
			startVimKeybindings(editor)
			return
		}
		stopVimKeybindings()
		applyEditorCursorStyle(mode, "insert", editor)
	}

	return {
		vimMode,
		vimModeRef,
		startVimKeybindings,
		stopVimKeybindings,
		applyKeybindingMode,
		applyEditorCursorStyle,
	}
}
