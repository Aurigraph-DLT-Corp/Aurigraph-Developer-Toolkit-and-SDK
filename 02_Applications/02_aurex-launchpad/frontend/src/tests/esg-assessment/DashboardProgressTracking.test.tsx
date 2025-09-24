/**
 * User Dashboard and Progress Tracking Tests
 * Aurex Launchpad - ESG Assessment Platform
 * 
 * Test suite for user dashboard functionality, progress tracking,
 * milestone management, and assessment workflow monitoring
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { ToastProvider } from '../../contexts/ToastContext';

// Mock components for dashboard and progress tracking
const MockESGDashboard = ({ user, assessments, onAssessmentSelect }) => (
  <div data-testid="esg-dashboard">
    <header data-testid="dashboard-header">
      <h1>Welcome, {user.name}</h1>
      <div data-testid="user-role">{user.role}</div>
      <div data-testid="company-name">{user.company}</div>
    </header>
    
    <div data-testid="dashboard-stats">
      <div data-testid="active-assessments">Active: {assessments.filter(a => a.status === 'active').length}</div>
      <div data-testid="completed-assessments">Completed: {assessments.filter(a => a.status === 'completed').length}</div>
      <div data-testid="draft-assessments">Drafts: {assessments.filter(a => a.status === 'draft').length}</div>
    </div>
    
    <div data-testid="assessment-list">
      {assessments.map(assessment => (
        <div
          key={assessment.id}
          data-testid={`assessment-${assessment.id}`}
          className="assessment-card"
          onClick={() => onAssessmentSelect(assessment)}
        >
          <h3>{assessment.framework} Assessment</h3>
          <div data-testid={`status-${assessment.id}`}>{assessment.status}</div>
          <div data-testid={`progress-${assessment.id}`}>{assessment.progress}%</div>
          <div data-testid={`deadline-${assessment.id}`}>{assessment.deadline}</div>
        </div>
      ))}
    </div>
  </div>
);

const MockProgressTracker = ({ assessment, milestones, onMilestoneUpdate }) => {
  const calculateOverallProgress = () => {
    const completedMilestones = milestones.filter(m => m.status === 'completed').length;
    return Math.round((completedMilestones / milestones.length) * 100);
  };

  return (
    <div data-testid="progress-tracker">
      <h2>{assessment.framework} Progress Tracker</h2>
      <div data-testid="overall-progress">Overall Progress: {calculateOverallProgress()}%</div>
      <div data-testid="assessment-status">Status: {assessment.status}</div>
      
      <div data-testid="milestone-list">
        {milestones.map((milestone, index) => (
          <div
            key={milestone.id}
            data-testid={`milestone-${milestone.id}`}
            className={`milestone ${milestone.status}`}
          >
            <div data-testid={`milestone-title-${milestone.id}`}>{milestone.title}</div>
            <div data-testid={`milestone-status-${milestone.id}`}>{milestone.status}</div>
            <div data-testid={`milestone-progress-${milestone.id}`}>{milestone.progress}%</div>
            <div data-testid={`milestone-due-${milestone.id}`}>{milestone.dueDate}</div>
            <button
              data-testid={`update-milestone-${milestone.id}`}
              onClick={() => onMilestoneUpdate(milestone.id, 'completed')}
              disabled={milestone.status === 'completed'}
            >
              Mark Complete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const MockWorkflowVisualizer = ({ framework, currentStep, steps, onStepClick }) => (
  <div data-testid="workflow-visualizer">
    <h3>{framework} Assessment Workflow</h3>
    <div data-testid="current-step">Current Step: {currentStep}</div>
    
    <div data-testid="workflow-steps">
      {steps.map((step, index) => (
        <div
          key={step.id}
          data-testid={`step-${step.id}`}
          className={`workflow-step ${step.status} ${step.id === currentStep ? 'current' : ''}`}
          onClick={() => onStepClick(step.id)}
        >
          <div data-testid={`step-title-${step.id}`}>{step.title}</div>
          <div data-testid={`step-status-${step.id}`}>{step.status}</div>
          <div data-testid={`step-order-${step.id}`}>Step {index + 1}</div>
        </div>
      ))}
    </div>
    
    <div data-testid="workflow-progress-bar">
      <div
        data-testid="progress-fill"
        style={{
          width: `${(steps.filter(s => s.status === 'completed').length / steps.length) * 100}%`
        }}
      />
    </div>
  </div>
);

const MockComplianceCalendarWidget = ({ upcomingDeadlines, overdueTasks }) => (
  <div data-testid="compliance-calendar-widget">
    <h3>Compliance Calendar</h3>
    
    <div data-testid="upcoming-deadlines">
      <h4>Upcoming Deadlines</h4>
      {upcomingDeadlines.map(deadline => (
        <div key={deadline.id} data-testid={`deadline-${deadline.id}`} className="deadline-item">
          <span>{deadline.title}</span>
          <span data-testid={`deadline-date-${deadline.id}`}>{deadline.date}</span>
          <span data-testid={`deadline-priority-${deadline.id}`}>{deadline.priority}</span>
        </div>
      ))}
    </div>
    
    <div data-testid="overdue-tasks">
      <h4>Overdue Tasks</h4>
      {overdueTasks.map(task => (
        <div key={task.id} data-testid={`overdue-${task.id}`} className="overdue-item">
          <span>{task.title}</span>
          <span data-testid={`overdue-date-${task.id}`}>{task.dueDate}</span>
          <span data-testid={`overdue-days-${task.id}`}>{task.daysOverdue} days overdue</span>
        </div>
      ))}
    </div>
  </div>
);

const MockPerformanceMetrics = ({ metrics, timeRange, onTimeRangeChange }) => (
  <div data-testid="performance-metrics">
    <h3>Performance Metrics</h3>
    
    <select
      data-testid="time-range-selector"
      value={timeRange}
      onChange={(e) => onTimeRangeChange(e.target.value)}
    >
      <option value="1M">Last Month</option>
      <option value="3M">Last 3 Months</option>
      <option value="6M">Last 6 Months</option>
      <option value="1Y">Last Year</option>
    </select>
    
    <div data-testid="metrics-grid">
      <div data-testid="assessments-completed">
        Assessments Completed: {metrics.assessmentsCompleted}
      </div>
      <div data-testid="average-completion-time">
        Avg Completion Time: {metrics.averageCompletionTime} days
      </div>
      <div data-testid="compliance-score">
        Average Compliance Score: {metrics.averageComplianceScore}%
      </div>
      <div data-testid="frameworks-covered">
        Frameworks Covered: {metrics.frameworksCovered.join(', ')}
      </div>
    </div>
    
    <div data-testid="performance-trends">
      <h4>Trends</h4>
      {metrics.trends.map((trend, index) => (
        <div key={index} data-testid={`trend-${index}`} className="trend-item">
          <span>{trend.metric}</span>
          <span data-testid={`trend-direction-${index}`} className={trend.direction}>
            {trend.change}% {trend.direction}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe('User Dashboard and Progress Tracking', () => {
  let mockUser;
  let mockAssessments;
  let mockMilestones;
  let mockOnAssessmentSelect;
  let mockOnMilestoneUpdate;
  let mockOnStepClick;
  let mockOnTimeRangeChange;
  let user;

  beforeEach(() => {
    mockUser = {
      name: 'John Smith',
      role: 'ESG Manager',
      company: 'Green Corp Inc.'
    };

    mockAssessments = [
      {
        id: 'assess-1',
        framework: 'TCFD',
        status: 'active',
        progress: 75,
        deadline: '2024-03-31',
        createdDate: '2024-01-15'
      },
      {
        id: 'assess-2',
        framework: 'GRI',
        status: 'completed',
        progress: 100,
        deadline: '2024-02-28',
        createdDate: '2024-01-10'
      },
      {
        id: 'assess-3',
        framework: 'SASB',
        status: 'draft',
        progress: 25,
        deadline: '2024-04-15',
        createdDate: '2024-02-01'
      },
      {
        id: 'assess-4',
        framework: 'CSRD',
        status: 'active',
        progress: 45,
        deadline: '2024-06-30',
        createdDate: '2024-01-20'
      }
    ];

    mockMilestones = [
      {
        id: 'milestone-1',
        title: 'Governance Assessment',
        status: 'completed',
        progress: 100,
        dueDate: '2024-02-15'
      },
      {
        id: 'milestone-2',
        title: 'Strategy Analysis',
        status: 'completed',
        progress: 100,
        dueDate: '2024-02-28'
      },
      {
        id: 'milestone-3',
        title: 'Risk Management Review',
        status: 'active',
        progress: 60,
        dueDate: '2024-03-15'
      },
      {
        id: 'milestone-4',
        title: 'Metrics & Targets Setup',
        status: 'pending',
        progress: 0,
        dueDate: '2024-03-31'
      }
    ];

    mockOnAssessmentSelect = jest.fn();
    mockOnMilestoneUpdate = jest.fn();
    mockOnStepClick = jest.fn();
    mockOnTimeRangeChange = jest.fn();
    user = userEvent.setup();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ESG Dashboard Overview', () => {
    test('renders dashboard with user information', () => {
      render(
        <TestWrapper>
          <MockESGDashboard
            user={mockUser}
            assessments={mockAssessments}
            onAssessmentSelect={mockOnAssessmentSelect}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('esg-dashboard')).toBeInTheDocument();
      expect(screen.getByText('Welcome, John Smith')).toBeInTheDocument();
      expect(screen.getByTestId('user-role')).toHaveTextContent('ESG Manager');
      expect(screen.getByTestId('company-name')).toHaveTextContent('Green Corp Inc.');
    });

    test('displays assessment statistics correctly', () => {
      render(
        <TestWrapper>
          <MockESGDashboard
            user={mockUser}
            assessments={mockAssessments}
            onAssessmentSelect={mockOnAssessmentSelect}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('active-assessments')).toHaveTextContent('Active: 2');
      expect(screen.getByTestId('completed-assessments')).toHaveTextContent('Completed: 1');
      expect(screen.getByTestId('draft-assessments')).toHaveTextContent('Drafts: 1');
    });

    test('renders assessment cards with correct information', () => {
      render(
        <TestWrapper>
          <MockESGDashboard
            user={mockUser}
            assessments={mockAssessments}
            onAssessmentSelect={mockOnAssessmentSelect}
          />
        </TestWrapper>
      );

      mockAssessments.forEach(assessment => {
        expect(screen.getByTestId(`assessment-${assessment.id}`)).toBeInTheDocument();
        expect(screen.getByTestId(`status-${assessment.id}`)).toHaveTextContent(assessment.status);
        expect(screen.getByTestId(`progress-${assessment.id}`)).toHaveTextContent(`${assessment.progress}%`);
        expect(screen.getByTestId(`deadline-${assessment.id}`)).toHaveTextContent(assessment.deadline);
      });
    });

    test('handles assessment selection', async () => {
      render(
        <TestWrapper>
          <MockESGDashboard
            user={mockUser}
            assessments={mockAssessments}
            onAssessmentSelect={mockOnAssessmentSelect}
          />
        </TestWrapper>
      );

      const assessmentCard = screen.getByTestId('assessment-assess-1');
      await user.click(assessmentCard);

      expect(mockOnAssessmentSelect).toHaveBeenCalledWith(mockAssessments[0]);
    });

    test('displays different assessment statuses with appropriate styling', () => {
      render(
        <TestWrapper>
          <MockESGDashboard
            user={mockUser}
            assessments={mockAssessments}
            onAssessmentSelect={mockOnAssessmentSelect}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('status-assess-1')).toHaveTextContent('active');
      expect(screen.getByTestId('status-assess-2')).toHaveTextContent('completed');
      expect(screen.getByTestId('status-assess-3')).toHaveTextContent('draft');
      expect(screen.getByTestId('status-assess-4')).toHaveTextContent('active');
    });
  });

  describe('Progress Tracking Functionality', () => {
    test('renders progress tracker with milestone information', () => {
      const activeAssessment = mockAssessments[0]; // TCFD assessment

      render(
        <TestWrapper>
          <MockProgressTracker
            assessment={activeAssessment}
            milestones={mockMilestones}
            onMilestoneUpdate={mockOnMilestoneUpdate}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('progress-tracker')).toBeInTheDocument();
      expect(screen.getByText('TCFD Progress Tracker')).toBeInTheDocument();
      expect(screen.getByTestId('overall-progress')).toHaveTextContent('Overall Progress: 50%');
      expect(screen.getByTestId('assessment-status')).toHaveTextContent('Status: active');
    });

    test('calculates overall progress correctly based on milestones', () => {
      const assessment = mockAssessments[0];
      
      render(
        <TestWrapper>
          <MockProgressTracker
            assessment={assessment}
            milestones={mockMilestones}
            onMilestoneUpdate={mockOnMilestoneUpdate}
          />
        </TestWrapper>
      );

      // 2 completed out of 4 milestones = 50%
      expect(screen.getByTestId('overall-progress')).toHaveTextContent('Overall Progress: 50%');
    });

    test('displays milestone details correctly', () => {
      const assessment = mockAssessments[0];
      
      render(
        <TestWrapper>
          <MockProgressTracker
            assessment={assessment}
            milestones={mockMilestones}
            onMilestoneUpdate={mockOnMilestoneUpdate}
          />
        </TestWrapper>
      );

      mockMilestones.forEach(milestone => {
        expect(screen.getByTestId(`milestone-${milestone.id}`)).toBeInTheDocument();
        expect(screen.getByTestId(`milestone-title-${milestone.id}`)).toHaveTextContent(milestone.title);
        expect(screen.getByTestId(`milestone-status-${milestone.id}`)).toHaveTextContent(milestone.status);
        expect(screen.getByTestId(`milestone-progress-${milestone.id}`)).toHaveTextContent(`${milestone.progress}%`);
        expect(screen.getByTestId(`milestone-due-${milestone.id}`)).toHaveTextContent(milestone.dueDate);
      });
    });

    test('handles milestone updates', async () => {
      const assessment = mockAssessments[0];
      
      render(
        <TestWrapper>
          <MockProgressTracker
            assessment={assessment}
            milestones={mockMilestones}
            onMilestoneUpdate={mockOnMilestoneUpdate}
          />
        </TestWrapper>
      );

      const updateButton = screen.getByTestId('update-milestone-milestone-3');
      await user.click(updateButton);

      expect(mockOnMilestoneUpdate).toHaveBeenCalledWith('milestone-3', 'completed');
    });

    test('disables update button for completed milestones', () => {
      const assessment = mockAssessments[0];
      
      render(
        <TestWrapper>
          <MockProgressTracker
            assessment={assessment}
            milestones={mockMilestones}
            onMilestoneUpdate={mockOnMilestoneUpdate}
          />
        </TestWrapper>
      );

      const completedMilestoneButton = screen.getByTestId('update-milestone-milestone-1');
      const activeMilestoneButton = screen.getByTestId('update-milestone-milestone-3');

      expect(completedMilestoneButton).toBeDisabled();
      expect(activeMilestoneButton).not.toBeDisabled();
    });
  });

  describe('Workflow Visualization', () => {
    const mockWorkflowSteps = [
      { id: 'context_setup', title: 'Context Setup', status: 'completed' },
      { id: 'governance_assessment', title: 'Governance Assessment', status: 'completed' },
      { id: 'strategy_assessment', title: 'Strategy Assessment', status: 'active' },
      { id: 'risk_management_assessment', title: 'Risk Management', status: 'pending' },
      { id: 'metrics_targets_assessment', title: 'Metrics & Targets', status: 'pending' }
    ];

    test('renders workflow visualizer with current step highlighted', () => {
      render(
        <TestWrapper>
          <MockWorkflowVisualizer
            framework="TCFD"
            currentStep="strategy_assessment"
            steps={mockWorkflowSteps}
            onStepClick={mockOnStepClick}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('workflow-visualizer')).toBeInTheDocument();
      expect(screen.getByText('TCFD Assessment Workflow')).toBeInTheDocument();
      expect(screen.getByTestId('current-step')).toHaveTextContent('Current Step: strategy_assessment');
    });

    test('displays all workflow steps with correct status', () => {
      render(
        <TestWrapper>
          <MockWorkflowVisualizer
            framework="TCFD"
            currentStep="strategy_assessment"
            steps={mockWorkflowSteps}
            onStepClick={mockOnStepClick}
          />
        </TestWrapper>
      );

      mockWorkflowSteps.forEach((step, index) => {
        expect(screen.getByTestId(`step-${step.id}`)).toBeInTheDocument();
        expect(screen.getByTestId(`step-title-${step.id}`)).toHaveTextContent(step.title);
        expect(screen.getByTestId(`step-status-${step.id}`)).toHaveTextContent(step.status);
        expect(screen.getByTestId(`step-order-${step.id}`)).toHaveTextContent(`Step ${index + 1}`);
      });
    });

    test('handles step navigation clicks', async () => {
      render(
        <TestWrapper>
          <MockWorkflowVisualizer
            framework="TCFD"
            currentStep="strategy_assessment"
            steps={mockWorkflowSteps}
            onStepClick={mockOnStepClick}
          />
        </TestWrapper>
      );

      const governanceStep = screen.getByTestId('step-governance_assessment');
      await user.click(governanceStep);

      expect(mockOnStepClick).toHaveBeenCalledWith('governance_assessment');
    });

    test('displays workflow progress bar correctly', () => {
      render(
        <TestWrapper>
          <MockWorkflowVisualizer
            framework="TCFD"
            currentStep="strategy_assessment"
            steps={mockWorkflowSteps}
            onStepClick={mockOnStepClick}
          />
        </TestWrapper>
      );

      const progressFill = screen.getByTestId('progress-fill');
      const completedSteps = mockWorkflowSteps.filter(s => s.status === 'completed').length;
      const expectedWidth = (completedSteps / mockWorkflowSteps.length) * 100;
      
      expect(progressFill).toHaveStyle(`width: ${expectedWidth}%`);
    });
  });

  describe('Compliance Calendar Widget', () => {
    const mockUpcomingDeadlines = [
      {
        id: 'deadline-1',
        title: 'TCFD Climate Report Submission',
        date: '2024-03-31',
        priority: 'high'
      },
      {
        id: 'deadline-2',
        title: 'GRI Sustainability Report',
        date: '2024-04-30',
        priority: 'medium'
      }
    ];

    const mockOverdueTasks = [
      {
        id: 'overdue-1',
        title: 'Stakeholder Engagement Survey',
        dueDate: '2024-01-15',
        daysOverdue: 12
      }
    ];

    test('renders compliance calendar with deadlines and overdue tasks', () => {
      render(
        <TestWrapper>
          <MockComplianceCalendarWidget
            upcomingDeadlines={mockUpcomingDeadlines}
            overdueTasks={mockOverdueTasks}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('compliance-calendar-widget')).toBeInTheDocument();
      expect(screen.getByText('Compliance Calendar')).toBeInTheDocument();
      expect(screen.getByTestId('upcoming-deadlines')).toBeInTheDocument();
      expect(screen.getByTestId('overdue-tasks')).toBeInTheDocument();
    });

    test('displays upcoming deadlines with correct information', () => {
      render(
        <TestWrapper>
          <MockComplianceCalendarWidget
            upcomingDeadlines={mockUpcomingDeadlines}
            overdueTasks={mockOverdueTasks}
          />
        </TestWrapper>
      );

      mockUpcomingDeadlines.forEach(deadline => {
        expect(screen.getByTestId(`deadline-${deadline.id}`)).toBeInTheDocument();
        expect(screen.getByTestId(`deadline-date-${deadline.id}`)).toHaveTextContent(deadline.date);
        expect(screen.getByTestId(`deadline-priority-${deadline.id}`)).toHaveTextContent(deadline.priority);
      });
    });

    test('displays overdue tasks with days overdue calculation', () => {
      render(
        <TestWrapper>
          <MockComplianceCalendarWidget
            upcomingDeadlines={mockUpcomingDeadlines}
            overdueTasks={mockOverdueTasks}
          />
        </TestWrapper>
      );

      mockOverdueTasks.forEach(task => {
        expect(screen.getByTestId(`overdue-${task.id}`)).toBeInTheDocument();
        expect(screen.getByTestId(`overdue-date-${task.id}`)).toHaveTextContent(task.dueDate);
        expect(screen.getByTestId(`overdue-days-${task.id}`)).toHaveTextContent(`${task.daysOverdue} days overdue`);
      });
    });
  });

  describe('Performance Metrics Dashboard', () => {
    const mockMetrics = {
      assessmentsCompleted: 8,
      averageCompletionTime: 45,
      averageComplianceScore: 82,
      frameworksCovered: ['TCFD', 'GRI', 'SASB'],
      trends: [
        { metric: 'Completion Time', change: -15, direction: 'down' },
        { metric: 'Compliance Score', change: 8, direction: 'up' },
        { metric: 'Assessments Completed', change: 25, direction: 'up' }
      ]
    };

    test('renders performance metrics with all key statistics', () => {
      render(
        <TestWrapper>
          <MockPerformanceMetrics
            metrics={mockMetrics}
            timeRange="3M"
            onTimeRangeChange={mockOnTimeRangeChange}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('performance-metrics')).toBeInTheDocument();
      expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
      expect(screen.getByTestId('assessments-completed')).toHaveTextContent('Assessments Completed: 8');
      expect(screen.getByTestId('average-completion-time')).toHaveTextContent('Avg Completion Time: 45 days');
      expect(screen.getByTestId('compliance-score')).toHaveTextContent('Average Compliance Score: 82%');
      expect(screen.getByTestId('frameworks-covered')).toHaveTextContent('Frameworks Covered: TCFD, GRI, SASB');
    });

    test('handles time range selection', async () => {
      render(
        <TestWrapper>
          <MockPerformanceMetrics
            metrics={mockMetrics}
            timeRange="3M"
            onTimeRangeChange={mockOnTimeRangeChange}
          />
        </TestWrapper>
      );

      const timeRangeSelector = screen.getByTestId('time-range-selector');
      await user.selectOptions(timeRangeSelector, '1Y');

      expect(mockOnTimeRangeChange).toHaveBeenCalledWith('1Y');
    });

    test('displays performance trends with direction indicators', () => {
      render(
        <TestWrapper>
          <MockPerformanceMetrics
            metrics={mockMetrics}
            timeRange="3M"
            onTimeRangeChange={mockOnTimeRangeChange}
          />
        </TestWrapper>
      );

      mockMetrics.trends.forEach((trend, index) => {
        expect(screen.getByTestId(`trend-${index}`)).toBeInTheDocument();
        expect(screen.getByTestId(`trend-direction-${index}`)).toHaveTextContent(`${trend.change}% ${trend.direction}`);
        expect(screen.getByTestId(`trend-direction-${index}`)).toHaveClass(trend.direction);
      });
    });

    test('shows correct time range selection', () => {
      render(
        <TestWrapper>
          <MockPerformanceMetrics
            metrics={mockMetrics}
            timeRange="6M"
            onTimeRangeChange={mockOnTimeRangeChange}
          />
        </TestWrapper>
      );

      const timeRangeSelector = screen.getByTestId('time-range-selector');
      expect(timeRangeSelector).toHaveValue('6M');
    });
  });

  describe('Integration and Workflow Testing', () => {
    test('dashboard components work together cohesively', () => {
      render(
        <TestWrapper>
          <MockESGDashboard
            user={mockUser}
            assessments={mockAssessments}
            onAssessmentSelect={mockOnAssessmentSelect}
          />
          <MockProgressTracker
            assessment={mockAssessments[0]}
            milestones={mockMilestones}
            onMilestoneUpdate={mockOnMilestoneUpdate}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('esg-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('progress-tracker')).toBeInTheDocument();
      
      // Verify data consistency between components
      expect(screen.getByTestId('progress-assess-1')).toHaveTextContent('75%');
      expect(screen.getByTestId('overall-progress')).toHaveTextContent('Overall Progress: 50%');
    });

    test('handles empty data states gracefully', () => {
      render(
        <TestWrapper>
          <MockESGDashboard
            user={mockUser}
            assessments={[]}
            onAssessmentSelect={mockOnAssessmentSelect}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('active-assessments')).toHaveTextContent('Active: 0');
      expect(screen.getByTestId('completed-assessments')).toHaveTextContent('Completed: 0');
      expect(screen.getByTestId('draft-assessments')).toHaveTextContent('Drafts: 0');
    });

    test('updates progress when milestones are completed', async () => {
      const { rerender } = render(
        <TestWrapper>
          <MockProgressTracker
            assessment={mockAssessments[0]}
            milestones={mockMilestones}
            onMilestoneUpdate={mockOnMilestoneUpdate}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('overall-progress')).toHaveTextContent('Overall Progress: 50%');

      // Complete another milestone
      const updatedMilestones = [...mockMilestones];
      updatedMilestones[2].status = 'completed';

      rerender(
        <TestWrapper>
          <MockProgressTracker
            assessment={mockAssessments[0]}
            milestones={updatedMilestones}
            onMilestoneUpdate={mockOnMilestoneUpdate}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('overall-progress')).toHaveTextContent('Overall Progress: 75%');
    });
  });

  describe('Responsive and Performance Tests', () => {
    test('dashboard renders efficiently with large datasets', () => {
      const largeAssessmentList = Array.from({ length: 50 }, (_, i) => ({
        id: `assess-${i}`,
        framework: ['TCFD', 'GRI', 'SASB', 'CSRD'][i % 4],
        status: ['active', 'completed', 'draft'][i % 3],
        progress: Math.floor(Math.random() * 100),
        deadline: '2024-12-31',
        createdDate: '2024-01-01'
      }));

      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <MockESGDashboard
            user={mockUser}
            assessments={largeAssessmentList}
            onAssessmentSelect={mockOnAssessmentSelect}
          />
        </TestWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(100); // Should render within 100ms
      expect(screen.getByTestId('esg-dashboard')).toBeInTheDocument();
    });

    test('progress tracker handles complex milestone calculations', () => {
      const complexMilestones = Array.from({ length: 20 }, (_, i) => ({
        id: `milestone-${i}`,
        title: `Milestone ${i + 1}`,
        status: i < 12 ? 'completed' : i < 16 ? 'active' : 'pending',
        progress: i < 12 ? 100 : i < 16 ? 50 : 0,
        dueDate: '2024-12-31'
      }));

      render(
        <TestWrapper>
          <MockProgressTracker
            assessment={mockAssessments[0]}
            milestones={complexMilestones}
            onMilestoneUpdate={mockOnMilestoneUpdate}
          />
        </TestWrapper>
      );

      // 12 completed out of 20 milestones = 60%
      expect(screen.getByTestId('overall-progress')).toHaveTextContent('Overall Progress: 60%');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('handles missing user data gracefully', () => {
      const incompleteUser = { name: 'John Doe' }; // Missing role and company

      render(
        <TestWrapper>
          <MockESGDashboard
            user={incompleteUser}
            assessments={mockAssessments}
            onAssessmentSelect={mockOnAssessmentSelect}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Welcome, John Doe')).toBeInTheDocument();
      expect(screen.getByTestId('user-role')).toBeInTheDocument(); // Should render even if empty
      expect(screen.getByTestId('company-name')).toBeInTheDocument(); // Should render even if empty
    });

    test('handles invalid milestone data', () => {
      const invalidMilestones = [
        { id: 'milestone-1', title: 'Valid Milestone', status: 'completed', progress: 100 },
        { id: 'milestone-2', title: 'Invalid Milestone', status: 'unknown', progress: -10 }
      ];

      render(
        <TestWrapper>
          <MockProgressTracker
            assessment={mockAssessments[0]}
            milestones={invalidMilestones}
            onMilestoneUpdate={mockOnMilestoneUpdate}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('progress-tracker')).toBeInTheDocument();
      expect(screen.getByTestId('milestone-status-milestone-2')).toHaveTextContent('unknown');
    });

    test('handles performance metrics calculation errors', () => {
      const metricsWithInvalidData = {
        assessmentsCompleted: 'invalid',
        averageCompletionTime: null,
        averageComplianceScore: undefined,
        frameworksCovered: [],
        trends: []
      };

      render(
        <TestWrapper>
          <MockPerformanceMetrics
            metrics={metricsWithInvalidData}
            timeRange="1M"
            onTimeRangeChange={mockOnTimeRangeChange}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('performance-metrics')).toBeInTheDocument();
      // Component should handle invalid data without crashing
    });
  });
});