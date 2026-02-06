import { Settings } from 'lucide-react'

interface SettingsButtonProps {
  onClick: () => void
}

const SettingsButton: React.FC<SettingsButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
      title="Settings"
    >
      <Settings className="w-5 h-5" />
    </button>
  )
}

export default SettingsButton