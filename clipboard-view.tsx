'use client'

import { useState } from 'react'
import {
  ClipboardList,
  Send,
  Copy,
  Trash2,
  ArrowUpFromLine,
  ArrowDownToLine,
} from 'lucide-react'
import { PageHeader, Panel, Toggle, StatPill, EngineBadge } from '@/components/ui-kit'
import { Button } from '@/components/ui/button'
import { useMab } from '@/lib/mab-store'
import { sendControl } from '@/lib/native-bridge'
import { MSG } from '@/lib/protocol'

interface ClipEntry {
  id: string
  text: string
  from: 'pc' | 'phone'
  at: number
}

export function ClipboardView() {
  const { engine, settings, updateSettings, addActivity } = useMab()
  const autoSync = settings.clipboardSync
  const [draft, setDraft] = useState('')
  const [history, setHistory] = useState<ClipEntry[]>([])

  async function sendToPhone() {
    const text = draft.trim()
    if (!text) return
    const delivered = await sendControl(MSG.CLIPBOARD_SET, { text })
    const entry: ClipEntry = { id: `${Date.now()}`, text, from: 'pc', at: Date.now() }
    setHistory((prev) => [entry, ...prev].slice(0, 20))
    addActivity(
      delivered ? 'info' : 'error',
      delivered ? 'Clipboard pushed to phone' : 'Clipboard sync needs the desktop app to deliver',
    )
    setDraft('')
  }

  async function pasteFromPc() {
    try {
      const t = await navigator.clipboard.readText()
      if (t) setDraft(t)
    } catch {
      addActivity('error', 'Clipboard read blocked by the browser')
    }
  }

  async function copyEntry(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      addActivity('info', 'Copied to PC clipboard')
    } catch {
      /* clipboard may be blocked in preview */
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Clipboard"
        subtitle="Sync copied text between your PC and phone."
        actions={<EngineBadge engine={engine} />}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-5">
          <Panel title="Send text">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type or paste text to sync across devices…"
              rows={4}
              className="w-full resize-none rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => void sendToPhone()} disabled={!draft.trim()}>
                <Send className="size-4" /> Send to phone
              </Button>
              <Button variant="outline" onClick={() => void pasteFromPc()}>
                <Copy className="size-4" /> Paste from PC
              </Button>
            </div>
          </Panel>

          <Panel
            title={`History (${history.length})`}
            action={
              history.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setHistory([])}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" /> Clear
                </button>
              ) : undefined
            }
          >
            {history.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Nothing synced yet</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {history.map((entry) => (
                  <li key={entry.id} className="rounded-lg border border-border p-3">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        {entry.from === 'pc' ? (
                          <ArrowUpFromLine className="size-3" />
                        ) : (
                          <ArrowDownToLine className="size-3" />
                        )}
                        {entry.from === 'pc' ? 'From PC' : 'From phone'}
                      </span>
                      <button
                        type="button"
                        onClick={() => void copyEntry(entry.text)}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Copy"
                      >
                        <Copy className="size-3.5" />
                      </button>
                    </div>
                    <p className="break-words text-sm">{entry.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="flex flex-col gap-5">
          <Panel title="Options">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">Auto-sync clipboard</span>
              <Toggle
                checked={autoSync}
                onChange={(v) => updateSettings({ ...settings, clipboardSync: v })}
                label="Auto-sync clipboard"
              />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground text-pretty">
              When enabled, text copied on either device is pushed to the other automatically over
              the encrypted channel. Disable it any time from here or in Settings.
            </p>
          </Panel>
          <Panel title="Session">
            <div className="flex flex-col gap-2">
              <StatPill label="Entries" value={history.length} />
              <StatPill
                label="Auto-sync"
                value={autoSync ? 'On' : 'Off'}
                tone={autoSync ? 'good' : 'muted'}
              />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
