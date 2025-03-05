import { useState, useEffect } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

const Dashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [selectedSection, setSelectedSection] = useState('')
  const [sections, setSections] = useState([])
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalPresent: 0,
    totalAbsent: 0,
    attendanceRate: 0
  })
  const [attendanceData, setAttendanceData] = useState([])
  const [showCalendar, setShowCalendar] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [totalSections, setTotalSections] = useState(0)
  const [studentCount, setStudentCount] = useState(0)

  // Get number of days in selected month
  const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate()

  // Calculate percentages
  const totalPresent = stats.totalPresent || 0
  const totalPossibleAttendance = stats.totalStudents * daysInMonth || 0
  const presentPercentage = stats.attendanceRate || 0
  const absentPercentage = (100 - presentPercentage).toFixed(1)

  useEffect(() => {
    loadSections()
    loadDashboardData()
    loadTotalStudents()
  }, [selectedMonth, selectedSection])

  const loadSections = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('sections:get')
      if (result.success) {
        setSections(result.data)
        setTotalSections(result.data.length)
      }
    } catch (error) {
      console.error('Failed to load sections:', error)
    }
  }

  const loadDashboardData = async () => {
    try {
      const month = format(selectedMonth, 'MM')
      const year = format(selectedMonth, 'yyyy')
      const section_id = selectedSection || null

      console.log('Requesting dashboard data:', { month, year, section_id })

      const result = await window.electron.ipcRenderer.invoke('dashboard:getData', {
        month,
        year,
        section_id
      })

      console.log('Dashboard data response:', result)

      if (result.success) {
        console.log('Setting stats:', result.data.stats)
        console.log('Setting attendance data:', result.data.attendanceData)
        setStats(result.data.stats)
        setAttendanceData(result.data.attendanceData)
      } else {
        console.error('Failed to load dashboard data:', result.error)
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    }
  }

  const loadTotalStudents = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('students:get')
      if (result.success) {
        setStudentCount(result.data.length)
      }
    } catch (error) {
      console.error('Failed to load total students:', error)
    }
  }

  // Update chart data to use real data
  const chartData = {
    labels: attendanceData.map(data => format(new Date(data.date), 'd')),
    datasets: [
      {
        label: 'Present',
        data: attendanceData.map(data => data.present),
        backgroundColor: 'rgb(59, 130, 246)',
        barPercentage: 0.6,
        categoryPercentage: 0.7
      },
      {
        label: 'Absent',
        data: attendanceData.map(data => data.absent),
        backgroundColor: 'rgb(45, 212, 191)',
        barPercentage: 0.6,
        categoryPercentage: 0.7
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: {
            size: 12
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12
          }
        }
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const total = stats.totalStudents;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
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

  // Add donut chart data
  const donutData = {
    labels: ['Present', 'Absent'],
    datasets: [
      {
        data: [presentPercentage, absentPercentage],
        backgroundColor: [
          'rgb(59, 130, 246)', // blue
          'rgb(45, 212, 191)', // turquoise
        ],
        borderWidth: 0,
        cutout: '80%'
      }
    ]
  }

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: false
      }
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          {/* Month Selector with Calendar */}
          <div className="relative">
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className="bg-white px-3 py-2 rounded-lg border flex items-center gap-2"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">{format(selectedMonth, 'MMMM yyyy')}</span>
            </button>

            <Calendar 
              isOpen={showCalendar} 
              onClose={() => setShowCalendar(false)} 
            />
          </div>

          {/* Section Selector */}
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="bg-white px-3 py-2 rounded-lg border text-sm"
          >
            <option value="">All Sections</option>
            {sections.map(section => (
              <option key={section.id} value={section.id}>
                [{section.name}] {section.schedule}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards - Update to 4 columns */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-blue-50 rounded-lg p-6 flex items-center gap-4">
          <div className="bg-white p-3 rounded-lg">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600">Total Sections</h3>
            <p className="text-2xl font-bold">{totalSections}</p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 flex items-center gap-4">
          <div className="bg-white p-3 rounded-lg">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600">Total Students</h3>
            <p className="text-2xl font-bold">{studentCount}</p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 flex items-center gap-4">
          <div className="bg-white p-3 rounded-lg">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600">Total Present</h3>
            <p className="text-2xl font-bold">{presentPercentage}%</p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 flex items-center gap-4">
          <div className="bg-white p-3 rounded-lg">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600">Total Absent</h3>
            <p className="text-2xl font-bold">{absentPercentage}%</p>
          </div>
        </div>
      </div>

      {/* Attendance Chart */}
      <div className="grid grid-cols-3 gap-6">
        {/* Attendance Chart - Make it span 2 columns */}
        <div className="col-span-2 bg-white rounded-lg p-6">
          <h2 className="text-lg font-medium mb-6">Attendance</h2>
          <div className="h-[400px]">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Monthly Statistics */}
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-lg font-medium mb-6">Monthly Attendance</h2>
          <div className="relative h-[300px] flex items-center justify-center">
            <div className="w-[200px] h-[200px]">
              <Doughnut data={donutData} options={donutOptions} />
            </div>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-blue-600">
                {presentPercentage}%
              </div>
              <div className="text-sm text-gray-500">Present</div>
            </div>
          </div>
          {/* Legend */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                <span className="text-sm text-gray-600">Present</span>
              </div>
              <span className="text-sm font-medium">{presentPercentage}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-teal-400"></div>
                <span className="text-sm text-gray-600">Absent</span>
              </div>
              <span className="text-sm font-medium">{absentPercentage}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
