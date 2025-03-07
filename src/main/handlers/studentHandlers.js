import { getDatabase } from '../database.js'

export function setupStudentHandlers(ipcMain) {
  // Get students (filtered by teacher_id)
  ipcMain.handle('students:get', async (_, { teacher_id }) => {
    try {
      const db = getDatabase()
      
      const students = await new Promise((resolve, reject) => {
        db.all(
          `SELECT 
            students.*,
            sections.name as section_name,
            sections.schedule as section_schedule
          FROM students 
          LEFT JOIN sections ON students.section_id = sections.id
          WHERE students.teacher_id = ?
          ORDER BY students.created_at DESC`,
          [teacher_id],
          (err, rows) => {
            if (err) reject(err)
            else resolve(rows)
          }
        )
      })

      return { success: true, data: students }
    } catch (error) {
      console.error('Error fetching students:', error)
      return { success: false, error: error.message }
    }
  })

  // Add student (with teacher_id)
  ipcMain.handle('students:add', async (_, { student_data, teacher_id }) => {
    try {
      const db = getDatabase()
      
      const result = await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO students (
            student_id, 
            name, 
            section_id, 
            teacher_id,
            schedule
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            student_data.student_id,
            student_data.name,
            student_data.section_id,
            teacher_id,
            student_data.schedule
          ],
          function(err) {
            if (err) reject(err)
            else resolve(this)
          }
        )
      })

      return { 
        success: true, 
        data: { id: result.lastID, ...student_data } 
      }
    } catch (error) {
      console.error('Error adding student:', error)
      return { success: false, error: error.message }
    }
  })

  // Update student (with teacher verification)
  ipcMain.handle('students:update', async (_, { id, student_data, teacher_id }) => {
    try {
      const db = getDatabase()

      // Verify the student belongs to this teacher
      const student = await new Promise((resolve, reject) => {
        db.get(
          'SELECT id FROM students WHERE id = ? AND teacher_id = ?',
          [id, teacher_id],
          (err, row) => {
            if (err) reject(err)
            else resolve(row)
          }
        )
      })

      if (!student) {
        return {
          success: false,
          error: 'Unauthorized: Student not found or access denied'
        }
      }

      await new Promise((resolve, reject) => {
        db.run(
          `UPDATE students 
          SET student_id = ?, name = ?, section_id = ?, schedule = ?
          WHERE id = ? AND teacher_id = ?`,
          [
            student_data.student_id,
            student_data.name,
            student_data.section_id,
            student_data.schedule,
            id,
            teacher_id
          ],
          (err) => {
            if (err) reject(err)
            else resolve()
          }
        )
      })

      return { success: true }
    } catch (error) {
      console.error('Error updating student:', error)
      return { success: false, error: error.message }
    }
  })

  // Delete student (with teacher verification)
  ipcMain.handle('students:delete', async (_, { id, teacher_id }) => {
    try {
      const db = getDatabase()

      // Verify the student belongs to this teacher
      const student = await new Promise((resolve, reject) => {
        db.get(
          'SELECT id FROM students WHERE id = ? AND teacher_id = ?',
          [id, teacher_id],
          (err, row) => {
            if (err) reject(err)
            else resolve(row)
          }
        )
      })

      if (!student) {
        return {
          success: false,
          error: 'Unauthorized: Student not found or access denied'
        }
      }

      await new Promise((resolve, reject) => {
        db.run(
          'DELETE FROM students WHERE id = ? AND teacher_id = ?',
          [id, teacher_id],
          (err) => {
            if (err) reject(err)
            else resolve()
          }
        )
      })

      return { success: true }
    } catch (error) {
      console.error('Error deleting student:', error)
      return { success: false, error: error.message }
    }
  })
} 