'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  Wifi,
  RefreshCw,
  Check,
  Pencil,
  MousePointer2,
  MonitorSmartphone,
  Camera,
  Gamepad2,
  Volume2,
  FolderSync,
  Clock,
  Upload,
  Download,
  Smartphone,
  AlertCircle,
  Link2,
  Link2Off,
  FileUp,
} from 'lucide-react'
import { Card, CardHead, PageHeader, Stat, StatusDot, EngineBadge } from '@/components/ui-kit'
import { Button } from '@/components/ui/button'
import { useMab, type ActivityKind } from '@/lib/mab-store'
import type { ViewId } from '@/components/nav'
import { useSessionDuration } from '@/lib/use-session-duration'
import { cn } from '@/lib/utils'

const QUICK_ACTIONS: { id: ViewId; label: string; desc: string; icon: typeof Camera }[] = [
  { id: 'remote-control', label: 'Remote Control', desc: 'Mouse & keyboard', icon: MousePointer2 },
  { id: 'remote-desktop', label: 'Remote Desktop', desc: 'Live screen', icon: MonitorSmartphone },
  { id: 'remote-camera', label: 'Remote Camera', desc: 'Phone as webcam', icon: Camera },
  { id: 'games', label: 'Games', desc: 'Virtual gamepad', icon: Gamepad2 },
  { id: 'audio', label: 'Audio', desc: 'Stream PC sound', icon: Volume2 },
  { id: 'files', label: 'File Transfer', desc: 'Send & receive', icon: FolderSync },
]

const ACTIVITY_ICON: Record<ActivityKind, typeof Link2> = {
  connect: Link2,
  disconnect: Link2Off,
  file: FileUp,
  control: MousePointer2,
  error: AlertCircle,
  info: Check,
}

function formatBytesPerSec(v: number): string {
  if (!v) return '0 KB/s'
  if (v < 1024 * 1024) return `${(v / 1024).toFixed(0)} KB/s`
  return `${(v / (1024 * 1024)).toFixed(1)} MB/s`
}

export function HomeView({ onNavigate }: { onNavigate: (id: ViewId) => void }) {
  const {
    engine,
    deviceName,
    setDeviceName,
    server,
    connection,
    phone,
    pairing,
    pairingUri,
    regeneratePairing,
    devices,
    stats,
    activity,
    startServer,
  } = useMab()

  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(deviceName)
  const session = useSessionDuration(stats.sessionStart)

  const ttlLeft = Math.max(0, Math.round((pairing.expiresAt - Date.now()) / 1000))

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={`Welcome to MAB Control`}
        subtitle="The premium way to control your PC from your phone over Wi-Fi."
        actions={<EngineBadge engine={engine} />}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Connection card */}
        <Card className="lg:col-span-2">
          <CardHead
            title="Connection"
            subtitle="Scan the QR code from the MAB Control phone app to pair."
            icon={<Wifi className="size-4.5" />}
            action={<StatusDot state={connection} label={connection} />}
          />
          <div className="grid gap-6 p-5 md:grid-cols-[1fr_auto]">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Connection">
                  <span className="inline-flex items-center gap-1.5">
                    <Wifi className="size-3.5 text-primary" /> Wi-Fi (LAN)
                  </span>
                </Field>
                <Field label="Status">
                  <span className="capitalize">{server.running ? 'Listening' : 'Idle'}</span>
                </Field>
                <Field label="Local IP" mono>
                  {server.ip ?? '—'}
                </Field>
                <Field label="Port" mono>
                  {server.port ?? '—'}
                </Field>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">Device name</p>
                {editing ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      className="h-8 flex-1 rounded-lg border border-border bg-secondary/50 px-2.5 text-sm outline-none focus-visible:border-ring"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        setDeviceName(draftName.trim() || 'MAB PC')
                        setEditing(false)
                      }}
                    >
                      <Check className="size-3.5" /> Save
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-secondary/60 px-2.5 py-1.5 text-sm font-medium">
                      {deviceName}
                    </span>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => {
                        setDraftName(deviceName)
                        setEditing(true)
                      }}
                      aria-label="Rename device"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button onClick={() => regeneratePairing()} variant="outline" size="sm">
                  <RefreshCw className="size-3.5" /> New token
                </Button>
                {!server.running ? (
                  <Button onClick={() => void startServer()} size="sm">
                    <Wifi className="size-3.5" /> Start server
                  </Button>
                ) : null}
                <span className="text-xs text-muted-foreground">
                  Token expires in {ttlLeft}s
                </span>
              </div>
            </div>

            {/* QR */}
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-xl border border-border bg-white p-3">
                <QRCodeSVG value={pairingUri} size={168} level="M" marginSize={0} />
              </div>
              <p className="max-w-[180px] break-all text-center font-mono text-[10px] leading-relaxed text-muted-foreground">
                {pairingUri}
              </p>
            </div>
          </div>
        </Card>

        {/* Statistics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <Stat
            label="Connected devices"
            value={phone ? 1 : 0}
            hint={`${devices.length} paired`}
            icon={<Smartphone className="size-4" />}
          />
          <Stat
            label="Session"
            value={session}
            hint={connection === 'connected' ? 'Active' : 'Idle'}
            icon={<Clock className="size-4" />}
          />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-2">
            <Stat
              label="Upload"
              value={formatBytesPerSec(stats.uploadSpeed)}
              icon={<Upload className="size-4" />}
            />
            <Stat
              label="Download"
              value={formatBytesPerSec(stats.downloadSpeed)}
              icon={<Download className="size-4" />}
            />
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <h2 className="mt-8 mb-3 text-sm font-semibold text-muted-foreground">Quick actions</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_ACTIONS.map((a) => {
          const Icon = a.icon
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onNavigate(a.id)}
              className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-accent/40"
            >
              <span className="grid size-11 place-items-center rounded-lg bg-primary/12 text-primary transition-transform group-hover:scale-105">
                <Icon className="size-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold">{a.label}</span>
                <span className="block text-xs text-muted-foreground">{a.desc}</span>
              </span>
            </button>
          )
        })}
      </div>

      {/* Recent activity */}
      <h2 className="mt-8 mb-3 text-sm font-semibold text-muted-foreground">Recent activity</h2>
      <Card>
        {activity.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            No activity yet. Pair a device to get started.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {activity.slice(0, 8).map((a) => {
              const Icon = ACTIVITY_ICON[a.kind]
              return (
                <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                  <span
                    className={cn(
                      'grid size-8 place-items-center rounded-lg',
                      a.kind === 'error'
                        ? 'bg-destructive/15 text-destructive'
                        : 'bg-secondary text-muted-foreground',
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="flex-1 text-sm">{a.message}</span>
                  <time className="font-mono text-xs text-muted-foreground">
                    {new Date(a.ts).toLocaleTimeString()}
                  </time>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}

function Field({
  label,
  children,
  mono,
}: {
  label: string
  children: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className={cn('mt-0.5 text-sm font-medium', mono && 'font-mono')}>{children}</p>
    </div>
  )
}
