'use client'

import { addMonths, eachDayOfInterval, endOfMonth, format, isSameDay, isSameMonth, startOfMonth, subMonths } from 'date-fns'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, User } from 'lucide-react'
import { useState } from 'react'
import { useCalendar } from '@/lib/CalendarContext'

const eventTypeColors = {
  therapy: 'bg-[#EAE6F5] text-[#8573bd] border-[#8573bd]',
  checkup: 'bg-green-100 text-green-700 border-green-200',
  exercise: 'bg-orange-100 text-[#E8B98A] border-[#E8B98A]',
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

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
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
                      ${isSelected ? 'bg-[#EAE6F5] border-[#8573bd]' : ''}
                      ${isToday ? 'bg-yellow-50 border-yellow-200' : ''}
                    `}
                  >
                    <div className={`
                      text-sm font-medium mb-1
                      ${!isSameMonth(day, currentDate) ? 'text-gray-300' : 'text-gray-900'}
                      ${isToday ? 'text-yellow-700' : ''}
                      ${isSelected ? 'text-[#8573bd]' : ''}
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
              <CalendarIcon className="w-5 h-5 text-[#8573bd] mr-2" />
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
                        {format(event.date, 'HH:mm')} ({event.duration}分钟)
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
              <button className="w-full px-4 py-2 bg-[#EAE6F5] text-[#8573bd] rounded-lg hover:bg-[#8573bd] hover:text-white transition-colors">
                Book Physical Therapy
              </button>

              <button className="w-full px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">
                Book Follow-up
              </button>

              <button className="w-full px-4 py-2 bg-orange-50 text-[#E8B98A] rounded-lg hover:bg-[#E8B98A] hover:text-white transition-colors">
                Schedule Training
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
