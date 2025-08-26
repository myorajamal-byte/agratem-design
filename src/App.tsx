import React from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import MainApp from '@/components/MainApp'

export default function App() {
  return (
    <ProtectedRoute>
      <MainApp />
    </ProtectedRoute>
  )
}
