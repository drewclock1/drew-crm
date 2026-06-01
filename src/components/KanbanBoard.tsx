'use client'

import { useState, useEffect, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import {
  InsuranceLead,
  RecruitingLead,
  INSURANCE_STAGES,
  RECRUITING_STAGES,
  INSURANCE_STAGE_LABELS,
  RECRUITING_STAGE_LABELS,
} from '@/types'
import LeadCard from './LeadCard'
import { clsx } from 'clsx'
import { Plus } from 'lucide-react'

type AnyLead = InsuranceLead | RecruitingLead

interface Props {
  pipelineType: 'insurance' | 'recruiting'
  onLeadClick?: (lead: AnyLead) => void
}

// Column header colors by stage
const STAGE_HEADER: Record<string, { bg: string; color: string; accent: string }> = {
  new_lead:    { bg: '#f8fafc', color: '#475569', accent: '#94a3b8' },
  contacted:   { bg: '#eff6ff', color: '#1d4ed8', accent: '#2B7FD4' },
  quote_sent:  { bg: '#f5f3ff', color: '#5b21b6', accent: '#7c3aed' },
  follow_up:   { bg: '#fffbeb', color: '#92400e', accent: '#f59e0b' },
  closed_won:  { bg: '#f0fdf4', color: '#166534', accent: '#4ade80' },
  closed_lost: { bg: '#fff1f2', color: '#9f1239', accent: '#f43f5e' },
  prospect:    { bg: '#f8fafc', color: '#475569', accent: '#94a3b8' },
  reached_out: { bg: '#eff6ff', color: '#1d4ed8', accent: '#2B7FD4' },
  interview:   { bg: '#f5f3ff', color: '#5b21b6', accent: '#7c3aed' },
  offer_sent:  { bg: '#fffbeb', color: '#92400e', accent: '#f59e0b' },
  onboarded:   { bg: '#f0fdf4', color: '#166534', accent: '#4ade80' },
  lost:        { bg: '#fff1f2', color: '#9f1239', accent: '#f43f5e' },
}

export default function KanbanBoard({ pipelineType, onLeadClick }: Props) {
  const [leads, setLeads] = useState<AnyLead[]>([])
  const [loading, setLoading] = useState(true)

  const stages = pipelineType === 'insurance' ? INSURANCE_STAGES : RECRUITING_STAGES
  const labels = pipelineType === 'insurance' ? INSURANCE_STAGE_LABELS : RECRUITING_STAGE_LABELS

  const fetchLeads = useCallback(async () => {
    const res = await fetch(`/api/leads/${pipelineType}`)
    const data = await res.json()
    setLeads(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [pipelineType])

  useEffect(() => {
    setLoading(true)
    fetchLeads()
  }, [fetchLeads])

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return
    const { draggableId, destination } = result
    const newStage = destination.droppableId

    setLeads(prev =>
      prev.map(l => (l.id === draggableId ? ({ ...l, stage: newStage } as AnyLead) : l))
    )

    await fetch(`/api/leads/${pipelineType}/${draggableId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    })
  }

  const stageLeads = (stage: string) => leads.filter(l => l.stage === stage)

  const stageValue = (stage: string) => {
    const sl = stageLeads(stage)
    if (pipelineType === 'insurance') {
      return (sl as InsuranceLead[]).reduce((s, l) => s + (l.annual_premium || 0), 0)
    }
    return (sl as RecruitingLead[]).reduce((s, l) => s + (l.est_first_year || 0), 0)
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-4">
        {stages.map(s => (
          <div
            key={s}
            className="shrink-0 rounded-xl animate-pulse"
            style={{
              width: '240px',
              minWidth: '220px',
              height: '280px',
              background: '#e9eef5',
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {stages.map(stage => {
          const header = STAGE_HEADER[stage] || { bg: '#f8fafc', color: '#475569', accent: '#94a3b8' }
          const count = stageLeads(stage).length
          const val = stageValue(stage)

          return (
            <div
              key={stage}
              className="shrink-0 flex flex-col rounded-xl overflow-hidden"
              style={{
                width: '240px',
                minWidth: '220px',
                maxWidth: '260px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              {/* Column header */}
              <div
                className="px-3 py-3"
                style={{
                  background: header.bg,
                  borderBottom: `2px solid ${header.accent}22`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: header.accent }}
                    />
                    <span className="text-sm font-bold" style={{ color: header.color }}>
                      {labels[stage as keyof typeof labels]}
                    </span>
                  </div>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: header.accent + '20', color: header.color }}
                  >
                    {count}
                  </span>
                </div>
                {val > 0 && (
                  <p className="text-xs font-semibold mt-1" style={{ color: '#C9951A' }}>
                    {fmt(val)}
                  </p>
                )}
              </div>

              {/* Droppable area */}
              <Droppable droppableId={stage}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex-1 p-2 space-y-2 transition-colors duration-150"
                    style={{
                      minHeight: '80px',
                      background: snapshot.isDraggingOver ? '#EBF4FF' : 'transparent',
                    }}
                  >
                    {stageLeads(stage).map((lead, index) => (
                      <Draggable key={lead.id} draggableId={lead.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              transform: snapshot.isDragging
                                ? (provided.draggableProps.style?.transform || '') + ' rotate(1.5deg)'
                                : provided.draggableProps.style?.transform,
                            }}
                          >
                            <LeadCard
                              lead={lead}
                              pipelineType={pipelineType}
                              onClick={() => onLeadClick?.(lead)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              {/* Add lead button */}
              <button
                className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-medium transition-colors duration-150"
                style={{ color: '#94a3b8', borderTop: '1px solid #f1f5f9' }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.color = '#2B7FD4'
                  el.style.background = '#EBF4FF'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.color = '#94a3b8'
                  el.style.background = 'transparent'
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                Add lead
              </button>
            </div>
          )
        })}
      </div>
    </DragDropContext>
  )
}
