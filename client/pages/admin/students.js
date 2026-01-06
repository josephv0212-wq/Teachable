import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import axios from 'axios'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { hasValidSession, isAdmin, clearSession } from '../../utils/session'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://86.104.72.45:5000/api'

export default function AdminStudents() {
  const router = useRouter()
  const [students, setStudents] = useState([])
  const [memberships, setMemberships] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [assignFormData, setAssignFormData] = useState({
    membershipPlanId: '',
    expiresAt: ''
  })

  useEffect(() => {
    // Check if user is admin
    if (!hasValidSession() || !isAdmin()) {
      clearSession()
      router.push('/student/login')
      return
    }
    fetchData()
  }, [router])

  const fetchData = async () => {
    try {
      const [studentsRes, membershipsRes, plansRes] = await Promise.all([
        axios.get(`${API_URL}/users`),
        axios.get(`${API_URL}/memberships/all`),
        axios.get(`${API_URL}/memberships/plans`)
      ])

      setStudents(studentsRes.data)
      setMemberships(membershipsRes.data)
      setPlans(plansRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStudentMembership = (studentId) => {
    return memberships.find(m => m.studentId === studentId && m.status === 'active')
  }

  const handleAssignMembership = async (e) => {
    e.preventDefault()
    try {
      await axios.post(`${API_URL}/memberships/assign`, {
        studentId: selectedStudent.id,
        membershipPlanId: parseInt(assignFormData.membershipPlanId),
        expiresAt: assignFormData.expiresAt || null
      })
      alert('Membership assigned successfully!')
      setShowAssignForm(false)
      setSelectedStudent(null)
      setAssignFormData({ membershipPlanId: '', expiresAt: '' })
      fetchData()
    } catch (error) {
      console.error('Error assigning membership:', error)
      alert(error.response?.data?.error || 'Failed to assign membership')
    }
  }

  const handleRemoveMembership = async (membershipId) => {
    if (!confirm('Are you sure you want to remove this membership?')) {
      return
    }

    try {
      await axios.post(`${API_URL}/memberships/remove/${membershipId}`)
      alert('Membership removed successfully!')
      fetchData()
    } catch (error) {
      console.error('Error removing membership:', error)
      alert(error.response?.data?.error || 'Failed to remove membership')
    }
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
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Student Management</h1>

          {showAssignForm && selectedStudent && (
            <div className="card mb-8">
              <h2 className="text-2xl font-semibold mb-4">
                Assign Membership to {selectedStudent.firstName} {selectedStudent.lastName}
              </h2>
              <form onSubmit={handleAssignMembership} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Membership Plan *
                  </label>
                  <select
                    value={assignFormData.membershipPlanId}
                    onChange={(e) => setAssignFormData(prev => ({ ...prev, membershipPlanId: e.target.value }))}
                    required
                    className="input-field"
                  >
                    <option value="">Select a plan</option>
                    {plans.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - ${plan.price}
                        {plan.type !== 'lifetime' && `/${plan.billingInterval}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiration Date (Optional - leave blank for default)
                  </label>
                  <input
                    type="date"
                    value={assignFormData.expiresAt}
                    onChange={(e) => setAssignFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                    className="input-field"
                  />
                </div>

                <div className="flex space-x-4">
                  <button type="submit" className="btn-primary">
                    Assign Membership
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssignForm(false)
                      setSelectedStudent(null)
                      setAssignFormData({ membershipPlanId: '', expiresAt: '' })
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="card overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Membership</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => {
                  const membership = getStudentMembership(student.id)
                  return (
                    <tr key={student.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.firstName} {student.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.phone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {membership ? (
                          <div>
                            <span className="font-semibold">{membership.planName}</span>
                            {membership.currentPeriodEnd && (
                              <div className="text-xs text-gray-500">
                                Renews: {new Date(membership.currentPeriodEnd).toLocaleDateString()}
                              </div>
                            )}
                            {membership.expiresAt && (
                              <div className="text-xs text-gray-500">
                                Expires: {new Date(membership.expiresAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">No membership</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {membership ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                            Free
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {membership ? (
                          <button
                            onClick={() => handleRemoveMembership(membership.id)}
                            className="text-red-600 hover:text-red-800 mr-4"
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedStudent(student)
                              setShowAssignForm(true)
                            }}
                            className="text-primary-600 hover:text-primary-800"
                          >
                            Assign Plan
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-4">Admin Navigation:</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/admin/dashboard" className="btn-secondary text-sm">
                Dashboard
              </Link>
              <Link href="/admin/memberships" className="btn-secondary text-sm">
                Manage Memberships
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
