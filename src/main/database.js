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

  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      grade TEXT NOT NULL,
      address TEXT,
      contact TEXT,
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
  console.log('Attempting login for email:', email)
  
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        console.error('Database error:', err)
        reject(err)
      } else if (!user) {
        console.log('User not found for email:', email)
        reject(new Error('User not found'))
      } else {
        console.log('User found, comparing passwords')
        try {
          const passwordMatch = await bcrypt.compare(password, user.password)
          console.log('Password match result:', passwordMatch)
          
          if (passwordMatch) {
            resolve({
              id: user.id,
              name: user.name,
              email: user.email
            })
          } else {
            reject(new Error('Invalid password'))
          }
        } catch (error) {
          console.error('Password comparison error:', error)
          reject(error)
        }
      }
    })
  })
}

export function getDatabasePath() {
  return dbPath
}

// Add student CRUD operations
export function getStudents() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM students ORDER BY id DESC', [], (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

export function addStudent(studentData) {
  const { name, grade, address, contact } = studentData
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO students (name, grade, address, contact) VALUES (?, ?, ?, ?)',
      [name, grade, address, contact],
      function (err) {
        if (err) reject(err)
        else resolve({ id: this.lastID })
      }
    )
  })
}

export function updateStudent(id, studentData) {
  const { name, grade, address, contact } = studentData
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE students SET name = ?, grade = ?, address = ?, contact = ? WHERE id = ?',
      [name, grade, address, contact, id],
      (err) => {
        if (err) reject(err)
        else resolve({ id })
      }
    )
  })
}

export function deleteStudent(id) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM students WHERE id = ?', [id], (err) => {
      if (err) reject(err)
      else resolve({ id })
    })
  })
} 