'use client'

import { cn } from '@/lib/utils'
import type { ConnectionState } from '@/lib/protocol'
import type { ReactNode } from 'react'

/* ---------- Card ---------- */
export function Card({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card text-card-foreground shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function CardHead({
  title,
  subtitle,
  icon,
  action,
}: {
  title: string
  subtitle?: string
  icon?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
      <div className="flex items-start gap-3">
        {icon ? (
          <span className="mt-0.5 grid size-9 place-items-center rounded-lg bg-primary/12 text-primary">
            {icon}
          </span>
        ) : null}
        <div>
          <h3 className="text-sm font-semibold text-pretty">{title}</h3>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-muted-foreground text-pretty">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {action}
    </div>
  )
}

/* ---------- Page header ---------- */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted-foreground text-pretty">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  )
}

/* ---------- Status dot ---------- */
const STATE_COLOR: Record<ConnectionState, string> = {
  connected: 'bg-success',
  connecting: 'bg-warning',
  reconnecting: 'bg-warning',
  disconnected: 'bg-muted-foreground',
  error: 'bg-destructive',
}

export function StatusDot({
  state,
  label,
  className,
}: {
  state: ConnectionState
  label?: string
  className?: string
}) {
  const animate = state === 'connecting' || state === 'reconnecting'
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="relative flex size-2.5">
        {animate ? (
          <span
            className={cn(
              'absolute inline-flex h-full w-full animate-ping rounded-full opacity-70',
              STATE_COLOR[state],
            )}
          />
        ) : null}
        <span className={cn('relative inline-flex size-2.5 rounded-full', STATE_COLOR[state])} />
      </span>
      {label ? <span className="text-xs font-medium capitalize">{label}</span> : null}
    </span>
  )
}

/* ---------- Stat tile ---------- */
export function Stat({
  label,
  value,
  hint,
  icon,
}: {
  label: string
  value: ReactNode
  hint?: string
  icon?: ReactNode
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      </div>
      <div className="mt-2 font-mono text-xl font-semibold tabular-nums">{value}</div>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </Card>
  )
}

/* ---------- Toggle switch ---------- */
export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-border transition-colors disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-secondary',
      )}
    >
      <span
        className={cn(
          'inline-block size-4 transform rounded-full bg-background shadow transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  )
}

/* ---------- Settings/labelled row ---------- */
export function Row({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {hint ? <p className="mt-0.5 text-xs text-muted-foreground text-pretty">{hint}</p> : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

/* ---------- Segmented control ---------- */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { label: string; value: T }[]
}) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-secondary/50 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-md px-3 py-1 text-xs font-medium transition-colors',
            value === o.value
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ---------- Native select ---------- */
export function Select<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T
  onChange: (v: T) => void
  options: { label: string; value: T }[]
  className?: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={cn(
        'h-8 rounded-lg border border-border bg-secondary/50 px-2 text-sm outline-none focus-visible:border-ring',
        className,
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

/* ---------- Panel (Card with optional titled header) ---------- */
export function Panel({
  title,
  action,
  icon,
  className,
  children,
}: {
  title?: string
  action?: ReactNode
  icon?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      {title ? (
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2">
            {icon ? <span className="text-primary">{icon}</span> : null}
            <h3 className="text-sm font-semibold">{title}</h3>
          </div>
          {action}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </Card>
  )
}

/* ---------- Field (label + control) ---------- */
export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted-foreground text-pretty">{hint}</span> : null}
    </label>
  )
}

/* ---------- StatPill (compact key/value row) ---------- */
export function StatPill({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: ReactNode
  tone?: 'default' | 'good' | 'muted'
}) {
  const toneClass =
    tone === 'good'
      ? 'text-success'
      : tone === 'muted'
        ? 'text-muted-foreground'
        : 'text-foreground'
  return (
    <div className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className={cn('font-mono text-xs font-semibold tabular-nums', toneClass)}>
        {value}
      </span>
    </div>
  )
}

/* ---------- Engine mode badge ---------- */
export function EngineBadge({ engine }: { engine: 'desktop' | 'browser' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        engine === 'desktop'
          ? 'border-success/30 bg-success/10 text-success'
          : 'border-warning/30 bg-warning/10 text-warning',
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {engine === 'desktop' ? 'Desktop engine' : 'Browser preview'}
    </span>
  )
}
