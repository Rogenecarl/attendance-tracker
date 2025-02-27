import { getStudents, addStudent, updateStudent, deleteStudent } from '../database.js'

export function setupStudentHandlers(ipcMain) {
  ipcMain.handle('students:get', async () => {
    try {
      const students = await getStudents()
      return { success: true, data: students }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('students:add', async (event, studentData) => {
    try {
      const result = await addStudent(studentData)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('students:update', async (event, { id, ...studentData }) => {
    try {
      const result = await updateStudent(id, studentData)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('students:delete', async (event, id) => {
    try {
      await deleteStudent(id)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })
} 