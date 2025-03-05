import { useState, useEffect } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { toast } from 'react-hot-toast'

const Attendance = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [selectedSection, setSelectedSection] = useState('')
  const [sections, setSections] = useState([])
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({})
  const [showCalendar, setShowCalendar] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [filteredStudents, setFilteredStudents] = useState([])

  // Get number of days in selected month
  const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate()

  useEffect(() => {
    loadSections()
    loadStudents()
  }, [])

  useEffect(() => {
    filterStudents()
  }, [selectedSection, students])

  useEffect(() => {
    loadAttendance()
  }, [selectedMonth, selectedSection])

  const loadSections = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('sections:get')
      if (result.success) {
        setSections(result.data)
      }
    } catch (error) {
      console.error('Failed to load sections:', error)
    }
  }

  const loadStudents = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('students:get')
      if (result.success) {
        setStudents(result.data)
        setFilteredStudents(result.data)
      }
    } catch (error) {
      console.error('Failed to load students:', error)
    }
  }

  const loadAttendance = async () => {
    try {
      const month = format(selectedMonth, 'MM')
      const year = format(selectedMonth, 'yyyy')
      
      const result = await window.electron.ipcRenderer.invoke('attendance:get', {
        month,
        year,
        section_id: selectedSection || null
      })

      if (result.success) {
        // Convert the attendance data to the format your component expects
        const attendanceMap = {}
        result.data.forEach(record => {
          const studentId = record.student_id
          if (!attendanceMap[studentId]) {
            attendanceMap[studentId] = {}
          }
          const day = new Date(record.date).getDate()
          attendanceMap[studentId][day] = record.status === 1
        })
        setAttendance(attendanceMap)
      }
    } catch (error) {
      console.error('Failed to load attendance:', error)
    }
  }

  const handleAttendanceChange = async (studentId, date, isPresent) => {
    try {
      const formattedDate = format(date, 'yyyy-MM-dd')
      console.log('Marking attendance:', { studentId, date: formattedDate, isPresent }) // Debug log

      const result = await window.electron.ipcRenderer.invoke('attendance:mark', {
        student_id: parseInt(studentId), // Ensure studentId is a number
        date: formattedDate,
        status: isPresent
      })

      if (result.success) {
        // Update local attendance state
        setAttendance(prev => ({
          ...prev,
          [studentId]: {
            ...(prev[studentId] || {}),
            [date.getDate()]: isPresent
          }
        }))
        toast.success('Attendance marked successfully')
        
        // Optionally refresh the attendance data
        await loadAttendance()
      } else {
        toast.error('Failed to mark attendance')
      }
    } catch (error) {
      console.error('Error marking attendance:', error)
      toast.error('Failed to mark attendance: ' + error.message)
    }
  }

  // Helper function to check if a student is present on a specific day
  const isStudentPresent = (studentId, day) => {
    return attendance[studentId]?.[day] === true
  }

  const filterStudents = () => {
    if (!selectedSection) {
      setFilteredStudents(students)
    } else {
      const filtered = students.filter(
        student => student.section_id === parseInt(selectedSection)
      )
      setFilteredStudents(filtered)
    }
  }

  const handleSectionChange = (e) => {
    setSelectedSection(e.target.value)
    loadAttendance()
  }

  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const Calendar = ({ isOpen, onClose }) => {
    if (!isOpen) return null

    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start, end })

    // Get day names
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

    // Get days from previous month to fill the first week
    const firstDayOfMonth = start.getDay()
    const prevMonthDays = Array.from({ length: firstDayOfMonth }, (_, i) => {
      const date = new Date(start)
      date.setDate(-i)
      return date
    }).reverse()

    // Get days for next month to fill the last week
    const lastDayOfMonth = end.getDay()
    const nextMonthDays = Array.from({ length: 6 - lastDayOfMonth }, (_, i) => {
      const date = new Date(end)
      date.setDate(end.getDate() + i + 1)
      return date
    })

    const handleDateClick = (date) => {
      setSelectedMonth(date)
      onClose()
    }

    return (
      <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 w-[280px]">
        {/* Month and Year header */}
        <div className="p-3 border-b">
          <div className="flex items-center justify-between px-2">
            <button
              onClick={previousMonth}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-medium">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <button
              onClick={nextMonth}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="p-3">
          <div className="grid grid-cols-7 gap-0">
            {/* Day names */}
            {dayNames.map(day => (
              <div
                key={day}
                className="h-8 flex items-center justify-center text-xs text-gray-500"
              >
                {day}
              </div>
            ))}

            {/* Previous month days */}
            {prevMonthDays.map(date => (
              <button
                key={date.toISOString()}
                onClick={() => handleDateClick(date)}
                className="h-8 w-8 flex items-center justify-center text-xs text-gray-400"
              >
                {date.getDate()}
              </button>
            ))}

            {/* Current month days */}
            {days.map(date => {
              const isToday = date.toDateString() === new Date().toDateString()
              const isSelected = date.toDateString() === selectedMonth.toDateString()

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => handleDateClick(date)}
                  className={`h-8 w-8 flex items-center justify-center text-xs transition-colors
                    ${isToday ? 'text-blue-600 font-medium' : ''}
                    ${isSelected ? 'bg-blue-600 text-white rounded-full' : 'hover:bg-gray-100'}
                  `}
                >
                  {date.getDate()}
                </button>
              )
            })}

            {/* Next month days */}
            {nextMonthDays.map(date => (
              <button
                key={date.toISOString()}
                onClick={() => handleDateClick(date)}
                className="h-8 w-8 flex items-center justify-center text-xs text-gray-400"
              >
                {date.getDate()}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // Add this CheckIcon component
  const CheckIcon = () => (
    <svg 
      className="w-4 h-4 text-blue-600" 
      fill="currentColor" 
      viewBox="0 0 20 20"
    >
      <path 
        fillRule="evenodd" 
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
        clipRule="evenodd" 
      />
    </svg>
  )

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Attendance</h1>
      
      {/* Filters Section */}
      <div className="bg-white rounded-lg p-4 mb-6 flex items-center gap-4">
        {/* Month Selector */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Month:</label>
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="min-w-[200px] px-4 py-2 border rounded-lg flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">{format(selectedMonth, 'MMMM yyyy')}</span>
            </div>
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Calendar Component */}
          <Calendar 
            isOpen={showCalendar} 
            onClose={() => setShowCalendar(false)} 
          />
        </div>

        {/* Section Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Section:</label>
          <select
            value={selectedSection}
            onChange={handleSectionChange}
            className="min-w-[300px] px-4 py-2 border rounded-lg bg-white"
          >
            <option value="">All Sections</option>
            {sections.map(section => (
              <option key={section.id} value={section.id}>
                [{section.name}] {section.schedule}
              </option>
            ))}
          </select>
        </div>

        {/* Search Button */}
        <button 
          onClick={loadAttendance}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mt-6"
        >
          Search
        </button>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                  Student ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-[150px] bg-gray-50 z-10">
                  Name
                </th>
                {[...Array(daysInMonth)].map((_, i) => (
                  <th key={i + 1} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student, idx) => (
                <tr key={student.id} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-inherit">
                    {student.student_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 sticky left-[150px] bg-inherit">
                    <div>
                      {student.name}
                      <span className="text-gray-500 text-xs ml-2">
                        [{sections.find(s => s.id === student.section_id)?.name || 'No Section'}]
                      </span>
                    </div>
                  </td>
                  {[...Array(daysInMonth)].map((_, day) => {
                    const currentDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day + 1)
                    const isPresent = isStudentPresent(student.id, day + 1)
                    
                    return (
                      <td key={day + 1} className="px-2 py-4 whitespace-nowrap text-center">
                        <div className="relative inline-block">
                          <input
                            type="checkbox"
                            checked={isPresent}
                            onChange={(e) => handleAttendanceChange(student.id, currentDate, e.target.checked)}
                            className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer ${
                              isPresent ? 'opacity-0' : 'opacity-100'
                            }`}
                          />
                          {isPresent && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <CheckIcon />
                            </div>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Attendance


