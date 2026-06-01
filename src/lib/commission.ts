import { PolicyType, DEFAULT_COMMISSION_RATES, CommissionCalcResult } from '@/types'

export function calculateCommission(
  premium: number,
  policyType: PolicyType,
  numPolicies: number,
  customRate?: number
): CommissionCalcResult {
  const rate = customRate !== undefined ? customRate / 100 : DEFAULT_COMMISSION_RATES[policyType]
  const baseCommission = premium * rate

  // Bonus tier
  let bonusPct = 0
  let bonusTier = 'None'
  if (numPolicies >= 20) { bonusPct = 0.20; bonusTier = '20+ policies (20%)' }
  else if (numPolicies >= 10) { bonusPct = 0.10; bonusTier = '10+ policies (10%)' }
  else if (numPolicies >= 5) { bonusPct = 0.05; bonusTier = '5+ policies (5%)' }

  const bonus = baseCommission * bonusPct
  const persistencyBonus = policyType === 'life' ? baseCommission * 0.10 : 0
  const total = baseCommission + bonus + persistencyBonus
  const effectiveRate = premium > 0 ? total / premium : 0

  return {
    premium,
    rate,
    baseCommission,
    bonus,
    persistencyBonus,
    total,
    effectiveRate,
    bonusTier,
  }
}
