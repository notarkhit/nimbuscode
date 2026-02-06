import { useState, useEffect, useRef, useLayoutEffect } from 'react'

export type KeybindMode = 'default' | 'vim' | 'emacs'

interface KeybindsDropdownProps {
	selectedMode: KeybindMode
	onModeChange: (mode: KeybindMode) => void
}

const VIEWPORT_PADDING = 8

const KeybindsDropdown: React.FC<KeybindsDropdownProps> = ({
	selectedMode,
	onModeChange
}) => {
	const [isOpen, setIsOpen] = useState(false)

	const triggerRef = useRef<HTMLButtonElement>(null)
	const dropdownRef = useRef<HTMLDivElement>(null)

	const options = [
		{ value: 'default', label: 'Default', description: 'Standard keyboard shortcuts' },
		{ value: 'vim', label: 'Vim', description: 'Vim-style key bindings' },
		{ value: 'emacs', label: 'Emacs', description: 'Emacs-style key bindings' }
	] as const

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node) &&
				!triggerRef.current?.contains(event.target as Node)
			) {
				setIsOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	useLayoutEffect(() => {
		if (!isOpen || !dropdownRef.current || !triggerRef.current) return

		const menu = dropdownRef.current
		const triggerRect = triggerRef.current.getBoundingClientRect()
		const menuRect = menu.getBoundingClientRect()

		let top = triggerRect.bottom
		let left = triggerRect.left

		// Flip vertically if overflowing bottom
		if (top + menuRect.height > window.innerHeight - VIEWPORT_PADDING) {
			top = triggerRect.top - menuRect.height
		}

		// Shift horizontally if overflowing right
		if (left + menuRect.width > window.innerWidth - VIEWPORT_PADDING) {
			left = window.innerWidth - menuRect.width - VIEWPORT_PADDING
		}

		// Clamp to viewport
		top = Math.max(VIEWPORT_PADDING, top)
		left = Math.max(VIEWPORT_PADDING, left)

		menu.style.top = `${top}px`
		menu.style.left = `${left}px`
	}, [isOpen])

	const handleSelect = (mode: KeybindMode) => {
		onModeChange(mode)
		setIsOpen(false)
	}

	const currentOption = options.find(opt => opt.value === selectedMode)

	return (
		<div>
			<button
				ref={triggerRef}
				onClick={() => setIsOpen(o => !o)}
				className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700"
			>
				<span className="text-slate-400">{currentOption?.label}</span>
				<svg
					className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
				</svg>
			</button>

			{isOpen && (
				<div
					ref={dropdownRef}
					className="fixed mt-1 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50"
				>
					<div className="py-1">
						{options.map(option => (
							<button
								key={option.value}
								onClick={() => handleSelect(option.value)}
								className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-700 transition-colors ${selectedMode === option.value
									? 'bg-slate-700 text-blue-400'
									: 'text-slate-300'
									}`}
							>
								<div className="font-medium">{option.label}</div>
								<div className="text-xs text-slate-400 mt-1">
									{option.description}
								</div>
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	)
}

export default KeybindsDropdown
