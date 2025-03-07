import { getDatabase, getAttendanceStats } from '../database.js'

export function setupDashboardHandlers(ipcMain) {
  ipcMain.handle('dashboard:getData', async (_, { teacher_id }) => {
    try {
      if (!teacher_id) {
        throw new Error('Teacher ID is required')
      }

      const stats = await getAttendanceStats(teacher_id)
      
      return {
        success: true,
        data: stats
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      return { 
        success: false, 
        error: error.message || 'Failed to fetch dashboard data'
      }
    }
  })
} 