import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://86.104.72.45:5000/api'
// Base URL without /api for static files
const BASE_URL = API_URL.replace('/api', '')

export default function CourseCard({ course }) {
  const [imageError, setImageError] = useState(false)
  
  const handleCardClick = (e) => {
    // If clicking on the Learn More link, don't trigger card click
    if (e.target.tagName === 'A') {
      return
    }
    
    // If course has exam paper URL, open it in new tab
    if (course.examPaperUrl) {
      e.preventDefault()
      window.open(`${BASE_URL}${course.examPaperUrl}`, '_blank')
    }
  }
  
  const hasExamPaper = course.examPaperUrl || course.examPaperPath
  
  return (
    <div 
      className={`bg-blue-50 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col ${hasExamPaper ? 'cursor-pointer' : ''}`}
      onClick={hasExamPaper ? handleCardClick : undefined}
      role={hasExamPaper ? 'button' : undefined}
      tabIndex={hasExamPaper ? 0 : undefined}
      onKeyDown={hasExamPaper ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleCardClick(e)
        }
      } : undefined}
    >
      <div className="relative w-full h-64 bg-gray-200">
        {course.image && !imageError ? (
          <Image
            src={course.image}
            alt={course.title || course.name}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
            <span className="text-blue-400 text-sm">Image</span>
          </div>
        )}
      </div>
      <div className="p-6 flex-grow flex flex-col bg-blue-50">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          {course.title || course.name}
        </h3>
        <p className="text-gray-700 text-sm leading-relaxed flex-grow">
          {course.description}
        </p>
        {course.testExamLink && (
          <Link
            href={course.testExamLink}
            className="btn-primary mt-4 inline-flex w-full justify-center"
            onClick={e => e.stopPropagation()}
          >
            Test Exam
          </Link>
        )}
        {hasExamPaper && (
          <p className="mt-2 text-xs text-primary-600 font-semibold">
            📄 Click to view exam paper
          </p>
        )}
        {course._id && (
          <Link 
            href={`/courses/${course._id}`}
            className="mt-4 inline-block text-primary-600 hover:text-primary-700 font-semibold text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            Learn More →
          </Link>
        )}
      </div>
    </div>
  )
}

