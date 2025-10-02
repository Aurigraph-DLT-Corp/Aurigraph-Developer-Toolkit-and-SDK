import React, { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import {
  EyeIcon,
  EyeSlashIcon,
  ServerIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from '../components/LoadingSpinner'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const { isAuthenticated, login, isLoading } = useAuth()
  const location = useLocation()
  
  const from = location.state?.from?.pathname || '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password)
      toast.success('Welcome to Aurex Admin Dashboard')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-admin-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-admin-50 to-aurex-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-16 h-16 bg-aurex-600 rounded-2xl shadow-lg">
              <ServerIcon className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="mt-6 text-3xl font-bold text-admin-900">
            Aurex Admin Dashboard
          </h1>
          <p className="mt-2 text-sm text-admin-600">
            Sign in to manage the Aurex Platform
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-admin-200">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                {...register('email')}
                id="email"
                type="email"
                autoComplete="email"
                className="form-input"
                placeholder="admin@aurigraph.io"
              />
              {errors.email && (
                <p className="form-error">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="form-input pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-admin-400 hover:text-admin-500" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-admin-400 hover:text-admin-500" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="form-error">{errors.password.message}</p>
              )}
            </div>

            {/* Remember me and Forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-aurex-600 focus:ring-aurex-500 border-admin-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-admin-700">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a
                  href="#"
                  className="font-medium text-aurex-600 hover:text-aurex-500 transition-colors"
                >
                  Forgot your password?
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-aurex-600 hover:bg-aurex-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-aurex-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Signing in...
                </>
              ) : (
                <>
                  <LockClosedIcon className="w-4 h-4 mr-2" />
                  Sign in
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-admin-50 rounded-lg border border-admin-200">
            <p className="text-sm font-medium text-admin-700 mb-2">Demo Credentials:</p>
            <div className="text-xs text-admin-600 space-y-1">
              <p>Email: admin@aurigraph.io</p>
              <p>Password: admin123</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-admin-500">
          <p>
            Aurex Platform Administration Dashboard
          </p>
          <p className="mt-1">
            Secure access to system management tools
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login