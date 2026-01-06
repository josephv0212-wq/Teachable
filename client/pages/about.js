import Link from 'next/link'
import Image from 'next/image'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">About Stay Ready Training Academy</h1>
          
          <div className="card">
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-gray-600 mb-4">
              Stay Ready Training Academy is a licensed security training school in Texas, providing 
              state-approved Private Security Training courses required by the Texas Department 
              of Public Safety.
            </p>
            <p className="text-gray-600 mb-4">
              Our training academy is a culmination of years of security mastery. We are dedicated to providing top-tier education and skill development for aspiring security professionals, setting them on the path to a successful and fulfilling career.
            </p>
            <p className="text-gray-600 mb-4">
              We are committed to providing high-quality, accessible training that prepares 
              individuals for careers in private security while meeting all state requirements.
            </p>
            <p className="text-gray-600 mb-6">
              At our academy, we focus on practical knowledge transfer, ensuring that every student gains the essential skills and expertise needed to excel in the dynamic field of security. Join us in our mission to shape the next generation of security leaders.
            </p>
            
            {/* room1.jpg at bottom of Our Mission */}
            <div className="relative w-full h-64 rounded-lg overflow-hidden mb-6">
              <Image
                src="/images/room1.jpg"
                alt="Training Room 1"
                fill
                className="object-cover"
              />
            </div>
            
            <h3 className="text-xl font-semibold mb-4">State-Approved Training</h3>
            <p className="text-gray-600 mb-6">
              All our courses are pre-designed and approved by the Texas Department of Public 
              Safety. Upon successful completion of a course and passing the required exam, 
              students receive an official certificate that meets state licensing requirements.
            </p>
            
            {/* room2.jpg at bottom of State-Approved Training */}
            <div className="relative w-full h-64 rounded-lg overflow-hidden mb-6">
              <Image
                src="/images/room2.jpg"
                alt="Training Room 2"
                fill
                className="object-cover"
              />
            </div>
            
            <h3 className="text-xl font-semibold mb-4">Why Choose Us?</h3>
            <ul className="space-y-3 text-gray-600 mb-8">
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">✓</span>
                <span>Fully licensed and state-approved training school</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">✓</span>
                <span>Online courses you can complete at your own pace</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">✓</span>
                <span>Official certificates issued immediately upon completion</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">✓</span>
                <span>Experienced instructors with real-world security experience</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">✓</span>
                <span>Support throughout your training journey</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

