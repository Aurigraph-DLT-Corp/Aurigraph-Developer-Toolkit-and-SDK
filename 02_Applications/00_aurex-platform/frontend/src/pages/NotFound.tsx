import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center px-4">
      <div className="max-w-lg mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* 404 Visual */}
          <div className="relative">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-9xl font-bold text-primary-600/20 select-none"
            >
              404
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
                <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">?</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Error Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="space-y-4"
          >
            <h2 className="text-3xl font-bold text-gray-900">
              Page Not Found
            </h2>
            <p className="text-lg text-gray-600 max-w-md mx-auto">
              Oops! The page you're looking for seems to have wandered off into the digital wilderness.
            </p>
            <p className="text-sm text-gray-500">
              Don't worry though – our ESG monitoring systems are still tracking everything perfectly.
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 btn-primary"
            >
              <HomeIcon className="w-5 h-5" />
              Back to Home
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 btn-secondary"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Go Back
            </button>
          </motion.div>

          {/* Helpful Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            className="pt-8 border-t border-gray-200"
          >
            <p className="text-sm text-gray-500 mb-4">
              Looking for something specific? Try these popular sections:
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                to="/#products"
                className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
              >
                Products
              </Link>
              <Link
                to="/#solutions"
                className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
              >
                Solutions
              </Link>
              <Link
                to="/#pricing"
                className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
              >
                Pricing
              </Link>
              <Link
                to="/#contact"
                className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
              >
                Contact
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;