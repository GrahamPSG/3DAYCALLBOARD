'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, parseISO, isWeekend, addDays, startOfDay } from 'date-fns'
import { fetchBoardData } from '@/lib/api'
import { BoardType } from '@/types/board'
import { useState } from 'react'

interface UpdateDataRequest {
  date: string
  boardType: string
  techCount?: number
  actualJobs?: number
  agedOpps?: number
}

// Function to get only weekdays (Monday-Friday)
function getWeekdays(): Date[] {
  const today = startOfDay(new Date())
  const dates: Date[] = []
  
  // Start from yesterday and go forward
  let currentDate = addDays(today, -1)
  
  while (dates.length < 5) {
    if (!isWeekend(currentDate)) {
      dates.push(new Date(currentDate))
    }
    currentDate = addDays(currentDate, 1)
  }
  
  return dates
}

export default function Board() {
  const [darkMode, setDarkMode] = useState(false)
  const [editingCell, setEditingCell] = useState<{date: string, field: string, boardType: string} | null>(null)
  const [editValue, setEditValue] = useState('')
  
  const queryClient = useQueryClient()
  
  const { data: boardData, isLoading, error } = useQuery({
    queryKey: ['board'],
    queryFn: fetchBoardData,
    refetchInterval: 2 * 60 * 1000,
  })

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateDataRequest) => {
      const key = new URLSearchParams(window.location.search).get('key')
      const response = await fetch(`/api/day/update?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to update')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] })
      setEditingCell(null)
    }
  })

  const handleCellClick = (date: string, field: string, boardType: string, currentValue: any) => {
    // Don't allow editing locked days
    const boardKey = boardType.toLowerCase() as 'hvac' | 'plumbing'
    if (boardData?.[boardKey]?.[date]?.locked) return
    
    setEditingCell({ date, field, boardType })
    setEditValue(String(currentValue || 0))
  }

  const handleSave = () => {
    if (!editingCell) return
    
    const value = parseInt(editValue) || 0
    const updateData: UpdateDataRequest = {
      date: editingCell.date,
      boardType: editingCell.boardType
    }
    
    if (editingCell.field === 'techCount') updateData.techCount = value
    if (editingCell.field === 'actualJobs') updateData.actualJobs = value  
    if (editingCell.field === 'agedOpps') updateData.agedOpps = value
    
    updateMutation.mutate(updateData)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') setEditingCell(null)
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading call board...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="text-center text-red-600">
          <div className="text-xl mb-2">⚠️</div>
          <div className="font-medium">Failed to load board data</div>
          <div className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        </div>
      </div>
    )
  }

  if (!boardData) return null

  const weekdays = getWeekdays()
  const dayLabels = ['Yesterday', 'Today', 'Tomorrow', '+2 Days', '+3 Days']

  const renderBoardSection = (title: string, boardType: string, bgColor: string) => {
    const boardData_typed = boardData[boardType.toLowerCase() as 'hvac' | 'plumbing']
    
    return (
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6 mb-8 ${bgColor}`}>
        <h2 className={`text-2xl font-bold mb-6 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          {title} Board
        </h2>
        
        <div className="grid grid-cols-5 gap-4">
          {weekdays.map((date, index) => {
            const dateStr = format(date, 'yyyy-MM-dd')
            const dayData = boardData_typed[dateStr]
            const isToday = index === 1
            const isLocked = dayData?.locked
            
            return (
              <div
                key={dateStr}
                className={`p-4 rounded-lg border-2 ${
                  isToday 
                    ? `border-blue-500 ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}` 
                    : isLocked 
                      ? `border-yellow-400 ${darkMode ? 'bg-gray-600' : 'bg-yellow-50'}`
                      : `border-gray-200 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`
                } transition-all hover:shadow-md`}
              >
                <div className="text-center mb-3">
                  <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {dayLabels[index]}
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {format(date, 'MMM d')}
                  </div>
                  <div className={`text-xs font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    Target: {boardData.targets[dateStr] || 0}%
                  </div>
                </div>

                {/* Editable Fields */}
                <div className="space-y-2 text-sm">
                  {/* Techs */}
                  <div className="flex justify-between items-center">
                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Techs:</span>
                    <span 
                      className={`font-medium cursor-pointer px-2 py-1 rounded ${
                        !isLocked ? 'hover:bg-blue-100 hover:text-blue-800' : ''
                      } ${darkMode ? 'text-white hover:bg-gray-600' : ''}`}
                      onClick={() => handleCellClick(dateStr, 'techCount', boardType, dayData?.techCount)}
                    >
                      {editingCell?.date === dateStr && editingCell?.field === 'techCount' ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleSave}
                          onKeyDown={handleKeyPress}
                          className="w-16 text-center border rounded px-1"
                          autoFocus
                        />
                      ) : (
                        dayData?.techCount || 0
                      )}
                    </span>
                  </div>

                  {/* Actual Jobs */}
                  <div className="flex justify-between items-center">
                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Actual:</span>
                    <span 
                      className={`font-medium cursor-pointer px-2 py-1 rounded ${
                        !isLocked ? 'hover:bg-blue-100 hover:text-blue-800' : ''
                      } ${darkMode ? 'text-white hover:bg-gray-600' : ''}`}
                      onClick={() => handleCellClick(dateStr, 'actualJobs', boardType, dayData?.actualJobs)}
                    >
                      {editingCell?.date === dateStr && editingCell?.field === 'actualJobs' ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleSave}
                          onKeyDown={handleKeyPress}
                          className="w-16 text-center border rounded px-1"
                          autoFocus
                        />
                      ) : (
                        dayData?.actualJobs || 0
                      )}
                    </span>
                  </div>

                  {/* Min Goal */}
                  <div className="flex justify-between items-center">
                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Min Goal:</span>
                    <span className={`font-medium ${darkMode ? 'text-white' : ''}`}>
                      {dayData?.minGoal || 0}
                    </span>
                  </div>

                  {/* Variance */}
                  <div className="flex justify-between items-center">
                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Variance:</span>
                    <span className={`font-medium ${
                      (dayData?.variance || 0) > 0 ? 'text-green-600' : 
                      (dayData?.variance || 0) < 0 ? 'text-red-600' : 
                      darkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      {(dayData?.variance || 0) > 0 ? '+' : ''}{dayData?.variance || 0}
                    </span>
                  </div>
                </div>
                
                <div className="border-t pt-2 mt-2">
                  {/* Aged/TO Opp */}
                  <div className="flex justify-between items-center text-sm">
                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Aged/TO Opp:</span>
                    <span 
                      className={`font-medium cursor-pointer px-2 py-1 rounded ${
                        !isLocked ? 'hover:bg-blue-100 hover:text-blue-800' : ''
                      } ${darkMode ? 'text-white hover:bg-gray-600' : ''}`}
                      onClick={() => handleCellClick(dateStr, 'agedOpps', boardType, dayData?.agedOpps)}
                    >
                      {editingCell?.date === dateStr && editingCell?.field === 'agedOpps' ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleSave}
                          onKeyDown={handleKeyPress}
                          className="w-16 text-center border rounded px-1"
                          autoFocus
                        />
                      ) : (
                        dayData?.agedOpps || 0
                      )}
                    </span>
                  </div>
                  
                  {/* Aged/TO Opp % */}
                  <div className="flex justify-between items-center text-sm">
                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Aged/TO Opp%:</span>
                    <span className={`font-medium ${
                      (dayData?.agedPercent || 0) >= 33 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(dayData?.agedPercent || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {isLocked && (
                  <div className={`text-xs p-2 rounded mt-2 ${
                    darkMode ? 'text-yellow-400 bg-gray-600' : 'text-yellow-700 bg-yellow-100'
                  }`}>
                    🔒 This day is locked
                  </div>
                )}

                {/* Weather for today, tomorrow, +2 */}
                {index >= 1 && index <= 3 && boardData.weather[dateStr] && (
                  <div className={`mt-2 text-center border-t pt-2 ${darkMode ? 'border-gray-600' : ''}`}>
                    <div className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Weather</div>
                    <div className={`text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      {Math.round(boardData.weather[dateStr].low)}° / {Math.round(boardData.weather[dateStr].high)}°
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border-b ${darkMode ? 'border-gray-700' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                3-Day Minimum Call Board
              </h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Paris Service Group • Auto-updates every 2 minutes
              </p>
            </div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Updated: {format(new Date(), 'h:mm a')}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Day headers */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {dayLabels.map((label, index) => (
            <div 
              key={label}
              className={`text-center py-3 px-4 rounded-lg font-medium text-sm ${
                index === 1 
                  ? `${darkMode ? 'bg-blue-800 text-white' : 'bg-blue-600 text-white'}` 
                  : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`
              }`}
            >
              {label}
            </div>
          ))}
        </div>

        {/* HVAC Board with light red background */}
        {renderBoardSection('HVAC', 'HVAC', darkMode ? 'bg-red-900/20' : 'bg-red-50/50')}
        
        {/* Plumbing Board with light blue background */}
        {renderBoardSection('Plumbing', 'PLUMBING', darkMode ? 'bg-blue-900/20' : 'bg-blue-50/50')}

        {/* Improved Legend */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6 mt-8`}>
          <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Legend</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded ${darkMode ? 'bg-green-600' : 'bg-green-200'}`}></div>
              <span className={`font-medium text-sm ${darkMode ? 'text-green-400' : 'text-green-700'}`}>On/Above Target</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded ${darkMode ? 'bg-red-600' : 'bg-red-200'}`}></div>
              <span className={`font-medium text-sm ${darkMode ? 'text-red-400' : 'text-red-700'}`}>Below Target</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded ${darkMode ? 'bg-yellow-600' : 'bg-yellow-200'}`}></div>
              <span className={`font-medium text-sm ${darkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>Locked Day</span>
            </div>
          </div>
          
          <div className={`text-sm space-y-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <div className="font-medium">• Minimum Goal = Tech Count × 3</div>
            <div className="font-medium">• Variance = Actual Jobs - Minimum Goal</div>
            <div className="font-medium">• Aged/TO Opp % = (Aged Opportunities ÷ Actual Jobs) × 100</div>
            <div className="font-medium">• Targets: Yesterday/Today=100%, Tomorrow=66%, +2=33%, +3=15%</div>
          </div>
        </div>

        {/* Dark/Light Mode Toggle */}
        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`px-4 py-2 rounded-full shadow-lg font-medium transition-all ${
              darkMode 
                ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400' 
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
      </main>
    </div>
  )
}