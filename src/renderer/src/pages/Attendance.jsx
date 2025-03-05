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
  const [currentPage, setCurrentPage] = useState(1)
  const studentsPerPage = 20

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
      
      console.log('Loading attendance for:', { month, year, section_id: selectedSection })

      const result = await window.electron.ipcRenderer.invoke('attendance:get', {
        month,
        year,
        section_id: selectedSection || null
      })

      if (result.success) {
        console.log('Received attendance data:', result.data)
        
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

        console.log('Processed attendance map:', attendanceMap)
        setAttendance(attendanceMap)
      } else {
        console.error('Failed to load attendance:', result.error)
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
        setAttendance(prev => {
          const dayOfMonth = date.getDate()
          return {
            ...prev,
            [studentId]: {
              ...(prev[studentId] || {}),
              [dayOfMonth]: isPresent
            }
          }
        })
        toast.success('Attendance marked successfully')
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Attendance Tracker</h1>
          <p className="mt-2 text-sm text-gray-600">Mark and manage student attendance</p>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Month Selector */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="w-full bg-white px-4 py-2.5 border border-gray-300 rounded-lg flex items-center justify-between hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-700">{format(selectedMonth, 'MMMM yyyy')}</span>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
              <select
                value={selectedSection}
                onChange={handleSectionChange}
                className="w-full bg-white px-4 py-2.5 border border-gray-300 rounded-lg appearance-none hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <div className="flex items-end">
              <button 
                onClick={loadAttendance}
                className="w-full px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
                    Student ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-[150px] bg-gray-50 z-10 border-r border-gray-200">
                    Name
                  </th>
                  {[...Array(daysInMonth)].map((_, i) => (
                    <th key={i + 1} className="px-3 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12 border-r border-gray-200 last:border-r-0">
                      {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents
                  .slice((currentPage - 1) * studentsPerPage, currentPage * studentsPerPage)
                  .map((student, idx) => (
                  <tr key={student.id} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-inherit border-r border-gray-200">
                      {student.student_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 sticky left-[150px] bg-inherit border-r border-gray-200">
                      <div className="flex flex-col">
                        <span className="font-medium">{student.name}</span>
                        <span className="text-xs text-gray-500">
                          {sections.find(s => s.id === student.section_id)?.name || 'No Section'}
                        </span>
                      </div>
                    </td>
                    {[...Array(daysInMonth)].map((_, day) => {
                      const currentDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day + 1)
                      const isPresent = isStudentPresent(student.id, day + 1)
                      const isPastDate = currentDate < new Date(new Date().setHours(0, 0, 0, 0))
                      
                      return (
                        <td key={day + 1} className="px-3 py-4 whitespace-nowrap text-center border-r border-gray-200 last:border-r-0">
                          <div className="relative inline-block">
                            <input
                              type="checkbox"
                              checked={isPresent}
                              onChange={(e) => handleAttendanceChange(student.id, currentDate, e.target.checked)}
                              disabled={isPastDate}
                              className={`h-5 w-5 rounded border-gray-300 text-blue-600 transition-colors
                                focus:ring-blue-500 focus:ring-offset-0 cursor-pointer
                                ${isPastDate ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500'}`}
                            />
                            {isPresent && (
                              <div className={`absolute inset-0 pointer-events-none flex items-center justify-center
                                ${isPastDate ? 'opacity-50' : ''}`}>
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

          {/* Pagination */}
          {filteredStudents.length > 0 && (
            <div className="px-6 py-4 bg-white border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center text-sm text-gray-500">
                  <span>
                    Showing{' '}
                    <span className="font-medium text-gray-900">
                      {Math.min((currentPage - 1) * studentsPerPage + 1, filteredStudents.length)}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium text-gray-900">
                      {Math.min(currentPage * studentsPerPage, filteredStudents.length)}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium text-gray-900">
                      {filteredStudents.length}
                    </span> students
                  </span>
                </div>

                <nav className="flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`p-2 rounded-lg transition-colors ${
                        currentPage === 1
                          ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                          : 'text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                      }`}
                      aria-label="Previous page"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    <div className="flex items-center gap-1">
                      {[...Array(Math.ceil(filteredStudents.length / studentsPerPage))].map((_, index) => {
                        const pageNumber = index + 1;
                        const isCurrentPage = pageNumber === currentPage;
                        const isNearCurrentPage = Math.abs(pageNumber - currentPage) <= 1;
                        const isFirstPage = pageNumber === 1;
                        const isLastPage = pageNumber === Math.ceil(filteredStudents.length / studentsPerPage);

                        if (isNearCurrentPage || isFirstPage || isLastPage) {
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => setCurrentPage(pageNumber)}
                              className={`min-w-[40px] h-10 px-3.5 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                isCurrentPage
                                  ? 'bg-blue-600 text-white focus:ring-blue-500'
                                  : 'text-gray-500 hover:bg-gray-100 focus:ring-gray-500'
                              }`}
                              aria-label={`Page ${pageNumber}`}
                              aria-current={isCurrentPage ? 'page' : undefined}
                            >
                              {pageNumber}
                            </button>
                          );
                        } else if (
                          (pageNumber === currentPage - 2 && currentPage > 3) ||
                          (pageNumber === currentPage + 2 && currentPage < Math.ceil(filteredStudents.length / studentsPerPage) - 2)
                        ) {
                          return (
                            <span key={pageNumber} className="px-2 text-gray-400" aria-hidden="true">
                              •••
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => 
                        Math.min(prev + 1, Math.ceil(filteredStudents.length / studentsPerPage))
                      )}
                      disabled={currentPage === Math.ceil(filteredStudents.length / studentsPerPage)}
                      className={`p-2 rounded-lg transition-colors ${
                        currentPage === Math.ceil(filteredStudents.length / studentsPerPage)
                          ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                          : 'text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                      }`}
                      aria-label="Next page"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </nav>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Attendance


