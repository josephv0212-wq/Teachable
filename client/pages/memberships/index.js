import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import axios from 'axios'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { hasValidSession, getStudentId } from '../../utils/session'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://86.104.72.45:5000/api'

export default function Memberships() {
  const router = useRouter()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentMembership, setCurrentMembership] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    setIsLoggedIn(hasValidSession())
    fetchPlans()
    if (hasValidSession()) {
      fetchCurrentMembership()
    }
    
    // Check if request was submitted
    if (router.query.requested === 'true') {
      setTimeout(() => {
        router.replace('/memberships', undefined, { shallow: true })
      }, 5000)
    }
  }, [router.query])

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API_URL}/memberships/plans`)
      setPlans(response.data)
    } catch (error) {
      console.error('Error fetching membership plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentMembership = async () => {
    try {
      const studentId = getStudentId()
      if (studentId) {
        const response = await axios.get(`${API_URL}/memberships/student/${studentId}`)
        setCurrentMembership(response.data)
      }
    } catch (error) {
      console.error('Error fetching current membership:', error)
    }
  }

  const handleSelectPlan = (planId) => {
    if (!isLoggedIn) {
      router.push(`/student/login?redirect=/memberships/checkout?planId=${planId}`)
    } else {
      router.push(`/memberships/checkout?planId=${planId}`)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const getBillingText = (plan) => {
    if (plan.type === 'lifetime') {
      return 'One-time payment'
    }
    if (plan.billingInterval === 'monthly') {
      return 'per month'
    }
    if (plan.billingInterval === 'yearly') {
      return 'per year'
    }
    return ''
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-blue-50">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading membership plans...</p>
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
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Membership Plans
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose a membership plan that fits your training needs. Get access to exclusive courses and discounts.
            </p>
          </div>

          {router.query.requested === 'true' && (
            <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">
                <strong>✓ Request Submitted!</strong> We have received your membership request. Our team will contact you shortly.
              </p>
            </div>
          )}

          {currentMembership && (
            <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">
                <strong>Current Membership:</strong> {currentMembership.planName}
                {currentMembership.currentPeriodEnd && (
                  <span className="ml-2">
                    (Renews: {new Date(currentMembership.currentPeriodEnd).toLocaleDateString()})
                  </span>
                )}
                {currentMembership.expiresAt && (
                  <span className="ml-2">
                    (Expires: {new Date(currentMembership.expiresAt).toLocaleDateString()})
                  </span>
                )}
              </p>
            </div>
          )}

          <div className="flex flex-nowrap justify-center gap-6 overflow-x-auto pb-4">
            {plans.map((plan) => {
              const isCurrentPlan = currentMembership?.membershipPlanId === plan.id
              
              return (
                <div
                  key={plan.id}
                  className={`bg-white rounded-lg shadow-lg overflow-hidden flex-shrink-0 w-64 ${
                    isCurrentPlan ? 'ring-2 ring-primary-600' : ''
                  }`}
                >
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-4">{plan.description}</p>
                    
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-primary-600">
                        {formatPrice(plan.price)}
                      </span>
                      {plan.type !== 'lifetime' && (
                        <span className="text-gray-600 ml-2">{getBillingText(plan)}</span>
                      )}
                    </div>

                    {plan.discountPercent > 0 && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>{plan.discountPercent}% discount</strong> on all courses
                        </p>
                      </div>
                    )}

                    {plan.courses && plan.courses.length > 0 && (
                      <div className="mb-6">
                        <p className="text-sm font-semibold text-gray-700 mb-2">
                          Included Courses ({plan.courses.length}):
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {plan.courses.slice(0, 3).map((course) => (
                            <li key={course.id}>• {course.name}</li>
                          ))}
                          {plan.courses.length > 3 && (
                            <li className="text-primary-600">
                              + {plan.courses.length - 3} more courses
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    {isCurrentPlan ? (
                      <button
                        disabled
                        className="w-full bg-gray-300 text-gray-600 py-3 rounded-lg font-semibold cursor-not-allowed"
                      >
                        Current Plan
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSelectPlan(plan.id)}
                        className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                      >
                        {isLoggedIn ? 'Request Plan' : 'Contact Us'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {plans.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No membership plans available at this time.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
