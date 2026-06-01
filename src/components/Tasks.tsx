'use client'
import { useState } from 'react'
import { CheckCircle, Circle, AlertCircle, Plus } from 'lucide-react'

interface Task {
  id: string
  text: string
  done: boolean
  priority: 'high' | 'medium' | 'low'
  category: 'non_negotiable' | 'business' | 'personal'
}

const defaultTasks: Task[] = [
  { id: '1', text: '🏋️ Hit the gym', done: false, priority: 'high', category: 'non_negotiable' },
  { id: '2', text: '💰 Make $400 minimum today', done: false, priority: 'high', category: 'non_negotiable' },
  { id: '3', text: '📞 Dial 80 leads', done: false, priority: 'high', category: 'non_negotiable' },
  { id: '4', text: 'Follow up on open leads', done: false, priority: 'medium', category: 'business' },
  { id: '5', text: 'Check Meta ads performance', done: false, priority: 'medium', category: 'business' },
  { id: '6', text: 'Review new Pinnacle leads', done: false, priority: 'medium', category: 'business' },
]

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>(defaultTasks)

  const toggle = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  const completed = tasks.filter(t => t.done).length
  const pct = Math.round((completed / tasks.length) * 100)

  const nonNeg = tasks.filter(t => t.category === 'non_negotiable')
  const business = tasks.filter(t => t.category === 'business')
  const personal = tasks.filter(t => t.category === 'personal')

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Today's Tasks</h2>
        <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus size={16} /> Add Task
        </button>
      </div>

      {/* Progress */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-400">Daily Progress</span>
          <span className="text-sm font-bold">{completed}/{tasks.length} done</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-3">
          <div
            className="bg-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-gray-500">{pct}% complete {pct === 100 ? '🔥 CRUSHED IT!' : ''}</div>
      </div>

      {/* Non-Negotiables */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wide flex items-center gap-2">
          <AlertCircle size={14} /> Non-Negotiables
        </h3>
        {nonNeg.map(task => (
          <TaskRow key={task.id} task={task} onToggle={toggle} />
        ))}
      </div>

      {/* Business */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide">Business Tasks</h3>
        {business.map(task => (
          <TaskRow key={task.id} task={task} onToggle={toggle} />
        ))}
      </div>

      {personal.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wide">Personal</h3>
          {personal.map(task => (
            <TaskRow key={task.id} task={task} onToggle={toggle} />
          ))}
        </div>
      )}
    </div>
  )
}

function TaskRow({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) {
  return (
    <button
      onClick={() => onToggle(task.id)}
      className="w-full flex items-center gap-3 bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-4 transition-all text-left"
    >
      {task.done ? (
        <CheckCircle size={20} className="text-green-400 shrink-0" />
      ) : (
        <Circle size={20} className="text-gray-600 shrink-0" />
      )}
      <span className={`flex-1 text-sm ${task.done ? 'line-through text-gray-500' : 'text-white'}`}>
        {task.text}
      </span>
      {task.priority === 'high' && !task.done && (
        <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">HIGH</span>
      )}
    </button>
  )
}
