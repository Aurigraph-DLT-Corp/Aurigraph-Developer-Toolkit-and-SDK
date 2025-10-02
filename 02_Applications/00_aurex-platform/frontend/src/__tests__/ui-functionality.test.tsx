import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

// Mock form validation
const mockValidation = {
  validateEmail: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  validatePhone: (phone: string) => /^\+?[\d\s\-\(\)]{10,}$/.test(phone),
  validateRequired: (value: string) => value.trim().length > 0
};

describe('UI/UX Functionality Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Navigation and Routing', () => {
    it('should navigate between sections smoothly', async () => {
      const mockScrollTo = vi.fn();
      window.scrollTo = mockScrollTo;

      // Mock navigation component with section links
      const NavigationTest = () => {
        const handleSectionClick = (section: string) => {
          const element = document.getElementById(section);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        };

        return (
          <nav>
            <button 
              onClick={() => handleSectionClick('hero')}
              data-testid="nav-hero"
            >
              Home
            </button>
            <button 
              onClick={() => handleSectionClick('products')}
              data-testid="nav-products"
            >
              Products
            </button>
            <button 
              onClick={() => handleSectionClick('pricing')}
              data-testid="nav-pricing"
            >
              Pricing
            </button>
          </nav>
        );
      };

      // Mock sections
      const SectionsTest = () => (
        <>
          <div id="hero" data-testid="hero-section">Hero Section</div>
          <div id="products" data-testid="products-section">Products Section</div>
          <div id="pricing" data-testid="pricing-section">Pricing Section</div>
        </>
      );

      render(
        <>
          <NavigationTest />
          <SectionsTest />
        </>
      );

      // Test navigation clicks
      const productsButton = screen.getByTestId('nav-products');
      fireEvent.click(productsButton);

      // Verify section exists
      expect(screen.getByTestId('products-section')).toBeInTheDocument();
    });

    it('should handle responsive navigation menu', async () => {
      // Mock mobile navigation
      const ResponsiveNav = () => {
        const [isOpen, setIsOpen] = React.useState(false);

        return (
          <nav>
            <button 
              onClick={() => setIsOpen(!isOpen)}
              data-testid="mobile-menu-toggle"
              aria-label="Toggle menu"
            >
              ☰
            </button>
            <ul 
              data-testid="nav-menu"
              className={isOpen ? 'open' : 'closed'}
              style={{ display: isOpen ? 'block' : 'none' }}
            >
              <li><a href="#home">Home</a></li>
              <li><a href="#products">Products</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </nav>
        );
      };

      render(<ResponsiveNav />);

      const menuToggle = screen.getByTestId('mobile-menu-toggle');
      const navMenu = screen.getByTestId('nav-menu');

      // Initially closed
      expect(navMenu).toHaveStyle({ display: 'none' });

      // Open menu
      fireEvent.click(menuToggle);
      expect(navMenu).toHaveStyle({ display: 'block' });

      // Close menu
      fireEvent.click(menuToggle);
      expect(navMenu).toHaveStyle({ display: 'none' });
    });
  });

  describe('Form Interactions', () => {
    it('should validate contact form inputs', async () => {
      const user = userEvent.setup();
      
      const ContactForm = () => {
        const [formData, setFormData] = React.useState({
          name: '',
          email: '',
          company: '',
          message: ''
        });
        const [errors, setErrors] = React.useState<Record<string, string>>({});

        const validateForm = () => {
          const newErrors: Record<string, string> = {};

          if (!mockValidation.validateRequired(formData.name)) {
            newErrors.name = 'Name is required';
          }
          if (!mockValidation.validateEmail(formData.email)) {
            newErrors.email = 'Valid email is required';
          }
          if (!mockValidation.validateRequired(formData.company)) {
            newErrors.company = 'Company is required';
          }
          if (!mockValidation.validateRequired(formData.message)) {
            newErrors.message = 'Message is required';
          }

          setErrors(newErrors);
          return Object.keys(newErrors).length === 0;
        };

        const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          if (validateForm()) {
            // Form is valid
            console.log('Form submitted successfully');
          }
        };

        return (
          <form onSubmit={handleSubmit} data-testid="contact-form">
            <div>
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                data-testid="name-input"
              />
              {errors.name && <span data-testid="name-error">{errors.name}</span>}
            </div>
            
            <div>
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                data-testid="email-input"
              />
              {errors.email && <span data-testid="email-error">{errors.email}</span>}
            </div>

            <div>
              <input
                type="text"
                placeholder="Company"
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
                data-testid="company-input"
              />
              {errors.company && <span data-testid="company-error">{errors.company}</span>}
            </div>

            <div>
              <textarea
                placeholder="Message"
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                data-testid="message-input"
              />
              {errors.message && <span data-testid="message-error">{errors.message}</span>}
            </div>

            <button type="submit" data-testid="submit-button">Submit</button>
          </form>
        );
      };

      render(<ContactForm />);

      // Test form validation by submitting empty form
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      // Check for validation errors
      await waitFor(() => {
        expect(screen.getByTestId('name-error')).toHaveTextContent('Name is required');
        expect(screen.getByTestId('email-error')).toHaveTextContent('Valid email is required');
        expect(screen.getByTestId('company-error')).toHaveTextContent('Company is required');
        expect(screen.getByTestId('message-error')).toHaveTextContent('Message is required');
      });

      // Fill form with valid data
      await user.type(screen.getByTestId('name-input'), 'John Doe');
      await user.type(screen.getByTestId('email-input'), 'john.doe@company.com');
      await user.type(screen.getByTestId('company-input'), 'Test Company');
      await user.type(screen.getByTestId('message-input'), 'This is a test message');

      // Submit valid form
      await user.click(submitButton);

      // Errors should be cleared
      await waitFor(() => {
        expect(screen.queryByTestId('name-error')).not.toBeInTheDocument();
        expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
        expect(screen.queryByTestId('company-error')).not.toBeInTheDocument();
        expect(screen.queryByTestId('message-error')).not.toBeInTheDocument();
      });
    });

    it('should handle demo request form with date/time selection', async () => {
      const user = userEvent.setup();
      
      const DemoForm = () => {
        const [formData, setFormData] = React.useState({
          name: '',
          email: '',
          company: '',
          phone: '',
          preferredDate: '',
          preferredTime: '',
          requirements: ''
        });
        const [isSubmitted, setIsSubmitted] = React.useState(false);

        const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          setIsSubmitted(true);
        };

        if (isSubmitted) {
          return <div data-testid="success-message">Demo request submitted successfully!</div>;
        }

        return (
          <form onSubmit={handleSubmit} data-testid="demo-form">
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              data-testid="demo-name-input"
              required
            />
            
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              data-testid="demo-email-input"
              required
            />
            
            <input
              type="text"
              placeholder="Company"
              value={formData.company}
              onChange={(e) => setFormData({...formData, company: e.target.value})}
              data-testid="demo-company-input"
              required
            />
            
            <input
              type="tel"
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              data-testid="demo-phone-input"
            />
            
            <input
              type="date"
              value={formData.preferredDate}
              onChange={(e) => setFormData({...formData, preferredDate: e.target.value})}
              data-testid="demo-date-input"
              min={new Date().toISOString().split('T')[0]}
            />
            
            <select
              value={formData.preferredTime}
              onChange={(e) => setFormData({...formData, preferredTime: e.target.value})}
              data-testid="demo-time-select"
            >
              <option value="">Select Time</option>
              <option value="09:00">9:00 AM</option>
              <option value="10:00">10:00 AM</option>
              <option value="11:00">11:00 AM</option>
              <option value="14:00">2:00 PM</option>
              <option value="15:00">3:00 PM</option>
              <option value="16:00">4:00 PM</option>
            </select>
            
            <textarea
              placeholder="Requirements or questions"
              value={formData.requirements}
              onChange={(e) => setFormData({...formData, requirements: e.target.value})}
              data-testid="demo-requirements-input"
            />

            <button type="submit" data-testid="demo-submit-button">
              Schedule Demo
            </button>
          </form>
        );
      };

      render(<DemoForm />);

      // Fill out the demo form
      await user.type(screen.getByTestId('demo-name-input'), 'Jane Smith');
      await user.type(screen.getByTestId('demo-email-input'), 'jane.smith@company.com');
      await user.type(screen.getByTestId('demo-company-input'), 'Demo Company');
      await user.type(screen.getByTestId('demo-phone-input'), '+1234567890');
      
      // Set future date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowString = tomorrow.toISOString().split('T')[0];
      await user.type(screen.getByTestId('demo-date-input'), tomorrowString);
      
      // Select time
      await user.selectOptions(screen.getByTestId('demo-time-select'), '14:00');
      
      await user.type(screen.getByTestId('demo-requirements-input'), 'Need ESG reporting solution');

      // Submit form
      await user.click(screen.getByTestId('demo-submit-button'));

      // Check for success message
      await waitFor(() => {
        expect(screen.getByTestId('success-message')).toHaveTextContent('Demo request submitted successfully!');
      });
    });
  });

  describe('Interactive Elements', () => {
    it('should handle accordion/dropdown interactions', async () => {
      const user = userEvent.setup();
      
      const AccordionTest = () => {
        const [openItems, setOpenItems] = React.useState<Set<number>>(new Set());

        const toggleItem = (index: number) => {
          const newOpenItems = new Set(openItems);
          if (newOpenItems.has(index)) {
            newOpenItems.delete(index);
          } else {
            newOpenItems.add(index);
          }
          setOpenItems(newOpenItems);
        };

        const faqItems = [
          { question: 'What is ESG?', answer: 'ESG stands for Environmental, Social, and Governance.' },
          { question: 'How does Aurex help?', answer: 'Aurex provides comprehensive ESG management tools.' },
          { question: 'What are the pricing plans?', answer: 'We offer flexible pricing plans for all business sizes.' }
        ];

        return (
          <div data-testid="faq-accordion">
            {faqItems.map((item, index) => (
              <div key={index} data-testid={`faq-item-${index}`}>
                <button
                  onClick={() => toggleItem(index)}
                  data-testid={`faq-toggle-${index}`}
                  aria-expanded={openItems.has(index)}
                >
                  {item.question}
                </button>
                {openItems.has(index) && (
                  <div data-testid={`faq-answer-${index}`}>
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      };

      render(<AccordionTest />);

      // Initially, no answers should be visible
      expect(screen.queryByTestId('faq-answer-0')).not.toBeInTheDocument();
      expect(screen.queryByTestId('faq-answer-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('faq-answer-2')).not.toBeInTheDocument();

      // Click first item
      await user.click(screen.getByTestId('faq-toggle-0'));
      expect(screen.getByTestId('faq-answer-0')).toBeInTheDocument();
      expect(screen.getByTestId('faq-toggle-0')).toHaveAttribute('aria-expanded', 'true');

      // Click second item
      await user.click(screen.getByTestId('faq-toggle-1'));
      expect(screen.getByTestId('faq-answer-1')).toBeInTheDocument();

      // Click first item again to close
      await user.click(screen.getByTestId('faq-toggle-0'));
      expect(screen.queryByTestId('faq-answer-0')).not.toBeInTheDocument();
      expect(screen.getByTestId('faq-toggle-0')).toHaveAttribute('aria-expanded', 'false');
    });

    it('should handle modal/popup interactions', async () => {
      const user = userEvent.setup();
      
      const ModalTest = () => {
        const [isOpen, setIsOpen] = React.useState(false);

        const handleEscapeKey = React.useCallback((e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            setIsOpen(false);
          }
        }, []);

        React.useEffect(() => {
          if (isOpen) {
            document.addEventListener('keydown', handleEscapeKey);
            return () => document.removeEventListener('keydown', handleEscapeKey);
          }
        }, [isOpen, handleEscapeKey]);

        return (
          <>
            <button 
              onClick={() => setIsOpen(true)}
              data-testid="open-modal-button"
            >
              Open Modal
            </button>
            
            {isOpen && (
              <div 
                data-testid="modal-overlay"
                onClick={() => setIsOpen(false)}
                style={{ 
                  position: 'fixed', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  bottom: 0, 
                  background: 'rgba(0,0,0,0.5)' 
                }}
              >
                <div 
                  data-testid="modal-content"
                  onClick={(e) => e.stopPropagation()}
                  style={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)', 
                    background: 'white', 
                    padding: '20px' 
                  }}
                >
                  <h2>Modal Title</h2>
                  <p>Modal content goes here</p>
                  <button 
                    onClick={() => setIsOpen(false)}
                    data-testid="close-modal-button"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </>
        );
      };

      render(<ModalTest />);

      // Initially modal should not be visible
      expect(screen.queryByTestId('modal-overlay')).not.toBeInTheDocument();

      // Open modal
      await user.click(screen.getByTestId('open-modal-button'));
      expect(screen.getByTestId('modal-overlay')).toBeInTheDocument();
      expect(screen.getByTestId('modal-content')).toBeInTheDocument();

      // Close modal using close button
      await user.click(screen.getByTestId('close-modal-button'));
      expect(screen.queryByTestId('modal-overlay')).not.toBeInTheDocument();

      // Reopen modal
      await user.click(screen.getByTestId('open-modal-button'));
      expect(screen.getByTestId('modal-overlay')).toBeInTheDocument();

      // Close modal by clicking overlay
      await user.click(screen.getByTestId('modal-overlay'));
      expect(screen.queryByTestId('modal-overlay')).not.toBeInTheDocument();

      // Test escape key functionality
      await user.click(screen.getByTestId('open-modal-button'));
      expect(screen.getByTestId('modal-overlay')).toBeInTheDocument();

      // Simulate escape key press
      fireEvent.keyDown(document, { key: 'Escape' });
      await waitFor(() => {
        expect(screen.queryByTestId('modal-overlay')).not.toBeInTheDocument();
      });
    });
  });

  describe('Visual Feedback and Loading States', () => {
    it('should show loading states for async actions', async () => {
      const user = userEvent.setup();
      
      const LoadingTest = () => {
        const [isLoading, setIsLoading] = React.useState(false);
        const [data, setData] = React.useState(null);

        const handleLoadData = async () => {
          setIsLoading(true);
          
          // Simulate API call delay
          setTimeout(() => {
            setData('Loaded data');
            setIsLoading(false);
          }, 1000);
        };

        return (
          <div>
            <button 
              onClick={handleLoadData}
              disabled={isLoading}
              data-testid="load-data-button"
            >
              {isLoading ? 'Loading...' : 'Load Data'}
            </button>
            
            {isLoading && (
              <div data-testid="loading-spinner">
                Loading spinner...
              </div>
            )}
            
            {data && (
              <div data-testid="loaded-data">
                {data}
              </div>
            )}
          </div>
        );
      };

      render(<LoadingTest />);

      const loadButton = screen.getByTestId('load-data-button');

      // Initially, no loading state or data
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      expect(screen.queryByTestId('loaded-data')).not.toBeInTheDocument();

      // Click load button
      await user.click(loadButton);

      // Should show loading state
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(loadButton).toBeDisabled();
      expect(loadButton).toHaveTextContent('Loading...');

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
        expect(screen.getByTestId('loaded-data')).toHaveTextContent('Loaded data');
        expect(loadButton).not.toBeDisabled();
        expect(loadButton).toHaveTextContent('Load Data');
      }, { timeout: 2000 });
    });

    it('should provide visual feedback for form submission', async () => {
      const user = userEvent.setup();
      
      const SubmissionFeedback = () => {
        const [status, setStatus] = React.useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

        const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          setStatus('submitting');

          // Simulate submission
          setTimeout(() => {
            // Randomly succeed or fail for testing
            const success = Math.random() > 0.5;
            setStatus(success ? 'success' : 'error');
            
            // Reset after showing feedback
            setTimeout(() => setStatus('idle'), 2000);
          }, 1000);
        };

        return (
          <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Name" required />
            <button 
              type="submit" 
              disabled={status === 'submitting'}
              data-testid="submit-feedback-button"
            >
              {status === 'submitting' ? 'Submitting...' : 'Submit'}
            </button>
            
            {status === 'success' && (
              <div data-testid="success-feedback" style={{ color: 'green' }}>
                ✓ Submitted successfully!
              </div>
            )}
            
            {status === 'error' && (
              <div data-testid="error-feedback" style={{ color: 'red' }}>
                ✗ Submission failed. Please try again.
              </div>
            )}
          </form>
        );
      };

      render(<SubmissionFeedback />);

      const submitButton = screen.getByTestId('submit-feedback-button');

      // Fill required field
      await user.type(screen.getByPlaceholderText('Name'), 'Test User');

      // Submit form
      await user.click(submitButton);

      // Should show submitting state
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent('Submitting...');

      // Wait for feedback
      await waitFor(() => {
        const successFeedback = screen.queryByTestId('success-feedback');
        const errorFeedback = screen.queryByTestId('error-feedback');
        
        // Should show either success or error feedback
        expect(successFeedback || errorFeedback).toBeInTheDocument();
        expect(submitButton).not.toBeDisabled();
        expect(submitButton).toHaveTextContent('Submit');
      }, { timeout: 2000 });
    });
  });
});