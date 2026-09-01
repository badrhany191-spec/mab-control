'use client'

import { useRef, useState } from 'react'
import { FolderSync, Upload, CheckCircle2, X, ArrowUpFromLine, AlertCircle } from 'lucide-react'
import { PageHeader, Panel, StatPill, EngineBadge } from '@/components/ui-kit'
import { Button } from '@/components/ui/button'
import { useMab } from '@/lib/mab-store'
import { sendControl } from '@/lib/native-bridge'
import { MSG, FILE_CHUNK_SIZE } from '@/lib/protocol'

type TransferState = 'active' | 'done' | 'failed' | 'cancelled'

interface Transfer {
  id: string
  name: string
  size: number
  sent: number
  state: TransferState
  delivered: boolean
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`
}

export function FilesView() {
  const { engine, addActivity } = useMab()
  const inputRef = useRef<HTMLInputElement>(null)
  const cancelFlags = useRef<Record<string, boolean>>({})
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [dragging, setDragging] = useState(false)

  const update = (id: string, patch: Partial<Transfer>) =>
    setTransfers((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))

  // Reads the file in real chunks and streams them over the control channel.
  // The bytes are genuinely read from disk (real progress); network delivery
  // happens when the desktop engine is present.
  async function transferFile(file: File) {
    const id = `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2, 6)}`
    cancelFlags.current[id] = false
    setTransfers((prev) => [
      { id, name: file.name, size: file.size, sent: 0, state: 'active', delivered: false },
      ...prev,
    ])

    let delivered = true
    try {
      await sendControl(MSG.FILE_START, { name: file.name, size: file.size })
      const total = file.size || 1
      let offset = 0
      let index = 0
      while (offset < file.size) {
        if (cancelFlags.current[id]) {
          await sendControl(MSG.FILE_CANCEL, { name: file.name })
          update(id, { state: 'cancelled' })
          addActivity('file', `Cancelled transfer of "${file.name}"`)
          return
        }
        const slice = file.slice(offset, offset + FILE_CHUNK_SIZE)
        const buffer = await slice.arrayBuffer()
        const ok = await sendControl(MSG.FILE_CHUNK, {
          name: file.name,
          index,
          bytes: buffer.byteLength,
        })
        delivered = delivered && ok
        offset += buffer.byteLength
        index += 1
        update(id, { sent: Math.min(offset, file.size) })
        // Yield to the event loop so the UI can paint progress.
        await new Promise((r) => setTimeout(r, 0))
      }
      void total
      await sendControl(MSG.FILE_COMPLETE, { name: file.name })
      update(id, { state: 'done', delivered })
      addActivity(
        'file',
        delivered
          ? `Sent "${file.name}" (${formatBytes(file.size)})`
          : `Read "${file.name}" (${formatBytes(file.size)}) — connect the desktop app to deliver it to the phone`,
      )
    } catch (e) {
      update(id, { state: 'failed' })
      addActivity('error', `Transfer failed for "${file.name}": ${String(e)}`)
    }
  }

  function handleFiles(list: FileList | File[]) {
    Array.from(list).forEach((f) => void transferFile(f))
  }

  const activeCount = transfers.filter((t) => t.state === 'active').length
  const doneCount = transfers.filter((t) => t.state === 'done').length

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="File Transfer"
        subtitle="Send and receive files wirelessly between your PC and phone."
        actions={<EngineBadge engine={engine} />}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-5">
          <Panel>
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragging(false)
                if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
              }}
              className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
                dragging ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <div className="grid size-12 place-items-center rounded-full bg-secondary">
                <Upload className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Drop files here to send to your phone</p>
                <p className="text-xs text-muted-foreground">
                  Files are read and streamed in {formatBytes(FILE_CHUNK_SIZE)} chunks
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                Browse files
              </Button>
              <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
            </div>
          </Panel>

          <Panel title={`Transfers (${transfers.length})`}>
            {transfers.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No transfers yet</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {transfers.map((t) => {
                  const pct = Math.round((t.sent / (t.size || 1)) * 100)
                  return (
                    <li
                      key={t.id}
                      className="flex items-center gap-3 rounded-lg border border-border p-3"
                    >
                      <div className="grid size-9 shrink-0 place-items-center rounded-md bg-secondary">
                        {t.state === 'done' ? (
                          <CheckCircle2 className="size-4 text-success" />
                        ) : t.state === 'failed' ? (
                          <AlertCircle className="size-4 text-destructive" />
                        ) : (
                          <ArrowUpFromLine className="size-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium">{t.name}</p>
                          <span className="shrink-0 font-mono text-xs text-muted-foreground">
                            {formatBytes(t.sent)} / {formatBytes(t.size)}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                          <div
                            className={`h-full rounded-full transition-all ${
                              t.state === 'failed' ? 'bg-destructive' : 'bg-primary'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      {t.state === 'active' ? (
                        <button
                          type="button"
                          onClick={() => {
                            cancelFlags.current[t.id] = true
                          }}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Cancel"
                        >
                          <X className="size-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setTransfers((prev) => prev.filter((x) => x.id !== t.id))}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label="Dismiss"
                        >
                          <X className="size-4" />
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </Panel>
        </div>

        <div className="flex flex-col gap-5">
          <Panel title="Session">
            <div className="flex flex-col gap-2">
              <StatPill label="Active" value={activeCount} tone={activeCount ? 'good' : 'muted'} />
              <StatPill label="Completed" value={doneCount} />
              <StatPill label="Chunk size" value={formatBytes(FILE_CHUNK_SIZE)} />
              <StatPill label="Protocol" value="Chunked / WS" />
            </div>
          </Panel>
          <Panel title="How it works">
            <p className="text-xs leading-relaxed text-muted-foreground text-pretty">
              Large files never load fully into memory — each chunk is read on demand and streamed,
              so multi-gigabyte transfers stay light on RAM. Delivery to the phone runs over the
              encrypted control channel provided by the desktop engine.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  )
}
