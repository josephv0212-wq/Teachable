import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import axios from 'axios'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { createSession, hasValidSession, getStudentId } from '../../utils/session'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://86.104.72.45:5000/api'

// Helper functions
const getStudentIdFromResponse = (data) => {
  return data.id || data._id
}

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
)

const SuccessMessage = ({ message }) => {
  if (!message) return null
  
  return (
    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
      {message}
    </div>
  )
}

const ErrorMessage = ({ message }) => {
  if (!message) return null
  
  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {message}
    </div>
  )
}

const initialFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  ssn: '',
  address: {
    street: '',
    city: '',
    state: 'TX',
    zipCode: ''
  }
}

export default function StudentRegister() {
  const router = useRouter()
  const [checkingSession, setCheckingSession] = useState(true)
  const [formData, setFormData] = useState(initialFormData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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

  const handleChange = (e) => {
    const { name, value } = e.target
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await axios.post(`${API_URL}/users`, formData)
      const studentId = getStudentIdFromResponse(response.data)

      if (!studentId) {
        setError('Invalid student data received. Please try again.')
        setLoading(false)
        return
      }

      createSession(studentId)
      setSuccess(true)

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push(`/student/dashboard?studentId=${studentId}`)
      }, 2000)
    } catch (err) {
      if (err.response?.status === 400) {
        setError(err.response.data.error || 'Email already exists. Please login instead.')
      } else {
        setError(err.response?.data?.error || 'Failed to register. Please try again.')
      }
      setLoading(false)
    }
  }

  if (checkingSession) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <div className="card">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              Student Registration
            </h1>

            <SuccessMessage message={success ? 'Registration successful! Redirecting to your dashboard...' : ''} />
            <ErrorMessage message={error} />

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="John"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="832-890-2542"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SSN (Last 4 digits) *
                </label>
                <input
                  type="text"
                  name="ssn"
                  value={formData.ssn}
                  onChange={handleChange}
                  maxLength="4"
                  pattern="[0-9]{4}"
                  required
                  className="input-field"
                  placeholder="1234"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Only the last 4 digits are required for certificate generation
                </p>
              </div>

              <div className="border-t pt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Address Information</h2>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="Houston"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="TX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      name="address.zipCode"
                      value={formData.address.zipCode}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="77054"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading || success}
                  className="btn-primary w-full"
                >
                  {loading ? 'Registering...' : success ? 'Registration Successful!' : 'Register'}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center space-y-4">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link href="/student/login" className="text-primary-600 hover:underline">
                  Login here
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
