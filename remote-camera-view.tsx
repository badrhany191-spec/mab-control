'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, Video, Circle, RefreshCw, SwitchCamera } from 'lucide-react'
import { PageHeader, Panel, Field, Select, Toggle, StatPill, EngineBadge } from '@/components/ui-kit'
import { Button } from '@/components/ui/button'
import { useMab } from '@/lib/mab-store'
import { getEngineMode } from '@/lib/native-bridge'

const RESOLUTIONS = [
  { label: '480p', value: '854x480' },
  { label: '720p', value: '1280x720' },
  { label: '1080p', value: '1920x1080' },
]

export function RemoteCameraView() {
  const { engine, addActivity } = useMab()
  const desktop = getEngineMode() === 'desktop'

  const [resolution, setResolution] = useState('1280x720')
  const [facing, setFacing] = useState<'user' | 'environment'>('user')
  const [mirror, setMirror] = useState(true)
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  function stop() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setStreaming(false)
  }

  async function start() {
    setError(null)
    try {
      const [w, h] = resolution.split('x').map(Number)
      const media = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: w }, height: { ideal: h }, facingMode: facing },
        audio: false,
      })
      streamRef.current = media
      if (videoRef.current) {
        videoRef.current.srcObject = media
        await videoRef.current.play().catch(() => {})
      }
      setStreaming(true)
      addActivity('info', `Camera stream started at ${resolution}`)
    } catch {
      setError(
        'Unable to access a camera. In the desktop app the phone acts as the webcam source; this preview needs local camera permission.',
      )
      setStreaming(false)
    }
  }

  useEffect(() => () => stop(), [])

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Remote Camera"
        subtitle="Use your phone as a high-quality wireless webcam."
        actions={<EngineBadge engine={engine} />}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Panel>
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              className="size-full object-cover"
              style={{ transform: mirror ? 'scaleX(-1)' : 'none' }}
            />
            {!streaming ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <Video className="size-10 opacity-40" />
                <p className="text-sm">Preview is idle</p>
              </div>
            ) : (
              <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
                <Circle className="size-2.5 animate-pulse fill-destructive text-destructive" />
                LIVE
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {!streaming ? (
              <Button onClick={() => void start()}>
                <Video className="size-4" /> Start camera
              </Button>
            ) : (
              <Button onClick={stop} variant="destructive">
                <Circle className="size-4" /> Stop
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}
            >
              <SwitchCamera className="size-4" /> Flip
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                stop()
                setTimeout(() => void start(), 100)
              }}
              disabled={!streaming}
            >
              <RefreshCw className="size-4" /> Restart
            </Button>
          </div>

          {error ? <p className="mt-3 text-sm text-destructive text-pretty">{error}</p> : null}
        </Panel>

        <div className="flex flex-col gap-5">
          <Panel title="Configuration">
            <div className="flex flex-col gap-4">
              <Field label="Resolution">
                <Select value={resolution} onChange={setResolution} options={RESOLUTIONS} />
              </Field>
              <Field label="Camera">
                <Select
                  value={facing}
                  onChange={setFacing}
                  options={[
                    { label: 'Front camera', value: 'user' },
                    { label: 'Back camera', value: 'environment' },
                  ]}
                />
              </Field>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">Mirror preview</span>
                <Toggle checked={mirror} onChange={setMirror} label="Mirror preview" />
              </div>
            </div>
          </Panel>

          <Panel title="Stream">
            <div className="flex flex-col gap-2">
              <StatPill
                label="Status"
                value={streaming ? 'Streaming' : 'Idle'}
                tone={streaming ? 'good' : 'muted'}
              />
              <StatPill label="Resolution" value={resolution} />
              <StatPill label="Source" value={desktop ? 'Phone camera' : 'Local webcam'} />
              <StatPill label="Codec" value="VP8 / WebRTC" />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
