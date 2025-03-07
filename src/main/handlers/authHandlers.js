import { getDatabase } from '../database.js'
import bcrypt from 'bcryptjs'

export function setupAuthHandlers(ipcMain) {
  // Register handler
  ipcMain.handle('auth:register', async (_, userData) => {
    try {
      const db = getDatabase()
      
      // Check existing user with proper error handling
      const existingUser = await new Promise((resolve, reject) => {
        db.get(
          'SELECT id FROM users WHERE email = ? OR username = ?',
          [userData.email, userData.username],
          (err, row) => {
            if (err) reject(err)
            else resolve(row)
          }
        )
      })
      
      if (existingUser) {
        // Be more specific about what's already taken
        const duplicateField = await new Promise((resolve, reject) => {
          db.get(
            'SELECT id FROM users WHERE email = ?',
            [userData.email],
            (err, row) => {
              if (err) reject(err)
              else resolve(row ? 'email' : 'username')
            }
          )
        })

        return {
          success: false,
          error: `This ${duplicateField} is already registered`
        }
      }

      // Hash password and create teacher account
      const hashedPassword = await bcrypt.hash(userData.password, 10)
      
      const result = await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
          [userData.username, userData.email, hashedPassword, 'teacher'],
          function(err) {
            if (err) reject(err)
            else resolve(this)
          }
        )
      })

      // Create session for the new user
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO current_session (user_id) VALUES (?)',
          [result.lastID],
          (err) => {
            if (err) reject(err)
            else resolve()
          }
        )
      })

      // Get the created user data
      const user = await new Promise((resolve, reject) => {
        db.get(
          'SELECT id, username, email, role FROM users WHERE id = ?',
          [result.lastID],
          (err, row) => {
            if (err) reject(err)
            else resolve(row)
          }
        )
      })

      return {
        success: true,
        data: user
      }
    } catch (error) {
      console.error('Registration error:', error)
      return { 
        success: false, 
        error: error.message || 'Registration failed' 
      }
    }
  })

  // Login handler
  ipcMain.handle('auth:login', async (_, { email, password }) => {
    try {
      const db = getDatabase()
      
      // Get user with password
      const user = await new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM users WHERE email = ?',
          [email],
          (err, row) => {
            if (err) reject(err)
            else resolve(row)
          }
        )
      })

      if (!user) {
        return {
          success: false,
          error: 'Invalid email or password'
        }
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password)
      if (!isValid) {
        return {
          success: false,
          error: 'Invalid email or password'
        }
      }

      // Update last login
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
          [user.id],
          (err) => {
            if (err) reject(err)
            else resolve()
          }
        )
      })

      // Create new session
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO current_session (user_id) VALUES (?)',
          [user.id],
          (err) => {
            if (err) reject(err)
            else resolve()
          }
        )
      })

      // Return user data without password
      const { password: _, ...userData } = user

      return {
        success: true,
        data: userData
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        error: error.message || 'Login failed'
      }
    }
  })
} 