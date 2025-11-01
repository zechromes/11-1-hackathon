'use client'

import { weeklyProgress } from '@/lib/mockData'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export default function WeeklyProgressChart() {
  const data = weeklyProgress.map(day => ({
    ...day,
    completionRate: Math.round((day.completed / day.total) * 100)
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">
            Completed: {data.completed}/{data.total} tasks
          </p>
          <p className="text-sm text-[#8573bd]">
            Completion Rate: {data.completionRate}%
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Weekly Recovery Progress</h2>
        <div className="text-sm text-gray-500">
          Task Completion Status
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="completed"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              name="Completed"
            />
            <Bar
              dataKey="total"
              fill="#e5e7eb"
              radius={[4, 4, 0, 0]}
              name="Total Tasks"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-[#8573bd] rounded mr-2"></div>
          <span className="text-gray-600">Completed</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gray-300 rounded mr-2"></div>
          <span className="text-gray-600">Total Tasks</span>
        </div>
      </div>

      {/* 周总结 */}
      <div className="mt-6 p-4 bg-[#EAE6F5] rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Weekly Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-semibold text-[#8573bd]">
              {data.reduce((sum, day) => sum + day.completed, 0)}
            </div>
            <div className="text-gray-700">Total Completed</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-[#8573bd]">
              {Math.round(data.reduce((sum, day) => sum + day.completionRate, 0) / data.length)}%
            </div>
            <div className="text-gray-700">Average Rate</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-[#8573bd]">
              {data.filter(day => day.completionRate === 100).length}
            </div>
            <div className="text-gray-700">Perfect Days</div>
          </div>
        </div>
      </div>
    </div>
  )
}
