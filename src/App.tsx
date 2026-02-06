import AppLayout from './components/Layout/AppLayout'
import { type KeybindMode } from './components/Navbar/KeybindsDropdown'

function App() {
  const handleSettingsClick = () => {
    console.log('Settings clicked - placeholder for future settings modal')
    // TODO: Implement settings modal
  }

  const handleKeybindModeChange = (mode: KeybindMode) => {
    console.log('Keybind mode changed to:', mode)
    // TODO: Apply keybind mode changes to Monaco editor
  }

  return (
    <AppLayout 
      onSettingsClick={handleSettingsClick}
      onKeybindModeChange={handleKeybindModeChange}
    />
  )
}

export default App
