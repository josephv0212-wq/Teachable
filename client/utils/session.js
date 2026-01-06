// Session management utility
// Session expires after 7 days (can be adjusted)

const SESSION_KEY = 'studentSession'
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

/**
 * Create a new session for a student
 * @param {string} studentId - The student ID
 * @param {boolean} isAdmin - Whether the user is an admin
 */
export const createSession = (studentId, isAdmin = false) => {
  const sessionData = {
    studentId,
    isAdmin: isAdmin || false,
    expiresAt: Date.now() + SESSION_DURATION,
    createdAt: Date.now()
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData))
  return sessionData
}

/**
 * Get the current session if valid
 * @returns {Object|null} Session data or null if expired/invalid
 */
export const getSession = () => {
  try {
    const sessionStr = localStorage.getItem(SESSION_KEY)
    if (!sessionStr) {
      return null
    }

    const sessionData = JSON.parse(sessionStr)
    
    // Check if session is expired
    if (Date.now() > sessionData.expiresAt) {
      // Session expired, remove it
      clearSession()
      return null
    }

    return sessionData
  } catch (error) {
    console.error('Error reading session:', error)
    clearSession()
    return null
  }
}

/**
 * Check if there's a valid session
 * @returns {boolean}
 */
export const hasValidSession = () => {
  return getSession() !== null
}

/**
 * Get student ID from session
 * @returns {string|null}
 */
export const getStudentId = () => {
  const session = getSession()
  return session ? session.studentId : null
}

/**
 * Clear the current session
 */
export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY)
  // Also remove old studentId for backward compatibility
  localStorage.removeItem('studentId')
}

/**
 * Refresh the session expiration time
 */
export const refreshSession = () => {
  const session = getSession()
  if (session) {
    const updatedSession = {
      ...session,
      expiresAt: Date.now() + SESSION_DURATION
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession))
    return updatedSession
  }
  return null
}

/**
 * Get time remaining until session expires (in milliseconds)
 * @returns {number}
 */
export const getSessionTimeRemaining = () => {
  const session = getSession()
  if (!session) {
    return 0
  }
  return Math.max(0, session.expiresAt - Date.now())
}

/**
 * Check if the current user is an admin
 * @returns {boolean}
 */
export const isAdmin = () => {
  const session = getSession()
  return session ? (session.isAdmin === true) : false
}
