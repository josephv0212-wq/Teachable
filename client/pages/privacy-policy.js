import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="card">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">A legal disclaimer</h2>
                <p className="text-gray-600 leading-relaxed">
                  The explanations and information provided on this page are only general and high-level explanations and information on how to write your own document of a Privacy Policy. You should not rely on this article as legal advice or as recommendations regarding what you should actually do, because we cannot know in advance what are the specific privacy policies you wish to establish between your business and your customers and visitors. We recommend that you seek legal advice to help you understand and to assist you in the creation of your own Privacy Policy.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">Privacy Policy - the basics</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Having said that, a privacy policy is a statement that discloses some or all of the ways a website collects, uses, discloses, processes, and manages the data of its visitors and customers. It usually also includes a statement regarding the website's commitment to protecting its visitors' or customers' privacy, and an explanation about the different mechanisms the website is implementing in order to protect privacy.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Different jurisdictions have different legal obligations of what must be included in a Privacy Policy. You are responsible to make sure you are following the relevant legislation to your activities and location.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">What to include in the Privacy Policy</h2>
                <p className="text-gray-600 leading-relaxed">
                  Generally speaking, a Privacy Policy often addresses these types of issues: the types of information the website is collecting and the manner in which it collects the data; an explanation about why is the website collecting these types of information; what are the website's practices on sharing the information with third parties; ways in which your visitors and customers can exercise their rights according to the relevant privacy legislation; the specific practices regarding minors' data collection; and much, much more.
                </p>
                <p className="text-gray-600 leading-relaxed mt-4">
                  To learn more about this, check out our article "Creating a Privacy Policy".
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-4">Related Pages:</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/terms-conditions" className="btn-secondary text-sm">
                  Terms & Conditions
                </Link>
                <Link href="/refund-policy" className="btn-secondary text-sm">
                  Refund Policy
                </Link>
                <Link href="/home" className="btn-secondary text-sm">
                  Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

