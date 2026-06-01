'use client'
import { useState } from 'react'
import { Phone, PhoneOff, PhoneMissed, PhoneCall, User, Clock } from 'lucide-react'

const mockQueue = [
  { id: '1', name: 'John Smith', phone: '(602) 555-0101', source: 'Meta Ads', attempts: 0 },
  { id: '2', name: 'Sarah Johnson', phone: '(480) 555-0202', source: 'Pinnacle', attempts: 1 },
  { id: '3', name: 'Mike Davis', phone: '(623) 555-0303', source: 'Google Sheets', attempts: 0 },
  { id: '4', name: 'Lisa Wilson', phone: '(480) 555-0404', source: 'Meta Ads', attempts: 2 },
]

export default function Dialer() {
  const [calling, setCalling] = useState(false)
  const [currentLead, setCurrentLead] = useState(mockQueue[0])
  const [callLog, setCallLog] = useState<{ name: string; outcome: string; time: string }[]>([])

  const logCall = (outcome: string) => {
    setCallLog(prev => [{
      name: currentLead.name,
      outcome,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    }, ...prev])
    setCalling(false)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Power Dialer</h2>
          <p className="text-gray-400 text-sm mt-1">All calls go through (928) 291-0777</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-400">{callLog.length}</div>
          <div className="text-xs text-gray-400">Dials Today</div>
        </div>
      </div>

      {/* Active Call Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
            <User size={28} className="text-gray-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold">{currentLead.name}</h3>
            <div className="text-lg text-gray-300">{currentLead.phone}</div>
            <div className="text-sm text-gray-500">{currentLead.source} • {currentLead.attempts} previous attempts</div>
          </div>
          {calling && (
            <div className="ml-auto flex items-center gap-2 text-green-400">
              <PhoneCall size={16} className="animate-pulse" />
              <span className="text-sm">Calling...</span>
            </div>
          )}
        </div>

        {!calling ? (
          <button
            onClick={() => setCalling(true)}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 text-lg transition-colors"
          >
            <Phone size={24} /> Call Now
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => logCall('✅ Sold')} className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-sm font-medium transition-colors">✅ Sold</button>
            <button onClick={() => logCall('📅 Appointment')} className="bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl text-sm font-medium transition-colors">📅 Appointment</button>
            <button onClick={() => logCall('📵 Voicemail')} className="bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded-xl text-sm font-medium transition-colors">📵 Voicemail</button>
            <button onClick={() => logCall('🔴 Not Interested')} className="bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl text-sm font-medium transition-colors">🔴 Not Interested</button>
            <button onClick={() => logCall('📞 Callback')} className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-sm font-medium transition-colors">📞 Callback</button>
            <button onClick={() => logCall('❌ No Answer')} className="bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-xl text-sm font-medium transition-colors">❌ No Answer</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Queue */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold mb-4 text-gray-300">Call Queue ({mockQueue.length})</h3>
          <div className="space-y-2">
            {mockQueue.map((lead, i) => (
              <div key={lead.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${i === 0 ? 'bg-blue-500/10 border border-blue-500/30' : 'hover:bg-gray-800'}`}>
                <div className="text-xs text-gray-500 w-5">{i + 1}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{lead.name}</div>
                  <div className="text-xs text-gray-500">{lead.phone} • {lead.source}</div>
                </div>
                {lead.attempts > 0 && (
                  <span className="text-xs text-yellow-400">{lead.attempts}x</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Call Log */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold mb-4 text-gray-300">Today's Call Log</h3>
          {callLog.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <Phone size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No calls yet today</p>
            </div>
          ) : (
            <div className="space-y-2">
              {callLog.map((log, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div>
                    <div className="text-sm font-medium">{log.name}</div>
                    <div className="text-xs text-gray-400">{log.outcome}</div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock size={10} />
                    {log.time}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
