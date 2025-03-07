import { getDatabase } from '../database.js'
import bcrypt from 'bcryptjs'

export function setupSettingsHandlers(ipcMain) {
  // Update user settings
  ipcMain.handle('settings:update', async (_, { user_id, settings_data }) => {
    try {
      const db = getDatabase()
      
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE users SET username = ?, email = ? WHERE id = ?',
          [settings_data.username, settings_data.email, user_id],
          (err) => {
            if (err) reject(err)
            else resolve()
          }
        )
      })

      return { success: true }
    } catch (error) {
      console.error('Error updating settings:', error)
      return { success: false, error: error.message }
    }
  })

  // Change password
  ipcMain.handle('settings:changePassword', async (_, { user_id, old_password, new_password }) => {
    try {
      const db = getDatabase()
      
      // Verify old password
      const user = await new Promise((resolve, reject) => {
        db.get(
          'SELECT password FROM users WHERE id = ?',
          [user_id],
          (err, row) => {
            if (err) reject(err)
            else resolve(row)
          }
        )
      })

      const isValid = await bcrypt.compare(old_password, user.password)
      if (!isValid) {
        return {
          success: false,
          error: 'Current password is incorrect'
        }
      }

      // Update password
      const hashedPassword = await bcrypt.hash(new_password, 10)
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE users SET password = ? WHERE id = ?',
          [hashedPassword, user_id],
          (err) => {
            if (err) reject(err)
            else resolve()
          }
        )
      })

      return { success: true }
    } catch (error) {
      console.error('Error changing password:', error)
      return { success: false, error: error.message }
    }
  })
} 