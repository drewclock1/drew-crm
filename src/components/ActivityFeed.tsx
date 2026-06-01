'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Activity } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, Phone, ArrowRight, Bot, UserCheck } from 'lucide-react'

const TYPE_CONFIG: Record<string, { icon: React.ElementType; bg: string; color: string; label: string }> = {
  note:         { icon: MessageSquare, bg: '#EBF4FF',  color: '#2B7FD4', label: 'Note' },
  call:         { icon: Phone,         bg: '#f0fdf4',  color: '#16a34a', label: 'Call' },
  stage_change: { icon: ArrowRight,    bg: '#FBF5E6',  color: '#C9951A', label: 'Stage' },
  bot_trigger:  { icon: Bot,           bg: '#f5f3ff',  color: '#7c3aed', label: 'Bot' },
  handoff:      { icon: UserCheck,     bg: '#fff7ed',  color: '#ea580c', label: 'Handoff' },
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    const supabase = createClient()

    supabase
      .from('activities')
      .select('*, user:users(full_name, email), contact:contacts(first_name, last_name)')
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => setActivities(data || []))

    const channel = supabase
      .channel('activities-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activities' },
        payload => {
          setActivities(prev => [payload.new as Activity, ...prev].slice(0, 30))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  if (activities.length === 0) {
    return (
      <div
        className="rounded-xl p-6 text-center text-sm"
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          color: '#94a3b8',
        }}
      >
        No activity yet — move a lead or log a note to get started.
      </div>
    )
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}
    >
      {activities.map((activity, idx) => {
        const cfg = TYPE_CONFIG[activity.type] || TYPE_CONFIG.note
        const Icon = cfg.icon
        const user = activity.user as { full_name?: string; email?: string } | null
        const contact = activity.contact as { first_name?: string; last_name?: string } | null

        return (
          <div
            key={activity.id}
            className="flex items-start gap-3 px-4 py-3 transition-colors duration-100"
            style={{
              borderBottom: idx < activities.length - 1 ? '1px solid #f8fafc' : 'none',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#f8fafc')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
          >
            {/* Icon circle */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: cfg.bg }}
            >
              <Icon className="w-4 h-4" style={{ color: cfg.color }} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm" style={{ color: '#1e293b' }}>
                {contact && (
                  <span className="font-semibold" style={{ color: '#0C3B6E' }}>
                    {contact.first_name} {contact.last_name}{' '}
                  </span>
                )}
                <span style={{ color: '#475569' }}>{activity.body}</span>
              </p>
              <p className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: '#94a3b8' }}>
                <span className="font-medium">{user?.full_name || user?.email || 'System'}</span>
                <span>·</span>
                <span>{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}</span>
                <span>·</span>
                <span
                  className="capitalize px-1.5 py-0.5 rounded text-[10px] font-semibold"
                  style={{ background: cfg.bg, color: cfg.color }}
                >
                  {cfg.label}
                </span>
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
