import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import { loadStripe } from '@stripe/stripe-js'
import { hasValidSession, getStudentId } from '../utils/session'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://86.104.72.45:5000/api'
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

export default function EnrollmentForm({ courseId, coursePrice }) {
  const router = useRouter()
  const [formData, setFormData] = useState({
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
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [membership, setMembership] = useState(null)
  const [membershipCheck, setMembershipCheck] = useState(null)
  const [finalPrice, setFinalPrice] = useState(coursePrice)

  useEffect(() => {
    // Check membership if student is logged in
    if (hasValidSession() && courseId) {
      checkMembershipAccess()
    }
  }, [courseId])

  const checkMembershipAccess = async () => {
    try {
      const studentId = getStudentId()
      if (!studentId) return

      // Get student membership
      const membershipRes = await axios.get(`${API_URL}/memberships/student/${studentId}`).catch(() => ({ data: null }))
      const studentMembership = membershipRes.data
      setMembership(studentMembership)

      if (studentMembership) {
        // Get plan details to check course access
        try {
          const planRes = await axios.get(`${API_URL}/memberships/plans/${studentMembership.membershipPlanId}`)
          const plan = planRes.data
          
          // Check if course is included in membership
          const hasAccess = plan.courses && plan.courses.some(c => c.id === parseInt(courseId))
          setMembershipCheck({ hasAccess, membership: studentMembership })
          
          if (hasAccess) {
            setFinalPrice(0)
          } else if (plan.discountPercent > 0) {
            const discountedPrice = coursePrice * (1 - plan.discountPercent / 100)
            setFinalPrice(discountedPrice)
          } else {
            setFinalPrice(coursePrice)
          }
        } catch (planError) {
          console.error('Error fetching plan details:', planError)
          setFinalPrice(coursePrice)
        }
      } else {
        setFinalPrice(coursePrice)
      }
    } catch (error) {
      console.error('Error checking membership:', error)
      setFinalPrice(coursePrice)
    }
  }

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

    try {
      // Create or get student
      let student
      try {
        const studentResponse = await axios.get(`${API_URL}/users/email/${formData.email}`)
        student = studentResponse.data
      } catch (err) {
        if (err.response?.status === 404) {
          // Student doesn't exist, create new one
          try {
            const newStudentResponse = await axios.post(`${API_URL}/users`, formData)
            student = newStudentResponse.data
          } catch (createErr) {
            throw new Error(createErr.response?.data?.error || 'Failed to create student account')
          }
        } else {
          throw new Error(err.response?.data?.error || 'Failed to check student account')
        }
      }

      // Check membership access for this student
      let actualPrice = coursePrice
      let hasAccess = false
      
      try {
        const membershipRes = await axios.get(`${API_URL}/memberships/student/${student._id}`).catch(() => ({ data: null }))
        const studentMembership = membershipRes.data
        
        if (studentMembership) {
          // Check if course is in membership tier
          const planRes = await axios.get(`${API_URL}/memberships/plans/${studentMembership.membershipPlanId}`)
          const plan = planRes.data
          
          if (plan.courses && plan.courses.some(c => c.id === parseInt(courseId))) {
            hasAccess = true
            actualPrice = 0 // Free through membership
          } else if (plan.discountPercent > 0) {
            // Apply discount
            actualPrice = coursePrice * (1 - plan.discountPercent / 100)
          }
        }
      } catch (membershipError) {
        console.error('Error checking membership:', membershipError)
        // Continue with regular price if membership check fails
      }

      // If student has access through membership, enroll directly without payment
      if (hasAccess) {
        await axios.post(`${API_URL}/enrollments`, {
          studentId: student._id,
          courseId: courseId,
          paymentStatus: 'paid'
        })
        router.push(`/student/dashboard?studentId=${student._id}`)
        return
      }

      // Create payment intent with adjusted price
      const paymentResponse = await axios.post(`${API_URL}/payments/create-intent`, {
        amount: actualPrice,
        courseId: courseId,
        studentId: student._id
      })

      // Redirect to Stripe Checkout or handle payment
      if (paymentResponse.data.clientSecret) {
        const stripe = await stripePromise
        const { error: stripeError } = await stripe.redirectToCheckout({
          sessionId: paymentResponse.data.sessionId
        })
        
        if (stripeError) {
          // If redirect fails, create enrollment directly
          await axios.post(`${API_URL}/enrollments`, {
            studentId: student._id,
            courseId: courseId,
            paymentId: paymentResponse.data.paymentIntentId
          })
          
          router.push(`/student/dashboard`)
        }
      } else {
        // Create enrollment without payment (for testing)
        await axios.post(`${API_URL}/enrollments`, {
          studentId: student._id,
          courseId: courseId
        })
        
        router.push(`/student/dashboard`)
      }
    } catch (err) {
      console.error('Enrollment error:', err)
      const errorMessage = err.response?.data?.error || err.message || 'Failed to enroll. Please try again.'
      setError(errorMessage)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Enrollment Information</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

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
          />
        </div>
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
          Phone *
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          className="input-field"
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
      </div>

      <div>
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
          />
        </div>
      </div>

      {/* Membership Info */}
      {membership && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          {membershipCheck?.hasAccess ? (
            <p className="text-blue-800">
              <strong>✓ Included in your {membership.planName} membership</strong> - This course is free!
            </p>
          ) : membership.discountPercent > 0 ? (
            <p className="text-blue-800">
              <strong>Membership Discount:</strong> You'll receive {membership.discountPercent}% off this course.
            </p>
          ) : null}
        </div>
      )}

      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? 'Processing...' : (
            membershipCheck?.hasAccess 
              ? 'Enroll Free (Included in Membership)'
              : `Enroll - $${finalPrice?.toFixed(2) || coursePrice?.toFixed(2) || '0.00'}`
          )}
        </button>
      </div>
    </form>
  )
}

