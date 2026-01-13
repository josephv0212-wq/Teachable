import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import axios from 'axios'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import EnrollmentForm from '../../components/EnrollmentForm'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://86.104.72.45:5000/api'

export default function CourseDetail() {
  const router = useRouter()
  const { id } = router.query
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEnrollment, setShowEnrollment] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)
  const [membership, setMembership] = useState(null)

  useEffect(() => {
    if (id) {
      fetchCourse()
    }
  }, [id])

  const fetchCourse = async () => {
    try {
      const response = await axios.get(`${API_URL}/courses/${id}`)
      const courseData = response.data
      setCourse(courseData)
      
      // Check membership access
      try {
        // Try to get student ID from session or query
        const studentId = router.query.studentId || localStorage.getItem('studentId')
        if (studentId && studentId !== 'undefined') {
          const membershipRes = await axios.get(`${API_URL}/memberships/student/${studentId}`).catch(() => ({ data: null }))
          const studentMembership = membershipRes.data
          setMembership(studentMembership)
          
          if (studentMembership) {
            // Check if course is in membership tier
            const planRes = await axios.get(`${API_URL}/memberships/plans/${studentMembership.membershipPlanId}`)
            const plan = planRes.data
            
            if (plan.courses && plan.courses.some(c => c.id === parseInt(id) || c._id === parseInt(id))) {
              setHasAccess(true)
            } else if (courseData.price === 0) {
              // Free course - everyone has access
              setHasAccess(true)
            }
          } else if (courseData.price === 0) {
            // Free course - everyone has access
            setHasAccess(true)
          }
        } else if (courseData.price === 0) {
          // Free course - everyone has access
          setHasAccess(true)
        }
      } catch (membershipError) {
        console.error('Error checking membership:', membershipError)
        // If course is free, allow access
        if (courseData.price === 0) {
          setHasAccess(true)
        }
      }
    } catch (error) {
      console.error('Error fetching course:', error)
      if (error.response?.status === 404) {
        // Course not found - handled by the UI check below
      }
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

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Course not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-4">
            <Link href="/courses" className="text-primary-600 hover:underline">
              ← Back to All Courses
            </Link>
          </div>

          <div className="card mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{course.name}</h1>
            <p className="text-gray-600 text-lg mb-6">{course.description}</p>
            
            <div className="flex flex-wrap gap-4 mb-6">
              {course.duration && (
                <span className="bg-primary-100 text-primary-800 px-4 py-2 rounded-lg">
                  Duration: {course.duration}
                </span>
              )}
              <span className="bg-green-100 text-green-800 px-4 py-2 rounded-lg">
                State-Approved
              </span>
              <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
                Certificate Included
              </span>
            </div>

            <div className="text-3xl font-bold text-primary-600 mb-6">
              ${course.price?.toFixed(2) || '0.00'}
            </div>

            <button
              onClick={() => setShowEnrollment(!showEnrollment)}
              className="btn-primary w-full sm:w-auto"
            >
              {showEnrollment ? 'Cancel Enrollment' : 'Enroll Now'}
            </button>
          </div>

          {showEnrollment && (
            <div className="card mb-8">
              <EnrollmentForm courseId={course._id} coursePrice={course.price} />
            </div>
          )}

          {course.examPaperUrl && (
            <div className="card mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">📄 Exam Paper</h2>
                  <p className="text-gray-600 mb-4">
                    Download the exam paper to review and prepare for your test. The exam paper contains sample questions and study materials.
                  </p>
                  {hasAccess || course.price === 0 ? (
                    <a
                      href={`${(process.env.NEXT_PUBLIC_API_URL || 'http://86.104.72.45:5000/api').replace('/api', '')}${course.examPaperUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary inline-block"
                    >
                      Download Exam Paper
                    </a>
                  ) : (
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800 mb-2">
                        <strong>Membership Required</strong>
                      </p>
                      <p className="text-yellow-700 text-sm mb-3">
                        You need to upgrade your membership plan to access this exam paper.
                      </p>
                      <Link href="/memberships" className="btn-primary inline-block text-sm">
                        Upgrade Membership
                      </Link>
                    </div>
                  )}
                </div>
                <div className="hidden md:block text-6xl">📚</div>
              </div>
            </div>
          )}

          {course.curriculum && course.curriculum.sections && (
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Curriculum</h2>
              <div className="space-y-6">
                {course.curriculum.sections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="border-l-4 border-primary-500 pl-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {section.title}
                    </h3>
                    {section.lessons && (
                      <ul className="space-y-2">
                        {section.lessons.map((lesson, lessonIndex) => (
                          <li key={lessonIndex} className="text-gray-600">
                            {lesson.order}. {lesson.title}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {course.teachableCourseId && (
            <div className="card mt-8 text-center">
              <p className="text-gray-600 mb-4">
                This course is also available on our Teachable platform
              </p>
              <a
                href={`https://stayreadyinstitutes.teachable.com/courses/${course.teachableCourseId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-block"
              >
                Access on Teachable
              </a>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Link href="/courses" className="btn-secondary">
              View All Courses
            </Link>
            <Link href="/memberships" className="btn-secondary">
              Check Membership Plans
            </Link>
            <Link href="/home" className="btn-secondary">
              Back to Home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

