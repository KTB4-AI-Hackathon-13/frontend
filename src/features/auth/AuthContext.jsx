import { useCallback, useMemo, useRef, useState } from 'react'

import { getCurrentUser } from './authApi.js'
import { AuthContext } from './authContext.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoadingUser, setIsLoadingUser] = useState(false)
  const requestRef = useRef(null)

  const refreshUser = useCallback(() => {
    if (requestRef.current) return requestRef.current

    setIsLoadingUser(true)
    const request = getCurrentUser()
      .then((currentUser) => {
        setUser(currentUser)
        return currentUser
      })
      .finally(() => {
        requestRef.current = null
        setIsLoadingUser(false)
      })

    requestRef.current = request
    return request
  }, [])

  const clearUser = useCallback(() => setUser(null), [])

  const value = useMemo(
    () => ({ user, isLoadingUser, refreshUser, updateUser: setUser, clearUser }),
    [user, isLoadingUser, refreshUser, clearUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
