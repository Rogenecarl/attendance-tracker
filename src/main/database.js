import sqlite3 from 'sqlite3'
import { app } from 'electron'
import path from 'path'
import bcrypt from 'bcryptjs'

const dbPath = path.join(app.getPath('userData'), 'database.sqlite')
console.log('Database path:', dbPath)

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection failed:', err)
  } else {
    console.log('Database connected')
    initDatabase()
  }
})

function initDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

export async function registerUser(userData) {
  const { name, email, password } = userData
  const hashedPassword = await bcrypt.hash(password, 10)

  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword],
      function (err) {
        if (err) {
          reject(err)
        } else {
          resolve({ id: this.lastID })
        }
      }
    )
  })
}

export async function loginUser(email, password) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        reject(err)
      } else if (!user) {
        reject(new Error('User not found'))
      } else {
        const passwordMatch = await bcrypt.compare(password, user.password)
        if (passwordMatch) {
          resolve({ id: user.id, name: user.name, email: user.email })
        } else {
          reject(new Error('Invalid password'))
        }
      }
    })
  })
}

export function getDatabasePath() {
  return dbPath
} 