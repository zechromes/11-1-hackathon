'use client'

import { addMonths, eachDayOfInterval, endOfMonth, format, isSameDay, isSameMonth, startOfMonth, subMonths } from 'date-fns'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, User, X } from 'lucide-react'
import { useState, useEffect } from 'react'



// Mock calendar event data
const initialcalendarEvents = [
  {
    id: '1',
    title: 'Physical Therapy',
    date: new Date(2025, 10, 1, 14, 0), // 11月1日 14:00
    duration: 60,
    type: 'therapy',
    location: 'Rehabilitation Center A',
    therapist: 'Dr. Li'
  },
  {
    id: '2',
    title: 'Follow-up Appointment',
    date: new Date(2025, 10, 5, 9, 30), // 11月5日 9:30
    duration: 30,
    type: 'checkup',
    location: 'Orthopedic Clinic',
    doctor: 'Dr. Wang'
  },
  {
    id: '3',
    title: 'Rehabilitation Training',
    date: new Date(2025, 10, 8, 16, 0), // 11月8日 16:00
    duration: 45,
    type: 'exercise',
    location: 'Training Room B',
    trainer: 'Coach Zhang'
  },
  {
    id: '4',
    title: 'Nutrition Consultation',
    date: new Date(2025, 10, 12, 10, 0), // 11月12日 10:00
    duration: 30,
    type: 'consultation',
    location: 'Nutrition Department',
    nutritionist: 'Nutritionist Chen'
  },
  {
    id: '5',
    title: 'Physical Therapy',
    date: new Date(2025, 10, 15, 14, 0), // 11月15日 14:00
    duration: 60,
    type: 'therapy',
    location: 'Rehabilitation Center A',
    therapist: 'Dr. Li'
  }
]

const eventTypeColors = {
  therapy: 'bg-blue-100 text-blue-700 border-blue-200',
  checkup: 'bg-green-100 text-green-700 border-green-200',
  exercise: 'bg-purple-100 text-purple-700 border-purple-200',
  consultation: 'bg-orange-100 text-orange-700 border-orange-200'
}

const eventTypeNames = {
  therapy: 'Physical Therapy',
  checkup: 'Follow-up',
  exercise: 'Rehab Training',
  consultation: 'Nutrition Consult'
}

export default function CalendarPage() {
  const { events: calendarEvents } = useCalendar()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())

  // 添加这一行 // Original events to state
  const [calendarEvents, setCalendarEvents] = useState(initialcalendarEvents)

  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '14:00',
    duration: 60,
    therapist: 'Dr. Li',
    location: 'Rehabilitation Center A'
  })

  // 从 localStorage 加载数据
  useEffect(() => {
    const savedEvents = localStorage.getItem('calendarEvents')
    
    if (savedEvents) {
      try {
        const parsedEvents = JSON.parse(savedEvents)
        const eventsWithDates = parsedEvents.map((event: any) => ({
          ...event,
          date: new Date(event.date)
        }))
        setCalendarEvents(eventsWithDates)
      } catch (error) {
        console.error('Failed to load events from localStorage:', error)
      }
    }
  }, [])

  // 保存数据到 localStorage
  useEffect(() => {
    localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents))
  }, [calendarEvents])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const handleBookPhysicalTherapy = () => {
    setFormData({
      date: format(selectedDate, 'yyyy-MM-dd'), // 使用选中的日期
      time: '14:00',
      duration: 60,
      therapist: 'Dr. Li',
      location: 'Rehabilitation Center A'
    })
    setShowModal(true) // 打开弹窗
  }

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newEvent = {
      id: `evt-${Date.now()}`,
      title: 'Physical Therapy',
      date: new Date(`${formData.date}T${formData.time}`),
      duration: formData.duration,
      type: 'therapy' as const,
      location: formData.location,
      therapist: formData.therapist
    }
    
    setCalendarEvents(prev => [...prev, newEvent])
    setShowModal(false)
    alert('Successfully booked')
  }

  // 👇 添加这个函数 - 更新表单数据
  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }


  const getEventsForDate = (date: Date) => {
    return calendarEvents.filter(event =>
      isSameDay(event.date, date)
    )
  }

  const selectedDateEvents = getEventsForDate(selectedDate)

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Recovery Calendar</h1>
        <p className="text-gray-600">Manage your recovery plans and appointment schedules</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 日历主体 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* 日历头部 */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={goToPreviousMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={goToNextMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 星期标题 */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            {/* 日历网格 */}
            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((day) => {
                const dayEvents = getEventsForDate(day)
                const isSelected = isSameDay(day, selectedDate)
                const isToday = isSameDay(day, new Date())

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      relative p-2 h-20 border border-gray-100 hover:bg-gray-50 transition-colors
                      ${isSelected ? 'bg-blue-50 border-blue-200' : ''}
                      ${isToday ? 'bg-yellow-50 border-yellow-200' : ''}
                    `}
                  >
                    <div className={`
                      text-sm font-medium mb-1
                      ${!isSameMonth(day, currentDate) ? 'text-gray-300' : 'text-gray-900'}
                      ${isToday ? 'text-yellow-700' : ''}
                      ${isSelected ? 'text-blue-700' : ''}
                    `}>
                      {format(day, 'd')}
                    </div>

                    {dayEvents.length > 0 && (
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className={`
                              px-1 py-0.5 text-xs rounded truncate
                              ${eventTypeColors[event.type as keyof typeof eventTypeColors]}
                            `}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* 右侧详情面板 */}
        <div className="space-y-6">
          {/* 选中日期信息 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <CalendarIcon className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="font-semibold text-gray-900">
                {format(selectedDate, 'MMMM d, EEEE')}
              </h3>
            </div>

            {selectedDateEvents.length > 0 ? (
              <div className="space-y-3">
                {selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`
                      p-3 rounded-lg border
                      ${eventTypeColors[event.type as keyof typeof eventTypeColors]}
                    `}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{event.title}</h4>
                      <span className="text-xs px-2 py-1 bg-white rounded">
                        {eventTypeNames[event.type as keyof typeof eventTypeNames]}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-2" />
                        {format(event.date, 'HH:mm')} ({event.duration}mins)
                      </div>

                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-2" />
                        {event.location}
                      </div>

                      {(event as any).therapist && (
                        <div className="flex items-center">
                          <User className="w-3 h-3 mr-2" />
                          {(event as any).therapist}
                        </div>
                      )}

                      {(event as any).doctor && (
                        <div className="flex items-center">
                          <User className="w-3 h-3 mr-2" />
                          {(event as any).doctor}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No appointments scheduled</p>
              </div>
            )}
          </div>

          {/* 快速统计 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Monthly Statistics</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Appointments</span>
                <span className="font-medium">{calendarEvents.length} times</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Physical Therapy</span>
                <span className="font-medium">
                  {calendarEvents.filter(e => e.type === 'therapy').length} times
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Rehab Training</span>
                <span className="font-medium">
                  {calendarEvents.filter(e => e.type === 'exercise').length} times
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Follow-ups</span>
                <span className="font-medium">
                  {calendarEvents.filter(e => e.type === 'checkup').length} times
                </span>
              </div>
            </div>
          </div>

          {/* 快速操作 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>

            <div className="space-y-2">
              <button
                onClick={handleBookPhysicalTherapy} 
                className="w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                Book Physical Therapy
              </button>

              <button className="w-full px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">
                Book Follow-up
              </button>

              <button className="w-full px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors">
                Schedule Training
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 预约表单 */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-white bg-opacity-70 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}  
        >
          <div 
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭按钮 X */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              type="button"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">Book Physical Therapy</h3>
            
            <form onSubmit={handleSubmitBooking} className="space-y-4">
              {/* 日期 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={e => handleInputChange('date', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* 时间 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={e => handleInputChange('time', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* 时长 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                <select
                  value={formData.duration}
                  onChange={e => handleInputChange('duration', Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                  <option value={120}>120 minutes</option>
                </select>
              </div>

              {/* 治疗师 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Therapist</label>
                <select
                  value={formData.therapist}
                  onChange={e => handleInputChange('therapist', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Dr. Li">Dr. Li</option>
                  <option value="Dr. Wang">Dr. Wang</option>
                  <option value="Dr. Zhang">Dr. Zhang</option>
                  <option value="Dr. Chen">Dr. Chen</option>
                </select>
              </div>

              {/* 地点 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <select
                  value={formData.location}
                  onChange={e => handleInputChange('location', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Rehabilitation Center A">Rehabilitation Center A</option>
                  <option value="Rehabilitation Center B">Rehabilitation Center B</option>
                  <option value="Orthopedic Clinic">Orthopedic Clinic</option>
                  <option value="Training Room B">Training Room B</option>
                </select>
              </div>

              {/* 按钮组 */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

