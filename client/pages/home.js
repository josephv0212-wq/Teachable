import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import CourseCard from '../components/CourseCard'
import Hero from '../components/Hero'
import { COURSES } from '../data/courses'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://86.104.72.45:5000/api'

export default function Home() {
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Hero />
        
        <section id="courses" className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Our Courses
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                State-approved Private Security Training courses required by the Texas Department of Public Safety
              </p>
            </div>
            {loading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {courses.map((course) => (
                  <CourseCard key={course._id || course.id} course={course} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Why Choose Stay Ready Training Academy?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
              <div className="card">
                <h3 className="text-xl font-semibold mb-3">State-Approved</h3>
                <p className="text-gray-600">
                  All courses are approved by the Texas Department of Public Safety
                </p>
              </div>
              <div className="card">
                <h3 className="text-xl font-semibold mb-3">Online Learning</h3>
                <p className="text-gray-600">
                  Complete your training at your own pace, from anywhere
                </p>
              </div>
              <div className="card">
                <h3 className="text-xl font-semibold mb-3">Official Certificates</h3>
                <p className="text-gray-600">
                  Receive your official certificate upon successful completion
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

