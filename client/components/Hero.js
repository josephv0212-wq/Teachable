import Link from 'next/link'

export default function Hero() {
  return (
    <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          SECURE YOUR FUTURE TODAY
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
          Welcome to Stay Ready Training Academy. We offer the State Required training in order to work as a Private Security Officer. The classes will be taught by an Ex Police Officer with over 20 years of experience in the Police and security industry.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/home#courses" className="btn-primary bg-white text-primary-600 hover:bg-gray-100">
            View Courses
          </Link>
          <Link href="/student/register" className="btn-secondary bg-primary-500 text-white hover:bg-primary-400">
            Enroll Now
          </Link>
        </div>
      </div>
    </section>
  )
}

