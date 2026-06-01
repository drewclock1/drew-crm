'use client'

import { InsuranceLead, RecruitingLead, Contact } from '@/types'
import { clsx } from 'clsx'
import { MessageSquare, User, UserCheck, UserX } from 'lucide-react'

type AnyLead = (InsuranceLead | RecruitingLead) & { contact?: Contact }

interface Props {
  lead: AnyLead
  pipelineType: 'insurance' | 'recruiting'
  onStageChange?: (leadId: string, newStage: string) => void
  onClick?: () => void
}

const TEMP_COLORS = {
  hot: 'bg-red-100 text-red-700 border-red-200',
  warm: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  cold: 'bg-blue-100 text-blue-700 border-blue-200',
}

const BOT_BADGE = {
  bot: { label: '🤖 Bot Active', cls: 'bg-blue-100 text-blue-700' },
  human: { label: '👤 Human', cls: 'bg-green-100 text-green-700' },
  opted_out: { label: '🚫 Opted Out', cls: 'bg-gray-100 text-gray-500' },
}

function formatMoney(n: number | null | undefined) {
  if (!n) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export default function LeadCard({ lead, pipelineType, onClick }: Props) {
  const contact = lead.contact
  const isInsurance = pipelineType === 'insurance'
  const ins = isInsurance ? (lead as InsuranceLead) : null
  const rec = !isInsurance ? (lead as RecruitingLead) : null

  const botStatus = contact?.mode || 'bot'
  const badge = BOT_BADGE[botStatus]
  const value = isInsurance ? ins?.annual_premium : rec?.est_first_year

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
      className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md hover:border-brand-blue/40 transition-all select-none"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-brand-navy text-sm leading-tight">
            {contact?.first_name} {contact?.last_name}
          </p>
          {contact?.phone && (
            <p className="text-xs text-gray-400 mt-0.5">{contact.phone}</p>
          )}
        </div>
        {ins?.temp && (
          <span className={clsx('text-xs px-2 py-0.5 rounded-full border font-medium capitalize', TEMP_COLORS[ins.temp])}>
            {ins.temp}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="space-y-1 mb-2">
        {isInsurance && ins && (
          <>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="capitalize bg-gray-100 px-1.5 py-0.5 rounded font-medium">{ins.policy_type || '—'}</span>
              {contact?.state && <span>· {contact.state}</span>}
            </div>
            <div className="text-sm font-bold text-brand-gold">{formatMoney(ins.annual_premium)}</div>
          </>
        )}
        {!isInsurance && rec && (
          <>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span>{rec.current_position || 'Unknown role'}</span>
              {rec.licensed && <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs">Licensed</span>}
            </div>
            <div className="text-sm font-bold text-brand-gold">{formatMoney(rec.est_first_year)} est.</div>
          </>
        )}
      </div>

      {/* Bot badge */}
      <div className="flex items-center justify-between gap-1 mt-2">
        <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', badge.cls)}>
          {badge.label}
        </span>
        <div className="flex items-center gap-1">
          {/* Text Now */}
          <button
            onClick={handleTextNow}
            title="Text Now"
            className="p-1 rounded hover:bg-brand-surface-blue text-brand-blue transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>
          {/* Take Over / Re-enable */}
          {botStatus === 'bot' ? (
            <button
              onClick={handleTakeOver}
              title="Take Over from Bot"
              className="p-1 rounded hover:bg-green-50 text-green-600 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" />
            </button>
          ) : botStatus === 'human' ? (
            <button
              onClick={handleReenableBot}
              title="Re-enable Bot"
              className="p-1 rounded hover:bg-blue-50 text-brand-blue transition-colors"
            >
              <User className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
