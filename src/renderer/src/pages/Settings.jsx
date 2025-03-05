import { useState, useEffect } from 'react'

const Settings = () => {
  const [dbPath, setDbPath] = useState('')

  useEffect(() => {
    const getPath = async () => {
      const path = await window.electron.ipcRenderer.invoke('get:dbPath')
      setDbPath(path)
    }
    getPath()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-sm text-gray-600">Manage application settings and configurations</p>
        </div>

        {/* Database Settings Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Database Configuration</h2>
            <p className="text-sm text-gray-500 mb-4">View and manage database connection settings</p>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Database Location</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 font-mono text-sm bg-white px-4 py-2.5 rounded border border-gray-200 text-gray-600">
                    {dbPath}
                  </div>
                  <button 
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    onClick={() => {
                      // Add copy to clipboard functionality if needed
                      navigator.clipboard.writeText(dbPath)
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Add more settings sections here */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">About</h2>
            <p className="text-sm text-gray-500 mb-4">Application information and version details</p>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2">
                <div className="text-sm text-gray-600">Version</div>
                <div className="text-sm font-medium text-gray-900">1.0.0</div>
              </div>
              <div className="flex justify-between items-center py-2">
                <div className="text-sm text-gray-600">Last Updated</div>
                <div className="text-sm font-medium text-gray-900">{new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings;


