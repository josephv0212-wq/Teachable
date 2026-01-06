import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import CourseCard from '../../components/CourseCard'
import { COURSES } from '../../data/courses'

export default function Courses() {
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {COURSES.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

