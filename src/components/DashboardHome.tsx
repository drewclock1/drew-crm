'use client'
import { Phone, Users, DollarSign, Target, TrendingUp, Calendar, CheckCircle, AlertCircle } from 'lucide-react'

const stats = [
  { label: 'Leads Today', value: '0', icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { label: 'Dials Today', value: '0', icon: Phone, color: 'text-green-400', bg: 'bg-green-400/10' },
  { label: 'Dial Goal', value: '0 / 80', icon: Target, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { label: 'Revenue Today', value: '$0', icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { label: 'Monthly Revenue', value: '$0', icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { label: 'Monthly Goal', value: '$0 / $12,000', icon: Target, color: 'text-orange-400', bg: 'bg-orange-400/10' },
]

const pipeline = [
  { stage: 'New Lead', count: 0, color: 'bg-blue-500' },
  { stage: 'Voicemail', count: 0, color: 'bg-yellow-500' },
  { stage: 'Not Interested', count: 0, color: 'bg-red-500' },
  { stage: 'Appointment', count: 0, color: 'bg-purple-500' },
  { stage: 'Sold', count: 0, color: 'bg-green-500' },
  { stage: 'Lost', count: 0, color: 'bg-gray-500' },
]

const tasks = [
  { text: 'Hit gym before work', done: false, priority: 'high' },
  { text: 'Call 80 leads today', done: false, priority: 'high' },
  { text: 'Make $400 minimum', done: false, priority: 'high' },
  { text: 'Follow up on yesterday\'s appointments', done: false, priority: 'medium' },
]

export default function DashboardHome() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Good morning, Drew 💪</h2>
          <p className="text-gray-400 mt-1">{today} — Let's get after it</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">June Target</div>
          <div className="text-2xl font-bold text-green-400">$12,000</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={`${bg} p-2 rounded-lg`}>
                <Icon size={18} className={color} />
              </div>
              <span className="text-sm text-gray-400">{label}</span>
            </div>
            <div className="text-2xl font-bold">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Snapshot */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Users size={16} className="text-blue-400" />
            Pipeline Snapshot
          </h3>
          <div className="space-y-3">
            {pipeline.map(({ stage, count, color }) => (
              <div key={stage} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                  <span className="text-sm text-gray-300">{stage}</span>
                </div>
                <span className="text-sm font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Tasks */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle size={16} className="text-green-400" />
            Today's Non-Negotiables
          </h3>
          <div className="space-y-3">
            {tasks.map(({ text, done, priority }) => (
              <div key={text} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  done ? 'bg-green-500 border-green-500' : 'border-gray-600'
                }`}>
                  {done && <CheckCircle size={12} className="text-white" />}
                </div>
                <span className={`text-sm flex-1 ${done ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                  {text}
                </span>
                {priority === 'high' && (
                  <AlertCircle size={14} className="text-red-400" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's Appointments */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Calendar size={16} className="text-purple-400" />
          Today's Appointments
        </h3>
        <div className="text-center py-8 text-gray-500">
          <Calendar size={32} className="mx-auto mb-2 opacity-30" />
          <p>No appointments today</p>
          <p className="text-xs mt-1">Leads you convert will appear here</p>
        </div>
      </div>
    </div>
  )
}
