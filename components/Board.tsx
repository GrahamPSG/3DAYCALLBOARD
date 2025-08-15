'use client'

import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { fetchBoardData } from '@/lib/api'
import { BoardType } from '@/types/board'

export default function Board() {
  const { data: boardData, isLoading, error } = useQuery({
    queryKey: ['board'],
    queryFn: fetchBoardData,
    refetchInterval: 2 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading call board...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <div className="text-xl mb-2">⚠️</div>
          <div className="font-medium">Failed to load board data</div>
          <div className="text-sm text-gray-600 mt-2">
            {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        </div>
      </div>
    )
  }

  if (!boardData) return null

  const renderBoardSection = (title: string, boardType: BoardType) => {
    const boardData_typed = boardData[boardType.toLowerCase() as 'hvac' | 'plumbing']
    
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {title} Board
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {boardData.days.map((date, index) => (
            <div
              key={`${boardType}-${date}`}
              className={`border rounded-lg p-4 ${
                boardData_typed[date]?.greyed ? 'opacity-50 bg-gray-50' : ''
              } ${
                boardData_typed[date]?.locked ? 'bg-yellow-50 border-yellow-200' : ''
              } ${
                date === boardData.days[1] ? 'ring-2 ring-blue-300' : ''
              }`}
            >
              <div className="text-center mb-3">
                <div className="text-sm font-semibold text-gray-600">
                  {format(parseISO(date), 'EEE')}
                </div>
                <div className="text-xs text-gray-500">
                  {format(parseISO(date), 'MMM d')}
                </div>
                <div className="text-xs text-blue-600 font-medium">
                  Target: {boardData.targets[date]}%
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Techs:</span>
                  <span className="font-medium">{boardData_typed[date]?.techCount || 0}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Actual:</span>
                  <span className={`font-medium ${
                    (boardData_typed[date]?.actualJobs || 0) >= (boardData_typed[date]?.minGoal || 0) 
                      ? 'text-green-600' : 'text-gray-900'
                  }`}>
                    {boardData_typed[date]?.actualJobs || 0}
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Min Goal:</span>
                  <span className="font-medium text-blue-600">{boardData_typed[date]?.minGoal || 0}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Variance:</span>
                  <span className={`font-medium ${
                    (boardData_typed[date]?.variance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(boardData_typed[date]?.variance || 0) > 0 ? '+' : ''}{boardData_typed[date]?.variance || 0}
                  </span>
                </div>
                
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Aged:</span>
                    <span className="font-medium">{boardData_typed[date]?.agedOpps || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Aged %:</span>
                    <span className={`font-medium ${
                      (boardData_typed[date]?.agedPercent || 0) >= 33 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(boardData_typed[date]?.agedPercent || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {boardData_typed[date]?.locked && (
                  <div className="text-xs text-yellow-700 bg-yellow-100 p-2 rounded mt-2">
                    🔒 This day is locked
                  </div>
                )}
              </div>

              {/* Weather for today, tomorrow, +2 */}
              {index >= 1 && index <= 3 && boardData.weather[date] && (
                <div className="mt-2 text-center border-t pt-2">
                  <div className="text-xs text-gray-600 mb-1">Weather</div>
                  <div className="text-sm font-medium text-blue-600">
                    {Math.round(boardData.weather[date].low)}° / {Math.round(boardData.weather[date].high)}°
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                3-Day Minimum Call Board
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Paris Service Group • Auto-updates every 2 minutes
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {boardData.unlockSession && (
                <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                  🔓 Yesterday unlocked ({boardData.unlockSession.remainingSeconds}s remaining)
                </div>
              )}
              
              <div className="text-sm text-gray-500">
                Updated: {format(parseISO(boardData.serverTime), 'h:mm a')}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex bg-blue-100 rounded-lg p-1">
            {['Yesterday', 'Today', 'Tomorrow', '+2 Days', '+3 Days'].map((label, index) => (
              <div
                key={label}
                className={`px-3 py-1 text-sm font-medium rounded ${
                  index === 1 
                    ? 'bg-blue-500 text-white' 
                    : 'text-blue-700'
                }`}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {renderBoardSection('HVAC', 'HVAC')}
        {renderBoardSection('Plumbing', 'PLUMBING')}

        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Legend</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span>On/Above Target</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
              <span>Below Target</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
              <span>Locked Day</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded opacity-50"></div>
              <span>Future Day (+3)</span>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-600">
            <p>• Minimum Goal = Tech Count × 3</p>
            <p>• Variance = Actual Jobs - Minimum Goal</p>
            <p>• Aged % = (Aged Opportunities ÷ Actual Jobs) × 100</p>
            <p>• Target %: Yesterday/Today=100%, Tomorrow=66%, +2=33%, +3=15%</p>
          </div>
        </div>
      </main>
    </div>
  )
}