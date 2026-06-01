'use client'
import { useState } from 'react'
import Sidebar from './Sidebar'
import DashboardHome from './DashboardHome'
import LeadPipeline from './LeadPipeline'
import Appointments from './Appointments'
import Tasks from './Tasks'
import Dialer from './Dialer'

export type View = 'dashboard' | 'pipeline' | 'appointments' | 'tasks' | 'dialer'

export default function Dashboard() {
  const [view, setView] = useState<View>('dashboard')

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      <Sidebar currentView={view} setView={setView} />
      <main className="flex-1 overflow-y-auto">
        {view === 'dashboard' && <DashboardHome />}
        {view === 'pipeline' && <LeadPipeline />}
        {view === 'appointments' && <Appointments />}
        {view === 'tasks' && <Tasks />}
        {view === 'dialer' && <Dialer />}
      </main>
    </div>
  )
}
