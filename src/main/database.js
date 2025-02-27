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
  // Drop existing students table if it exists
  db.run(`DROP TABLE IF EXISTS students`)

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
    CREATE TABLE IF NOT EXISTS sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      schedule TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Create new students table with student_id
  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      section_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (section_id) REFERENCES sections (id)
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

// Add section CRUD operations
export function getSections() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM sections ORDER BY id DESC', [], (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

export function addSection(sectionData) {
  const { name, schedule } = sectionData
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO sections (name, schedule) VALUES (?, ?)',
      [name, schedule],
      function (err) {
        if (err) reject(err)
        else resolve({ id: this.lastID })
      }
    )
  })
}

export function updateSection(id, sectionData) {
  const { name, schedule } = sectionData
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE sections SET name = ?, schedule = ? WHERE id = ?',
      [name, schedule, id],
      (err) => {
        if (err) reject(err)
        else resolve({ id })
      }
    )
  })
}

export function deleteSection(id) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM sections WHERE id = ?', [id], (err) => {
      if (err) reject(err)
      else resolve({ id })
    })
  })
}

// Update student functions to work with sections
export function getStudentsWithSections() {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT students.*, sections.name as section_name, sections.schedule 
      FROM students 
      LEFT JOIN sections ON students.section_id = sections.id 
      ORDER BY students.id DESC
    `, [], (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

// Update the getStudents function to include section information
export function getStudents() {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        students.*,
        sections.name as section_name,
        sections.schedule
      FROM students
      LEFT JOIN sections ON students.section_id = sections.id
      ORDER BY students.id DESC
    `, [], (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

// Update addStudent function
export function addStudent(studentData) {
  const { name, student_id, section_id } = studentData
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO students (name, student_id, section_id) VALUES (?, ?, ?)',
      [name, student_id, section_id],
      function (err) {
        if (err) {
          console.error('Database error:', err)
          reject(err)
        } else {
          resolve({ id: this.lastID })
        }
      }
    )
  })
}

// Update updateStudent function
export function updateStudent(id, studentData) {
  const { name, student_id, section_id } = studentData
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE students SET name = ?, student_id = ?, section_id = ? WHERE id = ?',
      [name, student_id, section_id, id],
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

// Add a function to reset the database if needed
export function resetDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`DROP TABLE IF EXISTS students`)
      db.run(`
        CREATE TABLE IF NOT EXISTS students (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          section_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (section_id) REFERENCES sections (id)
        )
      `, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  })
} 