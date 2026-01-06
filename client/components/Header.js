import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { hasValidSession, clearSession, getStudentId } from '../utils/session'

export default function Header() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // Check if user is logged in
    setIsLoggedIn(hasValidSession())
  }, [router.pathname])

  const handleLogout = () => {
    clearSession()
    setIsLoggedIn(false)
    router.push('/student/login')
  }

  return (
    <header className="bg-white shadow-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/home" className="text-2xl font-bold text-primary-600">
              Stay Ready Training Academy
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/home" className="text-gray-700 hover:text-primary-600 transition-colors">
              Home
            </Link>
            <Link href="/courses" className="text-gray-700 hover:text-primary-600 transition-colors">
              Courses
            </Link>
            <Link href="/memberships" className="text-gray-700 hover:text-primary-600 transition-colors">
              Memberships
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-primary-600 transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-primary-600 transition-colors">
              Contact
            </Link>
            {isLoggedIn ? (
              <>
                <Link 
                  href={`/student/dashboard?studentId=${getStudentId()}`} 
                  className="text-gray-700 hover:text-primary-600 transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link href="/student/login" className="text-gray-700 hover:text-primary-600 transition-colors">
                Student Portal
              </Link>
            )}
          </div>

          <button
            className="md:hidden text-gray-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4">
            <Link href="/home" className="block text-gray-700 hover:text-primary-600">Home</Link>
            <Link href="/courses" className="block text-gray-700 hover:text-primary-600">Courses</Link>
            <Link href="/memberships" className="block text-gray-700 hover:text-primary-600">Memberships</Link>
            <Link href="/about" className="block text-gray-700 hover:text-primary-600">About</Link>
            <Link href="/contact" className="block text-gray-700 hover:text-primary-600">Contact</Link>
            {isLoggedIn ? (
              <>
                <Link 
                  href={`/student/dashboard?studentId=${getStudentId()}`} 
                  className="block text-gray-700 hover:text-primary-600"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link href="/student/login" className="block text-gray-700 hover:text-primary-600">Student Portal</Link>
            )}
          </div>
        )}
      </nav>
    </header>
  )
}

