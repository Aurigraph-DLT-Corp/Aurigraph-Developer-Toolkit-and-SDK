/**
 * PipelineView Component
 *
 * Sales pipeline Kanban-style visualization
 * Features:
 * - Multi-stage pipeline display (Discovery → Closed Won/Lost)
 * - Drag-and-drop opportunity movement (future enhancement)
 * - Weighted revenue forecasting
 * - Win rate analytics
 * - At-risk opportunity highlighting
 * - Stage transition tracking
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
} from '@mui/material';
import { OpportunityStage, Opportunity } from '../../services/CrmService';

// Mock data for demonstration
const mockOpportunities: Opportunity[] = [
  {
    id: '1',
    leadId: 'lead-1',
    name: 'TechCorp Platform Implementation',
    description: 'Enterprise blockchain platform implementation',
    ownedByUserId: 'user-1',
    stage: OpportunityStage.DISCOVERY,
    estimatedValue: 250000,
    actualValue: null,
    currency: 'USD',
    probabilityPercent: 20,
    expectedCloseDate: '2025-03-15',
    actualCloseDate: null,
    competingVendors: 'Hyperledger Fabric, Corda',
    competitiveAdvantage: 'Superior throughput and quantum cryptography',
    atRisk: false,
    atRiskReason: null,
    riskProbabilityPercent: 0,
    isExpansion: false,
    parentOpportunityId: null,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-05',
  },
  {
    id: '2',
    leadId: 'lead-2',
    name: 'FinanceCorp Token Platform',
    description: 'Digital asset tokenization platform',
    ownedByUserId: 'user-1',
    stage: OpportunityStage.SOLUTION_DESIGN,
    estimatedValue: 500000,
    actualValue: null,
    currency: 'USD',
    probabilityPercent: 50,
    expectedCloseDate: '2025-04-30',
    actualCloseDate: null,
    competingVendors: 'Polygon, Avalanche',
    competitiveAdvantage: 'Real-world asset support, GDPR compliance',
    atRisk: true,
    atRiskReason: 'Waiting on compliance review',
    riskProbabilityPercent: 30,
    isExpansion: false,
    parentOpportunityId: null,
    createdAt: '2025-01-02',
    updatedAt: '2025-01-10',
  },
  {
    id: '3',
    leadId: 'lead-3',
    name: 'EnergyCorp Cross-Chain Bridge',
    description: 'Cross-chain liquidity bridge implementation',
    ownedByUserId: 'user-2',
    stage: OpportunityStage.PROPOSAL,
    estimatedValue: 350000,
    actualValue: null,
    currency: 'USD',
    probabilityPercent: 70,
    expectedCloseDate: '2025-03-01',
    actualCloseDate: null,
    competingVendors: 'Wormhole, Stargate',
    competitiveAdvantage: 'Quantum-resistant cross-chain design',
    atRisk: false,
    atRiskReason: null,
    riskProbabilityPercent: 0,
    isExpansion: false,
    parentOpportunityId: null,
    createdAt: '2025-01-03',
    updatedAt: '2025-01-08',
  },
  {
    id: '4',
    leadId: 'lead-4',
    name: 'HealthcareCorp Tokenization',
    description: 'Healthcare provider tokenization',
    ownedByUserId: 'user-2',
    stage: OpportunityStage.CLOSED_WON,
    estimatedValue: 200000,
    actualValue: 200000,
    currency: 'USD',
    probabilityPercent: 100,
    expectedCloseDate: '2025-02-15',
    actualCloseDate: '2025-02-10',
    competingVendors: null,
    competitiveAdvantage: 'Won with superior security model',
    atRisk: false,
    atRiskReason: null,
    riskProbabilityPercent: 0,
    isExpansion: false,
    parentOpportunityId: null,
    createdAt: '2024-12-01',
    updatedAt: '2025-02-10',
  },
];

const pipelineStages = [
  { stage: OpportunityStage.DISCOVERY, label: 'Discovery', color: '#e3f2fd' },
  { stage: OpportunityStage.ASSESSMENT, label: 'Assessment', color: '#f3e5f5' },
  { stage: OpportunityStage.SOLUTION_DESIGN, label: 'Solution Design', color: '#fff3e0' },
  { stage: OpportunityStage.PROPOSAL, label: 'Proposal', color: '#f1f8e9' },
  { stage: OpportunityStage.NEGOTIATION, label: 'Negotiation', color: '#fce4ec' },
  { stage: OpportunityStage.CLOSED_WON, label: 'Won', color: '#c8e6c9' },
  { stage: OpportunityStage.CLOSED_LOST, label: 'Lost', color: '#ffcdd2' },
];

interface PipelineStageProps {
  stage: OpportunityStage;
  label: string;
  color: string;
  opportunities: Opportunity[];
}

const PipelineColumn: React.FC<PipelineStageProps> = ({
  stage,
  label,
  color,
  opportunities,
}) => {
  const stageOpportunities = opportunities.filter((opp) => opp.stage === stage);
  const totalValue = stageOpportunities.reduce((sum, opp) => {
    const weight = opp.probabilityPercent || 0;
    const value = (opp.estimatedValue || opp.actualValue || 0) * (weight / 100);
    return sum + value;
  }, 0);

  return (
    <Box
      sx={{
        bgcolor: color,
        borderRadius: 1,
        p: 2,
        minHeight: 600,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        {label}
      </Typography>
      <Typography variant="caption" color="textSecondary" sx={{ mb: 2 }}>
        {stageOpportunities.length} opportunities
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>
        ${(totalValue / 1000).toFixed(0)}K
      </Typography>

      <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
        {stageOpportunities.map((opp) => (
          <Card
            key={opp.id}
            sx={{
              mb: 1,
              boxShadow: opp.atRisk ? '0 0 0 2px #f44336' : 'default',
              cursor: 'pointer',
              '&:hover': { boxShadow: 2 },
            }}
          >
            <CardContent sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                  {opp.name}
                </Typography>
                {opp.atRisk && (
                  <Chip label="At Risk" size="small" color="error" variant="outlined" />
                )}
              </Box>

              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
                {opp.currency} {opp.estimatedValue?.toLocaleString() || opp.actualValue?.toLocaleString()}
              </Typography>

              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption">Probability</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {opp.probabilityPercent}%
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={opp.probabilityPercent} />
              </Box>

              <Typography variant="caption" color="textSecondary">
                Expected: {new Date(opp.expectedCloseDate || '').toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

const PipelineView: React.FC = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(mockOpportunities);
  const [loading, setLoading] = useState(false);

  // Calculate pipeline metrics
  const openOpps = opportunities.filter(
    (opp) => opp.stage !== OpportunityStage.CLOSED_WON && opp.stage !== OpportunityStage.CLOSED_LOST
  );

  const totalPipelineValue = openOpps.reduce((sum, opp) => {
    const weight = opp.probabilityPercent || 0;
    const value = (opp.estimatedValue || 0) * (weight / 100);
    return sum + value;
  }, 0);

  const wonValue = opportunities
    .filter((opp) => opp.stage === OpportunityStage.CLOSED_WON)
    .reduce((sum, opp) => sum + (opp.actualValue || 0), 0);

  const lostCount = opportunities.filter((opp) => opp.stage === OpportunityStage.CLOSED_LOST).length;
  const wonCount = opportunities.filter((opp) => opp.stage === OpportunityStage.CLOSED_WON).length;
  const winRate = wonCount + lostCount > 0 ? (wonCount / (wonCount + lostCount)) * 100 : 0;

  const atRiskCount = opportunities.filter((opp) => opp.atRisk).length;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Metrics Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography color="textSecondary" variant="caption">
              Total Pipeline Value
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#667eea' }}>
              ${(totalPipelineValue / 1000).toFixed(0)}K
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography color="textSecondary" variant="caption">
              Won This Year
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#4caf50' }}>
              ${(wonValue / 1000).toFixed(0)}K
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography color="textSecondary" variant="caption">
              Win Rate
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#2196f3' }}>
              {winRate.toFixed(0)}%
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography color="textSecondary" variant="caption">
              At-Risk Deals
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#f44336' }}>
              {atRiskCount}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Pipeline Kanban */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          Sales Pipeline
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {pipelineStages.map((col) => (
              <Grid item xs={12} sm={6} md={4} lg={12 / 7} key={col.stage}>
                <PipelineColumn
                  stage={col.stage}
                  label={col.label}
                  color={col.color}
                  opportunities={opportunities}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* At-Risk Alert */}
      {atRiskCount > 0 && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="body2">
            {atRiskCount} opportunity(ies) flagged as at-risk. Review and take recovery actions.
          </Typography>
        </Alert>
      )}
    </Container>
  );
};

export default PipelineView;
