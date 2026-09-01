'use client'

import { cn } from '@/lib/utils'
import { NAV_ITEMS, type ViewId } from './nav'
import { StatusDot } from './ui-kit'
import { useMab } from '@/lib/mab-store'
import { PanelLeftClose, PanelLeft } from 'lucide-react'

export function Sidebar({
  active,
  onNavigate,
  collapsed,
  onToggleCollapse,
}: {
  active: ViewId
  onNavigate: (id: ViewId) => void
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  const { connection, server, phone, deviceName } = useMab()

  return (
    <aside
      className={cn(
        'flex h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 px-4">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
          <span className="font-mono text-sm font-bold">MC</span>
        </div>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">MAB Control</p>
            <p className="truncate text-xs text-muted-foreground">{deviceName}</p>
          </div>
        ) : null}
      </div>

      {/* Nav */}
      <nav className="mab-scroll flex-1 space-y-1 overflow-y-auto px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? 'page' : undefined}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground',
              )}
            >
              <Icon className="size-4.5 shrink-0" />
              {!collapsed ? <span className="truncate">{item.label}</span> : null}
            </button>
          )
        })}
      </nav>

      {/* Connection footer */}
      <div className="border-t border-sidebar-border p-3">
        {!collapsed ? (
          <div className="rounded-lg bg-sidebar-accent/40 p-3">
            <div className="flex items-center justify-between">
              <StatusDot state={connection} label={connection} />
              <button
                type="button"
                onClick={onToggleCollapse}
                aria-label="Collapse sidebar"
                className="text-muted-foreground hover:text-foreground"
              >
                <PanelLeftClose className="size-4" />
              </button>
            </div>
            <dl className="mt-2.5 space-y-1 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">IP</dt>
                <dd className="font-mono">{server.ip ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Port</dt>
                <dd className="font-mono">{server.port ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Device</dt>
                <dd className="truncate font-medium">{phone?.name ?? 'None'}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <StatusDot state={connection} />
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label="Expand sidebar"
              className="text-muted-foreground hover:text-foreground"
            >
              <PanelLeft className="size-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
