import { useState, useEffect, useRef } from 'react'

export type KeybindMode = 'default' | 'vim' | 'emacs'

interface KeybindsDropdownProps {
  selectedMode: KeybindMode
  onModeChange: (mode: KeybindMode) => void
}

const KeybindsDropdown: React.FC<KeybindsDropdownProps> = ({ 
  selectedMode, 
  onModeChange 
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const options: { value: KeybindMode; label: string; description: string }[] = [
    { value: 'default', label: 'Default', description: 'Standard keyboard shortcuts' },
    { value: 'vim', label: 'Vim', description: 'Vim-style key bindings' },
    { value: 'emacs', label: 'Emacs', description: 'Emacs-style key bindings' }
  ]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (mode: KeybindMode) => {
    onModeChange(mode)
    setIsOpen(false)
  }

  const currentOption = options.find(opt => opt.value === selectedMode)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700"
      >
        <span>Keybinds</span>
        <span className="text-slate-400">({currentOption?.label})</span>
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
        <div className="absolute top-full left-0 mt-1 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-700 transition-colors ${
                  selectedMode === option.value 
                    ? 'bg-slate-700 text-blue-400' 
                    : 'text-slate-300'
                }`}
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-slate-400 mt-1">{option.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default KeybindsDropdown