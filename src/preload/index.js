import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Define valid channels
const validChannels = [
  'auth:register',
  'auth:login',
  'students:get',
  'students:add',
  'students:update',
  'students:delete',
  'sections:get',
  'sections:add',
  'sections:update',
  'sections:delete',
  'attendance:get',
  'attendance:mark',
  'attendance:getByDateRange',
  'dashboard:getData',
  'get:dbPath',
  'get:currentUser',
  'update:user',
  'change:password',
  'settings:update',
  'settings:changePassword'
]

// Custom APIs for renderer
const api = {
  // IPC communication
  send: (channel, data) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data)
    }
  },
  invoke: (channel, data) => {
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data)
    }
    return Promise.reject(new Error(`Invalid channel: ${channel}`))
  },
  receive: (channel, func) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_, ...args) => func(...args))
    }
  },
  // Auth specific methods
  auth: {
    register: (data) => ipcRenderer.invoke('auth:register', data),
    login: (data) => ipcRenderer.invoke('auth:login', data)
  }
}

// Expose protected APIs
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('electron', electronAPI)
  } catch (error) {
    console.error('Error exposing API:', error)
  }
} else {
  window.api = api
  window.electron = electronAPI
}
