import { useState } from 'react'
import KeybindsDropdown, { type KeybindMode } from './KeybindsDropdown'
import SettingsButton from './SettingsButton'

interface NavbarProps {
  onSettingsClick: () => void
  onKeybindModeChange: (mode: KeybindMode) => void
}

const Navbar: React.FC<NavbarProps> = ({ 
  onSettingsClick, 
  onKeybindModeChange 
}) => {
  const [keybindMode, setKeybindMode] = useState<KeybindMode>('default')

  const handleKeybindModeChange = (mode: KeybindMode) => {
    setKeybindMode(mode)
    onKeybindModeChange(mode)
  }

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
      {/* App Name */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-white">
          <span className="text-blue-400">nimbus</span>
          <span className="text-slate-300">Code</span>
        </h1>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <KeybindsDropdown 
          selectedMode={keybindMode}
          onModeChange={handleKeybindModeChange}
        />
        <SettingsButton onClick={onSettingsClick} />
      </div>
    </header>
  )
}

export default Navbar