import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PasswordResetSuccessProps {
  onContinue?: () => void;
  returnPath?: string;
}

const PasswordResetSuccess: React.FC<PasswordResetSuccessProps> = ({ 
  onContinue, 
  returnPath = '/hydropulse' 
}) => {
  const [countdown, setCountdown] = useState(10);
  const [autoRedirect, setAutoRedirect] = useState(true);

  useEffect(() => {
    // Check if password reset was actually completed
    const resetCompleted = sessionStorage.getItem('aurex_reset_completed');
    const resetInitiated = sessionStorage.getItem('aurex_reset_initiated');
    
    if (!resetCompleted && !resetInitiated) {
      // Redirect to login if no reset was initiated
      window.location.href = returnPath;
      return;
    }

    // Clear reset flags
    sessionStorage.removeItem('aurex_reset_completed');
    sessionStorage.removeItem('aurex_reset_initiated');

    // Auto-redirect countdown
    if (autoRedirect && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (autoRedirect && countdown === 0) {
      handleContinue();
    }
  }, [countdown, autoRedirect, returnPath]);

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    } else {
      window.location.href = returnPath;
    }
  };

  const handleDisableAutoRedirect = () => {
    setAutoRedirect(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-2 border-green-200">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-800">Password Reset Successful!</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Your password has been successfully updated. You can now sign in with your new password.
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <h4 className="font-semibold text-green-800 mb-1">Security Notes:</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Your old password is no longer valid</li>
                    <li>• The reset link has been invalidated</li>
                    <li>• Please keep your new password secure</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={handleContinue}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Continue to HydroPulse
            </Button>

            {autoRedirect && (
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">
                  Automatically redirecting in {countdown} seconds...
                </p>
                <button
                  onClick={handleDisableAutoRedirect}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Cancel auto-redirect
                </button>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <div className="flex items-start gap-3 text-sm">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-600">
                  <strong>Having trouble signing in?</strong> Make sure you're using your new password. 
                  If you continue to have issues, you can request another password reset.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link 
              to="/hydropulse" 
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Go to HydroPulse Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PasswordResetSuccess;
