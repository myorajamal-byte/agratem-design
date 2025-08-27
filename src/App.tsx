import React from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function App() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            تطبيق الفارس الذهبي للإعلانات
          </h1>
          <p className="text-gray-600">
            التطبيق يعمل بنجاح مع ProtectedRoute!
          </p>
        </div>
      </div>
    </ProtectedRoute>
  )
}
