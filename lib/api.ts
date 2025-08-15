import { BoardData, UpdateDayRequest } from '@/types/board'

function getApiKey(): string {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('key') || 'development-secret-key-replace-in-production'
  }
  return process.env.SECRET_URL_KEY || 'development-secret-key-replace-in-production'
}

export async function fetchBoardData(): Promise<BoardData> {
  const apiKey = getApiKey()
  const response = await fetch(`/api/board?key=${apiKey}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch board data')
  }
  
  return response.json()
}