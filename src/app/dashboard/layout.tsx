import Sidebar from '@/components/dashboard/Sidebar'
import { PartyProvider } from '@/lib/PartyContext'
import { CalendarProvider } from '@/lib/CalendarContext'
import { Toaster } from 'react-hot-toast'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PartyProvider>
      <CalendarProvider>
        <div className="flex h-screen bg-gray-50">
          {/* 左侧固定导航栏 */}
          <Sidebar />

          {/* 右侧主内容区域 */}
          <main className="flex-1 overflow-auto">
            <div className="p-8">
              {children}
            </div>
          </main>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#333',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
          }}
        />
      </CalendarProvider>
    </PartyProvider>
  )
}
