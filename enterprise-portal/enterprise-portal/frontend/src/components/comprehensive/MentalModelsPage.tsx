import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Tabs,
  Space,
  Tooltip,
  Badge,
  Divider,
  Alert,
  message,
  List,
  Avatar,
  Progress,
  Statistic,
} from 'antd';
import {
  BulbOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  ThunderboltOutlined,
  NodeIndexOutlined,
  BranchesOutlined,
  ExperimentOutlined,
  RobotOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  LineChartOutlined,
  ForkOutlined,
} from '@ant-design/icons';
import ErrorBoundary from '../common/ErrorBoundary';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

// Mental Model Types
interface MentalModel {
  id: string;
  name: string;
  description: string;
  category: 'reasoning' | 'decision' | 'analysis' | 'creativity' | 'systems' | 'strategic';
  type: 'framework' | 'heuristic' | 'principle' | 'methodology';
  icon: string;
  parameters: ModelParameter[];
  useCases: string[];
  complementaryModels: string[];
  strengthAreas: string[];
  limitations: string[];
  enabled: boolean;
  popularity: number;
  complexity: 'simple' | 'moderate' | 'complex';
}

interface ModelParameter {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'select';
  value: any;
  options?: string[];
  min?: number;
  max?: number;
  description: string;
}

interface Orchestration {
  id: string;
  name: string;
  description: string;
  models: OrchestrationStep[];
  executionMode: 'sequential' | 'parallel' | 'conditional';
  created: string;
  lastUsed: string;
  status: 'draft' | 'active' | 'archived';
  successRate: number;
  avgExecutionTime: number;
}

interface OrchestrationStep {
  modelId: string;
  modelName: string;
  order: number;
  condition?: string;
  inputMapping?: Record<string, string>;
  outputMapping?: Record<string, string>;
  weight: number;
}

// Predefined Mental Models Database
const MENTAL_MODELS: MentalModel[] = [
  // Reasoning Models
  {
    id: 'first-principles',
    name: 'First Principles Thinking',
    description: 'Break down complex problems into basic elements and reassemble from the ground up.',
    category: 'reasoning',
    type: 'methodology',
    icon: 'experiment',
    parameters: [
      { name: 'decompositionDepth', type: 'number', value: 3, min: 1, max: 10, description: 'How many levels to decompose' },
      { name: 'assumptionChallenge', type: 'boolean', value: true, description: 'Challenge every assumption' },
    ],
    useCases: ['Innovation', 'Problem solving', 'Cost reduction', 'Process optimization'],
    complementaryModels: ['inversion', 'second-order'],
    strengthAreas: ['Breaking through constraints', 'Novel solutions'],
    limitations: ['Time consuming', 'Requires deep domain knowledge'],
    enabled: true,
    popularity: 95,
    complexity: 'complex',
  },
  {
    id: 'inversion',
    name: 'Inversion',
    description: 'Approach problems backwards by considering what you want to avoid.',
    category: 'reasoning',
    type: 'heuristic',
    icon: 'swap',
    parameters: [
      { name: 'inverseQuestions', type: 'number', value: 5, min: 1, max: 20, description: 'Number of inverse questions to generate' },
    ],
    useCases: ['Risk mitigation', 'Goal setting', 'Decision making'],
    complementaryModels: ['first-principles', 'pre-mortem'],
    strengthAreas: ['Risk identification', 'Blind spot detection'],
    limitations: ['Can be overly negative', 'May miss opportunities'],
    enabled: true,
    popularity: 88,
    complexity: 'simple',
  },
  {
    id: 'second-order',
    name: 'Second-Order Thinking',
    description: 'Consider the consequences of the consequences.',
    category: 'reasoning',
    type: 'framework',
    icon: 'branches',
    parameters: [
      { name: 'orderDepth', type: 'number', value: 3, min: 2, max: 7, description: 'How many orders to consider' },
      { name: 'timeHorizon', type: 'select', value: 'medium', options: ['short', 'medium', 'long'], description: 'Time horizon for consequences' },
    ],
    useCases: ['Strategy', 'Policy making', 'Investment decisions'],
    complementaryModels: ['systems-thinking', 'game-theory'],
    strengthAreas: ['Long-term planning', 'Avoiding unintended consequences'],
    limitations: ['Uncertainty increases with depth', 'Analysis paralysis risk'],
    enabled: true,
    popularity: 82,
    complexity: 'moderate',
  },
  // Decision Models
  {
    id: 'decision-matrix',
    name: 'Decision Matrix',
    description: 'Evaluate options against weighted criteria systematically.',
    category: 'decision',
    type: 'framework',
    icon: 'table',
    parameters: [
      { name: 'criteriaCount', type: 'number', value: 5, min: 2, max: 15, description: 'Number of criteria to evaluate' },
      { name: 'weightingMethod', type: 'select', value: 'linear', options: ['linear', 'exponential', 'rank-based'], description: 'How to weight criteria' },
    ],
    useCases: ['Vendor selection', 'Hiring', 'Technology choices'],
    complementaryModels: ['pareto', 'opportunity-cost'],
    strengthAreas: ['Objectivity', 'Transparency', 'Documentation'],
    limitations: ['Garbage in garbage out', 'May oversimplify'],
    enabled: true,
    popularity: 90,
    complexity: 'moderate',
  },
  {
    id: 'opportunity-cost',
    name: 'Opportunity Cost Analysis',
    description: 'Evaluate the hidden cost of not choosing alternatives.',
    category: 'decision',
    type: 'principle',
    icon: 'dollar',
    parameters: [
      { name: 'alternativesCount', type: 'number', value: 3, min: 1, max: 10, description: 'Number of alternatives to compare' },
      { name: 'includeNonMonetary', type: 'boolean', value: true, description: 'Include non-monetary factors' },
    ],
    useCases: ['Resource allocation', 'Time management', 'Career decisions'],
    complementaryModels: ['decision-matrix', 'regret-minimization'],
    strengthAreas: ['Resource optimization', 'Trade-off clarity'],
    limitations: ['Hard to quantify intangibles', 'Hindsight bias'],
    enabled: true,
    popularity: 78,
    complexity: 'simple',
  },
  {
    id: 'regret-minimization',
    name: 'Regret Minimization Framework',
    description: 'Make decisions by projecting to your future self and minimizing regret.',
    category: 'decision',
    type: 'framework',
    icon: 'clock-circle',
    parameters: [
      { name: 'projectionYears', type: 'number', value: 10, min: 1, max: 50, description: 'Years into future to project' },
      { name: 'scenarios', type: 'number', value: 3, min: 1, max: 10, description: 'Number of future scenarios' },
    ],
    useCases: ['Life decisions', 'Career pivots', 'Major investments'],
    complementaryModels: ['pre-mortem', 'opportunity-cost'],
    strengthAreas: ['Long-term alignment', 'Emotional clarity'],
    limitations: ['Subjective', 'May ignore practical constraints'],
    enabled: true,
    popularity: 75,
    complexity: 'simple',
  },
  // Analysis Models
  {
    id: 'pareto',
    name: 'Pareto Principle (80/20)',
    description: '80% of effects come from 20% of causes.',
    category: 'analysis',
    type: 'principle',
    icon: 'pie-chart',
    parameters: [
      { name: 'threshold', type: 'number', value: 80, min: 50, max: 95, description: 'Effect threshold percentage' },
      { name: 'iterative', type: 'boolean', value: false, description: 'Apply iteratively to the 20%' },
    ],
    useCases: ['Prioritization', 'Resource allocation', 'Bug fixing'],
    complementaryModels: ['decision-matrix', 'leverage-points'],
    strengthAreas: ['Focus', 'Efficiency', 'Quick wins'],
    limitations: ['Not always 80/20', 'May oversimplify'],
    enabled: true,
    popularity: 92,
    complexity: 'simple',
  },
  {
    id: 'root-cause',
    name: 'Root Cause Analysis (5 Whys)',
    description: 'Repeatedly ask "why" to drill down to fundamental causes.',
    category: 'analysis',
    type: 'methodology',
    icon: 'question',
    parameters: [
      { name: 'whyDepth', type: 'number', value: 5, min: 3, max: 10, description: 'Number of "why" iterations' },
      { name: 'branchingAllowed', type: 'boolean', value: true, description: 'Allow multiple parallel root causes' },
    ],
    useCases: ['Problem solving', 'Process improvement', 'Incident analysis'],
    complementaryModels: ['first-principles', 'systems-thinking'],
    strengthAreas: ['Getting to fundamentals', 'Preventing recurrence'],
    limitations: ['May stop at symptoms', 'Linear thinking bias'],
    enabled: true,
    popularity: 86,
    complexity: 'simple',
  },
  // Systems Models
  {
    id: 'systems-thinking',
    name: 'Systems Thinking',
    description: 'Understand how parts of a system interrelate and work over time.',
    category: 'systems',
    type: 'framework',
    icon: 'deployment-unit',
    parameters: [
      { name: 'boundaryDefinition', type: 'select', value: 'moderate', options: ['narrow', 'moderate', 'wide'], description: 'System boundary scope' },
      { name: 'feedbackLoops', type: 'boolean', value: true, description: 'Analyze feedback loops' },
      { name: 'delaysAnalysis', type: 'boolean', value: true, description: 'Consider time delays' },
    ],
    useCases: ['Complex problem solving', 'Organizational design', 'Policy analysis'],
    complementaryModels: ['leverage-points', 'second-order'],
    strengthAreas: ['Holistic view', 'Unintended consequences', 'Sustainable solutions'],
    limitations: ['Complexity', 'May be overwhelming', 'Hard to validate'],
    enabled: true,
    popularity: 84,
    complexity: 'complex',
  },
  {
    id: 'leverage-points',
    name: 'Leverage Points',
    description: 'Identify places in a system where small changes produce big effects.',
    category: 'systems',
    type: 'framework',
    icon: 'aim',
    parameters: [
      { name: 'leverageLevel', type: 'select', value: 'medium', options: ['parameters', 'buffers', 'structure', 'goals', 'paradigms'], description: 'Level of intervention' },
    ],
    useCases: ['Change management', 'System optimization', 'Strategic planning'],
    complementaryModels: ['systems-thinking', 'pareto'],
    strengthAreas: ['Maximum impact', 'Efficient resource use'],
    limitations: ['Requires deep system understanding', 'Resistance to paradigm shifts'],
    enabled: true,
    popularity: 72,
    complexity: 'complex',
  },
  // Strategic Models
  {
    id: 'game-theory',
    name: 'Game Theory',
    description: 'Analyze strategic interactions where outcomes depend on choices of all players.',
    category: 'strategic',
    type: 'framework',
    icon: 'trophy',
    parameters: [
      { name: 'players', type: 'number', value: 2, min: 2, max: 10, description: 'Number of players/parties' },
      { name: 'gameType', type: 'select', value: 'non-zero-sum', options: ['zero-sum', 'non-zero-sum', 'cooperative'], description: 'Type of game' },
      { name: 'iterations', type: 'number', value: 1, min: 1, max: 100, description: 'Number of iterations (for repeated games)' },
    ],
    useCases: ['Negotiation', 'Competitive strategy', 'Pricing decisions'],
    complementaryModels: ['second-order', 'pre-mortem'],
    strengthAreas: ['Strategic clarity', 'Opponent modeling'],
    limitations: ['Assumes rationality', 'Information requirements'],
    enabled: true,
    popularity: 76,
    complexity: 'complex',
  },
  {
    id: 'pre-mortem',
    name: 'Pre-Mortem Analysis',
    description: 'Imagine the project has failed and work backwards to identify causes.',
    category: 'strategic',
    type: 'methodology',
    icon: 'warning',
    parameters: [
      { name: 'failureScenarios', type: 'number', value: 5, min: 1, max: 15, description: 'Number of failure scenarios to generate' },
      { name: 'participantDiversity', type: 'boolean', value: true, description: 'Include diverse perspectives' },
    ],
    useCases: ['Project planning', 'Risk management', 'Strategy validation'],
    complementaryModels: ['inversion', 'regret-minimization'],
    strengthAreas: ['Proactive risk identification', 'Psychological safety'],
    limitations: ['Can be demotivating', 'May create excessive caution'],
    enabled: true,
    popularity: 80,
    complexity: 'moderate',
  },
  // Creativity Models
  {
    id: 'lateral-thinking',
    name: 'Lateral Thinking',
    description: 'Solve problems through indirect and creative approaches.',
    category: 'creativity',
    type: 'methodology',
    icon: 'bulb',
    parameters: [
      { name: 'randomInput', type: 'boolean', value: true, description: 'Use random stimuli for ideation' },
      { name: 'constraintRemoval', type: 'boolean', value: true, description: 'Systematically remove constraints' },
      { name: 'analogyCount', type: 'number', value: 3, min: 1, max: 10, description: 'Number of analogies to explore' },
    ],
    useCases: ['Innovation', 'Creative problem solving', 'Product design'],
    complementaryModels: ['first-principles', 'scamper'],
    strengthAreas: ['Novel solutions', 'Breaking mental blocks'],
    limitations: ['Unpredictable', 'May seem unfocused'],
    enabled: true,
    popularity: 85,
    complexity: 'moderate',
  },
  {
    id: 'scamper',
    name: 'SCAMPER',
    description: 'Substitute, Combine, Adapt, Modify, Put to other use, Eliminate, Reverse.',
    category: 'creativity',
    type: 'framework',
    icon: 'tool',
    parameters: [
      { name: 'focusAreas', type: 'select', value: 'all', options: ['all', 'substitute', 'combine', 'adapt', 'modify', 'put-to-use', 'eliminate', 'reverse'], description: 'Which SCAMPER elements to focus on' },
    ],
    useCases: ['Product improvement', 'Process innovation', 'Service design'],
    complementaryModels: ['lateral-thinking', 'first-principles'],
    strengthAreas: ['Structured creativity', 'Comprehensive exploration'],
    limitations: ['Can be mechanical', 'May miss radical innovations'],
    enabled: true,
    popularity: 74,
    complexity: 'simple',
  },
  {
    id: 'circle-of-competence',
    name: 'Circle of Competence',
    description: 'Understand and stay within your areas of genuine expertise.',
    category: 'decision',
    type: 'principle',
    icon: 'safety-certificate',
    parameters: [
      { name: 'boundaryStrictness', type: 'select', value: 'moderate', options: ['strict', 'moderate', 'flexible'], description: 'How strictly to stay in circle' },
      { name: 'expansionRate', type: 'number', value: 10, min: 0, max: 50, description: 'Annual competence expansion target (%)' },
    ],
    useCases: ['Investment decisions', 'Business strategy', 'Career planning'],
    complementaryModels: ['opportunity-cost', 'regret-minimization'],
    strengthAreas: ['Risk reduction', 'Authentic expertise'],
    limitations: ['May limit growth', 'Hard to define boundaries'],
    enabled: true,
    popularity: 70,
    complexity: 'simple',
  },
];

// Category metadata
const CATEGORIES = {
  reasoning: { label: 'Reasoning', color: 'blue', icon: <BulbOutlined /> },
  decision: { label: 'Decision Making', color: 'green', icon: <NodeIndexOutlined /> },
  analysis: { label: 'Analysis', color: 'purple', icon: <LineChartOutlined /> },
  creativity: { label: 'Creativity', color: 'orange', icon: <ExperimentOutlined /> },
  systems: { label: 'Systems', color: 'cyan', icon: <BranchesOutlined /> },
  strategic: { label: 'Strategic', color: 'red', icon: <ThunderboltOutlined /> },
};

const MentalModelsPage: React.FC = () => {
  const [models, setModels] = useState<MentalModel[]>(MENTAL_MODELS);
  const [orchestrations, setOrchestrations] = useState<Orchestration[]>([]);
  const [selectedModel, setSelectedModel] = useState<MentalModel | null>(null);
  const [isModelModalVisible, setIsModelModalVisible] = useState(false);
  const [isOrchestrationModalVisible, setIsOrchestrationModalVisible] = useState(false);
  const [editingOrchestration, setEditingOrchestration] = useState<Orchestration | null>(null);
  const [activeTab, setActiveTab] = useState('models');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [form] = Form.useForm();

  // Load saved orchestrations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mentalModelOrchestrations');
    if (saved) {
      setOrchestrations(JSON.parse(saved));
    }
  }, []);

  // Save orchestrations to localStorage
  useEffect(() => {
    localStorage.setItem('mentalModelOrchestrations', JSON.stringify(orchestrations));
  }, [orchestrations]);

  // Filter models based on search and category
  const filteredModels = models.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || model.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Handle model selection
  const handleModelSelect = (model: MentalModel) => {
    setSelectedModel(model);
    setIsModelModalVisible(true);
  };

  // Toggle model enabled state
  const toggleModelEnabled = (modelId: string) => {
    setModels(prev => prev.map(m =>
      m.id === modelId ? { ...m, enabled: !m.enabled } : m
    ));
    message.success('Model status updated');
  };

  // Create new orchestration
  const handleCreateOrchestration = () => {
    setEditingOrchestration(null);
    form.resetFields();
    setIsOrchestrationModalVisible(true);
  };

  // Edit orchestration
  const handleEditOrchestration = (orch: Orchestration) => {
    setEditingOrchestration(orch);
    form.setFieldsValue({
      name: orch.name,
      description: orch.description,
      executionMode: orch.executionMode,
      models: orch.models.map(m => m.modelId),
    });
    setIsOrchestrationModalVisible(true);
  };

  // Save orchestration
  const handleSaveOrchestration = async () => {
    try {
      const values = await form.validateFields();
      const selectedModels = values.models.map((modelId: string, index: number) => {
        const model = models.find(m => m.id === modelId);
        return {
          modelId,
          modelName: model?.name || modelId,
          order: index + 1,
          weight: 1,
        };
      });

      const newOrchestration: Orchestration = {
        id: editingOrchestration?.id || `orch-${Date.now()}`,
        name: values.name,
        description: values.description,
        models: selectedModels,
        executionMode: values.executionMode,
        created: editingOrchestration?.created || new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        status: 'active',
        successRate: editingOrchestration?.successRate || 0,
        avgExecutionTime: editingOrchestration?.avgExecutionTime || 0,
      };

      if (editingOrchestration) {
        setOrchestrations(prev => prev.map(o =>
          o.id === editingOrchestration.id ? newOrchestration : o
        ));
        message.success('Orchestration updated successfully');
      } else {
        setOrchestrations(prev => [...prev, newOrchestration]);
        message.success('Orchestration created successfully');
      }

      setIsOrchestrationModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // Delete orchestration
  const handleDeleteOrchestration = (orchId: string) => {
    Modal.confirm({
      title: 'Delete Orchestration',
      content: 'Are you sure you want to delete this orchestration?',
      onOk: () => {
        setOrchestrations(prev => prev.filter(o => o.id !== orchId));
        message.success('Orchestration deleted');
      },
    });
  };

  // Run orchestration
  const handleRunOrchestration = async (orch: Orchestration) => {
    setLoading(true);
    message.loading({ content: `Running "${orch.name}"...`, key: 'orchestration' });

    // Simulate orchestration execution
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update success rate and execution time
    setOrchestrations(prev => prev.map(o =>
      o.id === orch.id
        ? {
            ...o,
            lastUsed: new Date().toISOString(),
            successRate: Math.min(100, o.successRate + 5),
            avgExecutionTime: (o.avgExecutionTime * 0.9) + (Math.random() * 500 * 0.1),
          }
        : o
    ));

    setLoading(false);
    message.success({ content: `"${orch.name}" executed successfully`, key: 'orchestration' });
  };

  // Duplicate orchestration
  const handleDuplicateOrchestration = (orch: Orchestration) => {
    const duplicate: Orchestration = {
      ...orch,
      id: `orch-${Date.now()}`,
      name: `${orch.name} (Copy)`,
      created: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      successRate: 0,
      avgExecutionTime: 0,
    };
    setOrchestrations(prev => [...prev, duplicate]);
    message.success('Orchestration duplicated');
  };

  // Model card component
  const ModelCard: React.FC<{ model: MentalModel }> = ({ model }) => {
    const categoryMeta = CATEGORIES[model.category];

    return (
      <Card
        hoverable
        onClick={() => handleModelSelect(model)}
        style={{ height: '100%' }}
        actions={[
          <Tooltip title={model.enabled ? 'Disable' : 'Enable'} key="toggle">
            <div onClick={(e) => e.stopPropagation()}>
              <Switch
                checked={model.enabled}
                onChange={() => toggleModelEnabled(model.id)}
                size="small"
              />
            </div>
          </Tooltip>,
          <Tooltip title="View Details" key="view">
            <InfoCircleOutlined onClick={() => handleModelSelect(model)} />
          </Tooltip>,
        ]}
      >
        <Card.Meta
          avatar={
            <Avatar
              style={{ backgroundColor: categoryMeta.color === 'blue' ? '#1890ff' :
                       categoryMeta.color === 'green' ? '#52c41a' :
                       categoryMeta.color === 'purple' ? '#722ed1' :
                       categoryMeta.color === 'orange' ? '#fa8c16' :
                       categoryMeta.color === 'cyan' ? '#13c2c2' : '#f5222d' }}
              icon={categoryMeta.icon}
            />
          }
          title={
            <Space>
              <Text strong>{model.name}</Text>
              {model.enabled && <Badge status="success" />}
            </Space>
          }
          description={
            <div>
              <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 8 }}>
                {model.description}
              </Paragraph>
              <Space wrap>
                <Tag color={categoryMeta.color}>{categoryMeta.label}</Tag>
                <Tag>{model.type}</Tag>
                <Tag color={model.complexity === 'simple' ? 'green' :
                           model.complexity === 'moderate' ? 'orange' : 'red'}>
                  {model.complexity}
                </Tag>
              </Space>
              <div style={{ marginTop: 8 }}>
                <Progress
                  percent={model.popularity}
                  size="small"
                  format={percent => `${percent}% popular`}
                />
              </div>
            </div>
          }
        />
      </Card>
    );
  };

  // Orchestration columns for table
  const orchestrationColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Orchestration) => (
        <Space>
          <ForkOutlined />
          <Text strong>{name}</Text>
          {record.status === 'active' && <Badge status="success" />}
        </Space>
      ),
    },
    {
      title: 'Models',
      dataIndex: 'models',
      key: 'models',
      render: (models: OrchestrationStep[]) => (
        <Space wrap>
          {models.map((m, i) => (
            <Tag key={i} icon={<RobotOutlined />}>
              {i + 1}. {m.modelName}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Execution Mode',
      dataIndex: 'executionMode',
      key: 'executionMode',
      render: (mode: string) => (
        <Tag color={mode === 'sequential' ? 'blue' : mode === 'parallel' ? 'green' : 'orange'}>
          {mode}
        </Tag>
      ),
    },
    {
      title: 'Success Rate',
      dataIndex: 'successRate',
      key: 'successRate',
      render: (rate: number) => <Progress percent={rate} size="small" />,
    },
    {
      title: 'Avg Time',
      dataIndex: 'avgExecutionTime',
      key: 'avgExecutionTime',
      render: (time: number) => `${time.toFixed(0)}ms`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Orchestration) => (
        <Space>
          <Tooltip title="Run">
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              size="small"
              onClick={() => handleRunOrchestration(record)}
              loading={loading}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditOrchestration(record)}
            />
          </Tooltip>
          <Tooltip title="Duplicate">
            <Button
              icon={<CopyOutlined />}
              size="small"
              onClick={() => handleDuplicateOrchestration(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => handleDeleteOrchestration(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <ErrorBoundary>
      <div style={{ padding: 24 }}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card>
              <Row justify="space-between" align="middle">
                <Col>
                  <Title level={2} style={{ margin: 0 }}>
                    <BulbOutlined /> Mental Models & Reasoning Orchestration
                  </Title>
                  <Text type="secondary">
                    Explore mental models and create custom orchestrations for complex reasoning
                  </Text>
                </Col>
                <Col>
                  <Space>
                    <Statistic
                      title="Total Models"
                      value={models.length}
                      prefix={<RobotOutlined />}
                    />
                    <Divider type="vertical" />
                    <Statistic
                      title="Enabled"
                      value={models.filter(m => m.enabled).length}
                      valueStyle={{ color: '#52c41a' }}
                    />
                    <Divider type="vertical" />
                    <Statistic
                      title="Orchestrations"
                      value={orchestrations.length}
                      prefix={<ForkOutlined />}
                    />
                  </Space>
                </Col>
              </Row>
            </Card>
          </Col>

          <Col span={24}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              tabBarExtraContent={
                activeTab === 'orchestrations' && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleCreateOrchestration}
                  >
                    Create Orchestration
                  </Button>
                )
              }
            >
              <TabPane
                tab={<span><BulbOutlined /> Mental Models ({models.length})</span>}
                key="models"
              >
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col xs={24} sm={12} md={8}>
                    <Input.Search
                      placeholder="Search models..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      allowClear
                    />
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Select
                      style={{ width: '100%' }}
                      value={categoryFilter}
                      onChange={setCategoryFilter}
                      placeholder="Filter by category"
                    >
                      <Option value="all">All Categories</Option>
                      {Object.entries(CATEGORIES).map(([key, val]) => (
                        <Option key={key} value={key}>
                          {val.icon} {val.label}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                </Row>

                <Row gutter={[16, 16]}>
                  {filteredModels.map(model => (
                    <Col xs={24} sm={12} lg={8} xl={6} key={model.id}>
                      <ModelCard model={model} />
                    </Col>
                  ))}
                </Row>

                {filteredModels.length === 0 && (
                  <Alert
                    message="No models found"
                    description="Try adjusting your search or filter criteria"
                    type="info"
                    showIcon
                  />
                )}
              </TabPane>

              <TabPane
                tab={<span><ForkOutlined /> Orchestrations ({orchestrations.length})</span>}
                key="orchestrations"
              >
                {orchestrations.length === 0 ? (
                  <Alert
                    message="No orchestrations yet"
                    description="Create your first custom orchestration by combining multiple mental models into a reasoning pipeline."
                    type="info"
                    showIcon
                    action={
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleCreateOrchestration}
                      >
                        Create First Orchestration
                      </Button>
                    }
                  />
                ) : (
                  <Table
                    dataSource={orchestrations}
                    columns={orchestrationColumns}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                  />
                )}
              </TabPane>

              <TabPane
                tab={<span><LineChartOutlined /> Analytics</span>}
                key="analytics"
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={8}>
                    <Card>
                      <Statistic
                        title="Most Popular Model"
                        value={models.sort((a, b) => b.popularity - a.popularity)[0]?.name || 'N/A'}
                        prefix={<ThunderboltOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} md={8}>
                    <Card>
                      <Statistic
                        title="Average Complexity"
                        value={
                          (models.filter(m => m.complexity === 'simple').length * 1 +
                           models.filter(m => m.complexity === 'moderate').length * 2 +
                           models.filter(m => m.complexity === 'complex').length * 3) / models.length
                        }
                        precision={1}
                        suffix="/ 3"
                        prefix={<ExperimentOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} md={8}>
                    <Card>
                      <Statistic
                        title="Categories Covered"
                        value={Object.keys(CATEGORIES).length}
                        prefix={<BranchesOutlined />}
                      />
                    </Card>
                  </Col>
                </Row>

                <Card title="Model Distribution by Category" style={{ marginTop: 16 }}>
                  <Row gutter={[16, 8]}>
                    {Object.entries(CATEGORIES).map(([key, val]) => {
                      const count = models.filter(m => m.category === key).length;
                      const percent = (count / models.length) * 100;
                      return (
                        <Col xs={24} sm={12} md={8} key={key}>
                          <Space>
                            {val.icon}
                            <Text>{val.label}</Text>
                          </Space>
                          <Progress
                            percent={percent}
                            format={() => count}
                            strokeColor={val.color === 'blue' ? '#1890ff' :
                                        val.color === 'green' ? '#52c41a' :
                                        val.color === 'purple' ? '#722ed1' :
                                        val.color === 'orange' ? '#fa8c16' :
                                        val.color === 'cyan' ? '#13c2c2' : '#f5222d'}
                          />
                        </Col>
                      );
                    })}
                  </Row>
                </Card>
              </TabPane>
            </Tabs>
          </Col>
        </Row>

        {/* Model Detail Modal */}
        <Modal
          title={
            <Space>
              {selectedModel && CATEGORIES[selectedModel.category].icon}
              {selectedModel?.name}
            </Space>
          }
          open={isModelModalVisible}
          onCancel={() => setIsModelModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setIsModelModalVisible(false)}>
              Close
            </Button>,
            <Button
              key="toggle"
              type={selectedModel?.enabled ? 'default' : 'primary'}
              onClick={() => {
                if (selectedModel) toggleModelEnabled(selectedModel.id);
                setIsModelModalVisible(false);
              }}
            >
              {selectedModel?.enabled ? 'Disable' : 'Enable'} Model
            </Button>,
          ]}
          width={800}
        >
          {selectedModel && (
            <div>
              <Paragraph>{selectedModel.description}</Paragraph>

              <Divider>Properties</Divider>
              <Row gutter={[16, 8]}>
                <Col span={8}>
                  <Text type="secondary">Category:</Text>
                  <br />
                  <Tag color={CATEGORIES[selectedModel.category].color}>
                    {CATEGORIES[selectedModel.category].label}
                  </Tag>
                </Col>
                <Col span={8}>
                  <Text type="secondary">Type:</Text>
                  <br />
                  <Tag>{selectedModel.type}</Tag>
                </Col>
                <Col span={8}>
                  <Text type="secondary">Complexity:</Text>
                  <br />
                  <Tag color={selectedModel.complexity === 'simple' ? 'green' :
                             selectedModel.complexity === 'moderate' ? 'orange' : 'red'}>
                    {selectedModel.complexity}
                  </Tag>
                </Col>
              </Row>

              <Divider>Parameters</Divider>
              <List
                size="small"
                dataSource={selectedModel.parameters}
                renderItem={param => (
                  <List.Item>
                    <List.Item.Meta
                      title={param.name}
                      description={param.description}
                    />
                    <Tag>{param.type}: {JSON.stringify(param.value)}</Tag>
                  </List.Item>
                )}
              />

              <Divider>Use Cases</Divider>
              <Space wrap>
                {selectedModel.useCases.map((uc, i) => (
                  <Tag key={i} color="blue">{uc}</Tag>
                ))}
              </Space>

              <Divider>Strengths & Limitations</Divider>
              <Row gutter={16}>
                <Col span={12}>
                  <Title level={5}><CheckCircleOutlined style={{ color: '#52c41a' }} /> Strengths</Title>
                  <List
                    size="small"
                    dataSource={selectedModel.strengthAreas}
                    renderItem={item => <List.Item>{item}</List.Item>}
                  />
                </Col>
                <Col span={12}>
                  <Title level={5}><CloseCircleOutlined style={{ color: '#f5222d' }} /> Limitations</Title>
                  <List
                    size="small"
                    dataSource={selectedModel.limitations}
                    renderItem={item => <List.Item>{item}</List.Item>}
                  />
                </Col>
              </Row>

              <Divider>Complementary Models</Divider>
              <Space wrap>
                {selectedModel.complementaryModels.map(cmId => {
                  const cm = models.find(m => m.id === cmId);
                  return cm ? (
                    <Tag
                      key={cmId}
                      color="purple"
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        const complementaryModel = models.find(m => m.id === cmId);
                        if (complementaryModel) setSelectedModel(complementaryModel);
                      }}
                    >
                      {cm.name}
                    </Tag>
                  ) : null;
                })}
              </Space>
            </div>
          )}
        </Modal>

        {/* Orchestration Modal */}
        <Modal
          title={editingOrchestration ? 'Edit Orchestration' : 'Create New Orchestration'}
          open={isOrchestrationModalVisible}
          onCancel={() => {
            setIsOrchestrationModalVisible(false);
            form.resetFields();
          }}
          onOk={handleSaveOrchestration}
          okText={editingOrchestration ? 'Update' : 'Create'}
          width={700}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="name"
              label="Orchestration Name"
              rules={[{ required: true, message: 'Please enter a name' }]}
            >
              <Input placeholder="e.g., Strategic Decision Pipeline" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: 'Please enter a description' }]}
            >
              <TextArea
                rows={3}
                placeholder="Describe what this orchestration is designed for..."
              />
            </Form.Item>

            <Form.Item
              name="executionMode"
              label="Execution Mode"
              rules={[{ required: true, message: 'Please select an execution mode' }]}
              initialValue="sequential"
            >
              <Select>
                <Option value="sequential">
                  <Space>
                    <NodeIndexOutlined />
                    Sequential - Models run one after another
                  </Space>
                </Option>
                <Option value="parallel">
                  <Space>
                    <BranchesOutlined />
                    Parallel - Models run simultaneously
                  </Space>
                </Option>
                <Option value="conditional">
                  <Space>
                    <ForkOutlined />
                    Conditional - Models run based on conditions
                  </Space>
                </Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="models"
              label="Select Models (in order of execution)"
              rules={[{ required: true, message: 'Please select at least one model' }]}
            >
              <Select
                mode="multiple"
                placeholder="Select mental models to include"
                optionFilterProp="children"
              >
                {models.filter(m => m.enabled).map(model => (
                  <Option key={model.id} value={model.id}>
                    <Space>
                      {CATEGORIES[model.category].icon}
                      {model.name}
                      <Tag style={{ fontSize: '12px' }}>{model.complexity}</Tag>
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Alert
              message="Orchestration Tips"
              description={
                <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                  <li>Start with broad analysis models, then narrow down with decision models</li>
                  <li>Include at least one creativity model for novel insights</li>
                  <li>End with a validation model like Pre-Mortem</li>
                  <li>Consider complementary model pairs for better coverage</li>
                </ul>
              }
              type="info"
              showIcon
            />
          </Form>
        </Modal>
      </div>
    </ErrorBoundary>
  );
};

export default MentalModelsPage;
