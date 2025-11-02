'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface CalendarEvent {
  id: string
  title: string
  date: Date
  duration: number // in minutes
  type: 'therapy' | 'checkup' | 'exercise' | 'consultation' | 'mission'
  location?: string
  therapist?: string
  doctor?: string
  trainer?: string
  nutritionist?: string
  description?: string
  source?: 'exercise-plan' | 'manual' // Track if event came from exercise plan sync
}

interface CalendarContextType {
  events: CalendarEvent[]
  addEvents: (newEvents: CalendarEvent[]) => void
  removeEvent: (eventId: string) => void
  clearSyncedEvents: () => void // Remove only synced events
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined)

// Initial mock events
const initialEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Physical Therapy',
    date: new Date(2024, 10, 1, 14, 0),
    duration: 60,
    type: 'therapy',
    location: 'Rehabilitation Center A',
    therapist: 'Dr. Li',
    source: 'manual'
  },
  {
    id: '2',
    title: 'Follow-up Appointment',
    date: new Date(2024, 10, 5, 9, 30),
    duration: 30,
    type: 'checkup',
    location: 'Orthopedic Clinic',
    doctor: 'Dr. Wang',
    source: 'manual'
  },
  {
    id: '3',
    title: 'Rehabilitation Training',
    date: new Date(2024, 10, 8, 16, 0),
    duration: 45,
    type: 'exercise',
    location: 'Training Room B',
    trainer: 'Coach Zhang',
    source: 'manual'
  },
  {
    id: '4',
    title: 'Nutrition Consultation',
    date: new Date(2024, 10, 12, 10, 0),
    duration: 30,
    type: 'consultation',
    location: 'Nutrition Department',
    nutritionist: 'Nutritionist Chen',
    source: 'manual'
  },
  {
    id: '5',
    title: 'Physical Therapy',
    date: new Date(2024, 10, 15, 14, 0),
    duration: 60,
    type: 'therapy',
    location: 'Rehabilitation Center A',
    therapist: 'Dr. Li',
    source: 'manual'
  }
]

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)

  const addEvents = (newEvents: CalendarEvent[]) => {
    setEvents(prev => [...prev, ...newEvents])
  }

  const removeEvent = (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId))
  }

  const clearSyncedEvents = () => {
    setEvents(prev => prev.filter(e => e.source !== 'exercise-plan'))
  }

  return (
    <CalendarContext.Provider value={{ events, addEvents, removeEvent, clearSyncedEvents }}>
      {children}
    </CalendarContext.Provider>
  )
}

export function useCalendar() {
  const context = useContext(CalendarContext)
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider')
  }
  return context
}

