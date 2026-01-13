import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import axios from 'axios'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import { getStudentId, hasValidSession, refreshSession, clearSession } from '../../../utils/session'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://86.104.72.45:5000/api'

// Helper functions
const isValidStudentId = (id) => id && id !== 'undefined'

const getStudentIdFromQueryOrSession = (queryStudentId) => {
  return isValidStudentId(queryStudentId) ? queryStudentId : getStudentId()
}

const getDashboardLink = () => {
  const studentId = getStudentId()
  return studentId ? `/student/dashboard?studentId=${studentId}` : '/student/dashboard'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString()
}

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
)

export default function ExamPage() {
  const router = useRouter()
  const { id, enrollmentId } = router.query
  const [course, setCourse] = useState(null)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hasValidSession()) {
      clearSession()
      router.push('/student/login')
      return
    }

    refreshSession()

    if (id) {
      fetchCourse()
      if (!router.query.enrollmentId && router.query.studentId) {
        createEnrollmentIfNeeded()
      }
    }
  }, [id, router.query])

  const createEnrollmentIfNeeded = async () => {
    try {
      const studentId = getStudentIdFromQueryOrSession(router.query.studentId)
      if (!isValidStudentId(studentId) || !id) return

      // Check membership access first
      try {
        const membershipRes = await axios.get(`${API_URL}/memberships/student/${studentId}`).catch(() => ({ data: null }))
        const studentMembership = membershipRes.data
        
        if (studentMembership) {
          // Check if course is in membership tier
          const planRes = await axios.get(`${API_URL}/memberships/plans/${studentMembership.membershipPlanId}`)
          const plan = planRes.data
          
          if (!plan.courses || !plan.courses.some(c => c.id === parseInt(id) || c._id === parseInt(id))) {
            alert('You do not have access to this course. Please upgrade your membership plan.')
            router.push('/memberships')
            return
          }
        } else {
          // No membership - check if course is free
          const courseRes = await axios.get(`${API_URL}/courses/${id}`)
          if (courseRes.data.price > 0) {
            alert('You do not have access to this course. Please upgrade your membership plan or complete payment.')
            router.push(`/courses/${id}`)
            return
          }
        }
      } catch (membershipError) {
        console.error('Error checking membership:', membershipError)
        // Continue to enrollment check
      }

      // Check if enrollment exists
      const enrollmentsRes = await axios.get(`${API_URL}/enrollments/student/${studentId}`)
      const existingEnrollment = enrollmentsRes.data.find(
        e => e.courseId === parseInt(id) || e.courseId === id
      )

      if (existingEnrollment) {
        const existingEnrollmentId = existingEnrollment.id || existingEnrollment._id
        router.replace(
          `/courses/${id}/exam?enrollmentId=${existingEnrollmentId}&studentId=${studentId}`,
          undefined,
          { shallow: true }
        )
        return
      }

      // Create new enrollment - will check membership access on backend
      try {
        const enrollmentRes = await axios.post(`${API_URL}/enrollments`, {
          studentId: parseInt(studentId),
          courseId: parseInt(id),
          paymentStatus: 'paid'
        })

        const newEnrollmentId = enrollmentRes.data.id || enrollmentRes.data._id
        router.replace(
          `/courses/${id}/exam?enrollmentId=${newEnrollmentId}&studentId=${studentId}`,
          undefined,
          { shallow: true }
        )
      } catch (enrollmentError) {
        if (enrollmentError.response?.status === 403) {
          alert(enrollmentError.response.data.error || 'You do not have access to this course. Please upgrade your membership plan.')
          router.push('/memberships')
        } else {
          throw enrollmentError
        }
      }
    } catch (error) {
      console.error('Error creating enrollment:', error)
      if (error.response?.status === 403) {
        alert(error.response.data.error || 'You do not have access to this course.')
        router.push('/memberships')
      } else {
        alert('Failed to access exam. Please try again.')
      }
    }
  }

  const fetchCourse = async () => {
    try {
      const response = await axios.get(`${API_URL}/courses/${id}`)
      const courseData = response.data
      
      // Check membership access before showing exam
      const studentId = getStudentIdFromQueryOrSession(router.query.studentId)
      if (isValidStudentId(studentId)) {
        try {
          const membershipRes = await axios.get(`${API_URL}/memberships/student/${studentId}`).catch(() => ({ data: null }))
          const studentMembership = membershipRes.data
          
          if (studentMembership) {
            // Check if course is in membership tier
            const planRes = await axios.get(`${API_URL}/memberships/plans/${studentMembership.membershipPlanId}`)
            const plan = planRes.data
            
            if (!plan.courses || !plan.courses.some(c => c.id === parseInt(id) || c._id === parseInt(id))) {
              setCourse(null)
              alert('You do not have access to this course. Please upgrade your membership plan.')
              router.push('/memberships')
              setLoading(false)
              return
            }
          } else if (courseData.price > 0) {
            // No membership and course is not free
            setCourse(null)
            alert('You do not have access to this course. Please upgrade your membership plan or complete payment.')
            router.push(`/courses/${id}`)
            setLoading(false)
            return
          }
        } catch (membershipError) {
          console.error('Error checking membership:', membershipError)
          // Continue to show course if membership check fails
        }
      }
      
      setCourse(courseData)
    } catch (error) {
      console.error('Error fetching course:', error)
      if (error.response?.status === 404) {
        setCourse(null)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionIndex, answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }))
  }

  const generateCertificate = async (enrollmentId) => {
    try {
      const certResponse = await axios.post(`${API_URL}/certificates/generate/${enrollmentId}`)
      
      if (certResponse.data.certificate) {
        setResult(prev => ({ ...prev, certificate: certResponse.data.certificate }))
      } else {
        console.warn('Certificate response missing certificate data:', certResponse.data)
      }
    } catch (certError) {
      console.error('Error generating certificate:', certError)
      const errorMessage = certError.response?.data?.error || 
                          'Failed to generate certificate. You can generate it from your dashboard.'
      setResult(prev => ({ ...prev, certError: errorMessage }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const studentId = getStudentIdFromQueryOrSession(router.query.studentId)
      
      if (!isValidStudentId(studentId)) {
        alert('Session expired. Please login again.')
        router.push('/student/login')
        return
      }

      const answerArray = course.exam.questions.map((_, index) => answers[index] || -1)

      const response = await axios.post(`${API_URL}/enrollments/${enrollmentId || 'new'}/exam`, {
        answers: answerArray,
        studentId: studentId ? parseInt(studentId) : null,
        courseId: id ? parseInt(id) : null
      })

      setResult(response.data)
      setSubmitted(true)

      // Automatically generate certificate if passed
      if (response.data.passed && enrollmentId) {
        await generateCertificate(enrollmentId)
      }
    } catch (error) {
      console.error('Error submitting exam:', error)
      const errorMessage = error.response?.data?.error || 
                          error.message || 
                          'Failed to submit exam. Please try again.'
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const renderCertificateSection = () => {
    if (!result.certificate && !result.certError) {
      return (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <h3 className="text-xl font-bold text-blue-800 mb-2">⏳ Generating Certificate...</h3>
          <p className="text-blue-700">
            Your certificate is being generated. Please check your dashboard in a moment.
          </p>
        </div>
      )
    }

    if (result.certError) {
      return (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
          <h3 className="text-xl font-bold text-yellow-800 mb-2">⚠️ Certificate Generation Issue</h3>
          <p className="text-yellow-700 mb-4">{result.certError}</p>
          <p className="text-sm text-yellow-600">
            Don't worry! Your exam results are saved. You can generate your certificate from your dashboard.
          </p>
        </div>
      )
    }

    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-green-800 mb-4">🎓 Your Certificate is Ready!</h3>
        <div className="bg-white rounded-lg p-4 border border-green-300 mb-4">
          <p className="text-gray-700 mb-2">
            <strong>Certificate #:</strong> {result.certificate.certificateNumber}
          </p>
          <p className="text-gray-700 mb-2">
            <strong>Issued:</strong> {formatDate(result.certificate.issuedAt || result.certificate.completionDate)}
          </p>
        </div>
        <a
          href={`${API_URL}/certificates/download/${result.certificate.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary inline-block w-full text-center"
          onClick={(e) => {
            e.preventDefault()
            window.open(`${API_URL}/certificates/download/${result.certificate.id}`, '_blank')
          }}
        >
          📥 Download Certificate PDF
        </a>
      </div>
    )
  }

  if (loading && !course) {
    return <LoadingSpinner />
  }

  if (!course || !course.exam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Exam not available for this course.</p>
      </div>
    )
  }

  if (submitted && result) {
    const answeredCount = Object.keys(answers).length
    const totalQuestions = course.exam.questions.length

    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto card text-center">
            <h1 className="text-4xl font-bold mb-6">
              {result.passed ? 'Congratulations!' : 'Exam Results'}
            </h1>
            <div className={`text-6xl mb-6 ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
              {result.passed ? '✓' : '✗'}
            </div>
            <p className="text-2xl mb-4">
              Your Score: {result.score.toFixed(1)}%
            </p>
            <p className="text-lg text-gray-600 mb-6">
              {result.passed
                ? 'You passed! Your certificate will be generated automatically.'
                : `You need ${course.exam.passingScore}% to pass. Please review the material and try again.`
              }
            </p>
            {result.passed && (
              <div className="space-y-4">
                {renderCertificateSection()}
                <Link href={getDashboardLink()} className="btn-primary inline-block">
                  Go to Dashboard
                </Link>
              </div>
            )}
            {!result.passed && (
              <Link href={getDashboardLink()} className="btn-secondary inline-block">
                Back to Dashboard
              </Link>
            )}
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const answeredCount = Object.keys(answers).length
  const totalQuestions = course.exam.questions.length
  const allQuestionsAnswered = answeredCount >= totalQuestions

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="card mb-6">
            <h1 className="text-3xl font-bold mb-4">Final Exam: {course.name}</h1>
            <p className="text-gray-600 mb-2">
              Passing Score: {course.exam.passingScore}%
            </p>
            {course.exam.timeLimit && (
              <p className="text-gray-600">
                Time Limit: {course.exam.timeLimit} minutes
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="card">
            <div className="space-y-8">
              {course.exam.questions.map((question, qIndex) => (
                <div key={qIndex} className="border-b border-gray-200 pb-6 last:border-0">
                  <h3 className="text-lg font-semibold mb-4">
                    {qIndex + 1}. {question.question}
                  </h3>
                  <div className="space-y-2">
                    {question.options.map((option, oIndex) => (
                      <label
                        key={oIndex}
                        className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="radio"
                          name={`question-${qIndex}`}
                          value={oIndex}
                          checked={answers[qIndex] === oIndex}
                          onChange={() => handleAnswerChange(qIndex, oIndex)}
                          className="mr-3"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="mb-4 text-sm text-gray-600">
                Answered: {answeredCount} / {totalQuestions} questions
              </div>
              <button
                type="submit"
                disabled={loading || !allQuestionsAnswered}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Exam'}
              </button>
              {!allQuestionsAnswered && (
                <p className="mt-2 text-sm text-red-600">
                  Please answer all questions before submitting.
                </p>
              )}
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}
