import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import axios from 'axios'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { hasValidSession, isAdmin, clearSession } from '../../utils/session'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://86.104.72.45:5000/api'

export default function AdminMemberships() {
  const router = useRouter()
  const [plans, setPlans] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'recurring',
    billingInterval: 'monthly',
    price: '',
    discountPercent: 0,
    courseIds: []
  })

  useEffect(() => {
    // Check if user is admin
    if (!hasValidSession() || !isAdmin()) {
      clearSession()
      router.push('/student/login')
      return
    }
    fetchPlans()
    fetchCourses()
  }, [router])

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API_URL}/memberships/plans`)
      setPlans(response.data)
    } catch (error) {
      console.error('Error fetching plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API_URL}/courses`)
      setCourses(response.data || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    if (name === 'courseIds') {
      const courseId = parseInt(value)
      setFormData(prev => ({
        ...prev,
        courseIds: checked
          ? [...prev.courseIds, courseId]
          : prev.courseIds.filter(id => id !== courseId)
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) || 0 : value
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingPlan) {
        await axios.put(`${API_URL}/memberships/plans/${editingPlan.id}`, formData)
      } else {
        await axios.post(`${API_URL}/memberships/plans`, formData)
      }
      setShowForm(false)
      setEditingPlan(null)
      resetForm()
      fetchPlans()
    } catch (error) {
      console.error('Error saving plan:', error)
      alert(error.response?.data?.error || 'Failed to save plan')
    }
  }

  const handleEdit = (plan) => {
    setEditingPlan(plan)
    setFormData({
      name: plan.name,
      description: plan.description || '',
      type: plan.type,
      billingInterval: plan.billingInterval || 'monthly',
      price: plan.price,
      discountPercent: plan.discountPercent || 0,
      courseIds: plan.courses ? plan.courses.map(c => c.id) : []
    })
    setShowForm(true)
  }

  const handleDelete = async (planId) => {
    if (!confirm('Are you sure you want to deactivate this plan?')) {
      return
    }
    try {
      await axios.delete(`${API_URL}/memberships/plans/${planId}`)
      fetchPlans()
    } catch (error) {
      console.error('Error deleting plan:', error)
      alert(error.response?.data?.error || 'Failed to delete plan')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'recurring',
      billingInterval: 'monthly',
      price: '',
      discountPercent: 0,
      courseIds: []
    })
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

  return (
    <div className="min-h-screen flex flex-col bg-blue-50">
      <Header />
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Link href="/admin/dashboard" className="text-primary-600 hover:underline flex items-center gap-2">
              <span>←</span>
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Membership Plans Management</h1>
            <button
              onClick={() => {
                setShowForm(true)
                setEditingPlan(null)
                resetForm()
              }}
              className="btn-primary"
            >
              + Create New Plan
            </button>
          </div>

          {showForm && (
            <div className="card mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                {editingPlan ? 'Edit Plan' : 'Create New Plan'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plan Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type *
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      required
                      className="input-field"
                    >
                      <option value="recurring">Recurring</option>
                      <option value="lifetime">Lifetime</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="input-field"
                  />
                </div>

                {formData.type === 'recurring' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Billing Interval *
                    </label>
                    <select
                      name="billingInterval"
                      value={formData.billingInterval}
                      onChange={handleInputChange}
                      required
                      className="input-field"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      required
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount %
                    </label>
                    <input
                      type="number"
                      name="discountPercent"
                      value={formData.discountPercent}
                      onChange={handleInputChange}
                      step="0.1"
                      min="0"
                      max="100"
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Included Courses
                  </label>
                  <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto">
                    {courses.map((course) => (
                      <label key={course.id} className="flex items-center space-x-2 py-2">
                        <input
                          type="checkbox"
                          name="courseIds"
                          value={course.id}
                          checked={formData.courseIds.includes(course.id)}
                          onChange={handleInputChange}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700">
                          {course.name} ({formatPrice(course.price)})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button type="submit" className="btn-primary">
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingPlan(null)
                      resetForm()
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  {plan.isActive ? (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Active</span>
                  ) : (
                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">Inactive</span>
                  )}
                </div>
                
                <p className="text-gray-600 mb-4">{plan.description}</p>
                
                <div className="mb-4">
                  <p className="text-2xl font-bold text-primary-600">
                    {formatPrice(plan.price)}
                    {plan.type === 'recurring' && `/${plan.billingInterval}`}
                  </p>
                  {plan.discountPercent > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      {plan.discountPercent}% discount on courses
                    </p>
                  )}
                </div>

                {plan.courses && plan.courses.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Included Courses ({plan.courses.length}):
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {plan.courses.slice(0, 3).map((course) => (
                        <li key={course.id}>• {course.name}</li>
                      ))}
                      {plan.courses.length > 3 && (
                        <li className="text-primary-600">
                          + {plan.courses.length - 3} more
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="btn-secondary text-sm flex-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
                  >
                    Deactivate
                  </button>
                </div>
              </div>
            ))}
          </div>

          {plans.length === 0 && (
            <div className="card text-center py-12">
              <p className="text-gray-600 mb-4">No membership plans created yet.</p>
              <button
                onClick={() => {
                  setShowForm(true)
                  setEditingPlan(null)
                  resetForm()
                }}
                className="btn-primary"
              >
                Create First Plan
              </button>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-4">Admin Navigation:</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/admin/dashboard" className="btn-secondary text-sm">
                Dashboard
              </Link>
              <Link href="/admin/students" className="btn-secondary text-sm">
                Manage Students
              </Link>
              <Link href="/home" className="btn-secondary text-sm">
                Public Site
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
