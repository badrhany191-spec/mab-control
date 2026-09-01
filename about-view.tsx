'use client'

import { Globe, RefreshCw, Code2 } from 'lucide-react'
import { PageHeader, Panel, StatPill } from '@/components/ui-kit'
import { Button } from '@/components/ui/button'
import { MabLogo } from '@/components/mab-logo'
import { useMab } from '@/lib/mab-store'
import { APP_VERSION, APP_BUILD } from '@/lib/settings'

const TECH = [
  'Next.js',
  'Electron.js',
  'Node.js',
  'WebSocket',
  'WebRTC',
  'nut-js',
  'FFmpeg',
  'Sharp',
  'ViGEm',
]

export function AboutView() {
  const { engine, addActivity } = useMab()

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="About" subtitle="Application information and credits." />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Panel>
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <MabLogo className="size-20" />
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">MAB Control</h2>
              <p className="text-sm text-muted-foreground">
                Version {APP_VERSION} · Build {APP_BUILD}
              </p>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground text-pretty">
              The complete way to control your PC from your phone — remote input, live desktop and
              camera streaming, audio, a virtual game controller, and wireless file transfer over
              your local network.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={() => addActivity('info', 'You are on the latest version')}>
                <RefreshCw className="size-4" /> Check for updates
              </Button>
              <Button variant="outline" onClick={() => addActivity('info', 'Opening website…')}>
                <Globe className="size-4" /> Visit website
              </Button>
              <Button variant="outline" onClick={() => addActivity('info', 'Opening source…')}>
                <Code2 className="size-4" /> Source
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              © 2026 MAB Control. All rights reserved.
            </p>
          </div>
        </Panel>

        <div className="flex flex-col gap-5">
          <Panel title="Runtime">
            <div className="flex flex-col gap-2">
              <StatPill
                label="Engine"
                value={engine === 'desktop' ? 'Desktop' : 'Browser preview'}
                tone={engine === 'desktop' ? 'good' : 'muted'}
              />
              <StatPill label="Protocol" value="v1" />
              <StatPill label="License" value="MIT" />
            </div>
          </Panel>

          <Panel title="Built with">
            <div className="flex flex-wrap gap-2">
              {TECH.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
