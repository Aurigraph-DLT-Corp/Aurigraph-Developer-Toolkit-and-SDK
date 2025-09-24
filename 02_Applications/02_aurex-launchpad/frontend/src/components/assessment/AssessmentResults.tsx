import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Target,
  FileText,
  Download,
  Share2,
  Calendar,
  Clock,
  Shield,
  Database,
  Factory,
  Zap,
  GitBranch,
  Building,
  ArrowRight,
  ExternalLink,
  Star,
  Users,
  Activity
} from 'lucide-react';

interface AssessmentResultsProps {
  assessmentData: {
    organizationId: string;
    responses: any[];
    totalScore: number;
    sectionScores: Record<string, number>;
    complianceLevel: string;
    startedAt: Date;
    completedAt: Date;
    status: string;
  };
  onClose: () => void;
  onStartPremium?: () => void;
}

const sectionIcons: Record<string, React.ComponentType<any>> = {
  organizational_preparedness: Building,
  data_collection_systems: Database,
  scope1_readiness: Factory,
  scope2_readiness: Zap,
  scope3_readiness: GitBranch,
  reporting_disclosure: FileText,
  climate_strategy: Target
};

const sectionTitles: Record<string, string> = {
  organizational_preparedness: 'Organizational Preparedness',
  data_collection_systems: 'Data Collection Systems',
  scope1_readiness: 'Scope 1 Readiness',
  scope2_readiness: 'Scope 2 Readiness',
  scope3_readiness: 'Scope 3 Readiness',
  reporting_disclosure: 'Reporting & Disclosure',
  climate_strategy: 'Climate Strategy Integration'
};

const AssessmentResults: React.FC<AssessmentResultsProps> = ({
  assessmentData,
  onClose,
  onStartPremium
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sections' | 'recommendations'>('overview');

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 65) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    if (score >= 35) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-50 border-emerald-200';
    if (score >= 65) return 'bg-blue-50 border-blue-200';
    if (score >= 50) return 'bg-yellow-50 border-yellow-200';
    if (score >= 35) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getRecommendations = () => {
    const { totalScore, sectionScores } = assessmentData;
    const recommendations = [];

    if (totalScore < 40) {
      recommendations.push({
        priority: 'Critical',
        title: 'Establish Basic GHG Accounting Framework',
        description: 'Your organization needs foundational GHG accounting capabilities. Start with organizational boundary definition and basic data collection systems.',
        actions: [
          'Define organizational boundaries per ISO 14064-1',
          'Implement basic data collection for Scope 1 and 2 emissions',
          'Establish governance structure for climate reporting',
          'Consider professional training on GHG accounting'
        ],
        timeline: '3-6 months',
        icon: AlertTriangle,
        color: 'red'
      });
    }

    if (sectionScores.scope3_readiness < 50) {
      recommendations.push({
        priority: 'High',
        title: 'Strengthen Scope 3 Value Chain Emissions',
        description: 'Scope 3 emissions often represent 70-90% of total footprint. Enhanced supplier engagement and data collection is crucial.',
        actions: [
          'Complete comprehensive Scope 3 screening and prioritization',
          'Develop supplier engagement program for key categories',
          'Implement primary data collection from major suppliers',
          'Consider life cycle assessment for key products'
        ],
        timeline: '6-12 months',
        icon: GitBranch,
        color: 'orange'
      });
    }

    if (sectionScores.data_collection_systems < 60) {
      recommendations.push({
        priority: 'High',
        title: 'Upgrade Data Collection and Management Systems',
        description: 'Robust data systems are essential for accurate and efficient GHG accounting and reporting.',
        actions: [
          'Implement automated data collection systems',
          'Establish data quality assurance protocols',
          'Consider DMRV (Digital MRV) implementation',
          'Integrate with existing enterprise systems'
        ],
        timeline: '4-8 months',
        icon: Database,
        color: 'yellow'
      });
    }

    if (totalScore >= 60 && sectionScores.reporting_disclosure < 70) {
      recommendations.push({
        priority: 'Medium',
        title: 'Enhance Reporting and Disclosure',
        description: 'Your data quality is good. Focus on transparent reporting and stakeholder engagement to build trust.',
        actions: [
          'Prepare for third-party verification',
          'Enhance sustainability report quality',
          'Engage with rating agencies and investors',
          'Consider public disclosure commitments'
        ],
        timeline: '2-4 months',
        icon: FileText,
        color: 'blue'
      });
    }

    if (totalScore >= 70) {
      recommendations.push({
        priority: 'Strategic',
        title: 'Advance to Carbon Management Excellence',
        description: 'Your organization is ready for advanced carbon management and leadership initiatives.',
        actions: [
          'Set science-based targets aligned with 1.5°C',
          'Implement carbon pricing in decision-making',
          'Explore carbon offset and removal strategies',
          'Consider industry leadership and advocacy'
        ],
        timeline: '6-18 months',
        icon: Star,
        color: 'emerald'
      });
    }

    return recommendations;
  };

  const recommendations = getRecommendations();
  const completionTime = Math.round((assessmentData.completedAt.getTime() - assessmentData.startedAt.getTime()) / 60000);

  const renderOverviewTab = () => (
    <div className="space-y-8">
      {/* Score Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl p-8 border border-emerald-200"
      >
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(assessmentData.totalScore)}`}>
                  {assessmentData.totalScore}%
                </div>
                <div className="text-sm text-gray-600">Overall Score</div>
              </div>
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Assessment Complete!
          </h3>
          <div className={`inline-flex items-center px-4 py-2 rounded-full border ${getScoreBgColor(assessmentData.totalScore)}`}>
            <Award className="w-5 h-5 mr-2" />
            <span className="font-semibold">{assessmentData.complianceLevel}</span>
          </div>
          
          <div className="flex justify-center items-center space-x-6 mt-6 text-sm text-gray-600">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              Completed in {completionTime} minutes
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {assessmentData.completedAt.toLocaleDateString()}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Section Scores Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(assessmentData.sectionScores).map(([sectionId, score], index) => {
          const Icon = sectionIcons[sectionId] || Shield;
          return (
            <motion.div
              key={sectionId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <Icon className="w-8 h-8 text-emerald-600" />
                <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
                  {score}%
                </div>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">
                {sectionTitles[sectionId]}
              </h4>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${score}%` }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Key Insights */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-6 h-6 text-emerald-600 mr-3" />
            <h4 className="text-lg font-semibold text-gray-900">Strengths</h4>
          </div>
          <div className="space-y-3">
            {Object.entries(assessmentData.sectionScores)
              .filter(([, score]) => score >= 70)
              .slice(0, 3)
              .map(([sectionId, score]) => (
                <div key={sectionId} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{sectionTitles[sectionId]}</span>
                  <span className="text-sm font-medium text-emerald-600">{score}%</span>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Target className="w-6 h-6 text-orange-600 mr-3" />
            <h4 className="text-lg font-semibold text-gray-900">Focus Areas</h4>
          </div>
          <div className="space-y-3">
            {Object.entries(assessmentData.sectionScores)
              .filter(([, score]) => score < 60)
              .slice(0, 3)
              .map(([sectionId, score]) => (
                <div key={sectionId} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{sectionTitles[sectionId]}</span>
                  <span className={`text-sm font-medium ${getScoreColor(score)}`}>{score}%</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Premium CTA */}
      {assessmentData.totalScore >= 40 && (
        <div className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xl font-bold mb-2">Ready for Advanced Carbon Management?</h4>
              <p className="text-blue-100 mb-4">
                Your assessment shows readiness for our premium services. Access industry-specific data collection,
                product carbon footprints, and expert advisory services.
              </p>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Industry Data Acquisition
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Product Carbon Footprint
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Expert Advisory
                </div>
              </div>
            </div>
            <div className="ml-8">
              <button
                onClick={onStartPremium}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center"
              >
                Explore Premium
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSectionsTab = () => (
    <div className="space-y-6">
      {Object.entries(assessmentData.sectionScores).map(([sectionId, score]) => {
        const Icon = sectionIcons[sectionId] || Shield;
        return (
          <motion.div
            key={sectionId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Icon className="w-8 h-8 text-emerald-600 mr-3" />
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {sectionTitles[sectionId]}
                  </h4>
                  <p className="text-sm text-gray-600">Detailed section analysis</p>
                </div>
              </div>
              <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
                {score}%
              </div>
            </div>
            
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Status: </span>
                <span className={getScoreColor(score)}>
                  {score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : score >= 50 ? 'Fair' : 'Needs Improvement'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Priority: </span>
                <span>
                  {score < 40 ? 'Critical' : score < 60 ? 'High' : score < 80 ? 'Medium' : 'Low'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Next Steps: </span>
                <span className="text-emerald-600">View recommendations</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  const renderRecommendationsTab = () => (
    <div className="space-y-6">
      {recommendations.map((rec, index) => {
        const Icon = rec.icon;
        const colorClasses = {
          red: 'border-red-200 bg-red-50',
          orange: 'border-orange-200 bg-orange-50',
          yellow: 'border-yellow-200 bg-yellow-50',
          blue: 'border-blue-200 bg-blue-50',
          emerald: 'border-emerald-200 bg-emerald-50'
        };

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`rounded-xl border p-6 ${colorClasses[rec.color as keyof typeof colorClasses]}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <Icon className="w-8 h-8 mr-3 text-gray-700" />
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <h4 className="text-lg font-semibold text-gray-900">{rec.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      rec.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                      rec.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                      rec.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {rec.priority} Priority
                    </span>
                  </div>
                  <p className="text-gray-700">{rec.description}</p>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <Clock className="w-4 h-4 inline mr-1" />
                {rec.timeline}
              </div>
            </div>

            <div className="ml-11">
              <h5 className="font-medium text-gray-900 mb-2">Recommended Actions:</h5>
              <ul className="space-y-2">
                {rec.actions.map((action, actionIndex) => (
                  <li key={actionIndex} className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-emerald-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        );
      })}

      <div className="bg-gradient-to-r from-emerald-600 to-blue-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xl font-bold mb-2">Need Expert Guidance?</h4>
            <p className="text-emerald-100 mb-4">
              Our carbon accounting experts can help you implement these recommendations
              and accelerate your progress toward audit-ready GHG reporting.
            </p>
          </div>
          <button
            onClick={onStartPremium}
            className="bg-white text-emerald-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center"
          >
            <Users className="w-4 h-4 mr-2" />
            Schedule Consultation
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-50 rounded-xl max-w-6xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Award className="w-8 h-8 text-emerald-600 mr-3" />
                GHG Readiness Assessment Results
              </h2>
              <p className="text-gray-600 mt-1">
                ISO 14046-2 Compliant Assessment • Completed {assessmentData.completedAt.toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </button>
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Share2 className="w-4 h-4 mr-2" />
                Share Results
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'sections', label: 'Section Details', icon: Activity },
              { id: 'recommendations', label: 'Recommendations', icon: Target }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(95vh-200px)] p-6">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'sections' && renderSectionsTab()}
          {activeTab === 'recommendations' && renderRecommendationsTab()}
        </div>
      </div>
    </div>
  );
};

export default AssessmentResults;