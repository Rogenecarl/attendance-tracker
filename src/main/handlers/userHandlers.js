import { getDatabase } from '../database'

export function setupUserHandlers(ipcMain) {
  // Get current user data
  ipcMain.handle('get:currentUser', async () => {
    try {
      const db = getDatabase()
      
      // First check if there's an active session
      const session = await db.get(
        'SELECT user_id FROM current_session ORDER BY created_at DESC LIMIT 1'
      )

      if (!session) {
        throw new Error('No user is currently logged in')
      }

      // Get user data
      const user = await db.get(
        `SELECT 
          id, 
          username, 
          email, 
          role, 
          created_at, 
          last_login 
        FROM users 
        WHERE id = ?`,
        [session.user_id]
      )

      if (!user) {
        throw new Error('User not found')
      }

      return user
    } catch (error) {
      console.error('Error fetching user:', error)
      throw error
    }
  })

  // Update user profile
  ipcMain.handle('update:user', async (_, userData) => {
    try {
      const db = getDatabase()
      
      // Check for active session
      const session = await db.get(
        'SELECT user_id FROM current_session ORDER BY created_at DESC LIMIT 1'
      )

      if (!session) {
        throw new Error('No user is currently logged in')
      }

      await db.run(
        'UPDATE users SET username = ?, email = ? WHERE id = ?',
        [userData.username, userData.email, session.user_id]
      )
      
      return true
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  })

  // Change password
  ipcMain.handle('change:password', async (_, { currentPassword, newPassword }) => {
    try {
      const db = getDatabase()
      const currentUser = await db.get(
        'SELECT user_id as id FROM current_session LIMIT 1'
      )
      
      if (!currentUser) {
        throw new Error('No user is currently logged in')
      }

      // Verify current password
      const user = await db.get(
        'SELECT password FROM users WHERE id = ?',
        [currentUser.id]
      )

      if (user.password !== currentPassword) {
        throw new Error('Current password is incorrect')
      }

      // Update password
      await db.run(
        'UPDATE users SET password = ? WHERE id = ?',
        [newPassword, currentUser.id]
      )
      
      return true
    } catch (error) {
      console.error('Error changing password:', error)
      throw error
    }
  })
} 