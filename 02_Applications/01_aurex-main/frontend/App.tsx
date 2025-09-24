import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState, Suspense, lazy } from "react";
import { initializeEmailJS } from "./services/emailService";
import { AuthProvider } from "./contexts/AuthContext";
import { AssessmentAuthProvider } from "./contexts/AssessmentAuthContext";

// Lazy load all pages for better performance
const Index = lazy(() => import("./pages/Index"));
const SelfService = lazy(() => import("./pages/SelfService"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const CarbonTrace = lazy(() => import("./pages/CarbonTrace"));
const Hydropulse = lazy(() => import("./pages/Hydropulse"));
const Sylvagraph = lazy(() => import("./pages/Sylvagraph"));
const BeginnerAssessment = lazy(() => import("./pages/BeginnerAssessment"));
const ReportAnalytics = lazy(() => import("./pages/ReportAnalytics"));
const GHGReportAnalytics = lazy(() => import("./pages/GHGReportAnalytics"));
const FastApiTest = lazy(() => import("./pages/FastApiTest"));
const UserSignupTest = lazy(() => import("./pages/UserSignupTest"));
const Contact = lazy(() => import("./pages/Contact"));
const Demo = lazy(() => import("./pages/Demo"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SignUp = lazy(() => import("./pages/SignUp"));
const SignIn = lazy(() => import("./pages/SignIn"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AdminPortal = lazy(() => import("./pages/AdminPortal"));
const DatabaseAdmin = lazy(() => import("./components/admin/DatabaseAdmin"));
const AdminNavigation = lazy(() => import("./components/admin/AdminNavigation"));
const SubdomainDeploymentMonitor = lazy(() => import("./components/admin/SubdomainDeploymentMonitor"));
const LaunchpadRedirect = lazy(() => import("./components/LaunchpadRedirect"));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

const App = () => {
  const [currentService, setCurrentService] = useState('platform');

  useEffect(() => {
    // Initialize EmailJS when the app loads
    initializeEmailJS();

    // Set current service for routing
    setCurrentService('platform');
  }, []);

  return (
    <AuthProvider>
      <AssessmentAuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/self-service" element={<SelfService />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/carbon-trace" element={<CarbonTrace />} />
                <Route path="/hydropulse" element={<Hydropulse />} />
                <Route path="/sylvagraph" element={<Sylvagraph />} />
                <Route path="/launchpad" element={
                  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-gray-900 mb-4">Aurex Launchpad™</h1>
                      <p className="text-xl text-gray-600 mb-8">ESG Assessment Platform</p>
                      <p className="text-gray-500">This route is handled by nginx proxy.</p>
                    </div>
                  </div>
                } />
                <Route path="/launchpad/beginnerAssessment" element={<BeginnerAssessment />} />
                <Route path="/launchpad/reportAnalytics" element={<ReportAnalytics />} />
                <Route path="/launchpad/ghg-report-analytics" element={<GHGReportAnalytics />} />
                <Route path="/fastapi-test" element={<FastApiTest />} />
                <Route path="/user-signup-test" element={<UserSignupTest />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/demo" element={<Demo />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/launchpad/admin" element={<AdminPortal />} />
                <Route path="/admin" element={<AdminNavigation />} />
                <Route path="/admin/database" element={<DatabaseAdmin />} />
                <Route path="/admin/subdomains" element={<SubdomainDeploymentMonitor />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </div>
        </BrowserRouter>
      </AssessmentAuthProvider>
    </AuthProvider>
  );
};

export default App;
