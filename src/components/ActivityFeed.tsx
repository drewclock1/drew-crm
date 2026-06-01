'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Activity } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { clsx } from 'clsx'
import { MessageSquare, Phone, ArrowRight, Bot, UserCheck } from 'lucide-react'

const ICONS: Record<string, React.ElementType> = {
  note: MessageSquare,
  call: Phone,
  stage_change: ArrowRight,
  bot_trigger: Bot,
  handoff: UserCheck,
}

const COLORS: Record<string, string> = {
  note: 'bg-blue-100 text-blue-600',
  call: 'bg-green-100 text-green-600',
  stage_change: 'bg-brand-surface-gold text-brand-gold',
  bot_trigger: 'bg-purple-100 text-purple-600',
  handoff: 'bg-orange-100 text-orange-600',
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    const supabase = createClient()

    // Initial load
    supabase
      .from('activities')
      .select('*, user:users(full_name, email), contact:contacts(first_name, last_name)')
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => setActivities(data || []))

    // Realtime subscription
    const channel = supabase
      .channel('activities-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activities' }, payload => {
        setActivities(prev => [payload.new as Activity, ...prev].slice(0, 30))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  if (activities.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-400 text-sm">
        No activity yet — move a lead or log a note to get started.
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-50">
      {activities.map(activity => {
        const Icon = ICONS[activity.type] || MessageSquare
        const color = COLORS[activity.type] || 'bg-gray-100 text-gray-600'
        const user = activity.user as { full_name?: string; email?: string } | null
        const contact = activity.contact as { first_name?: string; last_name?: string } | null

        return (
          <div key={activity.id} className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors">
            <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5', color)}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800">
                {contact && (
                  <span className="font-medium text-brand-navy">
                    {contact.first_name} {contact.last_name} —{' '}
                  </span>
                )}
                {activity.body}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {user?.full_name || user?.email || 'System'}
                {' · '}
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                {' · '}
                <span className="capitalize">{activity.lead_type}</span>
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
