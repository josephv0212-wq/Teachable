import { useRouter } from 'next/router'
import { hasValidSession, getStudentId } from '../utils/session'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://86.104.72.45:5000/api'

export default function MembershipCard({ plan, currentMembership }) {
  const router = useRouter()
  const isLoggedIn = hasValidSession()
  const isCurrentPlan = currentMembership?.membershipPlanId === plan.id

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

  const handleSelect = () => {
    if (!isLoggedIn) {
      router.push(`/student/login?redirect=/memberships/checkout?planId=${plan.id}`)
    } else {
      router.push(`/memberships/checkout?planId=${plan.id}`)
    }
  }

  return (
    <div
      className={`bg-white rounded-lg shadow-lg overflow-hidden ${
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
            onClick={handleSelect}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            {isLoggedIn ? 'Select Plan' : 'Sign Up to Get Started'}
          </button>
        )}
      </div>
    </div>
  )
}
