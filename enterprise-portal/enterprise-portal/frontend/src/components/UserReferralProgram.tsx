/**
 * User Profile & Referral Program
 *
 * A comprehensive page for user profile management and referral program participation.
 * Features:
 * - User profile display and editing
 * - Referral code generation and sharing
 * - Referral statistics and rewards tracking
 * - Invite friends functionality
 * - Leaderboard and achievements
 *
 * @author Aurigraph Development Team
 * @version 12.0.0
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Input,
  Statistic,
  Table,
  Tag,
  Avatar,
  Progress,
  Tabs,
  Form,
  message,
  Modal,
  Tooltip,
  Space,
  Divider,
  List,
  Badge,
  Alert,
} from 'antd';
import {
  UserOutlined,
  GiftOutlined,
  ShareAltOutlined,
  CopyOutlined,
  TeamOutlined,
  TrophyOutlined,
  DollarOutlined,
  MailOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StarOutlined,
  RiseOutlined,
  TwitterOutlined,
  LinkedinOutlined,
  SendOutlined,
  EditOutlined,
  SafetyCertificateOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

// Types
interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatar?: string;
  walletAddress?: string;
  role: string;
  status: 'active' | 'inactive';
  joinedAt: string;
  referralCode: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  totalReferrals: number;
  totalRewards: number;
  pendingRewards: number;
}

interface Referral {
  id: string;
  referredUser: string;
  email: string;
  status: 'pending' | 'active' | 'completed' | 'expired';
  signupDate: string;
  rewardAmount: number;
  rewardStatus: 'pending' | 'paid' | 'processing';
}

interface RewardTier {
  name: string;
  minReferrals: number;
  rewardPerReferral: number;
  bonusReward: number;
  color: string;
  icon: React.ReactNode;
}

interface LeaderboardEntry {
  rank: number;
  username: string;
  referrals: number;
  rewards: number;
  tier: string;
}

// Mock Data
const mockUser: UserProfile = {
  id: 'user-001',
  username: 'john.blockchain',
  email: 'john@aurigraph.io',
  fullName: 'John Anderson',
  walletAddress: '0x742d35Cc6634C0532925a3b8...',
  role: 'User',
  status: 'active',
  joinedAt: '2025-01-15',
  referralCode: 'AUR-JOH-2025',
  tier: 'gold',
  totalReferrals: 12,
  totalRewards: 2400,
  pendingRewards: 300,
};

const mockReferrals: Referral[] = [
  { id: '1', referredUser: 'alice.smith', email: 'alice@example.com', status: 'completed', signupDate: '2025-11-01', rewardAmount: 200, rewardStatus: 'paid' },
  { id: '2', referredUser: 'bob.jones', email: 'bob@example.com', status: 'active', signupDate: '2025-11-15', rewardAmount: 200, rewardStatus: 'processing' },
  { id: '3', referredUser: 'carol.white', email: 'carol@example.com', status: 'pending', signupDate: '2025-12-01', rewardAmount: 200, rewardStatus: 'pending' },
  { id: '4', referredUser: 'david.brown', email: 'david@example.com', status: 'completed', signupDate: '2025-10-20', rewardAmount: 200, rewardStatus: 'paid' },
  { id: '5', referredUser: 'eva.green', email: 'eva@example.com', status: 'completed', signupDate: '2025-10-25', rewardAmount: 200, rewardStatus: 'paid' },
];

const rewardTiers: RewardTier[] = [
  { name: 'Bronze', minReferrals: 0, rewardPerReferral: 100, bonusReward: 0, color: '#cd7f32', icon: <StarOutlined /> },
  { name: 'Silver', minReferrals: 5, rewardPerReferral: 150, bonusReward: 250, color: '#c0c0c0', icon: <StarOutlined /> },
  { name: 'Gold', minReferrals: 10, rewardPerReferral: 200, bonusReward: 500, color: '#ffd700', icon: <TrophyOutlined /> },
  { name: 'Platinum', minReferrals: 25, rewardPerReferral: 250, bonusReward: 1000, color: '#e5e4e2', icon: <TrophyOutlined /> },
  { name: 'Diamond', minReferrals: 50, rewardPerReferral: 300, bonusReward: 2500, color: '#b9f2ff', icon: <SafetyCertificateOutlined /> },
];

const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, username: 'crypto_king', referrals: 156, rewards: 31200, tier: 'diamond' },
  { rank: 2, username: 'blockchain_wizard', referrals: 98, rewards: 19600, tier: 'diamond' },
  { rank: 3, username: 'token_master', referrals: 67, rewards: 13400, tier: 'diamond' },
  { rank: 4, username: 'defi_explorer', referrals: 45, rewards: 9000, tier: 'platinum' },
  { rank: 5, username: 'web3_pioneer', referrals: 38, rewards: 7600, tier: 'platinum' },
  { rank: 6, username: 'john.blockchain', referrals: 12, rewards: 2400, tier: 'gold' },
  { rank: 7, username: 'smart_investor', referrals: 10, rewards: 2000, tier: 'gold' },
  { rank: 8, username: 'chain_builder', referrals: 8, rewards: 1600, tier: 'silver' },
];

const UserReferralProgram: React.FC = () => {
  const [user, setUser] = useState<UserProfile>(mockUser);
  const [referrals, setReferrals] = useState<Referral[]>(mockReferrals);
  const [activeTab, setActiveTab] = useState('profile');
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [form] = Form.useForm();

  // Get current tier info
  const currentTier = rewardTiers.find(t => t.name.toLowerCase() === user.tier) || rewardTiers[0];
  const nextTier = rewardTiers.find(t => t.minReferrals > user.totalReferrals);

  // Calculate progress to next tier
  const progressToNextTier = nextTier
    ? ((user.totalReferrals - (currentTier?.minReferrals || 0)) /
       (nextTier.minReferrals - (currentTier?.minReferrals || 0))) * 100
    : 100;

  // Copy referral link to clipboard
  const copyReferralLink = () => {
    const link = `https://dlt.aurigraph.io/signup?ref=${user.referralCode}`;
    navigator.clipboard.writeText(link);
    message.success('Referral link copied to clipboard!');
  };

  // Copy referral code
  const copyReferralCode = () => {
    navigator.clipboard.writeText(user.referralCode);
    message.success('Referral code copied!');
  };

  // Send invite email
  const handleSendInvite = () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      message.error('Please enter a valid email address');
      return;
    }
    message.success(`Invitation sent to ${inviteEmail}`);
    setInviteEmail('');
    setInviteModalVisible(false);
  };

  // Share to social media
  const shareToSocial = (platform: string) => {
    const link = `https://dlt.aurigraph.io/signup?ref=${user.referralCode}`;
    const text = `Join Aurigraph DLT - The next-generation blockchain platform! Use my referral code ${user.referralCode} to get started.`;

    let url = '';
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`;
        break;
    }
    window.open(url, '_blank');
  };

  // Referral table columns
  const referralColumns: ColumnsType<Referral> = [
    {
      title: 'Referred User',
      dataIndex: 'referredUser',
      key: 'referredUser',
      render: (text) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email) => <Text type="secondary">{email}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors: Record<string, string> = {
          pending: 'orange',
          active: 'blue',
          completed: 'green',
          expired: 'red',
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Signup Date',
      dataIndex: 'signupDate',
      key: 'signupDate',
    },
    {
      title: 'Reward',
      dataIndex: 'rewardAmount',
      key: 'rewardAmount',
      render: (amount) => <Text strong style={{ color: '#52c41a' }}>${amount}</Text>,
    },
    {
      title: 'Reward Status',
      dataIndex: 'rewardStatus',
      key: 'rewardStatus',
      render: (status) => {
        const config: Record<string, { color: string; icon: React.ReactNode }> = {
          pending: { color: 'orange', icon: <ClockCircleOutlined /> },
          processing: { color: 'blue', icon: <ClockCircleOutlined spin /> },
          paid: { color: 'green', icon: <CheckCircleOutlined /> },
        };
        return (
          <Tag color={config[status].color} icon={config[status].icon}>
            {status.toUpperCase()}
          </Tag>
        );
      },
    },
  ];

  // Leaderboard columns
  const leaderboardColumns: ColumnsType<LeaderboardEntry> = [
    {
      title: 'Rank',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (rank) => {
        if (rank <= 3) {
          const medals = ['', '🥇', '🥈', '🥉'];
          return <Text strong style={{ fontSize: 18 }}>{medals[rank]}</Text>;
        }
        return <Text>#{rank}</Text>;
      },
    },
    {
      title: 'User',
      dataIndex: 'username',
      key: 'username',
      render: (username) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <Text strong>{username}</Text>
          {username === user.username && <Tag color="blue">YOU</Tag>}
        </Space>
      ),
    },
    {
      title: 'Referrals',
      dataIndex: 'referrals',
      key: 'referrals',
      render: (count) => <Badge count={count} style={{ backgroundColor: '#1890ff' }} overflowCount={999} />,
    },
    {
      title: 'Rewards',
      dataIndex: 'rewards',
      key: 'rewards',
      render: (amount) => <Text strong style={{ color: '#52c41a' }}>${amount.toLocaleString()}</Text>,
    },
    {
      title: 'Tier',
      dataIndex: 'tier',
      key: 'tier',
      render: (tier) => {
        const tierInfo = rewardTiers.find(t => t.name.toLowerCase() === tier);
        return (
          <Tag color={tierInfo?.color} style={{ color: tier === 'platinum' || tier === 'diamond' ? '#333' : undefined }}>
            {tier.toUpperCase()}
          </Tag>
        );
      },
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <UserOutlined /> User Profile & Referral Program
      </Title>
      <Paragraph type="secondary">
        Manage your profile and earn rewards by inviting friends to Aurigraph DLT
      </Paragraph>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        {/* Profile Tab */}
        <TabPane
          tab={<span><UserOutlined /> Profile</span>}
          key="profile"
        >
          <Row gutter={[24, 24]}>
            {/* User Info Card */}
            <Col xs={24} lg={8}>
              <Card>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <Avatar size={100} icon={<UserOutlined />} style={{ backgroundColor: currentTier.color }} />
                  <Title level={3} style={{ marginTop: 16, marginBottom: 4 }}>{user.fullName}</Title>
                  <Text type="secondary">@{user.username}</Text>
                  <div style={{ marginTop: 8 }}>
                    <Tag color={currentTier.color} style={{ color: user.tier === 'platinum' || user.tier === 'diamond' ? '#333' : '#fff' }}>
                      {currentTier.icon} {user.tier.toUpperCase()} MEMBER
                    </Tag>
                  </div>
                </div>

                <Divider />

                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text type="secondary"><MailOutlined /> Email</Text>
                    <br />
                    <Text>{user.email}</Text>
                  </div>
                  <div>
                    <Text type="secondary"><WalletOutlined /> Wallet</Text>
                    <br />
                    <Text copyable={{ text: user.walletAddress }}>
                      {user.walletAddress?.substring(0, 20)}...
                    </Text>
                  </div>
                  <div>
                    <Text type="secondary">Member Since</Text>
                    <br />
                    <Text>{user.joinedAt}</Text>
                  </div>
                </Space>

                <Divider />

                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  block
                  onClick={() => setEditProfileVisible(true)}
                >
                  Edit Profile
                </Button>
              </Card>
            </Col>

            {/* Stats Cards */}
            <Col xs={24} lg={16}>
              <Row gutter={[16, 16]}>
                <Col xs={12} md={6}>
                  <Card>
                    <Statistic
                      title="Total Referrals"
                      value={user.totalReferrals}
                      prefix={<TeamOutlined />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
                <Col xs={12} md={6}>
                  <Card>
                    <Statistic
                      title="Total Rewards"
                      value={user.totalRewards}
                      prefix={<DollarOutlined />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Card>
                </Col>
                <Col xs={12} md={6}>
                  <Card>
                    <Statistic
                      title="Pending Rewards"
                      value={user.pendingRewards}
                      prefix={<ClockCircleOutlined />}
                      valueStyle={{ color: '#faad14' }}
                    />
                  </Card>
                </Col>
                <Col xs={12} md={6}>
                  <Card>
                    <Statistic
                      title="Reward Rate"
                      value={currentTier.rewardPerReferral}
                      prefix={<GiftOutlined />}
                      suffix="/referral"
                      valueStyle={{ color: '#722ed1' }}
                    />
                  </Card>
                </Col>
              </Row>

              {/* Tier Progress */}
              <Card style={{ marginTop: 16 }}>
                <Title level={4}><RiseOutlined /> Tier Progress</Title>
                {nextTier ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text>{currentTier.name}</Text>
                      <Text>{nextTier.name}</Text>
                    </div>
                    <Progress
                      percent={Math.round(progressToNextTier)}
                      strokeColor={currentTier.color}
                      format={() => `${user.totalReferrals}/${nextTier.minReferrals}`}
                    />
                    <Alert
                      message={`${nextTier.minReferrals - user.totalReferrals} more referrals to reach ${nextTier.name} tier!`}
                      description={`Unlock $${nextTier.rewardPerReferral}/referral and $${nextTier.bonusReward} bonus reward`}
                      type="info"
                      showIcon
                      style={{ marginTop: 16 }}
                    />
                  </>
                ) : (
                  <Alert
                    message="You've reached the highest tier!"
                    description="Congratulations! You're a Diamond member with maximum benefits."
                    type="success"
                    showIcon
                  />
                )}
              </Card>

              {/* Tier Benefits */}
              <Card style={{ marginTop: 16 }}>
                <Title level={4}><TrophyOutlined /> Tier Benefits</Title>
                <Row gutter={[16, 16]}>
                  {rewardTiers.map((tier) => (
                    <Col xs={24} sm={12} md={8} lg={4} key={tier.name}>
                      <Card
                        size="small"
                        style={{
                          borderColor: tier.name.toLowerCase() === user.tier ? tier.color : undefined,
                          borderWidth: tier.name.toLowerCase() === user.tier ? 2 : 1,
                        }}
                      >
                        <div style={{ textAlign: 'center' }}>
                          <Avatar
                            size={40}
                            style={{ backgroundColor: tier.color, color: tier.name === 'Platinum' || tier.name === 'Diamond' ? '#333' : '#fff' }}
                            icon={tier.icon}
                          />
                          <div style={{ marginTop: 8 }}>
                            <Text strong>{tier.name}</Text>
                          </div>
                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {tier.minReferrals}+ refs
                            </Text>
                          </div>
                          <div>
                            <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>
                              ${tier.rewardPerReferral}/ref
                            </Text>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* Referral Tab */}
        <TabPane
          tab={<span><ShareAltOutlined /> Referral Program</span>}
          key="referral"
        >
          <Row gutter={[24, 24]}>
            {/* Referral Code Card */}
            <Col xs={24} lg={12}>
              <Card title={<><GiftOutlined /> Your Referral Code</>}>
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div
                    style={{
                      fontSize: 32,
                      fontWeight: 'bold',
                      letterSpacing: 4,
                      padding: '16px 32px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: 12,
                      display: 'inline-block',
                      color: '#fff',
                    }}
                  >
                    {user.referralCode}
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <Space>
                      <Button icon={<CopyOutlined />} onClick={copyReferralCode}>
                        Copy Code
                      </Button>
                      <Button type="primary" icon={<ShareAltOutlined />} onClick={copyReferralLink}>
                        Copy Link
                      </Button>
                    </Space>
                  </div>
                </div>

                <Divider>Share on Social</Divider>

                <div style={{ textAlign: 'center' }}>
                  <Space size="large">
                    <Tooltip title="Share on Twitter">
                      <Button
                        shape="circle"
                        size="large"
                        icon={<TwitterOutlined />}
                        style={{ backgroundColor: '#1DA1F2', color: '#fff' }}
                        onClick={() => shareToSocial('twitter')}
                      />
                    </Tooltip>
                    <Tooltip title="Share on LinkedIn">
                      <Button
                        shape="circle"
                        size="large"
                        icon={<LinkedinOutlined />}
                        style={{ backgroundColor: '#0077B5', color: '#fff' }}
                        onClick={() => shareToSocial('linkedin')}
                      />
                    </Tooltip>
                    <Tooltip title="Send Email Invitation">
                      <Button
                        shape="circle"
                        size="large"
                        icon={<MailOutlined />}
                        style={{ backgroundColor: '#EA4335', color: '#fff' }}
                        onClick={() => setInviteModalVisible(true)}
                      />
                    </Tooltip>
                  </Space>
                </div>
              </Card>
            </Col>

            {/* How It Works */}
            <Col xs={24} lg={12}>
              <Card title={<><TrophyOutlined /> How It Works</>}>
                <List
                  itemLayout="horizontal"
                  dataSource={[
                    {
                      title: 'Share Your Code',
                      description: 'Share your unique referral code or link with friends',
                      icon: <ShareAltOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
                    },
                    {
                      title: 'Friends Sign Up',
                      description: 'When they register using your code, they get bonus tokens',
                      icon: <TeamOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
                    },
                    {
                      title: 'Earn Rewards',
                      description: `Earn $${currentTier.rewardPerReferral} for each successful referral`,
                      icon: <GiftOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
                    },
                    {
                      title: 'Level Up',
                      description: 'Reach higher tiers for bigger rewards and bonuses',
                      icon: <RiseOutlined style={{ fontSize: 24, color: '#faad14' }} />,
                    },
                  ]}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={item.icon}
                        title={item.title}
                        description={item.description}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>

            {/* Referrals Table */}
            <Col xs={24}>
              <Card
                title={<><TeamOutlined /> Your Referrals</>}
                extra={
                  <Button type="primary" icon={<SendOutlined />} onClick={() => setInviteModalVisible(true)}>
                    Invite Friends
                  </Button>
                }
              >
                <Table
                  columns={referralColumns}
                  dataSource={referrals}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* Leaderboard Tab */}
        <TabPane
          tab={<span><TrophyOutlined /> Leaderboard</span>}
          key="leaderboard"
        >
          <Row gutter={[24, 24]}>
            <Col xs={24}>
              <Card title={<><TrophyOutlined /> Top Referrers</>}>
                <Table
                  columns={leaderboardColumns}
                  dataSource={mockLeaderboard}
                  rowKey="rank"
                  pagination={false}
                  rowClassName={(record) => record.username === user.username ? 'highlighted-row' : ''}
                />
              </Card>
            </Col>

            {/* Your Rank */}
            <Col xs={24} md={12}>
              <Card>
                <Statistic
                  title="Your Current Rank"
                  value={6}
                  prefix={<TrophyOutlined />}
                  suffix="/ 1,234 users"
                  valueStyle={{ color: '#1890ff', fontSize: 48 }}
                />
                <Progress
                  percent={75}
                  strokeColor="#1890ff"
                  format={() => 'Top 1%'}
                  style={{ marginTop: 16 }}
                />
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card>
                <Statistic
                  title="This Month's Referrals"
                  value={3}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#52c41a', fontSize: 48 }}
                />
                <Alert
                  message="Great progress!"
                  description="You're 2 referrals away from reaching the monthly bonus."
                  type="success"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* Rewards Tab */}
        <TabPane
          tab={<span><GiftOutlined /> Rewards</span>}
          key="rewards"
        >
          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="Available Balance"
                  value={user.totalRewards - 200}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#52c41a', fontSize: 36 }}
                />
                <Button type="primary" block style={{ marginTop: 16 }}>
                  Withdraw Rewards
                </Button>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="Pending Rewards"
                  value={user.pendingRewards}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#faad14', fontSize: 36 }}
                />
                <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                  Processing within 24-48 hours
                </Text>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title="Lifetime Earnings"
                  value={user.totalRewards}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#722ed1', fontSize: 36 }}
                />
                <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                  Since {user.joinedAt}
                </Text>
              </Card>
            </Col>

            {/* Reward History */}
            <Col xs={24}>
              <Card title="Reward History">
                <Table
                  columns={[
                    { title: 'Date', dataIndex: 'date', key: 'date' },
                    { title: 'Type', dataIndex: 'type', key: 'type', render: (t) => <Tag color="blue">{t}</Tag> },
                    { title: 'Description', dataIndex: 'description', key: 'description' },
                    {
                      title: 'Amount',
                      dataIndex: 'amount',
                      key: 'amount',
                      render: (a) => <Text style={{ color: a > 0 ? '#52c41a' : '#ff4d4f' }}>{a > 0 ? '+' : ''}{a}</Text>
                    },
                    {
                      title: 'Status',
                      dataIndex: 'status',
                      key: 'status',
                      render: (s) => <Tag color={s === 'completed' ? 'green' : 'orange'}>{s}</Tag>
                    },
                  ]}
                  dataSource={[
                    { key: '1', date: '2025-12-10', type: 'Referral', description: 'bob.jones signup bonus', amount: 200, status: 'completed' },
                    { key: '2', date: '2025-12-05', type: 'Tier Bonus', description: 'Gold tier achievement', amount: 500, status: 'completed' },
                    { key: '3', date: '2025-11-28', type: 'Referral', description: 'carol.white signup bonus', amount: 200, status: 'pending' },
                    { key: '4', date: '2025-11-15', type: 'Withdrawal', description: 'Bank transfer', amount: -500, status: 'completed' },
                  ]}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {/* Invite Modal */}
      <Modal
        title="Invite a Friend"
        open={inviteModalVisible}
        onCancel={() => setInviteModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setInviteModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="send" type="primary" icon={<SendOutlined />} onClick={handleSendInvite}>
            Send Invitation
          </Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="Friend's Email Address">
            <Input
              placeholder="Enter email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              prefix={<MailOutlined />}
            />
          </Form.Item>
          <Alert
            message="Your friend will receive:"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>100 bonus tokens on signup</li>
                <li>Your referral code pre-filled</li>
                <li>Getting started guide</li>
              </ul>
            }
            type="info"
            showIcon
          />
        </Form>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        title="Edit Profile"
        open={editProfileVisible}
        onCancel={() => setEditProfileVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setEditProfileVisible(false)}>
            Cancel
          </Button>,
          <Button key="save" type="primary" onClick={() => {
            message.success('Profile updated successfully!');
            setEditProfileVisible(false);
          }}>
            Save Changes
          </Button>,
        ]}
      >
        <Form layout="vertical" initialValues={user}>
          <Form.Item label="Full Name" name="fullName">
            <Input />
          </Form.Item>
          <Form.Item label="Username" name="username">
            <Input prefix="@" />
          </Form.Item>
          <Form.Item label="Email" name="email">
            <Input type="email" />
          </Form.Item>
          <Form.Item label="Wallet Address" name="walletAddress">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        .highlighted-row {
          background-color: #e6f7ff !important;
        }
        .highlighted-row:hover td {
          background-color: #bae7ff !important;
        }
      `}</style>
    </div>
  );
};

export default UserReferralProgram;
