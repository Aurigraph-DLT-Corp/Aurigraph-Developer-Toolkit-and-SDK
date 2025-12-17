/**
 * Demo Protected Route Component
 *
 * Guards routes that require demo registration before access.
 * Redirects unregistered users to the demo registration page.
 *
 * @author Aurigraph DLT Development Team
 * @since V12.0.0
 * @see RTN-603
 */

import { Navigate, useLocation } from 'react-router-dom'
import { DemoUserService } from '../pages/demo/DemoRegistration'

interface DemoProtectedRouteProps {
  children: React.ReactNode
}

export default function DemoProtectedRoute({ children }: DemoProtectedRouteProps) {
  const location = useLocation()
  const isRegistered = DemoUserService.isRegistered()

  if (!isRegistered) {
    // Redirect to registration, preserving the intended destination
    return (
      <Navigate
        to="/demo/register"
        state={{ from: location.pathname }}
        replace
      />
    )
  }

  // Update last active timestamp
  DemoUserService.updateLastActive()

  return <>{children}</>
}
