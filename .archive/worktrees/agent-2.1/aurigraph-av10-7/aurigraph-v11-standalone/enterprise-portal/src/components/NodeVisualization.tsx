// Node Visualization Component - Interactive network topology view
import React, { useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Paper, Tooltip, Chip,
  Grid, Avatar, Stack
} from '@mui/material';
import {
  Circle as CircleIcon,
  Storage as ValidatorIcon,
  Business as BusinessIcon,
  Laptop as SlimIcon
} from '@mui/icons-material';

interface Node {
  id: string;
  name: string;
  type: 'VALIDATOR' | 'BUSINESS' | 'SLIM';
  endpoint: string;
  channelId: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

interface Channel {
  id: string;
  name: string;
  type: 'PUBLIC' | 'PRIVATE' | 'CONSORTIUM';
}

interface Props {
  validators: Node[];
  businessNodes: Node[];
  slimNodes: Node[];
  channels: Channel[];
}

type NodeType = 'VALIDATOR' | 'BUSINESS' | 'SLIM';

const NODE_COLORS = {
  VALIDATOR: '#1976d2',    // Blue
  BUSINESS: '#2e7d32',     // Green
  SLIM: '#ed6c02',         // Orange
} as const;

const NODE_ICONS = {
  VALIDATOR: ValidatorIcon,
  BUSINESS: BusinessIcon,
  SLIM: SlimIcon,
} as const;

export const NodeVisualization: React.FC<Props> = ({
  validators,
  businessNodes,
  slimNodes,
  channels,
}) => {
  // Combine all nodes for processing
  const allNodes = useMemo(() => [
    ...validators,
    ...businessNodes,
    ...slimNodes,
  ], [validators, businessNodes, slimNodes]);

  // Group nodes by channel
  const nodesByChannel = useMemo(() => {
    const grouped = new Map<string, Node[]>();

    channels.forEach(channel => {
      const channelNodes = allNodes.filter(node => node.channelId === channel.id);
      if (channelNodes.length > 0) {
        grouped.set(channel.id, channelNodes);
      }
    });

    return grouped;
  }, [allNodes, channels]);

  // Calculate statistics
  const stats = useMemo(() => ({
    totalNodes: allNodes.length,
    validators: validators.length,
    businessNodes: businessNodes.length,
    slimNodes: slimNodes.length,
    totalChannels: channels.length,
    activeChannels: nodesByChannel.size,
  }), [allNodes, validators, businessNodes, slimNodes, channels, nodesByChannel]);

  const getNodeColor = (type: NodeType) => NODE_COLORS[type];
  const getNodeIcon = (type: NodeType) => NODE_ICONS[type];

  const getChannelColor = (type: Channel['type']) => {
    switch (type) {
      case 'PUBLIC': return '#4caf50';      // Green
      case 'PRIVATE': return '#ff9800';     // Orange
      case 'CONSORTIUM': return '#9c27b0';  // Purple
      default: return '#757575';            // Grey
    }
  };

  return (
    <Box>
      {/* Legend */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom>Network Topology Legend</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Stack direction="row" spacing={1} alignItems="center">
              <ValidatorIcon sx={{ color: NODE_COLORS.VALIDATOR }} />
              <Box>
                <Typography variant="body2"><strong>Validators</strong></Typography>
                <Typography variant="caption" color="textSecondary">
                  Consensus nodes ({stats.validators})
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Stack direction="row" spacing={1} alignItems="center">
              <BusinessIcon sx={{ color: NODE_COLORS.BUSINESS }} />
              <Box>
                <Typography variant="body2"><strong>Business Nodes</strong></Typography>
                <Typography variant="caption" color="textSecondary">
                  Transaction processing ({stats.businessNodes})
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Stack direction="row" spacing={1} alignItems="center">
              <SlimIcon sx={{ color: NODE_COLORS.SLIM }} />
              <Box>
                <Typography variant="body2"><strong>Slim Nodes</strong></Typography>
                <Typography variant="caption" color="textSecondary">
                  Lightweight clients ({stats.slimNodes})
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="body2"><strong>Total Network</strong></Typography>
              <Typography variant="caption" color="textSecondary">
                {stats.totalNodes} nodes across {stats.activeChannels} channels
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" variant="body2">Validators</Typography>
                  <Typography variant="h3" sx={{ color: NODE_COLORS.VALIDATOR }}>
                    {stats.validators}
                  </Typography>
                </Box>
                <ValidatorIcon sx={{ fontSize: 48, color: NODE_COLORS.VALIDATOR, opacity: 0.3 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" variant="body2">Business Nodes</Typography>
                  <Typography variant="h3" sx={{ color: NODE_COLORS.BUSINESS }}>
                    {stats.businessNodes}
                  </Typography>
                </Box>
                <BusinessIcon sx={{ fontSize: 48, color: NODE_COLORS.BUSINESS, opacity: 0.3 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" variant="body2">Slim Nodes</Typography>
                  <Typography variant="h3" sx={{ color: NODE_COLORS.SLIM }}>
                    {stats.slimNodes}
                  </Typography>
                </Box>
                <SlimIcon sx={{ fontSize: 48, color: NODE_COLORS.SLIM, opacity: 0.3 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Channel-based Node Visualization */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Network Topology by Channel
      </Typography>

      {channels.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="textSecondary">
            No channels configured. Create channels to visualize network topology.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {channels.map((channel) => {
            const channelNodes = nodesByChannel.get(channel.id) || [];
            const channelValidators = channelNodes.filter(n => n.type === 'VALIDATOR');
            const channelBusiness = channelNodes.filter(n => n.type === 'BUSINESS');
            const channelSlim = channelNodes.filter(n => n.type === 'SLIM');

            return (
              <Grid item xs={12} key={channel.id}>
                <Card sx={{ borderLeft: 4, borderColor: getChannelColor(channel.type) }}>
                  <CardContent>
                    {/* Channel Header */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Box>
                        <Typography variant="h6">{channel.name}</Typography>
                        <Stack direction="row" spacing={1} mt={1}>
                          <Chip
                            label={channel.type}
                            size="small"
                            sx={{
                              bgcolor: getChannelColor(channel.type),
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          />
                          <Chip
                            label={`${channelNodes.length} nodes`}
                            size="small"
                            variant="outlined"
                          />
                        </Stack>
                      </Box>
                    </Box>

                    {/* Node Grid Visualization */}
                    {channelNodes.length === 0 ? (
                      <Typography variant="body2" color="textSecondary" sx={{ py: 2 }}>
                        No nodes assigned to this channel yet.
                      </Typography>
                    ) : (
                      <Box>
                        {/* Validators Section */}
                        {channelValidators.length > 0 && (
                          <Box mb={2}>
                            <Typography variant="subtitle2" gutterBottom sx={{ color: NODE_COLORS.VALIDATOR }}>
                              Validators ({channelValidators.length})
                            </Typography>
                            <Grid container spacing={1}>
                              {channelValidators.map((node) => (
                                <Grid item key={node.id}>
                                  <NodeCard node={node} />
                                </Grid>
                              ))}
                            </Grid>
                          </Box>
                        )}

                        {/* Business Nodes Section */}
                        {channelBusiness.length > 0 && (
                          <Box mb={2}>
                            <Typography variant="subtitle2" gutterBottom sx={{ color: NODE_COLORS.BUSINESS }}>
                              Business Nodes ({channelBusiness.length})
                            </Typography>
                            <Grid container spacing={1}>
                              {channelBusiness.map((node) => (
                                <Grid item key={node.id}>
                                  <NodeCard node={node} />
                                </Grid>
                              ))}
                            </Grid>
                          </Box>
                        )}

                        {/* Slim Nodes Section */}
                        {channelSlim.length > 0 && (
                          <Box>
                            <Typography variant="subtitle2" gutterBottom sx={{ color: NODE_COLORS.SLIM }}>
                              Slim Nodes ({channelSlim.length})
                            </Typography>
                            <Grid container spacing={1}>
                              {channelSlim.map((node) => (
                                <Grid item key={node.id}>
                                  <NodeCard node={node} />
                                </Grid>
                              ))}
                            </Grid>
                          </Box>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* SVG Network Diagram (Simplified) */}
      {allNodes.length > 0 && (
        <Box mt={4}>
          <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
            Network Connection Diagram
          </Typography>
          <Paper sx={{ p: 2, bgcolor: 'grey.50', overflow: 'auto' }}>
            <svg width="100%" height="400" viewBox="0 0 1200 400">
              {/* Draw channel groups */}
              {channels.map((channel, channelIndex) => {
                const channelNodes = nodesByChannel.get(channel.id) || [];
                const channelX = 100 + (channelIndex * 300);
                const channelY = 50;

                return (
                  <g key={channel.id}>
                    {/* Channel container */}
                    <rect
                      x={channelX - 80}
                      y={channelY - 30}
                      width={160}
                      height={340}
                      fill={getChannelColor(channel.type)}
                      opacity={0.1}
                      stroke={getChannelColor(channel.type)}
                      strokeWidth={2}
                      rx={8}
                    />

                    {/* Channel label */}
                    <text
                      x={channelX}
                      y={channelY - 10}
                      textAnchor="middle"
                      fontSize="14"
                      fontWeight="bold"
                      fill={getChannelColor(channel.type)}
                    >
                      {channel.name}
                    </text>

                    {/* Draw nodes */}
                    {channelNodes.map((node, nodeIndex) => {
                      const nodeY = channelY + 40 + (nodeIndex * 50);
                      const nodeColor = getNodeColor(node.type);

                      return (
                        <g key={node.id}>
                          {/* Connection line to channel */}
                          <line
                            x1={channelX}
                            y1={channelY + 10}
                            x2={channelX}
                            y2={nodeY - 15}
                            stroke={nodeColor}
                            strokeWidth={1}
                            opacity={0.3}
                          />

                          {/* Node circle */}
                          <circle
                            cx={channelX}
                            cy={nodeY}
                            r={12}
                            fill={nodeColor}
                            stroke="white"
                            strokeWidth={2}
                          />

                          {/* Node label */}
                          <text
                            x={channelX + 20}
                            y={nodeY + 4}
                            fontSize="10"
                            fill="#333"
                          >
                            {node.name}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              })}

              {/* Legend in SVG */}
              <g transform="translate(20, 360)">
                <circle cx={10} cy={10} r={6} fill={NODE_COLORS.VALIDATOR} />
                <text x={20} y={14} fontSize="10">Validator</text>

                <circle cx={100} cy={10} r={6} fill={NODE_COLORS.BUSINESS} />
                <text x={110} y={14} fontSize="10">Business</text>

                <circle cx={190} cy={10} r={6} fill={NODE_COLORS.SLIM} />
                <text x={200} y={14} fontSize="10">Slim</text>
              </g>
            </svg>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

// Individual Node Card Component
const NodeCard: React.FC<{ node: Node }> = ({ node }) => {
  const nodeColor = NODE_COLORS[node.type];
  const NodeIcon = NODE_ICONS[node.type];

  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="body2"><strong>{node.name}</strong></Typography>
          <Typography variant="caption">Type: {node.type}</Typography><br />
          <Typography variant="caption">Endpoint: {node.endpoint}</Typography><br />
          <Typography variant="caption">Status: {node.status || 'ACTIVE'}</Typography>
        </Box>
      }
      arrow
      placement="top"
    >
      <Paper
        sx={{
          p: 1.5,
          minWidth: 120,
          cursor: 'pointer',
          borderLeft: 3,
          borderColor: nodeColor,
          transition: 'all 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 3,
            bgcolor: 'grey.50',
          },
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Avatar sx={{ bgcolor: nodeColor, width: 32, height: 32 }}>
            <NodeIcon fontSize="small" />
          </Avatar>
          <Box flex={1}>
            <Typography variant="body2" fontWeight="bold" noWrap>
              {node.name}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {node.type}
            </Typography>
          </Box>
          <CircleIcon
            sx={{
              fontSize: 12,
              color: node.status === 'INACTIVE' ? 'error.main' : 'success.main'
            }}
          />
        </Stack>
      </Paper>
    </Tooltip>
  );
};
