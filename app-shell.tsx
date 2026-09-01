'use client'

/*
 * MAB Control - Application shell.
 * Wraps the whole desktop UI in the global store, renders the fixed sidebar and
 * switches the active view. Sidebar navigation is driven by local view state.
 */

import { useState } from 'react'
import { MabProvider } from '@/lib/mab-store'
import { Sidebar } from './sidebar'
import type { ViewId } from './nav'
import { HomeView } from './views/home-view'
import { RemoteControlView } from './views/remote-control-view'
import { RemoteDesktopView } from './views/remote-desktop-view'
import { RemoteCameraView } from './views/remote-camera-view'
import { GamesView } from './views/games-view'
import { AudioView } from './views/audio-view'
import { FilesView } from './views/files-view'
import { ClipboardView } from './views/clipboard-view'
import { DevicesView } from './views/devices-view'
import { NetworkView } from './views/network-view'
import { SettingsView } from './views/settings-view'
import { AboutView } from './views/about-view'

export function AppShell() {
  const [active, setActive] = useState<ViewId>('home')
  const [collapsed, setCollapsed] = useState(false)

  return (
    <MabProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
        <Sidebar
          active={active}
          onNavigate={setActive}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
        />
        <main className="mab-scroll flex-1 overflow-y-auto px-6 py-6 lg:px-8">
          {active === 'home' && <HomeView onNavigate={setActive} />}
          {active === 'remote-control' && <RemoteControlView />}
          {active === 'remote-desktop' && <RemoteDesktopView />}
          {active === 'remote-camera' && <RemoteCameraView />}
          {active === 'games' && <GamesView />}
          {active === 'audio' && <AudioView />}
          {active === 'files' && <FilesView />}
          {active === 'clipboard' && <ClipboardView />}
          {active === 'devices' && <DevicesView />}
          {active === 'network' && <NetworkView />}
          {active === 'settings' && <SettingsView />}
          {active === 'about' && <AboutView />}
        </main>
      </div>
    </MabProvider>
  )
}
