'use client'

import { useState } from 'react'
import { Music, Volume2, VolumeX, Play, Square } from 'lucide-react'
import { PageHeader, Panel, Field, Select, StatPill, EngineBadge } from '@/components/ui-kit'
import { Button } from '@/components/ui/button'
import { useMab } from '@/lib/mab-store'
import { sendControl } from '@/lib/native-bridge'
import { MSG } from '@/lib/protocol'

type Source = 'system' | 'mic' | 'app'

export function AudioView() {
  const { engine, settings, updateSettings, addActivity } = useMab()

  const [muted, setMuted] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [source, setSource] = useState<Source>('system')

  const volume = settings.audio.volume
  const quality = settings.audio.quality
  const effective = muted ? 0 : volume
  const circumference = 2 * Math.PI * 88

  const setVolume = (v: number) =>
    updateSettings({ ...settings, audio: { ...settings.audio, volume: v } })

  async function toggle() {
    const next = !streaming
    if (next) {
      const delivered = await sendControl(MSG.AUDIO_START, { source, quality, volume })
      setStreaming(true)
      addActivity(
        delivered ? 'info' : 'error',
        delivered
          ? `Audio streaming started (${quality})`
          : 'Audio capture requires the desktop app (loopback / WASAPI). Started in preview mode.',
      )
    } else {
      await sendControl(MSG.AUDIO_STOP, {})
      setStreaming(false)
      addActivity('info', 'Audio streaming stopped')
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Audio"
        subtitle="Stream this PC's audio to the paired phone in real time."
        actions={<EngineBadge engine={engine} />}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Panel>
          <div className="flex flex-col items-center justify-center gap-6 py-6">
            <div className="relative flex size-56 items-center justify-center">
              <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 192 192">
                <circle cx="96" cy="96" r="88" fill="none" stroke="var(--border)" strokeWidth="6" />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (effective / 100) * circumference}
                  className="transition-all duration-300"
                />
              </svg>
              <div
                className={`flex size-36 flex-col items-center justify-center rounded-full bg-secondary text-center ${
                  streaming ? 'ring-2 ring-primary/40' : ''
                }`}
              >
                {streaming ? (
                  <div className="flex items-end gap-1" aria-hidden>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 rounded-full bg-primary"
                        style={{
                          height: `${12 + ((i % 3) + 1) * 8}px`,
                          animation: `mab-eq 900ms ease-in-out ${i * 120}ms infinite alternate`,
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <Music className="size-10 text-muted-foreground" />
                )}
                <span className="mt-2 font-mono text-2xl font-semibold tabular-nums">
                  {effective}%
                </span>
              </div>
            </div>

            <div className="flex w-full max-w-sm items-center gap-3">
              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value))
                  setMuted(false)
                }}
                className="mab-range flex-1"
                aria-label="Volume"
              />
            </div>

            <Button
              onClick={() => void toggle()}
              variant={streaming ? 'destructive' : 'default'}
              size="lg"
            >
              {streaming ? <Square className="size-4" /> : <Play className="size-4" />}
              {streaming ? 'Stop streaming' : 'Start streaming'}
            </Button>
          </div>
        </Panel>

        <div className="flex flex-col gap-5">
          <Panel title="Source">
            <div className="flex flex-col gap-4">
              <Field label="Audio source">
                <Select
                  value={source}
                  onChange={setSource}
                  options={[
                    { label: 'System sound', value: 'system' },
                    { label: 'Microphone', value: 'mic' },
                    { label: 'Application', value: 'app' },
                  ]}
                />
              </Field>
              <Field label="Audio quality">
                <Select
                  value={quality}
                  onChange={(v) => updateSettings({ ...settings, audio: { ...settings.audio, quality: v } })}
                  options={[
                    { label: 'Low — 96 kbps', value: 'low' },
                    { label: 'Medium — 160 kbps', value: 'medium' },
                    { label: 'High — 256 kbps', value: 'high' },
                  ]}
                />
              </Field>
            </div>
          </Panel>

          <Panel title="Stream">
            <div className="flex flex-col gap-2">
              <StatPill
                label="Status"
                value={streaming ? 'Streaming' : 'Idle'}
                tone={streaming ? 'good' : 'muted'}
              />
              <StatPill label="Codec" value="Opus" />
              <StatPill label="Latency" value={streaming ? '~40 ms' : '—'} />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
