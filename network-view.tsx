'use client'

import { Network, Server, RefreshCw, Radio, Copy, Play, Square } from 'lucide-react'
import { PageHeader, Panel, Field, StatusDot, StatPill, EngineBadge } from '@/components/ui-kit'
import { Button } from '@/components/ui/button'
import { useMab } from '@/lib/mab-store'

export function NetworkView() {
  const { engine, server, pairing, settings, regeneratePairing, startServer, stopServer, addActivity } =
    useMab()

  const ip = server.ip ?? '—'
  const port = server.port ?? '—'
  const endpoint = server.ip && server.port ? `ws://${server.ip}:${server.port}` : '—'

  const copy = (text: string) => {
    if (text === '—') return
    navigator.clipboard?.writeText(text).catch(() => {})
    addActivity('info', 'Copied to clipboard')
  }

  async function restart() {
    await stopServer()
    await startServer()
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Network"
        subtitle="Server status, discovery and connection endpoints."
        actions={
          <div className="flex items-center gap-2">
            <EngineBadge engine={engine} />
            {server.running ? (
              <Button variant="outline" size="sm" onClick={() => void stopServer()}>
                <Square className="size-3.5" /> Stop
              </Button>
            ) : (
              <Button size="sm" onClick={() => void startServer()}>
                <Play className="size-3.5" /> Start server
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => void restart()} disabled={!server.running}>
              <RefreshCw className="size-3.5" /> Restart
            </Button>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Server" icon={<Server className="size-4" />}>
          <div className="mb-4 flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2.5">
            <span className="text-sm font-medium">Signaling server</span>
            <StatusDot
              state={server.running ? 'connected' : 'disconnected'}
              label={server.running ? 'Running' : 'Stopped'}
            />
          </div>
          <div className="flex flex-col gap-3">
            <Field label="Local IP address">
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-sm">
                  {ip}
                </code>
                <Button variant="ghost" size="icon" onClick={() => copy(ip)} aria-label="Copy IP">
                  <Copy className="size-4" />
                </Button>
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Port">
                <code className="block rounded-md border border-border bg-background px-3 py-2 font-mono text-sm">
                  {port}
                </code>
              </Field>
              <Field label="Protocol">
                <code className="block rounded-md border border-border bg-background px-3 py-2 font-mono text-sm">
                  WS / WebRTC
                </code>
              </Field>
            </div>
            <Field label="Endpoint">
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-md border border-border bg-background px-3 py-2 font-mono text-sm">
                  {endpoint}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copy(endpoint)}
                  aria-label="Copy endpoint"
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            </Field>
          </div>
        </Panel>

        <div className="flex flex-col gap-5">
          <Panel title="Discovery" icon={<Radio className="size-4" />}>
            <div className="mb-3 flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2.5">
              <span className="text-sm font-medium">mDNS broadcast</span>
              <StatusDot
                state={server.running && settings.connection.discovery ? 'connected' : 'disconnected'}
                label={server.running && settings.connection.discovery ? 'Advertising' : 'Off'}
              />
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground text-pretty">
              The phone app auto-discovers this PC on the local network via mDNS/Bonjour
              (<code className="font-mono">_mabcontrol._tcp</code>). No manual IP entry is required
              when both devices share the same Wi-Fi.
            </p>
          </Panel>

          <Panel title="Pairing token" icon={<RefreshCw className="size-4" />}>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-md border border-border bg-background px-3 py-2 font-mono text-sm">
                {pairing.token}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={regeneratePairing}
                aria-label="Regenerate token"
              >
                <RefreshCw className="size-4" />
              </Button>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <StatPill
                label="Encryption"
                value={settings.security.encryption ? 'AES-256-GCM' : 'Off'}
                tone={settings.security.encryption ? 'good' : 'muted'}
              />
              <StatPill label="Token lifetime" value={`${settings.security.tokenTtlMin} min`} />
              <StatPill label="Session" value="Per-connection key" />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
