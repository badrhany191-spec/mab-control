'use client'

import { useEffect, useRef, useState } from 'react'
import { Monitor, Play, Square, Maximize2, Gauge, Activity, Zap } from 'lucide-react'
import { Card, CardHead, PageHeader, EngineBadge, Segmented, Select, Stat } from '@/components/ui-kit'
import { Button } from '@/components/ui/button'
import { useMab } from '@/lib/mab-store'
import { getNative, sendControl } from '@/lib/native-bridge'
import { MSG } from '@/lib/protocol'
import { cn } from '@/lib/utils'

interface StreamStats {
  fps: number
  bitrateKbps: number
  latencyMs: number
  resolution: string
}

export function RemoteDesktopView() {
  const { engine, settings, updateSettings, addActivity } = useMab()
  const [streaming, setStreaming] = useState(false)
  const [display, setDisplay] = useState('0')
  const [showFps, setShowFps] = useState(true)
  const [stats, setStats] = useState<StreamStats | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)

  // Bind to native screen frames + stats when running on the desktop engine.
  useEffect(() => {
    const native = getNative()
    if (!native) return
    const offFrame = native.onEvent('mab:frame', (raw) => {
      const f = raw as { dataUrl?: string }
      if (f.dataUrl && imgRef.current) imgRef.current.src = f.dataUrl
    })
    const offStats = native.onEvent('mab:screen-stats', (raw) => {
      setStats(raw as StreamStats)
    })
    return () => {
      offFrame()
      offStats()
    }
  }, [])

  async function toggleStream() {
    if (streaming) {
      await sendControl(MSG.SCREEN_STOP, {})
      setStreaming(false)
      setStats(null)
      addActivity('info', 'Desktop streaming stopped')
      return
    }
    const delivered = await sendControl(MSG.SCREEN_START, {
      display: Number(display),
      quality: settings.display.quality,
      fps: settings.display.fps,
      resolution: settings.display.resolution,
    })
    setStreaming(delivered)
    addActivity(
      delivered ? 'info' : 'error',
      delivered
        ? 'Desktop streaming started'
        : 'Screen capture requires the desktop app (Electron desktopCapturer / FFmpeg).',
    )
  }

  function enterFullscreen() {
    frameRef.current?.requestFullscreen?.().catch(() => {})
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Remote Desktop"
        subtitle="Stream this PC's screen to the paired phone in real time."
        actions={<EngineBadge engine={engine} />}
      />

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Card className="overflow-hidden">
          <CardHead
            title="Live screen"
            icon={<Monitor className="size-4.5" />}
            action={
              <Button variant="outline" size="sm" onClick={enterFullscreen}>
                <Maximize2 className="size-3.5" /> Full screen
              </Button>
            }
          />
          <div
            ref={frameRef}
            className="relative grid aspect-video place-items-center bg-black"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              alt="Live desktop stream"
              className={cn('h-full w-full object-contain', streaming ? 'block' : 'hidden')}
            />
            {!streaming ? (
              <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                <Monitor className="size-10 opacity-40" />
                <p className="text-sm">
                  {engine === 'desktop'
                    ? 'Press Start stream to begin capturing this display.'
                    : 'Screen capture runs in the desktop app. Start the MAB Control desktop engine to stream.'}
                </p>
              </div>
            ) : null}

            {streaming && showFps && stats ? (
              <div className="absolute left-3 top-3 rounded-lg bg-background/70 px-2.5 py-1.5 font-mono text-xs backdrop-blur">
                {stats.fps} FPS · {stats.latencyMs} ms
              </div>
            ) : null}
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHead title="Stream settings" icon={<Gauge className="size-4.5" />} />
            <div className="space-y-4 p-5">
              <Setting label="Quality">
                <Segmented
                  value={settings.display.quality}
                  onChange={(v) =>
                    updateSettings({
                      ...settings,
                      display: { ...settings.display, quality: v },
                    })
                  }
                  options={[
                    { label: 'Low', value: 'low' },
                    { label: 'Med', value: 'medium' },
                    { label: 'High', value: 'high' },
                  ]}
                />
              </Setting>
              <Setting label="Frame rate">
                <Segmented
                  value={String(settings.display.fps)}
                  onChange={(v) =>
                    updateSettings({
                      ...settings,
                      display: { ...settings.display, fps: Number(v) as 15 | 30 | 60 },
                    })
                  }
                  options={[
                    { label: '15', value: '15' },
                    { label: '30', value: '30' },
                    { label: '60', value: '60' },
                  ]}
                />
              </Setting>
              <Setting label="Resolution">
                <Select
                  value={settings.display.resolution}
                  onChange={(v) =>
                    updateSettings({
                      ...settings,
                      display: { ...settings.display, resolution: v },
                    })
                  }
                  options={[
                    { label: 'Auto', value: 'auto' },
                    { label: '720p', value: '720p' },
                    { label: '1080p', value: '1080p' },
                  ]}
                />
              </Setting>
              <Setting label="Display">
                <Select
                  value={display}
                  onChange={setDisplay}
                  options={[
                    { label: 'Main', value: '0' },
                    { label: 'Display 2', value: '1' },
                    { label: 'Display 3', value: '2' },
                  ]}
                />
              </Setting>
              <Setting label="Show FPS overlay">
                <input
                  type="checkbox"
                  checked={showFps}
                  onChange={(e) => setShowFps(e.target.checked)}
                  className="size-4 accent-primary"
                />
              </Setting>
              <Button className="w-full" onClick={() => void toggleStream()}>
                {streaming ? (
                  <>
                    <Square className="size-3.5" /> Stop stream
                  </>
                ) : (
                  <>
                    <Play className="size-3.5" /> Start stream
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Live stats */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="FPS" value={stats?.fps ?? '—'} icon={<Activity className="size-4" />} />
        <Stat
          label="Bitrate"
          value={stats ? `${stats.bitrateKbps} kbps` : '—'}
          icon={<Zap className="size-4" />}
        />
        <Stat
          label="Latency"
          value={stats ? `${stats.latencyMs} ms` : '—'}
          icon={<Activity className="size-4" />}
        />
        <Stat label="Resolution" value={stats?.resolution ?? '—'} icon={<Monitor className="size-4" />} />
      </div>
    </div>
  )
}

function Setting({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </div>
  )
}
