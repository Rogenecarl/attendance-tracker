import sqlite3 from 'sqlite3'
import { open } from 'sqlite3'
import { app } from 'electron'
import path from 'path'
import bcrypt from 'bcryptjs'

let db = null

export const getDatabasePath = () => {
  return path.join(app.getPath('userData'), 'database.sqlite')
}

export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized')
  }
  return db
}

export const initDatabase = async () => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db)
      return
    }

    const dbPath = getDatabasePath()
    console.log('Initializing database at:', dbPath)

    db = new sqlite3.Database(dbPath, async (err) => {
      if (err) {
        console.error('Error opening database:', err)
        reject(err)
        return
      }

      try {
        await resetAllTables()
        resolve(db)
      } catch (error) {
        console.error('Error initializing database:', error)
        reject(error)
      }
    })
  })
}

export const resetAllTables = async () => {
  if (!db) {
    throw new Error('Database not initialized')
  }

  console.log('Starting database reset...')
  
  const run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err)
        else resolve(this)
      })
    })
  }

  try {
    // Drop all existing tables
    console.log('Dropping existing tables...')
    await run('DROP TABLE IF EXISTS current_session')
    await run('DROP TABLE IF EXISTS attendance')
    await run('DROP TABLE IF EXISTS students')
    await run('DROP TABLE IF EXISTS sections')
    await run('DROP TABLE IF EXISTS users')

    // Create tables with new schema
    console.log('Creating new tables...')
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT CHECK(role IN ('admin', 'teacher')) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      )
    `)

    await run(`
      CREATE TABLE IF NOT EXISTS sections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        schedule TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await run(`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        section_id INTEGER,
        teacher_id INTEGER NOT NULL,
        schedule TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (section_id) REFERENCES sections (id),
        FOREIGN KEY (teacher_id) REFERENCES users (id)
      )
    `)

    await run(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        date DATE,
        status BOOLEAN,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students (id)
      )
    `)

    await run(`
      CREATE TABLE IF NOT EXISTS current_session (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `)

    // Create default admin user
    console.log('Creating default admin user...')
    const hashedPassword = await bcrypt.hash('admin123', 10)
    await run(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      ['admin', 'admin@school.com', hashedPassword, 'admin']
    )
    console.log('Created default admin user')

    console.log('Verifying database setup...')
    const users = await listUsers()
    console.log('Current users in database:', users)

    console.log('Database reset completed successfully')
  } catch (error) {
    console.error('Error during database reset:', error)
    throw error
  }
}

export async function registerUser(userData) {
  const { username, email, password, role = 'user' } = userData
  const hashedPassword = await bcrypt.hash(password, 10)

  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, role],
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
            // Update last login time
            await db.run(
              'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
              [user.id]
            )

            // Clear any existing sessions and create new one
            await db.run('DELETE FROM current_session')
            await db.run(
              'INSERT INTO current_session (user_id) VALUES (?)',
              [user.id]
            )

            resolve({
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role
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

export function getStudents() {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        students.*,
        sections.name as section_name,
        sections.schedule as section_schedule
      FROM students
      LEFT JOIN sections ON students.section_id = sections.id
      ORDER BY students.id DESC
    `, [], (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

export function addStudent(studentData) {
  const { name, student_id, section_id, schedule } = studentData
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO students (name, student_id, section_id, schedule) VALUES (?, ?, ?, ?)',
      [name, student_id, section_id, schedule],
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

export function updateStudent(id, studentData) {
  const { name, student_id, section_id, schedule } = studentData
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE students SET name = ?, student_id = ?, section_id = ?, schedule = ? WHERE id = ?',
      [name, student_id, section_id, schedule, id],
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

export function resetDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`DROP TABLE IF EXISTS attendance`)
      db.run(`
        CREATE TABLE IF NOT EXISTS attendance (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id INTEGER,
          date DATE,
          status BOOLEAN,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (student_id) REFERENCES students (id)
        )
      `, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  })
}

export function getAttendance(month, year, section_id = null) {
  return new Promise((resolve, reject) => {
    console.log('Getting attendance for:', { month, year, section_id })
    
    let query = `
      SELECT 
        a.*,
        s.name as student_name,
        s.student_id as student_code,
        s.id as student_id,
        s.section_id
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE strftime('%m', date) = ? AND strftime('%Y', date) = ?
    `
    const params = [month, year]

    if (section_id) {
      query += ' AND s.section_id = ?'
      params.push(section_id)
    }

    console.log('Attendance query:', query)
    console.log('Query params:', params)

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Error getting attendance:', err)
        reject(err)
        return
      }
      
      console.log('Found attendance records:', rows)
      resolve(rows)
    })
  })
}

export function markAttendance(attendanceData) {
  const { student_id, date, status } = attendanceData
  
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id FROM attendance WHERE student_id = ? AND date = ?',
      [student_id, date],
      (err, row) => {
        if (err) {
          reject(err)
          return
        }

        if (row) {
          db.run(
            'UPDATE attendance SET status = ? WHERE student_id = ? AND date = ?',
            [status ? 1 : 0, student_id, date],
            function(err) {
              if (err) reject(err)
              else resolve({ id: row.id, updated: true })
            }
          )
        } else {
          db.run(
            'INSERT INTO attendance (student_id, date, status) VALUES (?, ?, ?)',
            [student_id, date, status ? 1 : 0],
            function(err) {
              if (err) reject(err)
              else resolve({ id: this.lastID, updated: false })
            }
          )
        }
      }
    )
  })
}

export function getAttendanceByDateRange(startDate, endDate, section_id = null) {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT 
        a.*,
        s.name as student_name,
        s.student_id,
        s.section_id
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE a.date BETWEEN ? AND ?
    `
    const params = [startDate, endDate]

    if (section_id) {
      query += ' AND s.section_id = ?'
      params.push(section_id)
    }

    db.all(query, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

export function getAttendanceStats(teacher_id) {
  const db = getDatabase()
  return new Promise((resolve, reject) => {
    db.all(`
      WITH AttendanceStats AS (
        SELECT 
          COUNT(DISTINCT s.id) as total_students,
          COUNT(DISTINCT sec.id) as total_sections,
          (
            SELECT COUNT(*) 
            FROM attendance a
            JOIN students s2 ON a.student_id = s2.id
            WHERE s2.teacher_id = ? 
            AND a.date = DATE('now')
            AND a.status = 1
          ) as present_today,
          (
            SELECT COUNT(*) 
            FROM attendance a
            JOIN students s2 ON a.student_id = s2.id
            WHERE s2.teacher_id = ? 
            AND a.date = DATE('now')
          ) as total_today
        FROM students s
        LEFT JOIN sections sec ON s.section_id = sec.id
        WHERE s.teacher_id = ?
      ),
      AttendanceHistory AS (
        SELECT 
          a.date,
          COUNT(CASE WHEN a.status = 1 THEN 1 END) as present_count,
          COUNT(CASE WHEN a.status = 0 THEN 1 END) as absent_count
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        WHERE s.teacher_id = ?
        AND a.date >= date('now', '-30 days')
        GROUP BY a.date
        ORDER BY a.date ASC
      )
      SELECT 
        ats.*,
        json_group_array(
          json_object(
            'date', ah.date,
            'present', ah.present_count,
            'absent', ah.absent_count
          )
        ) as attendance_history
      FROM AttendanceStats ats
      LEFT JOIN AttendanceHistory ah
    `, [teacher_id, teacher_id, teacher_id, teacher_id], (err, rows) => {
      if (err) reject(err)
      else {
        const result = rows[0]
        try {
          result.attendance_history = JSON.parse(result.attendance_history)
        } catch (e) {
          result.attendance_history = []
        }
        resolve(result)
      }
    })
  })
}

export const checkDatabaseState = async () => {
  const db = getDatabase()
  
  try {
    // Check users table
    const users = await db.all('SELECT id, username, email, role FROM users')
    console.log('Current users in database:', users)
    
    // Check current session
    const session = await db.get('SELECT * FROM current_session')
    console.log('Current session:', session)
    
    return { users, session }
  } catch (error) {
    console.error('Error checking database state:', error)
    throw error
  }
}

export const listUsers = async () => {
  const db = getDatabase()
  return new Promise((resolve, reject) => {
    db.all('SELECT id, username, email, role FROM users', [], (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

// Get attendance history for charts
export const getAttendanceHistory = async (teacher_id, days = 30) => {
  const db = getDatabase()
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        a.date,
        COUNT(CASE WHEN a.status = 1 THEN 1 END) as present_count,
        COUNT(*) as total_count
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE s.teacher_id = ?
      AND a.date >= date('now', '-${days} days')
      GROUP BY a.date
      ORDER BY a.date ASC
    `, [teacher_id], (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

// Get section details with student count
export const getSectionDetails = async (teacher_id) => {
  const db = getDatabase()
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        s.*,
        COUNT(st.id) as student_count,
        (
          SELECT COUNT(*) 
          FROM attendance a
          JOIN students st2 ON a.student_id = st2.id
          WHERE st2.section_id = s.id
          AND a.date = DATE('now')
          AND a.status = 1
        ) as present_today
      FROM sections s
      LEFT JOIN students st ON s.id = st.section_id
      WHERE st.teacher_id = ?
      GROUP BY s.id
    `, [teacher_id], (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

// Update student section
export const updateStudentSection = async (student_id, section_id, teacher_id) => {
  const db = getDatabase()
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE students SET section_id = ? WHERE id = ? AND teacher_id = ?',
      [section_id, student_id, teacher_id],
      function(err) {
        if (err) reject(err)
        else resolve(this)
      }
    )
  })
}

// Get student attendance summary
export const getStudentAttendanceSummary = async (student_id, teacher_id) => {
  const db = getDatabase()
  return new Promise((resolve, reject) => {
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
} 