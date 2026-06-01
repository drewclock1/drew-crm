'use client'

import { useState } from 'react'
import { PolicyType, DEFAULT_COMMISSION_RATES } from '@/types'
import { calculateCommission } from '@/lib/commission'
import { DollarSign, Calculator, Save, CheckCircle } from 'lucide-react'
import { format, startOfMonth } from 'date-fns'

interface Props {
  onSave?: (result: ReturnType<typeof calculateCommission> & { leadId?: string }) => void
  leadId?: string
  agentId?: string
  prefillPremium?: number
  prefillPolicyType?: PolicyType
}

export default function CommissionCalculator({
  onSave,
  leadId,
  agentId,
  prefillPremium,
  prefillPolicyType,
}: Props) {
  const [premium, setPremium] = useState(prefillPremium || 0)
  const [policyType, setPolicyType] = useState<PolicyType>(prefillPolicyType || 'auto')
  const [numPolicies, setNumPolicies] = useState(1)
  const [customRate, setCustomRate] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const result = calculateCommission(
    premium,
    policyType,
    numPolicies,
    customRate !== '' ? parseFloat(customRate) : undefined
  )

  const handleSave = async () => {
    if (!agentId) return
    setSaving(true)
    try {
      await fetch('/api/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insurance_lead_id: leadId || null,
          agent_id: agentId,
          month: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
          premium: result.premium,
          rate: result.rate,
          base_commission: result.baseCommission,
          bonus: result.bonus,
          persistency_bonus: result.persistencyBonus,
          total: result.total,
          policy_type: policyType,
        }),
      })
      setSaved(true)
      onSave?.({ ...result, leadId })
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  const effectiveRatePct = (result.effectiveRate * 100).toFixed(1)

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderTop: '3px solid #C9951A',
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
      }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: '#FBF5E6' }}
        >
          <Calculator className="w-4 h-4" style={{ color: '#C9951A' }} />
        </div>
        <h3 className="font-bold text-sm" style={{ color: '#0C3B6E' }}>
          💰 Commission Calc
        </h3>
      </div>

      <div className="px-4 pb-4 space-y-3">
        {/* Policy Type */}
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: '#64748b' }}>
            Policy Type
          </label>
          <select
            value={policyType}
            onChange={e => { setPolicyType(e.target.value as PolicyType); setCustomRate('') }}
            className="input"
          >
            <option value="auto">Auto (10%)</option>
            <option value="life">Life (85% 1st yr)</option>
            <option value="home">Home (12%)</option>
            <option value="bundle">Bundle (15%)</option>
            <option value="health">Health (8%)</option>
          </select>
        </div>

        {/* Annual Premium */}
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: '#64748b' }}>
            Annual Premium
          </label>
          <div className="relative">
            <DollarSign
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
              style={{ color: '#94a3b8' }}
            />
            <input
              type="number"
              value={premium || ''}
              onChange={e => setPremium(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="input"
              style={{ paddingLeft: '28px' }}
            />
          </div>
        </div>

        {/* Custom Rate */}
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: '#64748b' }}>
            Rate %{' '}
            <span style={{ color: '#94a3b8', fontWeight: 400 }}>(leave blank for default)</span>
          </label>
          <input
            type="number"
            value={customRate}
            onChange={e => setCustomRate(e.target.value)}
            placeholder={`${(DEFAULT_COMMISSION_RATES[policyType] * 100).toFixed(0)}% default`}
            className="input"
          />
        </div>

        {/* # Policies */}
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: '#64748b' }}>
            # Policies{' '}
            <span style={{ color: '#C9951A', fontWeight: 600 }}>({result.bonusTier})</span>
          </label>
          <input
            type="number"
            value={numPolicies}
            min={1}
            onChange={e => setNumPolicies(parseInt(e.target.value) || 1)}
            className="input"
          />
        </div>

        {/* Results breakdown */}
        <div
          className="rounded-lg p-3 space-y-2"
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
        >
          <div className="flex justify-between text-xs">
            <span style={{ color: '#64748b' }}>Base Commission</span>
            <span className="font-semibold" style={{ color: '#0f172a' }}>{fmt(result.baseCommission)}</span>
          </div>
          {result.bonus > 0 && (
            <div className="flex justify-between text-xs">
              <span style={{ color: '#64748b' }}>Volume Bonus</span>
              <span className="font-semibold" style={{ color: '#16a34a' }}>+{fmt(result.bonus)}</span>
            </div>
          )}
          {result.persistencyBonus > 0 && (
            <div className="flex justify-between text-xs">
              <span style={{ color: '#64748b' }}>Persistency (Life)</span>
              <span className="font-semibold" style={{ color: '#16a34a' }}>+{fmt(result.persistencyBonus)}</span>
            </div>
          )}
          <div
            className="flex justify-between items-center pt-2"
            style={{ borderTop: '1px solid #e2e8f0' }}
          >
            <span className="font-bold text-sm" style={{ color: '#0C3B6E' }}>Total Payout</span>
            <span className="font-extrabold text-lg" style={{ color: '#C9951A' }}>
              {fmt(result.total)}
            </span>
          </div>
          <div className="text-right text-[10px]" style={{ color: '#94a3b8' }}>
            Effective rate: {effectiveRatePct}%
          </div>
        </div>

        {/* Save button */}
        {agentId && (
          <button
            onClick={handleSave}
            disabled={saving || premium === 0}
            className="btn-gold w-full justify-center"
          >
            {saved ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {saving ? 'Saving…' : 'Save to Deal'}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
