import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import AurexLogo from '../components/ui/AurexLogo';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Try multiple API endpoints
      const apiEndpoints = [
        'https://dev.aurigraph.io/api',
        'http://localhost:8000/api',
        'http://dev.aurigraph.io:8000/api'
      ];

      let lastError = null;
      let success = false;

      for (const apiBaseUrl of apiEndpoints) {
        try {
          console.log(`Trying API endpoint: ${apiBaseUrl}`);

          const response = await fetch(`${apiBaseUrl}/auth/forgot-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
            timeout: 10000, // 10 second timeout
          });

          if (response.ok) {
            const data = await response.json();
            setIsSubmitted(true);
            success = true;
            break;
          } else {
            const data = await response.json();
            lastError = data.detail || 'Failed to send reset email';
          }
        } catch (err) {
          console.log(`API endpoint ${apiBaseUrl} failed:`, err);
          lastError = err;
          continue;
        }
      }

      if (!success) {
        // If all endpoints fail, show a helpful message
        setError(
          'Unable to connect to the server. Please try again later or contact support at support@aurigraph.io'
        );
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setError('Network error. Please contact support at support@aurigraph.io');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <AurexLogo className="h-12 w-12" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Check Your Email</h1>
            <p className="text-gray-600">
              We've sent password reset instructions to your email
            </p>
          </div>

          <Card className="shadow-lg border-0">
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Email Sent Successfully
              </h2>

              <p className="text-gray-600 mb-6">
                If an account with <strong>{email}</strong> exists, you will receive a password reset link shortly.
              </p>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Mail className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-blue-900">Check your inbox</p>
                      <p className="text-sm text-blue-700">
                        The reset link will expire in 1 hour for security reasons.
                      </p>
                    </div>
                  </div>
                </div>

                <Button asChild className="w-full">
                  <Link to="/signin">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Sign In
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <AurexLogo className="h-12 w-12" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password</h1>
          <p className="text-gray-600">
            Enter your email address and we'll send you a reset link
          </p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">Reset Your Password</CardTitle>
            <CardDescription className="text-center">
              We'll email you instructions to reset your password
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <div className="font-medium mb-2">⚠️ Service Temporarily Unavailable</div>
                <div className="text-sm">{error}</div>
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-blue-800 text-sm">
                  <div className="font-medium mb-1">🔧 Temporary Workaround:</div>
                  <div>Please contact our support team directly at:</div>
                  <div className="font-mono mt-1">support@aurigraph.io</div>
                  <div className="mt-2">Include your email address and mention "Password Reset Request"</div>
                </div>
              </div>
            )}

            {/* Temporary Notice */}
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium">System Maintenance Notice</div>
                  <div className="text-sm mt-1">
                    Password reset functionality is currently under maintenance.
                    For immediate assistance, please contact support@aurigraph.io
                  </div>
                </div>
              </div>
            </div>

            {/* Reset Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || !email}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                    Sending Reset Link...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Reset Link
                  </>
                )}
              </Button>
            </form>

            {/* Back to Sign In */}
            <div className="text-center pt-4">
              <Link
                to="/signin"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
