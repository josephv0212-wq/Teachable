import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import axios from 'axios'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { hasValidSession, getStudentId } from '../../utils/session'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://86.104.72.45:5000/api'

export default function MembershipCheckout() {
  const router = useRouter()
  const { planId } = router.query
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!hasValidSession()) {
      router.push(`/student/login?redirect=/memberships/checkout?planId=${planId}`)
      return
    }

    if (planId) {
      fetchPlan()
      const studentId = getStudentId()
      if (studentId) {
        fetchStudentInfo(studentId)
      }
    }
  }, [planId])

  const fetchPlan = async () => {
    try {
      const response = await axios.get(`${API_URL}/memberships/plans/${planId}`)
      setPlan(response.data)
    } catch (error) {
      console.error('Error fetching plan:', error)
      router.push('/memberships')
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentInfo = async (studentId) => {
    try {
      const response = await axios.get(`${API_URL}/users/${studentId}`)
      const student = response.data
      setFormData({
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        phone: student.phone || '',
        message: `I would like to subscribe to the ${plan?.name || ''} membership plan.`
      })
    } catch (error) {
      console.error('Error fetching student info:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Send contact request to admin
      await axios.post(`${API_URL}/contact`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: `Membership Plan Request: ${plan?.name}`,
        message: formData.message,
        membershipPlanId: planId
      })

      setSuccess(true)
      setTimeout(() => {
        router.push('/memberships?requested=true')
      }, 3000)
    } catch (error) {
      console.error('Error submitting request:', error)
      alert('Failed to submit request. Please try again or contact us directly.')
      setSubmitting(false)
    }
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-blue-50">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex flex-col bg-blue-50">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Plan not found</p>
            <button
              onClick={() => router.push('/memberships')}
              className="mt-4 text-primary-600 hover:underline"
            >
              Back to Membership Plans
            </button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-blue-50">
        <Header />
        <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
              <div className="text-6xl mb-4">✓</div>
              <h2 className="text-2xl font-bold text-green-900 mb-4">Request Submitted Successfully!</h2>
              <p className="text-green-800 mb-6">
                We have received your request for the <strong>{plan.name}</strong> membership plan.
                Our team will contact you shortly to complete your membership setup.
              </p>
              <p className="text-sm text-green-700">
                Redirecting to membership plans...
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-blue-50">
      <Header />
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => router.push('/memberships')}
              className="text-primary-600 hover:underline mb-4"
            >
              ← Back to Membership Plans
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Request Membership Plan</h1>
            <p className="text-gray-600 mt-2">
              Fill out the form below and our team will contact you to set up your membership.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-2">{plan.name}</h2>
            <p className="text-gray-600 mb-4">{plan.description}</p>
            
            <div className="mb-4">
              <span className="text-3xl font-bold text-primary-600">
                {formatPrice(plan.price)}
              </span>
              {plan.type !== 'lifetime' && (
                <span className="text-gray-600 ml-2">/{plan.billingInterval}</span>
              )}
            </div>

            {plan.courses && plan.courses.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Included Courses ({plan.courses.length}):
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {plan.courses.map((course) => (
                    <li key={course.id}>• {course.name}</li>
                  ))}
                </ul>
              </div>
            )}

            {plan.discountPercent > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>{plan.discountPercent}% discount</strong> on all courses
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows="4"
                className="input-field"
                placeholder="Any additional information or questions..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3 text-center">Other options:</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/memberships" className="text-primary-600 hover:underline text-sm">
                View All Plans
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/courses" className="text-primary-600 hover:underline text-sm">
                Browse Courses
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/home" className="text-primary-600 hover:underline text-sm">
                Home
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
