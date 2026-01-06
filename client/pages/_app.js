import '../styles/globals.css'
import { useEffect } from 'react'
import Head from 'next/head'

export default function App({ Component, pageProps }) {
  useEffect(() => {
    const suppressMetaMaskErrors = (event) => {
      const reason = event?.reason || event?.error || {}
      const message = String(reason?.message || reason || '')
      const stack = String(reason?.stack || '')
      const isMetaMask = message.includes('MetaMask') || stack.includes('nkbihfbeogaeaoehlefnkodbefgpgknn')

      if (isMetaMask) {
        event.preventDefault()
        console.warn('MetaMask not detected; ignoring wallet error')
      }
    }

    window.addEventListener('unhandledrejection', suppressMetaMaskErrors)
    window.addEventListener('error', suppressMetaMaskErrors)

    return () => {
      window.removeEventListener('unhandledrejection', suppressMetaMaskErrors)
      window.removeEventListener('error', suppressMetaMaskErrors)
    }
  }, [])

  return (
    <>
      <Head>
        <title>Stay Ready Institute - Private Security Training</title>
        <meta name="description" content="State-approved Private Security Training Courses in Texas" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" />
      </Head>
      <Component {...pageProps} />
    </>
  )
}

