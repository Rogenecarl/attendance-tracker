import { getAttendanceStats } from '../database'

export function setupDashboardHandlers(ipcMain) {
  ipcMain.handle('dashboard:getData', async (event, { month, year, section_id }) => {
    try {
      console.log('Dashboard getData request:', { month, year, section_id })
      const data = await getAttendanceStats(month, year, section_id)
      console.log('Dashboard getData response:', data)
      return { success: true, data }
    } catch (error) {
      console.error('Error getting dashboard data:', error)
      return { success: false, error: error.message }
    }
  })
} 