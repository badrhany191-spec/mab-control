import {
  Home,
  MousePointer2,
  MonitorSmartphone,
  Camera,
  Gamepad2,
  Volume2,
  FolderSync,
  ClipboardList,
  Smartphone,
  Network,
  Settings,
  Info,
  type LucideIcon,
} from 'lucide-react'

export type ViewId =
  | 'home'
  | 'remote-control'
  | 'remote-desktop'
  | 'remote-camera'
  | 'games'
  | 'audio'
  | 'files'
  | 'clipboard'
  | 'devices'
  | 'network'
  | 'settings'
  | 'about'

export interface NavItem {
  id: ViewId
  label: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'remote-control', label: 'Remote Control', icon: MousePointer2 },
  { id: 'remote-desktop', label: 'Remote Desktop', icon: MonitorSmartphone },
  { id: 'remote-camera', label: 'Remote Camera', icon: Camera },
  { id: 'games', label: 'Games', icon: Gamepad2 },
  { id: 'audio', label: 'Audio', icon: Volume2 },
  { id: 'files', label: 'File Transfer', icon: FolderSync },
  { id: 'clipboard', label: 'Clipboard', icon: ClipboardList },
  { id: 'devices', label: 'Devices', icon: Smartphone },
  { id: 'network', label: 'Network', icon: Network },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'about', label: 'About', icon: Info },
]
