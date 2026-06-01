'use client'
import { LayoutDashboard, Users, Calendar, CheckSquare, Phone } from 'lucide-react'
import type { View } from './Dashboard'

const nav = [
  { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
  { id: 'pipeline', label: 'Lead Pipeline', icon: Users },
  { id: 'appointments', label: 'Appointments', icon: Calendar },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'dialer', label: 'Power Dialer', icon: Phone },
]

export default function Sidebar({ currentView, setView }: { currentView: View; setView: (v: View) => void }) {
  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white">Drew CRM</h1>
        <p className="text-xs text-gray-400 mt-1">Insurance Command Center</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {nav.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setView(id as View)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              currentView === id
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <div className="text-xs text-gray-500">Drew Clock</div>
        <div className="text-xs text-green-400">● System Active</div>
      </div>
    </aside>
  )
}
