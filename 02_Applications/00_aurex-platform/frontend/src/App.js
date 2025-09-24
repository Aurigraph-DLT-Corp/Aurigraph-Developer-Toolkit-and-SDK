import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
// Components
import { AppNavigation } from './components/AppNavigation';
// Pages
import LandingPage from './pages/LandingPage';
import NotFound from './pages/NotFound';
// Utils
import { initAnalytics } from './utils/analytics';
// Initialize analytics in production
if (import.meta.env.PROD) {
    initAnalytics();
}
const App = () => {
    return (_jsxs("div", { className: "min-h-screen bg-white", children: [_jsx(AppNavigation, { currentApp: "platform" }), _jsx(AnimatePresence, { mode: "wait", children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.3 }, children: _jsx(LandingPage, {}) }) }), _jsx(Route, { path: "/full", element: _jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.3 }, children: _jsx(LandingPage, {}) }) }), _jsx(Route, { path: "/products", element: _jsx(LandingPage, { scrollTo: "products" }) }), _jsx(Route, { path: "/solutions", element: _jsx(LandingPage, { scrollTo: "solutions" }) }), _jsx(Route, { path: "/pricing", element: _jsx(LandingPage, { scrollTo: "pricing" }) }), _jsx(Route, { path: "/about", element: _jsx(LandingPage, { scrollTo: "about" }) }), _jsx(Route, { path: "/contact", element: _jsx(LandingPage, { scrollTo: "contact" }) }), _jsx(Route, { path: "*", element: _jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.3 }, children: _jsx(NotFound, {}) }) })] }) })] }));
};
export default App;
