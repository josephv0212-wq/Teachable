import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function RefundPolicy() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Refund Policy</h1>
          
          <div className="card">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">A legal disclaimer</h2>
                <p className="text-gray-600 leading-relaxed">
                  The explanations and information provided on this page are only general and high-level explanations and information on how to write your own document of a Refund Policy. You should not rely on this article as legal advice or as recommendations regarding what you should actually do, because we cannot know in advance what are the specific refund policies that you wish to establish between your business and your customers. We recommend that you seek legal advice to help you understand and to assist you in the creation of your own Refund Policy.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">Refund Policy - the basics</h2>
                <p className="text-gray-600 leading-relaxed">
                  Having said that, a Refund Policy is a legally binding document that is meant to establish the legal relations between you and your customers regarding how and if you will provide them with a refund. Online businesses selling products are sometimes required (depending on local laws and regulations) to present their product return policy and refund policy. In some jurisdictions, this is needed in order to comply with consumer protection laws. It may also help you avoid legal claims from customers that are not satisfied with the products they purchased.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">What to include in the Refund Policy</h2>
                <p className="text-gray-600 leading-relaxed">
                  Generally speaking, a Refund Policy often addresses these types of issues: the timeframe for asking for a refund; will the refund be full or partial; under which conditions will the customer receive a refund; and much, much more.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-4">Related Pages:</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/privacy-policy" className="btn-secondary text-sm">
                  Privacy Policy
                </Link>
                <Link href="/terms-conditions" className="btn-secondary text-sm">
                  Terms & Conditions
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

