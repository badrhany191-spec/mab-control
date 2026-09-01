'use client'

import { useCallback, useRef, useState } from 'react'
import {
  MousePointer2,
  Keyboard,
  Volume2,
  VolumeX,
  Volume1,
  Play,
  SkipForward,
  SkipBack,
  Presentation,
  ChevronLeft,
  ChevronRight,
  Lock,
  Moon,
  RotateCcw,
  Power,
  Hand,
} from 'lucide-react'
import { Card, CardHead, PageHeader, EngineBadge } from '@/components/ui-kit'
import { Button } from '@/components/ui/button'
import { useMab } from '@/lib/mab-store'
import { sendControl } from '@/lib/native-bridge'
import { MSG } from '@/lib/protocol'
import { cn } from '@/lib/utils'

export function RemoteControlView() {
  const { engine, addActivity, settings } = useMab()
  const padRef = useRef<HTMLDivElement>(null)
  const last = useRef<{ x: number; y: number } | null>(null)
  const [confirm, setConfirm] = useState<null | {
    label: string
    type: string
  }>(null)

  const dispatch = useCallback(
    async (type: string, payload?: Record<string, unknown>, label?: string) => {
      const delivered = await sendControl(type, payload)
      if (label) {
        addActivity(
          delivered ? 'control' : 'error',
          delivered
            ? label
            : `${label} — not delivered (launch the desktop app to inject input)`,
        )
      }
    },
    [addActivity],
  )

  // Touchpad: send relative movement deltas.
  const onPointerDown = (e: React.PointerEvent) => {
    padRef.current?.setPointerCapture(e.pointerId)
    last.current = { x: e.clientX, y: e.clientY }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!last.current) return
    const sens = settings.gaming.sensitivity / 50 || 1
    const dx = (e.clientX - last.current.x) * sens
    const dy = (e.clientY - last.current.y) * sens
    last.current = { x: e.clientX, y: e.clientY }
    if (dx || dy) void sendControl(MSG.MOUSE_MOVE, { dx, dy })
  }
  const onPointerUp = () => {
    last.current = null
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Remote Control"
        subtitle="Use the surface below as a live mouse, keyboard and media remote for this PC."
        actions={<EngineBadge engine={engine} />}
      />

      {engine === 'browser' ? (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm">
          <Hand className="mt-0.5 size-4 shrink-0 text-warning" />
          <p className="text-pretty">
            Controls are fully wired to the protocol. Real OS input injection runs in the MAB
            Control desktop app (Electron + nut-js). In this browser preview, each command is logged
            to Recent Activity instead of moving the cursor.
          </p>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* Touchpad + mouse buttons */}
        <Card>
          <CardHead title="Touchpad" subtitle="Drag to move · use the buttons below to click" icon={<MousePointer2 className="size-4.5" />} />
          <div className="p-5">
            <div
              ref={padRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className="grid h-56 touch-none place-items-center rounded-xl border border-dashed border-border bg-secondary/30 text-sm text-muted-foreground select-none"
            >
              <span className="pointer-events-none flex flex-col items-center gap-1">
                <Hand className="size-6" />
                Drag here to move the cursor
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={() => dispatch(MSG.MOUSE_CLICK, { button: 'left' }, 'Left click')}
              >
                Left click
              </Button>
              <Button
                variant="outline"
                onClick={() => dispatch(MSG.MOUSE_CLICK, { button: 'middle' }, 'Middle click')}
              >
                Middle
              </Button>
              <Button
                variant="outline"
                onClick={() => dispatch(MSG.MOUSE_CLICK, { button: 'right' }, 'Right click')}
              >
                Right click
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  dispatch(MSG.MOUSE_CLICK, { button: 'left', double: true }, 'Double click')
                }
              >
                Double click
              </Button>
              <Button
                variant="outline"
                onClick={() => dispatch(MSG.MOUSE_SCROLL, { dy: -120 }, 'Scroll up')}
              >
                Scroll up
              </Button>
              <Button
                variant="outline"
                onClick={() => dispatch(MSG.MOUSE_SCROLL, { dy: 120 }, 'Scroll down')}
              >
                Scroll down
              </Button>
            </div>
          </div>
        </Card>

        {/* Keyboard */}
        <Card>
          <CardHead title="Keyboard" subtitle="Type text or send special keys" icon={<Keyboard className="size-4.5" />} />
          <div className="space-y-4 p-5">
            <KeyboardInput onType={(text) => dispatch(MSG.KEY_TYPE, { text }, `Typed "${text}"`)} />
            <div className="grid grid-cols-4 gap-2">
              {(['Esc', 'Tab', 'Enter', 'Backspace'] as const).map((k) => (
                <Button
                  key={k}
                  variant="secondary"
                  size="sm"
                  onClick={() => dispatch(MSG.KEY_DOWN, { key: k.toLowerCase() }, `Key: ${k}`)}
                >
                  {k}
                </Button>
              ))}
              {(['Ctrl', 'Alt', 'Shift', 'Win'] as const).map((k) => (
                <Button
                  key={k}
                  variant="secondary"
                  size="sm"
                  onClick={() => dispatch(MSG.KEY_DOWN, { key: k.toLowerCase() }, `Modifier: ${k}`)}
                >
                  {k}
                </Button>
              ))}
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                aria-label="Arrow left"
                onClick={() => dispatch(MSG.KEY_DOWN, { key: 'left' }, 'Arrow left')}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <div className="flex flex-col gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  aria-label="Arrow up"
                  onClick={() => dispatch(MSG.KEY_DOWN, { key: 'up' }, 'Arrow up')}
                >
                  <ChevronRight className="size-4 -rotate-90" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  aria-label="Arrow down"
                  onClick={() => dispatch(MSG.KEY_DOWN, { key: 'down' }, 'Arrow down')}
                >
                  <ChevronRight className="size-4 rotate-90" />
                </Button>
              </div>
              <Button
                variant="secondary"
                size="icon"
                aria-label="Arrow right"
                onClick={() => dispatch(MSG.KEY_DOWN, { key: 'right' }, 'Arrow right')}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Media */}
        <Card>
          <CardHead title="Media & Volume" icon={<Volume2 className="size-4.5" />} />
          <div className="grid grid-cols-3 gap-2 p-5">
            <MediaBtn icon={Volume1} label="Vol -" onClick={() => dispatch(MSG.VOLUME_DOWN, {}, 'Volume down')} />
            <MediaBtn icon={VolumeX} label="Mute" onClick={() => dispatch(MSG.MUTE, {}, 'Mute')} />
            <MediaBtn icon={Volume2} label="Vol +" onClick={() => dispatch(MSG.VOLUME_UP, {}, 'Volume up')} />
            <MediaBtn icon={SkipBack} label="Prev" onClick={() => dispatch(MSG.MEDIA_PREV, {}, 'Previous track')} />
            <MediaBtn icon={Play} label="Play" onClick={() => dispatch(MSG.MEDIA_PLAY_PAUSE, {}, 'Play/Pause')} />
            <MediaBtn icon={SkipForward} label="Next" onClick={() => dispatch(MSG.MEDIA_NEXT, {}, 'Next track')} />
          </div>
        </Card>

        {/* Presentation + Power */}
        <Card>
          <CardHead title="Presentation & Power" icon={<Presentation className="size-4.5" />} />
          <div className="space-y-4 p-5">
            <div className="grid grid-cols-3 gap-2">
              <MediaBtn icon={ChevronLeft} label="Prev" onClick={() => dispatch(MSG.SLIDE_PREV, {}, 'Previous slide')} />
              <MediaBtn icon={Presentation} label="Present" onClick={() => dispatch(MSG.PRESENT_START, {}, 'Start presentation')} />
              <MediaBtn icon={ChevronRight} label="Next" onClick={() => dispatch(MSG.SLIDE_NEXT, {}, 'Next slide')} />
            </div>
            <div className="grid grid-cols-4 gap-2">
              <PowerBtn icon={Lock} label="Lock" onClick={() => setConfirm({ label: 'Lock PC', type: MSG.POWER_LOCK })} />
              <PowerBtn icon={Moon} label="Sleep" onClick={() => setConfirm({ label: 'Sleep', type: MSG.POWER_SLEEP })} />
              <PowerBtn icon={RotateCcw} label="Restart" onClick={() => setConfirm({ label: 'Restart', type: MSG.POWER_RESTART })} />
              <PowerBtn icon={Power} label="Shutdown" danger onClick={() => setConfirm({ label: 'Shutdown', type: MSG.POWER_SHUTDOWN })} />
            </div>
          </div>
        </Card>
      </div>

      {confirm ? (
        <ConfirmDialog
          label={confirm.label}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            void dispatch(confirm.type, {}, `Power command: ${confirm.label}`)
            setConfirm(null)
          }}
        />
      ) : null}
    </div>
  )
}

function KeyboardInput({ onType }: { onType: (text: string) => void }) {
  const [text, setText] = useState('')
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (text.trim()) {
          onType(text)
          setText('')
        }
      }}
      className="flex gap-2"
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type text to send to the PC…"
        className="h-9 flex-1 rounded-lg border border-border bg-secondary/50 px-3 text-sm outline-none focus-visible:border-ring"
      />
      <Button type="submit" size="lg">
        Send
      </Button>
    </form>
  )
}

function MediaBtn({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Play
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-secondary/40 py-3 text-xs font-medium transition-colors hover:bg-accent/50"
    >
      <Icon className="size-5" />
      {label}
    </button>
  )
}

function PowerBtn({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof Play
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1.5 rounded-lg border py-3 text-xs font-medium transition-colors',
        danger
          ? 'border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20'
          : 'border-border bg-secondary/40 hover:bg-accent/50',
      )}
    >
      <Icon className="size-5" />
      {label}
    </button>
  )
}

function ConfirmDialog({
  label,
  onConfirm,
  onCancel,
}: {
  label: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <Card className="w-full max-w-sm p-5">
        <h3 className="text-base font-semibold">Confirm: {label}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground text-pretty">
          This power command affects the PC. Are you sure you want to continue?
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {label}
          </Button>
        </div>
      </Card>
    </div>
  )
}
