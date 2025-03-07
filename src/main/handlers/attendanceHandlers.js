import { getDatabase } from '../database.js'

export function setupAttendanceHandlers(ipcMain) {
  // Get attendance with detailed student info
  ipcMain.handle('attendance:get', async (_, { month, year, section_id, teacher_id }) => {
    try {
      const db = getDatabase()
      
      let query = `
        SELECT 
          a.*,
          s.name as student_name,
          s.student_id as student_code,
          sec.name as section_name
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        LEFT JOIN sections sec ON s.section_id = sec.id
        WHERE strftime('%m', a.date) = ? 
        AND strftime('%Y', a.date) = ?
        AND s.teacher_id = ?
      `
      const params = [month, year, teacher_id]

      if (section_id) {
        query += ' AND s.section_id = ?'
        params.push(section_id)
      }

      query += ' ORDER BY a.date DESC, s.name ASC'

      const attendance = await new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        })
      })

      return { success: true, data: attendance }
    } catch (error) {
      console.error('Error fetching attendance:', error)
      return { success: false, error: error.message }
    }
  })

  // Mark attendance with bulk support
  ipcMain.handle('attendance:mark', async (_, { attendance_data, teacher_id }) => {
    try {
      const db = getDatabase()

      // Start a transaction
      await new Promise((resolve, reject) => {
        db.run('BEGIN TRANSACTION', (err) => {
          if (err) reject(err)
          else resolve()
        })
      })

      try {
        // Process each attendance record
        for (const record of attendance_data) {
          // Verify student belongs to teacher
          const student = await new Promise((resolve, reject) => {
            db.get(
              'SELECT id FROM students WHERE id = ? AND teacher_id = ?',
              [record.student_id, teacher_id],
              (err, row) => {
                if (err) reject(err)
                else resolve(row)
              }
            )
          })

          if (!student) {
            throw new Error(`Unauthorized: Student ${record.student_id} not found or access denied`)
          }

          // Update or insert attendance
          await new Promise((resolve, reject) => {
            db.run(
              `INSERT INTO attendance (student_id, date, status)
               VALUES (?, ?, ?)
               ON CONFLICT(student_id, date) 
               DO UPDATE SET status = ?`,
              [record.student_id, record.date, record.status, record.status],
              (err) => {
                if (err) reject(err)
                else resolve()
              }
            )
          })
        }

        // Commit transaction
        await new Promise((resolve, reject) => {
          db.run('COMMIT', (err) => {
            if (err) reject(err)
            else resolve()
          })
        })

        return { success: true }
      } catch (error) {
        // Rollback on error
        await new Promise((resolve) => {
          db.run('ROLLBACK', () => resolve())
        })
        throw error
      }
    } catch (error) {
      console.error('Error marking attendance:', error)
      return { success: false, error: error.message }
    }
  })

  // Get attendance statistics
  ipcMain.handle('attendance:stats', async (_, { student_id, teacher_id }) => {
    try {
      const db = getDatabase()
      
      const stats = await new Promise((resolve, reject) => {
        db.get(`
          SELECT 
            COUNT(*) as total_days,
            SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as present_days
          FROM attendance a
          JOIN students s ON a.student_id = s.id
          WHERE s.id = ? AND s.teacher_id = ?
        `, [student_id, teacher_id], (err, row) => {
          if (err) reject(err)
          else resolve(row)
        })
      })

      return { success: true, data: stats }
    } catch (error) {
      console.error('Error fetching attendance stats:', error)
      return { success: false, error: error.message }
    }
  })
} 