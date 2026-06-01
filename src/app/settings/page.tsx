'use client'

import { useState, useEffect } from 'react'
import { User, Goal } from '@/types'
import { Settings, Users, DollarSign, Target, Sheet, MessageSquare, CheckCircle, XCircle } from 'lucide-react'
import { format, startOfMonth } from 'date-fns'

export default function SettingsPage() {
  const [tab, setTab] = useState<'users' | 'rates' | 'goals' | 'sheets' | 'sms'>('users')
  const [users, setUsers] = useState<User[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [lastSync, setLastSync] = useState<{ synced_at: string; rows_pulled: number; status: string } | null>(null)
  const [botTestResult, setBotTestResult] = useState<string | null>(null)
  const [sheetsId, setSheetsId] = useState(process.env.NEXT_PUBLIC_SHEETS_ID || '')
  const [loading, setLoading] = useState(false)

  const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd')

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(d => setUsers(Array.isArray(d) ? d : []))
    fetch(`/api/goals?month=${currentMonth}`).then(r => r.json()).then(d => setGoals(Array.isArray(d) ? d : []))
  }, [])

  const handleRoleChange = async (userId: string, role: string) => {
    await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: role as User['role'] } : u))
  }

  const handleGoalSave = async (userId: string, field: string, value: number) => {
    const existing = goals.find(g => g.user_id === userId)
    const body = existing
      ? { ...existing, [field]: value }
      : { user_id: userId, month: currentMonth, commission_target: 0, policies_target: 0, contacts_target: 0, recruits_target: 0, [field]: value }

    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setGoals(prev => {
      const next = prev.filter(g => g.user_id !== userId)
      return [...next, data]
    })
  }

  const testSmsBot = async () => {
    setBotTestResult(null)
    try {
      const res = await fetch('/api/test/sms-bot', { method: 'POST' })
      setBotTestResult(res.ok ? 'success' : 'error')
    } catch {
      setBotTestResult('error')
    }
  }

  const tabs = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'rates', label: 'Comm. Rates', icon: DollarSign },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'sheets', label: 'Google Sheets', icon: Sheet },
    { id: 'sms', label: 'SMS Bot', icon: MessageSquare },
  ]

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-brand-navy" />
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage users, rates, goals, and integrations</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-white shadow-sm text-brand-navy' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Users tab */}
      {tab === 'users' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Name', 'Email', 'Role', 'Member Since'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-brand-navy">{u.full_name || '—'}</td>
                  <td className="px-5 py-3 text-gray-500">{u.email}</td>
                  <td className="px-5 py-3">
                    <select
                      value={u.role}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      className="text-sm border border-gray-200 rounded-lg px-2 py-1"
                    >
                      <option value="agent">Agent</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-5 py-3 text-gray-400">{format(new Date(u.created_at), 'MMM d, yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Commission rates tab */}
      {tab === 'rates' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md">
          <h3 className="font-semibold text-brand-navy mb-4">Default Commission Rates</h3>
          <p className="text-sm text-gray-500 mb-4">These are the system defaults used in the calculator. Individual deals can override these.</p>
          {[
            { type: 'Auto', rate: '10%' },
            { type: 'Life (1st Year)', rate: '85%' },
            { type: 'Home', rate: '12%' },
            { type: 'Bundle', rate: '15%' },
            { type: 'Health', rate: '8%' },
          ].map(r => (
            <div key={r.type} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <span className="font-medium text-gray-700">{r.type}</span>
              <span className="text-brand-gold font-bold">{r.rate}</span>
            </div>
          ))}
          <p className="text-xs text-gray-400 mt-4">To adjust rates, update DEFAULT_COMMISSION_RATES in src/types/index.ts and redeploy.</p>
        </div>
      )}

      {/* Goals tab */}
      {tab === 'goals' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
            <p className="text-sm font-medium text-gray-600">Setting goals for: <span className="text-brand-navy font-bold">{format(new Date(currentMonth), 'MMMM yyyy')}</span></p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Agent', 'Commission Target', 'Policies Target', 'Contacts Target', 'Recruits Target'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => {
                const g = goals.find(g => g.user_id === u.id)
                return (
                  <tr key={u.id}>
                    <td className="px-5 py-3 font-medium text-brand-navy">{u.full_name || u.email}</td>
                    {(['commission_target', 'policies_target', 'contacts_target', 'recruits_target'] as const).map(field => (
                      <td key={field} className="px-5 py-3">
                        <input
                          type="number"
                          defaultValue={g?.[field] || 0}
                          onBlur={e => handleGoalSave(u.id, field, parseFloat(e.target.value) || 0)}
                          className="w-28 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-brand-blue outline-none"
                        />
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Google Sheets tab */}
      {tab === 'sheets' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-lg">
          <h3 className="font-semibold text-brand-navy mb-4">Google Sheets Sync</h3>
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-600 mb-1 block">Sheet ID</label>
            <input
              value={sheetsId}
              onChange={e => setSheetsId(e.target.value)}
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-blue outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">Set GOOGLE_SHEETS_ID in your Coolify environment variables.</p>
          </div>
          {lastSync && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
              <p className="font-medium text-green-700">Last sync: {format(new Date(lastSync.synced_at), 'MMM d, h:mm a')}</p>
              <p className="text-green-600">{lastSync.rows_pulled} rows pulled</p>
            </div>
          )}
          <div className="mt-4 text-xs text-gray-400 space-y-1">
            <p>• Make sure your Google Service Account has Viewer access to the Sheet</p>
            <p>• Set GOOGLE_SERVICE_ACCOUNT_JSON with the full JSON key in Coolify env vars</p>
            <p>• Sync runs automatically every 15 minutes via the /api/cron/sheets-sync endpoint</p>
          </div>
        </div>
      )}

      {/* SMS Bot tab */}
      {tab === 'sms' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-lg">
          <h3 className="font-semibold text-brand-navy mb-4">SMS Bot Configuration</h3>
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">Bot URL</label>
              <input
                placeholder="https://your-n8n-webhook-url.com"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                disabled
              />
              <p className="text-xs text-gray-400 mt-1">Set SMS_BOT_URL in Coolify environment variables.</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">API Key</label>
              <input type="password" placeholder="••••••••••••" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" disabled />
              <p className="text-xs text-gray-400 mt-1">Set BOT_API_KEY in Coolify environment variables.</p>
            </div>
          </div>
          <button
            onClick={testSmsBot}
            className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Test Bot Connection
          </button>
          {botTestResult && (
            <div className={`mt-3 flex items-center gap-2 text-sm ${botTestResult === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {botTestResult === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {botTestResult === 'success' ? 'Bot is connected and responding!' : 'Could not reach bot. Check SMS_BOT_URL and BOT_API_KEY.'}
            </div>
          )}
          <div className="mt-6 border-t pt-4">
            <h4 className="text-sm font-semibold text-brand-navy mb-2">Webhook Endpoint</h4>
            <p className="text-xs text-gray-500 mb-1">Point your SMS bot to this URL for human handoff:</p>
            <code className="text-xs bg-gray-100 px-3 py-2 rounded block break-all">
              https://your-domain.com/api/webhooks/bot-handoff
            </code>
          </div>
        </div>
      )}
    </div>
  )
}
