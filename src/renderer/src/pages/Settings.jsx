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
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Settings</h2>
      <div className="bg-gray-100 p-4 rounded">
        <h3 className="font-medium mb-2">Database Location:</h3>
        <p className="font-mono text-sm">{dbPath}</p>
      </div>
    </div>
  )
}

export default Settings;


