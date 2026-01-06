import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function TermsConditions() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms & Conditions</h1>
          
          <div className="card">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">A legal disclaimer</h2>
                <p className="text-gray-600 leading-relaxed">
                  The explanations and information provided on this page are only general and high-level explanations and information on how to write your own document of Terms & Conditions. You should not rely on this article as legal advice or as recommendations regarding what you should actually do, because we cannot know in advance what are the specific terms you wish to establish between your business and your customers and visitors. We recommend that you seek legal advice to help you understand and to assist you in the creation of your own Terms & Conditions.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">Terms & Conditions - the basics</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Having said that, Terms and Conditions ("T&C") are a set of legally binding terms defined by you, as the owner of this website. The T&C set forth the legal boundaries governing the activities of the website visitors, or your customers, while they visit or engage with this website. The T&C are meant to establish the legal relationship between the site visitors and you as the website owner.
                </p>
                <p className="text-gray-600 leading-relaxed mb-4">
                  T&C should be defined according to the specific needs and nature of each website. For example, a website offering products to customers in e-commerce transactions requires T&C that are different from the T&C of a website only providing information (like a blog, a landing page, and so on).
                </p>
                <p className="text-gray-600 leading-relaxed">
                  T&C provide you as the website owner the ability to protect yourself from potential legal exposure, but this may differ from jurisdiction to jurisdiction, so make sure to receive local legal advice if you are trying to protect yourself from legal exposure.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">What to include in the T&C document</h2>
                <p className="text-gray-600 leading-relaxed">
                  Generally speaking, T&C often address these types of issues: Who is allowed to use the website; the possible payment methods; a declaration that the website owner may change his or her offering in the future; the types of warranties the website owner gives his or her customers; a reference to issues of intellectual property or copyrights, where relevant; the website owner's right to suspend or cancel a member's account; and much, much more.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-4">Related Pages:</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/privacy-policy" className="btn-secondary text-sm">
                  Privacy Policy
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

