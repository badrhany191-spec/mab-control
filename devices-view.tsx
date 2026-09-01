'use client'

import { useState } from 'react'
import {
  Smartphone,
  Trash2,
  ShieldCheck,
  Wifi,
  Pencil,
  Check,
  Link2,
  Link2Off,
} from 'lucide-react'
import { PageHeader, Panel, StatusDot, StatPill, Stat } from '@/components/ui-kit'
import { Button } from '@/components/ui/button'
import { useMab } from '@/lib/mab-store'

function timeAgo(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000)
  if (sec < 60) return `${sec}s ago`
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`
  if (sec < 86_400) return `${Math.floor(sec / 3600)}h ago`
  return `${Math.floor(sec / 86_400)}d ago`
}

export function DevicesView() {
  const { devices, phone, connection, connectDevice, disconnect, removeDevice, renameDevice } =
    useMab()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  const trustedCount = devices.filter((d) => d.trusted).length

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Devices"
        subtitle="Manage paired and connected devices. Only one device controls the PC at a time."
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Stat label="Paired devices" value={devices.length} icon={<Smartphone className="size-4" />} />
        <Stat label="Connected now" value={phone ? 1 : 0} icon={<Wifi className="size-4" />} />
        <Stat label="Trusted" value={trustedCount} icon={<ShieldCheck className="size-4" />} />
      </div>

      <Panel title="Paired devices">
        {devices.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Smartphone className="size-9 text-muted-foreground opacity-40" />
            <p className="text-sm text-muted-foreground text-pretty">
              No devices paired yet. Scan the QR code from the Home screen with the MAB Control phone
              app to pair.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {devices.map((d) => {
              const isConnected = phone?.id === d.id && connection === 'connected'
              const editing = editingId === d.id
              return (
                <li
                  key={d.id}
                  className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-secondary/20 p-4"
                >
                  <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
                    <Smartphone className="size-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    {editing ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          autoFocus
                          className="h-8 flex-1 rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus-visible:border-ring"
                        />
                        <Button
                          size="icon-sm"
                          onClick={() => {
                            renameDevice(d.id, draft.trim() || d.name)
                            setEditingId(null)
                          }}
                          aria-label="Save name"
                        >
                          <Check className="size-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{d.name}</p>
                        {d.trusted ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-medium text-primary">
                            <ShieldCheck className="size-3" /> Trusted
                          </span>
                        ) : null}
                      </div>
                    )}
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 font-mono">
                        <Wifi className="size-3" />
                        {d.ip}
                      </span>
                      <span>{d.os}</span>
                      <span>{d.connType}</span>
                      <span>Last seen {timeAgo(d.lastSeen)}</span>
                    </div>
                  </div>

                  <StatusDot
                    state={isConnected ? 'connected' : 'disconnected'}
                    label={isConnected ? 'Connected' : 'Offline'}
                  />

                  <div className="flex items-center gap-1">
                    {isConnected ? (
                      <Button variant="outline" size="sm" onClick={disconnect}>
                        <Link2Off className="size-3.5" /> Disconnect
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => connectDevice(d.id)}>
                        <Link2 className="size-3.5" /> Connect
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Rename ${d.name}`}
                      onClick={() => {
                        setDraft(d.name)
                        setEditingId(d.id)
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${d.name}`}
                      onClick={() => removeDevice(d.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>

      {devices.length === 0 ? (
        <div className="mt-4">
          <StatPill label="Tip" value="Pair from Home → QR code" tone="muted" />
        </div>
      ) : null}
    </div>
  )
}
