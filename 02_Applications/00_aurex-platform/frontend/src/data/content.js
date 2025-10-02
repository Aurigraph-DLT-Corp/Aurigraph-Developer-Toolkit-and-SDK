// Content data for the landing page based on PRD-501 requirements
// Hero Section Content
export const heroContent = {
    headline: "Transform Your ESG Impact with Intelligent DMRV",
    subheadline: "Monitor, Report, and Verify environmental impact across water, forests, and carbon with AI-powered precision",
    benefits: [
        "90% faster ESG reporting",
        "24/7 real-time monitoring",
        "100% regulatory compliance"
    ],
    socialProof: {
        customerCount: "450+ organizations",
        complianceRate: "98.5% compliance rate",
        certifications: ["SOC 2 Certified", "GDPR Compliant", "ISO 27001"]
    },
    cta: {
        primary: "Explore Offerings",
        secondary: "Watch Demo",
        leadMagnet: "Download ESG Guide"
    }
};
// Products Data
export const products = [
    {
        id: 'launchpad',
        name: 'Launchpad',
        title: 'AI-Enhanced ESG Assessment',
        description: 'Complete comprehensive ESG assessment in 15 minutes with AI-powered risk analysis',
        keyFeatures: [
            'Interactive 5-question assessment',
            'AI-powered risk analysis',
            'Automated compliance scoring',
            'Regulatory framework mapping'
        ],
        benefits: [
            'Complete assessment in 15 minutes',
            'Identify compliance gaps instantly',
            'Generate regulatory reports automatically',
            'Track improvement over time'
        ],
        icon: 'rocket',
        href: '/products/launchpad',
        demo: {
            type: 'interactive',
            url: '/demos/launchpad',
            description: 'Try our interactive ESG assessment demo'
        },
        metrics: [
            { label: 'Time Saved', value: '85%', description: 'vs traditional assessments' },
            { label: 'Accuracy', value: '96%', description: 'compliance prediction' },
            { label: 'Coverage', value: '100%', description: 'major ESG frameworks' }
        ]
    },
    {
        id: 'hydropulse',
        name: 'HydroPulse',
        title: 'AI-Powered Water Optimization',
        description: 'Reduce water usage 30%, increase yields 15% with intelligent water management',
        keyFeatures: [
            'IoT sensor integration',
            'Satellite data analysis',
            'Predictive analytics',
            'Automated irrigation control'
        ],
        benefits: [
            'Reduce water usage by 30%',
            'Increase crop yields by 15%',
            'Real-time anomaly detection',
            'Weather pattern integration'
        ],
        icon: 'water',
        href: '/products/hydropulse',
        demo: {
            type: 'simulation',
            url: '/demos/hydropulse',
            description: 'Explore live water management dashboard'
        },
        metrics: [
            { label: 'Water Savings', value: '30%', description: 'average reduction' },
            { label: 'Yield Increase', value: '15%', description: 'crop productivity' },
            { label: 'ROI', value: '240%', description: 'within first year' }
        ]
    },
    {
        id: 'sylvagraph',
        name: 'Sylvagraph',
        title: 'Computer Vision Forest Analysis',
        description: 'Detect forest changes within 24 hours using satellite imagery and AI',
        keyFeatures: [
            'Satellite image analysis',
            'Real-time deforestation alerts',
            'Biodiversity monitoring',
            'Carbon sequestration tracking'
        ],
        benefits: [
            'Detect changes within 24 hours',
            'Monitor biodiversity trends',
            'Track carbon sequestration',
            'Prevent illegal logging'
        ],
        icon: 'tree',
        href: '/products/sylvagraph',
        demo: {
            type: 'interactive',
            url: '/demos/sylvagraph',
            description: 'Interactive satellite map with zoom/pan'
        },
        metrics: [
            { label: 'Detection Speed', value: '24hrs', description: 'change detection' },
            { label: 'Accuracy', value: '98%', description: 'forest classification' },
            { label: 'Coverage', value: '150K+', description: 'hectares monitored' }
        ]
    },
    {
        id: 'carbontrace',
        name: 'CarbonTrace',
        title: 'Blockchain-Verified Carbon Credits',
        description: 'Generate $50-200/hectare additional revenue through verified carbon trading',
        keyFeatures: [
            'Blockchain verification',
            'Automated MRV processes',
            'Carbon credit marketplace',
            'Revenue optimization'
        ],
        benefits: [
            'Generate additional revenue',
            'Automated verification process',
            'Transparent trading platform',
            'Real-time market pricing'
        ],
        icon: 'leaf',
        href: '/products/carbontrace',
        demo: {
            type: 'simulation',
            url: '/demos/carbontrace',
            description: 'Carbon credit marketplace with live prices'
        },
        metrics: [
            { label: 'Revenue', value: '$50-200', description: 'per hectare annually' },
            { label: 'Verification', value: '99.9%', description: 'blockchain accuracy' },
            { label: 'Trading', value: '24/7', description: 'marketplace access' }
        ]
    }
];
// Benefits Data
export const benefits = [
    {
        title: "Automate ESG Reporting",
        description: "Generate compliance-ready reports in minutes, not weeks. Our AI-powered platform streamlines your entire reporting workflow with intelligent automation.",
        icon: "chart",
        statistic: "90% faster reporting",
        features: [
            "One-click report generation",
            "Multiple framework support",
            "Automated data collection",
            "Real-time dashboard updates"
        ]
    },
    {
        title: "Real-time Environmental Monitoring",
        description: "IoT and satellite data for continuous environmental tracking. Monitor your impact across all operations with advanced sensor integration.",
        icon: "monitor",
        statistic: "24/7 monitoring",
        features: [
            "Satellite data integration",
            "IoT sensor networks",
            "Automated alert systems",
            "Predictive analytics"
        ]
    },
    {
        title: "Ensure Regulatory Compliance",
        description: "Meet TCFD, SASB, GRI, and EU taxonomy requirements with confidence. Stay ahead of evolving regulations with automated compliance monitoring.",
        icon: "shield",
        statistic: "100% compliance rate",
        features: [
            "Multi-framework support",
            "Automated compliance checks",
            "Audit trail generation",
            "Regulatory update alerts"
        ]
    },
    {
        title: "Reduce Implementation Costs",
        description: "Unified platform eliminates need for multiple vendors. One solution for all your ESG management needs with streamlined implementation.",
        icon: "savings",
        statistic: "60% cost reduction",
        features: [
            "Single platform solution",
            "No vendor lock-in policy",
            "Flexible pricing tiers",
            "Quick implementation"
        ]
    }
];
// Testimonials Data
export const testimonials = [
    {
        id: '1',
        name: 'Sarah Chen',
        role: 'Chief Sustainability Officer',
        company: 'TechCorp Global',
        avatar: '/testimonials/sarah-chen.jpg',
        quote: 'Aurex reduced our ESG reporting time from weeks to hours. The AI-powered insights helped us identify $2M in cost savings through water optimization.',
        rating: 5,
        featured: true
    },
    {
        id: '2',
        name: 'Michael Rodriguez',
        role: 'Environmental Manager',
        company: 'GreenFields Agriculture',
        avatar: '/testimonials/michael-rodriguez.jpg',
        quote: 'HydroPulse increased our crop yields by 18% while reducing water usage by 35%. The ROI was evident within the first season.',
        rating: 5,
        featured: true
    },
    {
        id: '3',
        name: 'Dr. Emma Thompson',
        role: 'Forest Conservation Director',
        company: 'Conservation International',
        avatar: '/testimonials/emma-thompson.jpg',
        quote: 'Sylvagraph\'s early warning system helped us prevent 500 hectares of illegal deforestation last year. The satellite integration is game-changing.',
        rating: 5,
        featured: true
    },
    {
        id: '4',
        name: 'James Wilson',
        role: 'CFO',
        company: 'Sustainable Ventures',
        avatar: '/testimonials/james-wilson.jpg',
        quote: 'CarbonTrace generated $150,000 in additional revenue through verified carbon credits. The blockchain verification gives buyers complete confidence.',
        rating: 5,
        featured: false
    }
];
// Partners Data
export const partners = [
    // Technology Partners
    { id: '1', name: 'Microsoft Azure', logo: '/partners/microsoft.svg', category: 'technology', description: 'Sustainability Cloud Partner' },
    { id: '2', name: 'AWS for Climate', logo: '/partners/aws.svg', category: 'technology', description: 'Climate Technology Partner' },
    { id: '3', name: 'Salesforce', logo: '/partners/salesforce.svg', category: 'technology', description: 'ESG Cloud Certified App' },
    { id: '4', name: 'SAP', logo: '/partners/sap.svg', category: 'technology', description: 'Sustainability Solution Integration' },
    // Industry Partners
    { id: '5', name: 'CDP', logo: '/partners/cdp.svg', category: 'industry', description: 'Carbon Disclosure Project Data Partner' },
    { id: '6', name: 'GRI', logo: '/partners/gri.svg', category: 'industry', description: 'Global Reporting Initiative Aligned' },
    { id: '7', name: 'TCFD', logo: '/partners/tcfd.svg', category: 'industry', description: 'Framework Certified' },
    { id: '8', name: 'SASB', logo: '/partners/sasb.svg', category: 'industry', description: 'Standards Compliant' },
    // Certifications
    { id: '9', name: 'SOC 2 Type II', logo: '/partners/soc2.svg', category: 'certification', description: 'Security Certified' },
    { id: '10', name: 'ISO 27001', logo: '/partners/iso27001.svg', category: 'certification', description: 'Information Security' },
    { id: '11', name: 'ISO 14001', logo: '/partners/iso14001.svg', category: 'certification', description: 'Environmental Management' },
    { id: '12', name: 'B-Corporation', logo: '/partners/bcorp.svg', category: 'certification', description: 'Certification Pending' }
];
// Team Members Data
export const teamMembers = [
    {
        id: '1',
        name: 'Alexandra Patel',
        role: 'Chief Executive Officer',
        bio: '15+ years sustainability consulting, ex-McKinsey partner specializing in ESG transformation',
        avatar: '/team/alexandra-patel.jpg',
        linkedin: 'https://linkedin.com/in/alexandra-patel'
    },
    {
        id: '2',
        name: 'Dr. David Kim',
        role: 'Chief Technology Officer',
        bio: 'Former engineering lead at climate tech unicorn, PhD Computer Science from Stanford',
        avatar: '/team/david-kim.jpg',
        linkedin: 'https://linkedin.com/in/david-kim-cto'
    },
    {
        id: '3',
        name: 'Maria Santos',
        role: 'Chief Product Officer',
        bio: 'Ex-product director at leading ESG platform, 12+ years building sustainability software',
        avatar: '/team/maria-santos.jpg',
        linkedin: 'https://linkedin.com/in/maria-santos-cpo'
    },
    {
        id: '4',
        name: 'Dr. Robert Chen',
        role: 'Chief Scientist',
        bio: 'PhD Environmental Engineering MIT, 20+ years climate science and AI research',
        avatar: '/team/robert-chen.jpg',
        linkedin: 'https://linkedin.com/in/robert-chen-scientist'
    }
];
// Pricing Tiers Data
export const pricingTiers = [
    {
        id: 'starter',
        name: 'Starter',
        price: 'Free',
        description: 'Perfect for small teams getting started with ESG reporting',
        features: [
            'Basic ESG assessment',
            '1 user account',
            'Community support',
            'Standard templates',
            'Basic reporting'
        ],
        limitations: [
            'Limited to 1 assessment per month',
            'No API access',
            'Community support only'
        ],
        cta: 'Start Free',
        popular: false,
        enterprise: false
    },
    {
        id: 'professional',
        name: 'Professional',
        price: '$99/month',
        description: 'Comprehensive ESG management for growing organizations',
        features: [
            'Full platform access',
            'Up to 10 users',
            'Priority support',
            'Advanced analytics',
            'API access',
            'Custom reporting',
            'Data export',
            'Integration support'
        ],
        cta: 'Start Trial',
        popular: true,
        enterprise: false
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 'Custom',
        description: 'Tailored solutions for large organizations with complex needs',
        features: [
            'Unlimited users',
            'Custom integrations',
            'Dedicated support',
            'Advanced security',
            'Custom workflows',
            'SLA guarantees',
            'On-premise deployment',
            'Training & consulting'
        ],
        cta: 'Contact Sales',
        popular: false,
        enterprise: true
    }
];
// FAQ Data
export const faqs = [
    {
        id: '1',
        question: 'How quickly can we get started with Aurex Platform?',
        answer: 'Most organizations can complete their initial ESG assessment within 15 minutes using our AI-guided questionnaire. Full platform implementation typically takes 1-2 weeks depending on integration requirements.',
        category: 'getting-started'
    },
    {
        id: '2',
        question: 'Which ESG reporting frameworks does Aurex support?',
        answer: 'Aurex supports all major ESG frameworks including TCFD, SASB, GRI, CDP, EU Taxonomy, and ISSB standards. Our platform automatically maps your data to the required frameworks.',
        category: 'compliance'
    },
    {
        id: '3',
        question: 'How does the pricing work for multiple applications?',
        answer: 'Our pricing is based on the number of users and applications you need. The Professional plan includes access to all applications (Launchpad, HydroPulse, Sylvagraph, CarbonTrace) with usage-based limits.',
        category: 'pricing'
    },
    {
        id: '4',
        question: 'Is my data secure and compliant?',
        answer: 'Yes, Aurex is SOC 2 Type II certified, ISO 27001 compliant, and GDPR/CCPA compliant. All data is encrypted at rest and in transit, with role-based access controls and comprehensive audit trails.',
        category: 'security'
    },
    {
        id: '5',
        question: 'Can Aurex integrate with our existing systems?',
        answer: 'Absolutely. Aurex offers 200+ pre-built integrations and a comprehensive API. We support popular ERP, CRM, and data management systems, plus custom integrations for enterprise clients.',
        category: 'integrations'
    },
    {
        id: '6',
        question: 'What kind of support do you provide?',
        answer: 'We offer tiered support: community support for Starter users, priority email/chat support for Professional users, and dedicated customer success managers for Enterprise clients. All plans include comprehensive documentation and training resources.',
        category: 'support'
    }
];
// Global Impact Dashboard Data
export const globalImpact = {
    environmentalMetrics: [
        { label: 'CO₂ Monitored & Verified', value: '2.3M+', unit: 'tons', description: 'Total carbon emissions tracked' },
        { label: 'Hectares Under Management', value: '150K+', unit: 'hectares', description: 'Land actively monitored' },
        { label: 'Organizations Reporting', value: '450+', unit: 'companies', description: 'Active platform users' },
        { label: 'Regulatory Compliance Rate', value: '98.5%', unit: 'success', description: 'Audit pass rate' }
    ],
    platformScale: [
        { label: 'Countries Covered', value: '15', unit: 'countries', description: 'Global reach' },
        { label: 'IoT Sensors Connected', value: '2,500+', unit: 'sensors', description: 'Real-time monitoring' },
        { label: 'Satellite Data Processed', value: '50TB+', unit: 'monthly', description: 'Image analysis' },
        { label: 'API Requests', value: '10M+', unit: 'monthly', description: 'System integrations' }
    ]
};
// Industry Solutions Data
export const industrySolutions = [
    {
        id: 'agriculture',
        title: 'Agriculture & Food',
        description: 'Sustainable farming solutions for the next generation',
        benefits: [
            'Reduce water usage 30%, increase yields 15%',
            'Carbon credit revenue generation',
            'Supply chain traceability',
            'Sustainable farming best practices'
        ],
        keyFeatures: [
            'Precision agriculture monitoring',
            'Crop health assessment',
            'Water optimization',
            'Carbon sequestration tracking'
        ],
        icon: 'agriculture',
        caseStudy: {
            title: 'GreenFields Agriculture',
            result: '35% water reduction, 18% yield increase',
            href: '/case-studies/greenfields'
        }
    },
    {
        id: 'manufacturing',
        title: 'Manufacturing & Industry',
        description: 'Complete supply chain visibility and optimization',
        benefits: [
            'Achieve complete Scope 3 visibility',
            'Automated sustainability reporting',
            'Energy efficiency optimization',
            'Supplier ESG scorecards'
        ],
        keyFeatures: [
            'Factory emissions monitoring',
            'Supply chain mapping',
            'Energy management',
            'Waste reduction tracking'
        ],
        icon: 'industry',
        caseStudy: {
            title: 'TechCorp Manufacturing',
            result: '40% emission reduction, $2M savings',
            href: '/case-studies/techcorp'
        }
    },
    {
        id: 'finance',
        title: 'Financial Services',
        description: 'Climate risk assessment and green finance solutions',
        benefits: [
            'Assess climate risks in portfolios',
            'Green bond impact tracking',
            'ESG investment screening',
            'Regulatory compliance automation'
        ],
        keyFeatures: [
            'Climate scenario analysis',
            'Portfolio carbon footprint',
            'Risk assessment tools',
            'Green taxonomy mapping'
        ],
        icon: 'finance',
        caseStudy: {
            title: 'Sustainable Ventures',
            result: '25% portfolio risk reduction',
            href: '/case-studies/sustainable-ventures'
        }
    },
    {
        id: 'realestate',
        title: 'Real Estate & Construction',
        description: 'Building performance and green certification management',
        benefits: [
            'Track building performance',
            'LEED/BREEAM compliance',
            'Energy usage optimization',
            'Tenant engagement platforms'
        ],
        keyFeatures: [
            'Building energy monitoring',
            'Certification tracking',
            'Tenant portal',
            'Performance benchmarking'
        ],
        icon: 'building',
        caseStudy: {
            title: 'GreenTower Properties',
            result: '30% energy reduction, LEED Platinum',
            href: '/case-studies/greentower'
        }
    }
];
