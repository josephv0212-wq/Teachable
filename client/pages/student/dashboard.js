import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'
import axios from 'axios'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { getStudentId, hasValidSession, refreshSession, clearSession } from '../../utils/session'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://86.104.72.45:5000/api'
const BASE_URL = API_URL.replace('/api', '')

// Course data matching the courses page
const courseData = [
  {
    id: 'level2',
    title: 'Level 2 Non - Commission',
    description: 'This is a State required course in order to work as a Security officer who does not carry a Firearm',
    image: '/images/level2-classroom.jpg',
    examPaperUrl: '/uploads/course-materials/level2-exam.pdf',
    examPage: '/exams/level2'
  },
  {
    id: 'level3',
    title: 'Level 3 Commission',
    description: 'This is a State required in order to carry a Firearm on duty as a licensed Security Officer',
    image: '/images/level3-badge.jpg',
    examPaperUrl: '/uploads/course-materials/level3-exam.pdf',
    examPage: '/exams/level2'
  },
  {
    id: 'level3-recert',
    title: 'Level 3 Recertification',
    description: 'This is a every Two year State required course in order to maintain the Level 3 Commission',
    image: '/images/level3-training.jpg',
    examPaperUrl: '/uploads/course-materials/level3-exam.pdf',
    examPage: '/exams/level2'
  },
  {
    id: 'ltc',
    title: 'License To Carry (LTC)',
    description: 'This is a State required course in order to carry a Firearm in public',
    image: '/images/ltc-range.jpg',
    examPaperUrl: '/uploads/course-materials/ltc-exam.pdf',
    examPage: '/exams/level2'
  },
  {
    id: 'exam2',
    title: 'Test Exam 2',
    description: 'This is a test course for exam functionality. Use this course to test the exam system.',
    image: '/images/level2-classroom.jpg',
    examPaperUrl: null,
    examPage: '/courses/1/exam'
  }
]

// Helper functions
const isValidStudentId = (id) => id && id !== 'undefined'

const getStudentIdFromQueryOrSession = (queryStudentId) => {
  const sessionStudentId = getStudentId()
  return isValidStudentId(queryStudentId) ? queryStudentId : sessionStudentId
}

const normalizeString = (str) => (str || '').toLowerCase()

const matchCourse = (course, dbCourse) => {
  const courseIdLower = normalizeString(course.id)
  const courseTitleLower = normalizeString(course.title)
  const courseNumberLower = normalizeString(dbCourse.courseNumber)
  const courseNameLower = normalizeString(dbCourse.name)

  return (
    courseNumberLower === courseIdLower ||
    courseNumberLower.includes(courseIdLower) ||
    courseIdLower.includes(courseNumberLower) ||
    courseNameLower.includes(courseTitleLower) ||
    courseTitleLower.includes(courseNameLower) ||
    courseNameLower.includes(courseIdLower) ||
    courseIdLower.includes(courseNameLower)
  )
}

const findCourseByKeywords = (course, coursesToSearch) => {
  const courseTitleLower = normalizeString(course.title)
  const keyWords = courseTitleLower.split(/\s+/).filter(w => w.length > 2)
  
  return coursesToSearch.find(c => {
    const courseNameLower = normalizeString(c.name)
    return keyWords.some(word => courseNameLower.includes(word))
  })
}

export default function StudentDashboard() {
  const router = useRouter()
  const [student, setStudent] = useState(null)
  const [enrollments, setEnrollments] = useState([])
  const [certificates, setCertificates] = useState([])
  const [courses, setCourses] = useState([])
  const [membership, setMembership] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hasValidSession()) {
      clearSession()
      router.push('/student/login')
      return
    }

    refreshSession()

    const queryStudentId = router.query.studentId
    const studentId = getStudentIdFromQueryOrSession(queryStudentId)

    if (!isValidStudentId(studentId)) {
      console.error('No valid student ID found. Query:', queryStudentId, 'Session:', getStudentId())
      clearSession()
      router.push('/student/login')
      return
    }

    // Update URL if query param is missing
    if (!isValidStudentId(queryStudentId)) {
      router.replace(`/student/dashboard?studentId=${studentId}`, undefined, { shallow: true })
    }

    fetchStudentData(studentId)
  }, [router.query])

  const fetchStudentData = async (studentId) => {
    try {
      const [studentRes, enrollmentsRes, certificatesRes, coursesRes, membershipRes] = await Promise.all([
        axios.get(`${API_URL}/users/${studentId}`),
        axios.get(`${API_URL}/enrollments/student/${studentId}`),
        axios.get(`${API_URL}/certificates/student/${studentId}`),
        axios.get(`${API_URL}/courses`),
        axios.get(`${API_URL}/memberships/student/${studentId}`).catch(() => ({ data: null }))
      ])

      setStudent(studentRes.data)
      setEnrollments(enrollmentsRes.data)
      setCertificates(certificatesRes.data)
      setCourses(coursesRes.data || [])
      setMembership(membershipRes.data)
    } catch (error) {
      console.error('Error fetching student data:', error)
      if (error.response?.status === 401 || error.response?.status === 404) {
        clearSession()
        router.push('/student/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const findOrCreateEnrollment = async (courseId, courseNumber) => {
    try {
      const studentId = getStudentIdFromQueryOrSession(router.query.studentId)
      
      if (!isValidStudentId(studentId)) {
        alert('Please login first')
        router.push('/student/login')
        return null
      }

      // Check if enrollment already exists
      const enrollmentsRes = await axios.get(`${API_URL}/enrollments/student/${studentId}`)
      const existingEnrollment = enrollmentsRes.data.find(
        e => e.courseId === courseId || e.course?.courseNumber === courseNumber
      )

      if (existingEnrollment) {
        return existingEnrollment.id || existingEnrollment._id
      }

      // Create new enrollment automatically (test exams are free)
      const enrollmentRes = await axios.post(`${API_URL}/enrollments`, {
        studentId: parseInt(studentId),
        courseId: parseInt(courseId),
        paymentStatus: 'paid'
      })

      return enrollmentRes.data.id || enrollmentRes.data._id
    } catch (error) {
      console.error('Error finding/creating enrollment:', error)
      alert('Failed to start exam. Please try again.')
      return null
    }
  }

  const findCourseInDatabase = async (course) => {
    // Ensure courses are loaded
    let coursesToSearch = courses
    if (!coursesToSearch || coursesToSearch.length === 0) {
      try {
        const coursesRes = await axios.get(`${API_URL}/courses`)
        coursesToSearch = coursesRes.data || []
        setCourses(coursesToSearch)
      } catch (fetchError) {
        console.error('Error fetching courses:', fetchError)
        throw new Error('Failed to load courses. Please try again.')
      }
    }

    // Try matching by courseNumber or name
    let dbCourse = coursesToSearch.find(c => matchCourse(course, c))

    // Try fetching course directly by ID if course.id is numeric
    if (!dbCourse && !isNaN(course.id)) {
      try {
        const courseRes = await axios.get(`${API_URL}/courses/${course.id}`)
        dbCourse = courseRes.data
      } catch (directFetchError) {
        console.log('Direct course fetch failed:', directFetchError)
      }
    }

    // Try keyword-based matching
    if (!dbCourse) {
      dbCourse = findCourseByKeywords(course, coursesToSearch)
    }

    if (!dbCourse) {
      console.error('Course matching failed. Course ID:', course.id, 'Title:', course.title)
      console.error('Available courses:', coursesToSearch.map(c => ({ 
        id: c.id, 
        courseNumber: c.courseNumber, 
        name: c.name 
      })))
      // Return null instead of throwing error - let calling code handle it
      return null
    }

    return dbCourse
  }

  const handleTestExam = async (course) => {
    try {
      const studentId = getStudentIdFromQueryOrSession(router.query.studentId)
      
      if (!isValidStudentId(studentId)) {
        alert('Please login first')
        router.push('/student/login')
        return
      }

      // For level2, find and navigate to exam2 course
      if (course.id === 'level2') {
        try {
          // Fetch all courses to find exam2
          const coursesRes = await axios.get(`${API_URL}/courses`)
          const allCourses = coursesRes.data || []
          
          // Find exam2 course by courseNumber
          const exam2Course = allCourses.find(c => c.courseNumber === 'exam2')
          
          if (exam2Course) {
            // Find or create enrollment for exam2
            const enrollmentId = await findOrCreateEnrollment(exam2Course.id, exam2Course.courseNumber)
            if (enrollmentId) {
              router.push(`/courses/${exam2Course.id}/exam?enrollmentId=${enrollmentId}&studentId=${studentId}`)
            } else {
              // If enrollment creation fails, still navigate - exam page will handle it
              router.push(`/courses/${exam2Course.id}/exam?studentId=${studentId}`)
            }
          } else {
            // Fallback: try course ID 1 (exam2 might be ID 1)
            router.push(`/courses/1/exam?studentId=${studentId}`)
          }
        } catch (error) {
          console.error('Error finding exam2 course:', error)
          // Fallback: try course ID 1
          router.push(`/courses/1/exam?studentId=${studentId}`)
        }
        return
      }

      // For exam2, use the existing lookup logic
      if (course.id === 'exam2') {
        const dbCourse = await findCourseInDatabase(course)
        if (dbCourse) {
          const enrollmentId = await findOrCreateEnrollment(dbCourse.id, dbCourse.courseNumber)
          if (enrollmentId) {
            router.push(`/courses/${dbCourse.id}/exam?enrollmentId=${enrollmentId}&studentId=${studentId}`)
          } else {
            router.push(`/courses/${dbCourse.id}/exam?studentId=${studentId}`)
          }
        } else {
          // Fallback: try course ID 1
          router.push(`/courses/1/exam?studentId=${studentId}`)
        }
        return
      }

      // For other courses, use the existing lookup logic
      const dbCourse = await findCourseInDatabase(course)
      
      if (!dbCourse) {
        console.error('Course not found:', course)
        // Try to navigate directly using course.id if it's numeric
        if (!isNaN(course.id)) {
          router.push(`/courses/${course.id}/exam?studentId=${studentId}`)
        } else {
          console.error('Cannot determine course ID for:', course)
        }
        return
      }

      const enrollmentId = await findOrCreateEnrollment(dbCourse.id, dbCourse.courseNumber)

      if (enrollmentId) {
        router.push(`/courses/${dbCourse.id}/exam?enrollmentId=${enrollmentId}&studentId=${studentId}`)
      }
    } catch (error) {
      console.error('Error starting exam:', error)
      // Don't show alert - just log the error
    }
  }

  const handleGenerateCertificate = async (enrollmentId) => {
    try {
      const response = await axios.post(`${API_URL}/certificates/generate/${enrollmentId}`)

      if (response.data.certificate) {
        alert(`Certificate generated successfully! Certificate #: ${response.data.certificate.certificateNumber}`)
      } else {
        alert('Certificate generation completed. Please refresh the page.')
      }

      // Refresh data
      const studentId = getStudentIdFromQueryOrSession(router.query.studentId)
      if (isValidStudentId(studentId)) {
        await fetchStudentData(studentId)
      } else {
        console.error('Cannot refresh: No valid student ID')
      }
    } catch (error) {
      console.error('Certificate generation error:', error)
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.details || 
                          error.message || 
                          'Failed to generate certificate'
      alert(`Error: ${errorMessage}`)
    }
  }

  const handleGenerateAllCertificates = async () => {
    const passedEnrollments = enrollments.filter(e => e.examPassed && !e.certificateIssued)
    for (const enrollment of passedEnrollments) {
      try {
        await handleGenerateCertificate(enrollment.id)
      } catch (error) {
        console.error('Error generating certificate:', error)
      }
    }
  }

  const handleCancelMembership = async () => {
    if (!membership || !confirm('Are you sure you want to cancel your membership?')) {
      return
    }

    try {
      await axios.post(`${API_URL}/memberships/cancel/${membership.id}`)
      alert('Membership canceled successfully')
      const studentId = getStudentIdFromQueryOrSession(router.query.studentId)
      if (isValidStudentId(studentId)) {
        await fetchStudentData(studentId)
      }
    } catch (error) {
      console.error('Error canceling membership:', error)
      alert(error.response?.data?.error || 'Failed to cancel membership')
    }
  }

  const handleRowClick = (course) => (e) => {
    // Don't trigger if clicking on the Test Exam button
    if (e.target.tagName === 'A' || e.target.closest('a')) {
      return
    }
    // Open PDF in new tab
    if (course.examPaperUrl) {
      window.open(`${BASE_URL}${course.examPaperUrl}`, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const hasExamPapers = enrollments.some(e => e.course?.examPaperUrl)
  const hasPassedExamsWithoutCertificates = enrollments.some(e => e.examPassed && !e.certificateIssued)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900">
              Student Dashboard
            </h1>
            <div className="flex gap-3">
              <Link href="/courses" className="btn-secondary text-sm">
                Browse Courses
              </Link>
              <Link href="/memberships" className="btn-secondary text-sm">
                View Memberships
              </Link>
            </div>
          </div>

          {/* Exam Papers Quick Access */}
          {hasExamPapers && (
            <div className="card mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📚 Exam Papers</h2>
              <p className="text-gray-600 mb-4">
                Access exam papers for your enrolled courses to help you prepare for your tests.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {enrollments
                  .filter(e => e.course?.examPaperUrl)
                  .map((enrollment) => (
                    <div key={enrollment.id || enrollment._id} className="bg-white p-4 rounded-lg border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {enrollment.course?.name || 'Course'}
                      </h3>
                      <a
                        href={`${BASE_URL}${enrollment.course.examPaperUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary text-sm w-full text-center inline-block"
                      >
                        📄 View Exam Paper
                      </a>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Student Information */}
          {student && (
            <div className="card mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">Student Information</h2>
                <Link
                  href="/memberships"
                  className="btn-primary text-sm whitespace-nowrap"
                >
                  {membership ? 'Upgrade Plan' : 'Upgrade Plans'}
                </Link>
              </div>
              <p className="text-gray-600">
                <strong>Name:</strong> {student.firstName} {student.lastName}
              </p>
              <p className="text-gray-600">
                <strong>Email:</strong> {student.email}
              </p>
              <p className="text-gray-600 mt-4">
                <strong>Membership Plan:</strong>{' '}
                {membership ? (
                  <span className="text-primary-600 font-semibold">
                    {membership.planName}
                    {membership.currentPeriodEnd && (
                      <span className="text-gray-500 text-sm ml-2">
                        (Renews: {new Date(membership.currentPeriodEnd).toLocaleDateString()})
                      </span>
                    )}
                    {membership.expiresAt && (
                      <span className="text-gray-500 text-sm ml-2">
                        (Expires: {new Date(membership.expiresAt).toLocaleDateString()})
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-gray-500">Free plan</span>
                )}
              </p>
            </div>
          )}

          <div className="space-y-8">
            {/* My Enrollments */}
            <div>
              <h2 className="text-2xl font-semibold mb-6">My Enrollments</h2>
              <div className="card overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-4 px-4 font-semibold text-gray-900">Image</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-900">Title</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-900">Description</th>
                      <th className="text-center py-4 px-4 font-semibold text-gray-900">Test Exam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseData.filter(course => course.id !== 'exam2').map((course) => (
                      <tr
                        key={course.id}
                        className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50 cursor-pointer"
                        onClick={handleRowClick(course)}
                      >
                        <td className="py-4 px-4">
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                            <Image
                              src={course.image}
                              alt={course.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {course.title}
                          </h3>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-gray-600">
                            {course.description}
                          </p>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            className="btn-primary text-sm inline-block"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleTestExam(course)
                            }}
                          >
                            Test Exam
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* My Certificates */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">My Certificates</h2>
                {hasPassedExamsWithoutCertificates && (
                  <button
                    onClick={handleGenerateAllCertificates}
                    className="btn-secondary text-sm"
                  >
                    Generate Missing Certificates
                  </button>
                )}
              </div>
              {certificates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {certificates.map((certificate) => (
                    <div
                      key={certificate.id || certificate._id}
                      className="card hover:shadow-lg transition-shadow cursor-pointer border-2 border-gray-200 hover:border-primary-500"
                      onClick={() => {
                        window.open(
                          `${API_URL}/certificates/download/${certificate.id || certificate._id}`,
                          '_blank'
                        )
                      }}
                    >
                      <div className="text-center mb-4">
                        <div className="text-6xl text-green-600 mb-3">🎓</div>
                        <h3 className="text-lg font-semibold mb-2">
                          {certificate.courseName || certificate.course?.name || 'Course Certificate'}
                        </h3>
                      </div>
                      <div className="space-y-2 mb-4 text-sm">
                        <p className="text-gray-600">
                          <strong>Certificate #:</strong> {certificate.certificateNumber}
                        </p>
                        <p className="text-gray-600">
                          <strong>Issued:</strong>{' '}
                          {new Date(certificate.issuedAt || certificate.completionDate).toLocaleDateString()}
                        </p>
                        {certificate.schoolName && (
                          <p className="text-gray-600 text-xs">
                            {certificate.schoolName}
                          </p>
                        )}
                      </div>
                      <div className="pt-4 border-t border-gray-200">
                        <p className="text-primary-600 font-semibold text-center text-sm">
                          Click to Download PDF
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card text-center py-8">
                  <p className="text-gray-600 mb-2">No certificates yet.</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Complete a course and pass the exam to receive your certificate.
                  </p>
                  {hasPassedExamsWithoutCertificates && (
                    <button
                      onClick={handleGenerateAllCertificates}
                      className="btn-primary"
                    >
                      Generate Certificate for Passed Exams
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
