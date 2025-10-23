// Live Animated Merkle Tree Visualization
// Shows real-time Merkle tree growth with transactions

import React, { useState, useEffect, useRef } from 'react';
import { Box, Card, CardContent, Typography, Chip, Alert, alpha } from '@mui/material';
import { AccountTree, CheckCircle, Add, TrendingUp } from '@mui/icons-material';
import { colors, animations, glassStyles } from '../styles/v0-theme';

interface MerkleNode {
  hash: string;
  level: number;
  index: number;
  children?: [MerkleNode, MerkleNode];
  isNew?: boolean;
  timestamp: number;
}

interface Props {
  demoId: string;
  transactionCount: number;
  merkleRoot: string;
}

export const LiveMerkleTreeViz: React.FC<Props> = ({ demoId, transactionCount, merkleRoot }) => {
  const [nodes, setNodes] = useState<MerkleNode[]>([]);
  const [animatingNodes, setAnimatingNodes] = useState<Set<string>>(new Set());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [treeHeight, setTreeHeight] = useState(0);
  const [leafCount, setLeafCount] = useState(0);

  // Build Merkle tree from transaction count
  useEffect(() => {
    const buildMerkleTree = () => {
      if (transactionCount === 0) return [];

      const leaves: MerkleNode[] = [];
      const height = Math.ceil(Math.log2(transactionCount)) + 1;

      // Create leaf nodes (transactions)
      for (let i = 0; i < transactionCount; i++) {
        const leafHash = `tx_${i.toString(16).padStart(8, '0')}`;
        leaves.push({
          hash: leafHash.substring(0, 12),
          level: 0,
          index: i,
          timestamp: Date.now() - (transactionCount - i) * 1000,
          isNew: i === transactionCount - 1, // Mark latest as new
        });
      }

      // Build tree bottom-up
      const allNodes: MerkleNode[] = [...leaves];
      let currentLevel = leaves;
      let level = 1;

      while (currentLevel.length > 1) {
        const nextLevel: MerkleNode[] = [];

        for (let i = 0; i < currentLevel.length; i += 2) {
          const left = currentLevel[i];
          const right = currentLevel[i + 1] || left; // Duplicate if odd

          const parentHash = `${left.hash.substring(0, 4)}${right.hash.substring(0, 4)}`;
          const parent: MerkleNode = {
            hash: parentHash,
            level,
            index: Math.floor(i / 2),
            children: [left, right],
            timestamp: Math.max(left.timestamp, right.timestamp),
            isNew: left.isNew || right.isNew,
          };

          nextLevel.push(parent);
          allNodes.push(parent);
        }

        currentLevel = nextLevel;
        level++;
      }

      setTreeHeight(height);
      setLeafCount(transactionCount);
      return allNodes;
    };

    const newNodes = buildMerkleTree();
    setNodes(newNodes);

    // Animate new nodes
    if (transactionCount > 0) {
      const newNodeHash = newNodes.find(n => n.isNew)?.hash;
      if (newNodeHash) {
        setAnimatingNodes(prev => new Set([...prev, newNodeHash]));
        setTimeout(() => {
          setAnimatingNodes(prev => {
            const next = new Set(prev);
            next.delete(newNodeHash);
            return next;
          });
        }, 2000);
      }
    }
  }, [transactionCount]);

  // Draw tree on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate layout
    const levelHeight = height / (treeHeight + 1);
    const maxNodesInLevel = Math.pow(2, treeHeight - 1);

    // Draw connections first
    nodes.forEach(node => {
      if (node.children) {
        const [left, right] = node.children;

        const parentX = width / 2 + (node.index - maxNodesInLevel / Math.pow(2, node.level + 1)) *
                        (width / maxNodesInLevel) * Math.pow(2, node.level);
        const parentY = height - node.level * levelHeight - 30;

        const leftX = width / 2 + (left.index - maxNodesInLevel / Math.pow(2, left.level + 1)) *
                      (width / maxNodesInLevel) * Math.pow(2, left.level);
        const leftY = height - left.level * levelHeight - 30;

        const rightX = width / 2 + (right.index - maxNodesInLevel / Math.pow(2, right.level + 1)) *
                       (width / maxNodesInLevel) * Math.pow(2, right.level);
        const rightY = height - right.level * levelHeight - 30;

        // Draw lines
        ctx.strokeStyle = node.isNew ? colors.brand.primary : alpha(colors.brand.secondary, 0.3);
        ctx.lineWidth = node.isNew ? 3 : 1;
        ctx.beginPath();
        ctx.moveTo(parentX, parentY);
        ctx.lineTo(leftX, leftY);
        ctx.stroke();

        if (left !== right) {
          ctx.beginPath();
          ctx.moveTo(parentX, parentY);
          ctx.lineTo(rightX, rightY);
          ctx.stroke();
        }
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const x = width / 2 + (node.index - maxNodesInLevel / Math.pow(2, node.level + 1)) *
                (width / maxNodesInLevel) * Math.pow(2, node.level);
      const y = height - node.level * levelHeight - 30;

      const isAnimating = animatingNodes.has(node.hash);
      const radius = isAnimating ? 12 : 8;

      // Draw node circle
      ctx.fillStyle = node.level === 0 ? colors.brand.secondary :
                     node.level === treeHeight - 1 ? colors.brand.primary :
                     alpha(colors.brand.accent, 0.7);

      if (isAnimating) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = colors.brand.primary;
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw hash text for top levels
      if (node.level >= treeHeight - 2) {
        ctx.fillStyle = colors.dark.textPrimary;
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(node.hash, x, y + 25);
      }
    });

  }, [nodes, animatingNodes, treeHeight]);

  return (
    <Card sx={{ ...glassStyles.card, border: `1px solid ${alpha(colors.brand.primary, 0.2)}` }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountTree sx={{ color: colors.brand.primary }} />
            Live Merkle Tree Visualization
          </Typography>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              icon={<TrendingUp />}
              label={`Height: ${treeHeight}`}
              size="small"
              sx={{
                background: alpha(colors.brand.secondary, 0.2),
                color: colors.brand.secondary,
              }}
            />
            <Chip
              icon={<Add />}
              label={`Leaves: ${leafCount}`}
              size="small"
              sx={{
                background: alpha(colors.brand.primary, 0.2),
                color: colors.brand.primary,
              }}
            />
          </Box>
        </Box>

        {/* Alert for new transactions */}
        {transactionCount > 0 && nodes.some(n => n.isNew) && (
          <Alert
            severity="success"
            icon={<CheckCircle />}
            sx={{ mb: 2, ...animations.slideUp }}
          >
            New transaction added! Tree updated with latest hash.
          </Alert>
        )}

        {/* Canvas for tree visualization */}
        <Box sx={{
          position: 'relative',
          width: '100%',
          height: 400,
          background: alpha(colors.dark.bgDark, 0.5),
          borderRadius: 2,
          overflow: 'hidden',
          border: `1px solid ${alpha(colors.brand.primary, 0.1)}`,
        }}>
          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        </Box>

        {/* Merkle Root Display */}
        <Box sx={{ mt: 3, p: 2, background: alpha(colors.brand.primary, 0.1), borderRadius: 2 }}>
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            Current Merkle Root (SHA-256)
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontFamily: 'monospace',
              color: colors.brand.primary,
              fontWeight: 600,
              wordBreak: 'break-all',
            }}
          >
            {merkleRoot || 'No transactions yet'}
          </Typography>
        </Box>

        {/* Legend */}
        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: colors.brand.secondary
            }} />
            <Typography variant="caption" color="text.secondary">Leaf Nodes (Transactions)</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: alpha(colors.brand.accent, 0.7)
            }} />
            <Typography variant="caption" color="text.secondary">Intermediate Nodes</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: colors.brand.primary
            }} />
            <Typography variant="caption" color="text.secondary">Root Node</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
