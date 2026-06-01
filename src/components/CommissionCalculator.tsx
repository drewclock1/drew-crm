'use client'

import { useState, useEffect } from 'react'
import { PolicyType, DEFAULT_COMMISSION_RATES } from '@/types'
import { calculateCommission } from '@/lib/commission'
import { DollarSign, Calculator, Save } from 'lucide-react'
import { format, startOfMonth } from 'date-fns'

interface Props {
  onSave?: (result: ReturnType<typeof calculateCommission> & { leadId?: string }) => void
  leadId?: string
  agentId?: string
  prefillPremium?: number
  prefillPolicyType?: PolicyType
}

export default function CommissionCalculator({ onSave, leadId, agentId, prefillPremium, prefillPolicyType }: Props) {
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

  useEffect(() => {
    if (customRate === '') {
      // reset to default when cleared
    }
  }, [policyType])

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
    <div className="bg-brand-surface-gold border border-brand-gold/30 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-brand-gold" />
        <h3 className="font-bold text-brand-navy text-sm">Commission Calculator</h3>
      </div>

      <div className="space-y-3">
        {/* Policy Type */}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Policy Type</label>
          <select
            value={policyType}
            onChange={e => { setPolicyType(e.target.value as PolicyType); setCustomRate('') }}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-brand-blue outline-none"
          >
            <option value="auto">Auto (10%)</option>
            <option value="life">Life (85% 1st yr)</option>
            <option value="home">Home (12%)</option>
            <option value="bundle">Bundle (15%)</option>
            <option value="health">Health (8%)</option>
          </select>
        </div>

        {/* Premium */}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Annual Premium</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="number"
              value={premium || ''}
              onChange={e => setPremium(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="w-full text-sm border border-gray-200 rounded-lg pl-8 pr-3 py-2 bg-white focus:ring-2 focus:ring-brand-blue outline-none"
            />
          </div>
        </div>

        {/* Custom Rate */}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">
            Rate % <span className="text-gray-400">(leave blank for default)</span>
          </label>
          <input
            type="number"
            value={customRate}
            onChange={e => setCustomRate(e.target.value)}
            placeholder={`${(DEFAULT_COMMISSION_RATES[policyType] * 100).toFixed(0)}% (default)`}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-brand-blue outline-none"
          />
        </div>

        {/* Num Policies */}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">
            # of Policies <span className="text-gray-400">({result.bonusTier})</span>
          </label>
          <input
            type="number"
            value={numPolicies}
            min={1}
            onChange={e => setNumPolicies(parseInt(e.target.value) || 1)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-brand-blue outline-none"
          />
        </div>
      </div>

      {/* Results */}
      <div className="mt-4 bg-white rounded-lg p-4 space-y-2 border border-brand-gold/20">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Base Commission</span>
          <span className="font-medium">{fmt(result.baseCommission)}</span>
        </div>
        {result.bonus > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Volume Bonus</span>
            <span className="font-medium text-green-600">+{fmt(result.bonus)}</span>
          </div>
        )}
        {result.persistencyBonus > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Persistency Bonus (Life)</span>
            <span className="font-medium text-green-600">+{fmt(result.persistencyBonus)}</span>
          </div>
        )}
        <div className="border-t pt-2 flex justify-between">
          <span className="font-bold text-brand-navy">Total Payout</span>
          <span className="font-bold text-brand-gold text-lg">{fmt(result.total)}</span>
        </div>
        <div className="text-xs text-gray-400 text-right">Effective rate: {effectiveRatePct}%</div>
      </div>

      {agentId && (
        <button
          onClick={handleSave}
          disabled={saving || premium === 0}
          className="mt-3 w-full flex items-center justify-center gap-2 bg-brand-gold hover:bg-yellow-600 disabled:opacity-40 text-white text-sm font-medium py-2 rounded-lg transition-colors"
        >
          <Save className="w-4 h-4" />
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save to Deal'}
        </button>
      )}
    </div>
  )
}
