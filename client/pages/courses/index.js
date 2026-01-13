import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import CourseCard from '../../components/CourseCard'
import { COURSES } from '../../data/courses'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://86.104.72.45:5000/api'

export default function Courses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API_URL}/courses`)
      const apiCourses = response.data || []
      
      // Merge API courses with static course data (for images, etc.)
      const mergedCourses = apiCourses.map(apiCourse => {
        // Try to find matching static course by courseNumber or name
        const staticCourse = COURSES.find(sc => 
          sc.id === apiCourse.courseNumber ||
          sc.title.toLowerCase().includes(apiCourse.name.toLowerCase()) ||
          apiCourse.name.toLowerCase().includes(sc.title.toLowerCase())
        )
        
        return {
          ...apiCourse,
          // Use static course image if available, otherwise keep API data
          image: staticCourse?.image || null,
          // Preserve test exam link from static data if available
          testExamLink: staticCourse?.testExamLink || null,
        }
      })
      
      setCourses(mergedCourses)
    } catch (error) {
      console.error('Error fetching courses:', error)
      // Fallback to static courses if API fails
      setCourses(COURSES)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-blue-50">
        <Header />
        <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Our Courses
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              State-approved Private Security Training courses required by the Texas Department of Public Safety
            </p>
          </div>
          {courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {courses.map((course) => (
                <CourseCard key={course._id || course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No courses available at this time.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

