'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Gamepad2, Play, Zap, Activity } from 'lucide-react'
import { PageHeader, Panel, Field, Select, Toggle, StatPill, EngineBadge } from '@/components/ui-kit'
import { Button } from '@/components/ui/button'
import { useMab } from '@/lib/mab-store'
import { sendControl } from '@/lib/native-bridge'
import { MSG } from '@/lib/protocol'

interface GameTile {
  id: string
  title: string
  genre: string
  cover: string
}

const GAMES: GameTile[] = [
  { id: 'racing', title: 'Apex Velocity', genre: 'Racing', cover: '/games/racing.png' },
  { id: 'shooter', title: 'Zero Protocol', genre: 'Shooter', cover: '/games/shooter.png' },
  { id: 'openworld', title: 'Neon Dominion', genre: 'Open World', cover: '/games/openworld.png' },
  { id: 'sandbox', title: 'Blockforge', genre: 'Sandbox', cover: '/games/sandbox.png' },
]

export function GamesView() {
  const { engine, settings, addActivity } = useMab()

  const [quality, setQuality] = useState<'low' | 'medium' | 'high' | 'ultra'>('high')
  const [gamepad, setGamepad] = useState(true)
  const [showFps, setShowFps] = useState(true)
  const [active, setActive] = useState<string | null>(null)

  async function launch(game: GameTile) {
    setActive(game.id)
    if (gamepad) await sendControl(MSG.GAMEPAD_CONNECT, { profile: settings.gaming.profile })
    addActivity('info', `Launched "${game.title}" in game mode`)
  }

  async function end() {
    setActive(null)
    await sendControl(MSG.GAMEPAD_DISCONNECT, {})
    addActivity('info', 'Exited game mode')
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Games"
        subtitle="Turn your phone into a controller and play PC games."
        actions={<EngineBadge engine={engine} />}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {GAMES.map((game) => (
          <button
            key={game.id}
            type="button"
            onClick={() => void launch(game)}
            className={`group relative aspect-[3/4] overflow-hidden rounded-xl border text-left transition-all ${
              active === game.id
                ? 'border-primary ring-1 ring-primary'
                : 'border-border hover:border-primary/60'
            }`}
          >
            <Image
              src={game.cover || '/placeholder.svg'}
              alt={`${game.title} cover art`}
              fill
              sizes="(max-width:768px) 50vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                {game.genre}
              </p>
              <p className="text-sm font-semibold text-balance text-white">{game.title}</p>
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
              <span className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg">
                <Play className="size-5 translate-x-0.5" />
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Panel title="Game mode">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Streaming quality">
              <Select
                value={quality}
                onChange={setQuality}
                options={[
                  { label: 'Low — lowest latency', value: 'low' },
                  { label: 'Medium', value: 'medium' },
                  { label: 'High', value: 'high' },
                  { label: 'Ultra — best visuals', value: 'ultra' },
                ]}
              />
            </Field>
            <div className="flex flex-col justify-center gap-3 pt-1">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">Virtual gamepad (Xbox 360)</span>
                <Toggle checked={gamepad} onChange={setGamepad} label="Enable virtual gamepad" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">Show FPS overlay</span>
                <Toggle checked={showFps} onChange={setShowFps} label="Show FPS overlay" />
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground text-pretty">
            The virtual gamepad requires the ViGEm Bus driver on Windows. Game mode locks the
            streaming pipeline to the lowest-latency profile and maps phone touch zones to gamepad
            axes and buttons using your saved profile ({settings.gaming.profile}).
          </p>
        </Panel>

        <Panel title="Live">
          <div className="flex flex-col gap-2">
            <StatPill
              label="State"
              value={active ? 'In game' : 'Ready'}
              tone={active ? 'good' : 'muted'}
            />
            <StatPill label="Gamepad" value={gamepad ? 'Connected' : 'Off'} />
            <StatPill label="FPS overlay" value={showFps ? 'On' : 'Off'} />
            <StatPill label="Quality" value={quality} />
          </div>
          <div className="mt-4 flex gap-2">
            <Button className="flex-1" onClick={() => void launch(GAMES[0])}>
              <Zap className="size-4" /> Quick play
            </Button>
            {active ? (
              <Button variant="outline" onClick={() => void end()}>
                <Activity className="size-4" /> End
              </Button>
            ) : null}
          </div>
        </Panel>
      </div>
    </div>
  )
}
