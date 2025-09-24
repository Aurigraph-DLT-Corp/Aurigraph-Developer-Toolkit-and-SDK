// Common types for the landing page
import React from 'react';

export interface BaseProps {
  className?: string;
  children?: React.ReactNode;
}

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
}

// Navigation types
export interface NavigationItem {
  label: string;
  href: string;
  external?: boolean;
  children?: NavigationItem[];
}

// Form types
export interface ContactFormData {
  name: string;
  email: string;
  company: string;
  role: string;
  message: string;
  interests: string[];
  consent: boolean;
}

export interface DemoRequestData {
  name: string;
  email: string;
  company: string;
  role: string;
  phone?: string;
  employees: string;
  timeline: string;
  interests: string[];
  message?: string;
}

export interface NewsletterData {
  email: string;
  interests?: string[];
}

// Product types
export interface Product {
  id: string;
  name: string;
  title: string;
  description: string;
  keyFeatures: string[];
  benefits: string[];
  icon: string;
  href: string;
  demo?: {
    type: 'interactive' | 'video' | 'simulation';
    url: string;
    description: string;
  };
  metrics?: {
    label: string;
    value: string;
    description: string;
  }[];
}

// Testimonial types
export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  quote: string;
  rating?: number;
  featured?: boolean;
  video?: string;
}

// Case study types
export interface CaseStudy {
  id: string;
  title: string;
  company: string;
  industry: string;
  challenge: string;
  solution: string;
  results: {
    metric: string;
    value: string;
    description: string;
  }[];
  image: string;
  href: string;
}

// Partner types
export interface Partner {
  id: string;
  name: string;
  logo: string;
  category: 'technology' | 'industry' | 'certification';
  description?: string;
  href?: string;
}

// Team member types
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatar: string;
  linkedin?: string;
  twitter?: string;
}

// Pricing types
export interface PricingTier {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  limitations?: string[];
  cta: string;
  popular?: boolean;
  enterprise?: boolean;
}

// FAQ types
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

// Blog post types
export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  readTime: number;
  category: string;
  tags: string[];
  image: string;
  href: string;
}

// Resource types
export interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'guide' | 'whitepaper' | 'checklist' | 'template' | 'webinar';
  downloadUrl: string;
  image: string;
  category: string;
  gated: boolean;
}

// Analytics types
export interface AnalyticsEvent {
  event: string;
  properties: Record<string, unknown>;
  timestamp?: Date;
}

// API response types
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form state types
export interface FormState {
  isSubmitting: boolean;
  isSubmitted: boolean;
  error?: string;
  success?: string;
}

// Modal types
export interface ModalProps extends BaseProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

// Animation types
export interface AnimationConfig {
  duration?: number;
  delay?: number;
  easing?: string;
  repeat?: boolean;
}

// Viewport types
export interface ViewportSize {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}