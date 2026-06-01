'use client'

import { InsuranceLead, RecruitingLead, Contact } from '@/types'
import { clsx } from 'clsx'
import { MessageSquare, UserCheck, User } from 'lucide-react'

type AnyLead = (InsuranceLead | RecruitingLead) & { contact?: Contact }

interface Props {
  lead: AnyLead
  pipelineType: 'insurance' | 'recruiting'
  onStageChange?: (leadId: string, newStage: string) => void
  onClick?: () => void
}

const TEMP_STYLES: Record<string, { bg: string; color: string; border: string; dot: string }> = {
  hot:  { bg: '#fff1ee', color: '#c2410c', border: '#fecdc5', dot: '#ef4444' },
  warm: { bg: '#fffbeb', color: '#92400e', border: '#fde68a', dot: '#f59e0b' },
  cold: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', dot: '#3b82f6' },
}

const BOT_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  bot:       { label: '🤖 Bot Active', bg: '#f5f3ff', color: '#5b21b6' },
  human:     { label: '👤 Human',      bg: '#ecfdf5', color: '#065f46' },
  opted_out: { label: '🚫 Opted Out',  bg: '#f8fafc', color: '#64748b' },
}

// Left border colors by stage
const STAGE_BORDER: Record<string, string> = {
  new_lead:    '#94a3b8',
  contacted:   '#2B7FD4',
  quote_sent:  '#7c3aed',
  follow_up:   '#f59e0b',
  closed_won:  '#4ade80',
  closed_lost: '#f43f5e',
  prospect:    '#94a3b8',
  reached_out: '#2B7FD4',
  interview:   '#7c3aed',
  offer_sent:  '#f59e0b',
  onboarded:   '#4ade80',
  lost:        '#f43f5e',
}

function formatMoney(n: number | null | undefined) {
  if (!n) return null
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

export default function LeadCard({ lead, pipelineType, onClick }: Props) {
  const contact = lead.contact
  const isInsurance = pipelineType === 'insurance'
  const ins = isInsurance ? (lead as InsuranceLead) : null
  const rec = !isInsurance ? (lead as RecruitingLead) : null

  const botStatus = contact?.mode || 'bot'
  const botBadge = BOT_BADGE[botStatus] || BOT_BADGE.bot
  const tempStyle = ins?.temp ? TEMP_STYLES[ins.temp] : null
  const borderColor = STAGE_BORDER[lead.stage] || '#e2e8f0'
  const value = isInsurance ? formatMoney(ins?.annual_premium) : formatMoney(rec?.est_first_year)

  const handleTextNow = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!contact?.phone) return
    const triggerContext = isInsurance
      ? `Agent wants to text lead ${contact.first_name} ${contact.last_name} right now about their insurance. Send a warm, engaging follow-up.`
      : `Recruiter wants to text prospect ${contact.first_name} ${contact.last_name} right now about the opportunity. Send an engaging message.`

    await fetch(`/api/leads/${pipelineType}/${lead.id}/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ triggerContext }),
    })
  }

  const handleTakeOver = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await fetch(`/api/contacts/${contact?.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'human' }),
    })
  }

  const handleReenableBot = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await fetch(`/api/contacts/${contact?.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'bot' }),
    })
  }

  return (
    <div
      className="card card-lift cursor-pointer select-none"
      style={{
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: '10px',
        padding: '12px',
      }}
      onClick={onClick}
    >
      {/* Top row: name + temp badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p
            className="font-semibold text-sm leading-tight truncate"
            style={{ color: '#0C3B6E' }}
          >
            {contact?.first_name} {contact?.last_name}
          </p>
          {contact?.phone && (
            <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>
              {contact.phone}
            </p>
          )}
        </div>
        {tempStyle && ins?.temp && (
          <span
            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0"
            style={{
              background: tempStyle.bg,
              color: tempStyle.color,
              border: `1px solid ${tempStyle.border}`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: tempStyle.dot, display: 'inline-block' }}
            />
            {ins.temp}
          </span>
        )}
      </div>

      {/* Middle: details + value */}
      <div className="mb-2.5 space-y-1">
        {isInsurance && ins && (
          <div className="flex items-center gap-1.5">
            {ins.policy_type && (
              <span
                className="text-[10.5px] px-1.5 py-0.5 rounded font-semibold capitalize"
                style={{ background: '#f1f5f9', color: '#475569' }}
              >
                {ins.policy_type}
              </span>
            )}
            {contact?.state && (
              <span className="text-[10.5px]" style={{ color: '#94a3b8' }}>
                {contact.state}
              </span>
            )}
          </div>
        )}
        {!isInsurance && rec && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {rec.current_position && (
              <span className="text-[10.5px]" style={{ color: '#64748b' }}>
                {rec.current_position}
              </span>
            )}
            {rec.licensed && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                style={{ background: '#f0fdf4', color: '#166534' }}
              >
                Licensed
              </span>
            )}
          </div>
        )}
        {value && (
          <p className="text-sm font-bold" style={{ color: '#C9951A' }}>
            {value}{!isInsurance ? ' est.' : ''}
          </p>
        )}
      </div>

      {/* Bottom: stage pill + bot badge + action buttons */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="stage-pill"
            style={{ fontSize: '9.5px' }}
          >
            {lead.stage.replace(/_/g, ' ')}
          </span>
          <span
            className="text-[9.5px] px-1.5 py-0.5 rounded-full font-semibold"
            style={{ background: botBadge.bg, color: botBadge.color }}
          >
            {botBadge.label}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleTextNow}
            title="Quick Text"
            className="p-1 rounded-lg transition-colors"
            style={{ color: '#2B7FD4' }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#EBF4FF')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
          {botStatus === 'bot' ? (
            <button
              onClick={handleTakeOver}
              title="Take Over from Bot"
              className="p-1 rounded-lg transition-colors"
              style={{ color: '#16a34a' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#f0fdf4')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
            >
              <UserCheck className="w-3.5 h-3.5" />
            </button>
          ) : botStatus === 'human' ? (
            <button
              onClick={handleReenableBot}
              title="Re-enable Bot"
              className="p-1 rounded-lg transition-colors"
              style={{ color: '#2B7FD4' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#EBF4FF')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
            >
              <User className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
