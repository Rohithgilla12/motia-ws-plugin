import { create } from 'zustand'
import type { WebSocketConnection, WebSocketMessage, WebSocketStats } from '../types/websocket'

interface WebSocketStore {
  connections: WebSocketConnection[]
  messages: WebSocketMessage[]
  selectedConnectionId: string | null
  stats: WebSocketStats

  // Actions
  setConnections: (connections: WebSocketConnection[]) => void
  addConnection: (connection: WebSocketConnection) => void
  updateConnection: (id: string, updates: Partial<WebSocketConnection>) => void
  removeConnection: (id: string) => void

  setMessages: (messages: WebSocketMessage[]) => void
  addMessage: (message: WebSocketMessage) => void
  clearMessages: (connectionId?: string) => void

  selectConnection: (id: string | null) => void
  updateStats: (stats: Partial<WebSocketStats>) => void
}

export const useWebSocketStore = create<WebSocketStore>((set) => ({
  connections: [],
  messages: [],
  selectedConnectionId: null,
  stats: {
    totalConnections: 0,
    activeConnections: 0,
    totalMessages: 0,
    messagesPerSecond: 0,
  },

  setConnections: (connections) => set({ connections }),
  addConnection: (connection) =>
    set((state) => ({ connections: [...state.connections, connection] })),
  updateConnection: (id, updates) =>
    set((state) => ({
      connections: state.connections.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),
  removeConnection: (id) =>
    set((state) => ({
      connections: state.connections.filter((c) => c.id !== id),
    })),

  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: (connectionId) =>
    set((state) => ({
      messages: connectionId
        ? state.messages.filter((m) => m.connectionId !== connectionId)
        : [],
    })),

  selectConnection: (id) => set({ selectedConnectionId: id }),
  updateStats: (stats) =>
    set((state) => ({ stats: { ...state.stats, ...stats } })),
}))
