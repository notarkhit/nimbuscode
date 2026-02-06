import { type KeybindMode } from '../../components/Navbar/KeybindsDropdown'
import Navbar from '../../components/Navbar/Navbar'
import MonacoEditor from '../../components/Editor/MonacoEditor'

interface AppLayoutProps {
  onSettingsClick: () => void
  onKeybindModeChange: (mode: KeybindMode) => void
}

const AppLayout: React.FC<AppLayoutProps> = ({ 
  onSettingsClick, 
  onKeybindModeChange 
}) => {
  return (
    <div className="h-screen flex flex-col bg-slate-900">
      <Navbar 
        onSettingsClick={onSettingsClick}
        onKeybindModeChange={onKeybindModeChange}
      />
      <MonacoEditor />
    </div>
  )
}

export default AppLayout