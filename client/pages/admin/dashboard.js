import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import axios from 'axios'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { hasValidSession, isAdmin, clearSession } from '../../utils/session'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://86.104.72.45:5000/api'

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({
    students: 0,
    courses: 0,
    enrollments: 0,
    certificates: 0
  })
  const [recentEnrollments, setRecentEnrollments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is admin
    if (!hasValidSession() || !isAdmin()) {
      clearSession()
      router.push('/student/login')
      return
    }
    fetchDashboardData()
  }, [router])

  const fetchDashboardData = async () => {
    try {
      const [studentsRes, coursesRes, enrollmentsRes, certificatesRes] = await Promise.all([
        axios.get(`${API_URL}/users`),
        axios.get(`${API_URL}/courses`),
        axios.get(`${API_URL}/enrollments`),
        axios.get(`${API_URL}/certificates`)
      ])

      setStats({
        students: studentsRes.data.length,
        courses: coursesRes.data.length,
        enrollments: enrollmentsRes.data.length,
        certificates: certificatesRes.data.length
      })

      // Get recent enrollments
      const enrollments = enrollmentsRes.data
        .sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt))
        .slice(0, 10)
      setRecentEnrollments(enrollments)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex space-x-4">
              <Link href="/admin/students" className="btn-primary">
                Manage Students
              </Link>
              <Link href="/admin/memberships" className="btn-secondary">
                Manage Memberships
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Students</h3>
              <p className="text-3xl font-bold text-primary-600">{stats.students}</p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Active Courses</h3>
              <p className="text-3xl font-bold text-primary-600">{stats.courses}</p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Enrollments</h3>
              <p className="text-3xl font-bold text-primary-600">{stats.enrollments}</p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Certificates Issued</h3>
              <p className="text-3xl font-bold text-primary-600">{stats.certificates}</p>
            </div>
          </div>

          <div className="card">
            <h2 className="text-2xl font-semibold mb-6">Recent Enrollments</h2>
            {recentEnrollments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentEnrollments.map((enrollment) => (
                      <tr key={enrollment._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {enrollment.student?.firstName} {enrollment.student?.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {enrollment.course?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            enrollment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            enrollment.status === 'active' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {enrollment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {enrollment.progress}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(enrollment.enrolledAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600">No enrollments yet.</p>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

