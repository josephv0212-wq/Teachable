import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function AccessibilityStatement() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Accessibility Statement</h1>
          
          <div className="card">
            <div className="space-y-6">
              <div>
                <p className="text-gray-600 mb-4">
                  This statement was last updated on [enter relevant date].
                </p>
                <p className="text-gray-600 leading-relaxed">
                  We at Stay Ready Training Academy are working to make our site accessible to people with disabilities.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">What web accessibility is</h2>
                <p className="text-gray-600 leading-relaxed">
                  An accessible site allows visitors with disabilities to browse the site with the same or a similar level of ease and enjoyment as other visitors. This can be achieved with the capabilities of the system on which the site is operating, and through assistive technologies.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">Accessibility adjustments on this site</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  We have adapted this site in accordance with WCAG 2.1 guidelines, and have made the site accessible to the level of AA. This site's contents have been adapted to work with assistive technologies, such as screen readers and keyboard use. As part of this effort, we have also:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
                  <li>Used the Accessibility Wizard to find and fix potential accessibility issues</li>
                  <li>Set the language of the site</li>
                  <li>Set the content order of the site's pages</li>
                  <li>Defined clear heading structures on all of the site's pages</li>
                  <li>Added alternative text to images</li>
                  <li>Implemented color combinations that meet the required color contrast</li>
                  <li>Reduced the use of motion on the site</li>
                  <li>Ensured all videos, audio, and files on the site are accessible</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">Declaration of partial compliance with the standard due to third-party content</h2>
                <p className="text-gray-600 leading-relaxed">
                  The accessibility of certain pages on the site depend on contents that do not belong to the organization, and instead belong to third-party providers. We therefore declare partial compliance with the standard for these pages.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">Accessibility arrangements in the organization</h2>
                <p className="text-gray-600 leading-relaxed">
                  Stay Ready Training Academy is committed to providing accessible services. For information about physical accessibility arrangements at our facilities, please contact us directly.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">Requests, issues, and suggestions</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  If you find an accessibility issue on the site, or if you require further assistance, you are welcome to contact us:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 mb-2">
                    <strong>Phone:</strong> 832-890-2542
                  </p>
                  <p className="text-gray-700 mb-2">
                    <strong>Email:</strong> info@stayreadyinstitutes.com
                  </p>
                  <p className="text-gray-700">
                    <strong>Address:</strong> 2600 South Loop West Ste. 693, Houston, TX. 77054
                  </p>
                </div>
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

