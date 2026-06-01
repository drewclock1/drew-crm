'use client'
import { Calendar, Clock, User, Video, Phone } from 'lucide-react'

const mockAppts = [
  { id: '1', name: 'Sarah Johnson', time: '2:00 PM', type: 'google_meet', phone: '(480) 555-0202', source: 'Pinnacle', notes: 'Interested in term life' },
  { id: '2', name: 'Mike Davis', time: '4:00 PM', type: 'phone', phone: '(602) 555-0303', source: 'Meta Ads', notes: 'Comparing rates' },
]

export default function Appointments() {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Appointments</h2>
          <p className="text-gray-400 text-sm mt-1">{today}</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          + Book Appointment
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-purple-400">{mockAppts.length}</div>
          <div className="text-sm text-gray-400 mt-1">Today</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-green-400">0</div>
          <div className="text-sm text-gray-400 mt-1">Sold</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-blue-400">0</div>
          <div className="text-sm text-gray-400 mt-1">This Week</div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-gray-300">Today's Schedule</h3>
        {mockAppts.map(appt => (
          <div key={appt.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-4">
            <div className="text-center min-w-16">
              <div className="text-lg font-bold text-white">{appt.time}</div>
              <div className="text-xs text-gray-500">Today</div>
            </div>
            <div className="w-px h-12 bg-gray-700" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <User size={14} className="text-gray-400" />
                <span className="font-medium">{appt.name}</span>
                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{appt.source}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                {appt.type === 'google_meet' ? (
                  <span className="flex items-center gap-1"><Video size={12} /> Google Meet</span>
                ) : (
                  <span className="flex items-center gap-1"><Phone size={12} /> Phone Call</span>
                )}
                <span>{appt.phone}</span>
              </div>
              {appt.notes && <div className="text-xs text-gray-500 mt-1">{appt.notes}</div>}
            </div>
            <div className="flex gap-2">
              <button className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-2 rounded-lg transition-colors">
                Mark Sold
              </button>
              <button className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-2 rounded-lg transition-colors">
                Reschedule
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
