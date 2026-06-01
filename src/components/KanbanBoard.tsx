'use client'

import { useState, useEffect, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { InsuranceLead, RecruitingLead, INSURANCE_STAGES, RECRUITING_STAGES, INSURANCE_STAGE_LABELS, RECRUITING_STAGE_LABELS } from '@/types'
import LeadCard from './LeadCard'
import { clsx } from 'clsx'
import { Plus } from 'lucide-react'

type AnyLead = InsuranceLead | RecruitingLead

interface Props {
  pipelineType: 'insurance' | 'recruiting'
  onLeadClick?: (lead: AnyLead) => void
}

const STAGE_COLORS: Record<string, string> = {
  new_lead: 'border-t-gray-400',
  contacted: 'border-t-blue-400',
  quote_sent: 'border-t-purple-400',
  follow_up: 'border-t-yellow-400',
  closed_won: 'border-t-green-500',
  closed_lost: 'border-t-red-400',
  prospect: 'border-t-gray-400',
  reached_out: 'border-t-blue-400',
  interview: 'border-t-purple-400',
  offer_sent: 'border-t-yellow-400',
  onboarded: 'border-t-green-500',
  lost: 'border-t-red-400',
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
    fetchLeads()
  }, [fetchLeads])

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return
    const { draggableId, destination } = result
    const newStage = destination.droppableId

    // Optimistic update
    setLeads(prev => prev.map(l => l.id === draggableId ? { ...l, stage: newStage as AnyLead['stage'] } : l))

    await fetch(`/api/leads/${pipelineType}/${draggableId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    })
  }

  const stageLeads = (stage: string) => leads.filter(l => l.stage === stage)

  const stageValue = (stage: string) => {
    const stagel = stageLeads(stage)
    if (pipelineType === 'insurance') {
      return (stagel as InsuranceLead[]).reduce((s, l) => s + (l.annual_premium || 0), 0)
    }
    return (stagel as RecruitingLead[]).reduce((s, l) => s + (l.est_first_year || 0), 0)
  }

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map(s => (
          <div key={s} className="w-60 shrink-0 bg-white rounded-xl border border-gray-200 h-64 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map(stage => (
          <div
            key={stage}
            className={clsx(
              'w-60 shrink-0 bg-white rounded-xl border-t-4 border border-gray-200 shadow-sm',
              STAGE_COLORS[stage]
            )}
          >
            {/* Column header */}
            <div className="px-3 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-brand-navy">{labels[stage as keyof typeof labels]}</span>
                <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 font-medium">
                  {stageLeads(stage).length}
                </span>
              </div>
              {stageValue(stage) > 0 && (
                <p className="text-xs text-brand-gold font-medium mt-0.5">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(stageValue(stage))}
                </p>
              )}
            </div>

            {/* Cards */}
            <Droppable droppableId={stage}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={clsx(
                    'p-2 min-h-[100px] space-y-2 transition-colors',
                    snapshot.isDraggingOver && 'bg-brand-surface-blue'
                  )}
                >
                  {stageLeads(stage).map((lead, index) => (
                    <Draggable key={lead.id} draggableId={lead.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={clsx(snapshot.isDragging && 'rotate-1 shadow-xl')}
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
          </div>
        ))}
      </div>
    </DragDropContext>
  )
}
