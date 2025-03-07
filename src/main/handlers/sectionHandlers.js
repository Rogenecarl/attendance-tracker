import { getDatabase } from '../database.js'

export function setupSectionHandlers(ipcMain) {
  // Get sections (filtered by teacher_id)
  ipcMain.handle('sections:get', async (_, { teacher_id }) => {
    try {
      const db = getDatabase()
      
      const sections = await new Promise((resolve, reject) => {
        db.all(
          `SELECT DISTINCT s.*
           FROM sections s
           JOIN students st ON s.id = st.section_id
           WHERE st.teacher_id = ?
           ORDER BY s.name`,
          [teacher_id],
          (err, rows) => {
            if (err) reject(err)
            else resolve(rows)
          }
        )
      })

      return { success: true, data: sections }
    } catch (error) {
      console.error('Error fetching sections:', error)
      return { success: false, error: error.message }
    }
  })

  // Add section (admin only)
  ipcMain.handle('sections:add', async (_, { section_data, user_role }) => {
    if (user_role !== 'admin') {
      return {
        success: false,
        error: 'Unauthorized: Only admins can add sections'
      }
    }

    try {
      const db = getDatabase()
      
      const result = await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO sections (name, schedule) VALUES (?, ?)',
          [section_data.name, section_data.schedule],
          function(err) {
            if (err) reject(err)
            else resolve(this)
          }
        )
      })

      return { 
        success: true, 
        data: { id: result.lastID, ...section_data } 
      }
    } catch (error) {
      console.error('Error adding section:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('sections:update', async (event, { id, ...sectionData }) => {
    try {
      const result = await updateSection(id, sectionData)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('sections:delete', async (event, id) => {
    try {
      await deleteSection(id)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })
} 