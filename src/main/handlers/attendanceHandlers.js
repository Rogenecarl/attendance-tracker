import { getAttendance, markAttendance, getAttendanceByDateRange } from '../database'

export function setupAttendanceHandlers(ipcMain) {
  ipcMain.handle('attendance:get', async (event, { month, year, section_id }) => {
    try {
      console.log('Attendance get request:', { month, year, section_id })
      const attendance = await getAttendance(month, year, section_id)
      console.log('Attendance get response:', attendance)
      return { success: true, data: attendance }
    } catch (error) {
      console.error('Error getting attendance:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('attendance:mark', async (event, attendanceData) => {
    try {
      console.log('Marking attendance:', attendanceData)
      const result = await markAttendance(attendanceData)
      console.log('Mark attendance result:', result)
      return { success: true, data: result }
    } catch (error) {
      console.error('Error marking attendance:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('attendance:getByDateRange', async (event, { startDate, endDate, section_id }) => {
    try {
      console.log('Getting attendance by date range:', { startDate, endDate, section_id })
      const attendance = await getAttendanceByDateRange(startDate, endDate, section_id)
      console.log('Date range attendance response:', attendance)
      return { success: true, data: attendance }
    } catch (error) {
      console.error('Error getting attendance by date range:', error)
      return { success: false, error: error.message }
    }
  })
} 