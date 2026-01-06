import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import CourseCard from '../components/CourseCard'
import Hero from '../components/Hero'
import { COURSES } from '../data/courses'

export default function Home() {

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {COURSES.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
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

