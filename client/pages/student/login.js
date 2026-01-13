import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import axios from 'axios'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { createSession, hasValidSession, getStudentId } from '../../utils/session'
import { API_URL } from '../../utils/api'

// Helper functions
const getStudentIdFromResponse = (data) => {
  return data.id || data._id
}

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
)

const ErrorMessage = ({ message }) => {
  if (!message) return null
  
  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {message}
    </div>
  )
}

export default function StudentLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    if (hasValidSession()) {
      const studentId = getStudentId()
      if (studentId) {
        router.replace(`/student/dashboard?studentId=${studentId}`)
        return
      }
    }
    setCheckingSession(false)
  }, [router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await axios.get(`${API_URL}/users/email/${email}`)
      const student = response.data
      const studentId = getStudentIdFromResponse(student)

      if (!studentId) {
        setError('Invalid student data received. Please try again.')
        return
      }

      // Check if user is admin
      const isAdmin = student.isAdmin === 1 || student.email.toLowerCase() === 'info@stayreadyinstitutes.com'
      
      createSession(studentId, isAdmin)
      
      // Redirect admin to admin dashboard, students to student dashboard
      if (isAdmin) {
        router.push('/admin/dashboard')
      } else {
        router.push(`/student/dashboard?studentId=${studentId}`)
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Student not found. Please enroll in a course first.')
      } else {
        setError('Error logging in. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (checkingSession) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="card">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              Student Portal Login
            </h1>

            <ErrorMessage message={error} />

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-field"
                  placeholder="your.email@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div className="mt-6 text-center space-y-4">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link href="/student/register" className="text-primary-600 hover:underline">
                  Register here
                </Link>
              </p>
              
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-3">Quick Links:</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link href="/home" className="text-primary-600 hover:underline text-sm">
                    Home
                  </Link>
                  <span className="text-gray-300">|</span>
                  <Link href="/courses" className="text-primary-600 hover:underline text-sm">
                    Courses
                  </Link>
                  <span className="text-gray-300">|</span>
                  <Link href="/memberships" className="text-primary-600 hover:underline text-sm">
                    Memberships
                  </Link>
                  <span className="text-gray-300">|</span>
                  <Link href="/about" className="text-primary-600 hover:underline text-sm">
                    About
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
