/**
 * TopologyGraph.jsx - D3.js Force-Directed Graph Component
 *
 * Sprint 10-11 Implementation (AV11-605-01)
 * React 18 + D3.js v7 Force-Directed Graph for Token Topology
 *
 * Features:
 * - Interactive force simulation with physics
 * - Zoom/Pan/Drag support via D3 behaviors
 * - Node type filtering and highlighting
 * - Edge visualization with labels
 * - Performance optimized for 500+ nodes
 * - Export to PNG functionality
 *
 * @author J4C Development Agent
 * @version 12.2.0
 * @since AV11-605-01
 */

const TopologyGraph = React.forwardRef(function TopologyGraph(props, ref) {
  const {
    data,
    nodeTypes,
    edgeTypes,
    selectedNode,
    highlightedNodes = [],
    showLabels = true,
    onNodeSelect
  } = props;

  const { useEffect, useRef, useCallback, useImperativeHandle } = React;

  // Refs for D3 elements
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const zoomRef = useRef(null);
  const transformRef = useRef(d3.zoomIdentity);

  // Configuration constants
  const CONFIG = {
    simulation: {
      alphaDecay: 0.02,
      velocityDecay: 0.4,
      forceStrength: {
        link: 0.3,
        charge: -400,
        collision: 1.5,
        center: 0.1
      }
    },
    zoom: {
      min: 0.1,
      max: 4
    },
    animation: {
      duration: 300
    }
  };

  // Initialize the graph
  useEffect(() => {
    if (!containerRef.current || !data) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Clear previous SVG
    d3.select(container).select('svg').remove();

    // Create SVG with zoom container
    const svg = d3.select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto;');

    svgRef.current = svg;

    // Add gradient definitions for enhanced visuals
    const defs = svg.append('defs');

    // Add node gradients for each type
    Object.entries(nodeTypes).forEach(([type, config]) => {
      const gradient = defs.append('radialGradient')
        .attr('id', `gradient-${type}`)
        .attr('cx', '30%')
        .attr('cy', '30%');

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', d3.color(config.color).brighter(0.5));

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', config.color);
    });

    // Add glow filter
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    filter.append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Add arrow markers for directed edges
    Object.entries(edgeTypes).forEach(([type, config]) => {
      defs.append('marker')
        .attr('id', `arrow-${type}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 20)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('fill', config.color)
        .attr('d', 'M0,-5L10,0L0,5');
    });

    // Create main group for zoom
    const g = svg.append('g').attr('class', 'main-group');

    // Setup zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([CONFIG.zoom.min, CONFIG.zoom.max])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        transformRef.current = event.transform;
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    // Process data - create copies to avoid mutation
    const nodes = data.nodes.map(n => ({ ...n }));
    const links = data.links.map(l => ({
      ...l,
      source: typeof l.source === 'object' ? l.source.id : l.source,
      target: typeof l.target === 'object' ? l.target.id : l.target
    }));

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links)
        .id(d => d.id)
        .distance(100)
        .strength(CONFIG.simulation.forceStrength.link))
      .force('charge', d3.forceManyBody()
        .strength(CONFIG.simulation.forceStrength.charge))
      .force('collision', d3.forceCollide()
        .radius(d => getNodeRadius(d) + 10)
        .strength(CONFIG.simulation.forceStrength.collision))
      .force('center', d3.forceCenter(width / 2, height / 2)
        .strength(CONFIG.simulation.forceStrength.center))
      .force('x', d3.forceX(width / 2).strength(0.05))
      .force('y', d3.forceY(height / 2).strength(0.05))
      .alphaDecay(CONFIG.simulation.alphaDecay)
      .velocityDecay(CONFIG.simulation.velocityDecay);

    simulationRef.current = simulation;

    // Create edge group
    const linkGroup = g.append('g').attr('class', 'links');

    // Create edges
    const link = linkGroup.selectAll('g')
      .data(links)
      .join('g')
      .attr('class', 'link-group');

    // Edge paths
    const linkPath = link.append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', d => edgeTypes[d.type]?.color || '#6B7280')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', d => {
        const style = edgeTypes[d.type]?.style;
        if (style === 'dashed') return '5,5';
        if (style === 'dotted') return '2,2';
        return 'none';
      })
      .attr('marker-end', d => `url(#arrow-${d.type})`);

    // Edge labels (optional)
    if (showLabels) {
      link.append('text')
        .attr('class', 'link-label')
        .attr('dy', -5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#94A3B8')
        .attr('font-size', 10)
        .text(d => edgeTypes[d.type]?.label || d.type);
    }

    // Create node group
    const nodeGroup = g.append('g').attr('class', 'nodes');

    // Create nodes
    const node = nodeGroup.selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'node-group')
      .style('cursor', 'pointer')
      .call(drag(simulation));

    // Node shapes based on type
    node.each(function(d) {
      const nodeEl = d3.select(this);
      const typeConfig = nodeTypes[d.group] || { color: '#6B7280', size: 25, shape: 'circle' };
      const radius = typeConfig.size / 2;

      // Draw shape based on type
      switch (typeConfig.shape) {
        case 'hexagon':
          nodeEl.append('polygon')
            .attr('points', getHexagonPoints(radius))
            .attr('fill', `url(#gradient-${d.group})`)
            .attr('stroke', d.verified ? '#10B981' : '#374151')
            .attr('stroke-width', d.verified ? 3 : 1);
          break;

        case 'diamond':
          nodeEl.append('polygon')
            .attr('points', getDiamondPoints(radius))
            .attr('fill', `url(#gradient-${d.group})`)
            .attr('stroke', d.verified ? '#10B981' : '#374151')
            .attr('stroke-width', d.verified ? 3 : 1);
          break;

        case 'square':
        case 'rect':
          nodeEl.append('rect')
            .attr('x', -radius)
            .attr('y', -radius)
            .attr('width', radius * 2)
            .attr('height', radius * 2)
            .attr('rx', 4)
            .attr('fill', `url(#gradient-${d.group})`)
            .attr('stroke', d.verified ? '#10B981' : '#374151')
            .attr('stroke-width', d.verified ? 3 : 1);
          break;

        case 'triangle':
          nodeEl.append('polygon')
            .attr('points', getTrianglePoints(radius))
            .attr('fill', `url(#gradient-${d.group})`)
            .attr('stroke', d.verified ? '#10B981' : '#374151')
            .attr('stroke-width', d.verified ? 3 : 1);
          break;

        case 'star':
          nodeEl.append('polygon')
            .attr('points', getStarPoints(radius, 5))
            .attr('fill', `url(#gradient-${d.group})`)
            .attr('stroke', d.verified ? '#10B981' : '#374151')
            .attr('stroke-width', d.verified ? 3 : 1);
          break;

        case 'ellipse':
          nodeEl.append('ellipse')
            .attr('rx', radius * 1.3)
            .attr('ry', radius * 0.8)
            .attr('fill', `url(#gradient-${d.group})`)
            .attr('stroke', d.verified ? '#10B981' : '#374151')
            .attr('stroke-width', d.verified ? 3 : 1);
          break;

        default: // circle
          nodeEl.append('circle')
            .attr('r', radius)
            .attr('fill', `url(#gradient-${d.group})`)
            .attr('stroke', d.verified ? '#10B981' : '#374151')
            .attr('stroke-width', d.verified ? 3 : 1);
      }

      // Add verification badge
      if (d.verified) {
        nodeEl.append('circle')
          .attr('cx', radius * 0.7)
          .attr('cy', -radius * 0.7)
          .attr('r', 6)
          .attr('fill', '#10B981')
          .attr('stroke', '#0F172A')
          .attr('stroke-width', 1);

        nodeEl.append('text')
          .attr('x', radius * 0.7)
          .attr('y', -radius * 0.7)
          .attr('dy', 3)
          .attr('text-anchor', 'middle')
          .attr('fill', 'white')
          .attr('font-size', 8)
          .attr('font-weight', 'bold')
          .text('\u2713');
      }
    });

    // Node labels
    if (showLabels) {
      node.append('text')
        .attr('class', 'node-label')
        .attr('dy', d => (nodeTypes[d.group]?.size || 25) / 2 + 14)
        .attr('text-anchor', 'middle')
        .attr('fill', '#E2E8F0')
        .attr('font-size', 11)
        .attr('font-weight', 500)
        .text(d => truncateLabel(d.label, 15));
    }

    // Node hover effects
    node.on('mouseover', function(event, d) {
      const nodeEl = d3.select(this);

      // Apply glow effect
      nodeEl.select('circle, polygon, rect, ellipse')
        .attr('filter', 'url(#glow)');

      // Show tooltip
      showTooltip(event, d);
    })
    .on('mouseout', function(event, d) {
      const nodeEl = d3.select(this);

      // Remove glow effect
      nodeEl.select('circle, polygon, rect, ellipse')
        .attr('filter', null);

      // Hide tooltip
      hideTooltip();
    })
    .on('click', function(event, d) {
      event.stopPropagation();
      if (onNodeSelect) {
        onNodeSelect(d.id);
      }
    });

    // Update positions on simulation tick
    simulation.on('tick', () => {
      linkPath.attr('d', d => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        return `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`;
      });

      if (showLabels) {
        link.selectAll('text')
          .attr('x', d => (d.source.x + d.target.x) / 2)
          .attr('y', d => (d.source.y + d.target.y) / 2);
      }

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Initial animation
    simulation.alpha(1).restart();

    // Cleanup
    return () => {
      simulation.stop();
      hideTooltip();
    };
  }, [data, nodeTypes, edgeTypes, showLabels, onNodeSelect]);

  // Update highlighting when selected/highlighted nodes change
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const allHighlighted = highlightedNodes.length > 0
      ? new Set([...highlightedNodes, selectedNode].filter(Boolean))
      : new Set(selectedNode ? [selectedNode] : []);

    // Update node opacity
    svg.selectAll('.node-group')
      .transition()
      .duration(200)
      .style('opacity', d => {
        if (allHighlighted.size === 0) return 1;
        return allHighlighted.has(d.id) ? 1 : 0.3;
      });

    // Update link opacity
    svg.selectAll('.link-group')
      .transition()
      .duration(200)
      .style('opacity', d => {
        if (allHighlighted.size === 0) return 1;
        const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
        const targetId = typeof d.target === 'object' ? d.target.id : d.target;
        return allHighlighted.has(sourceId) || allHighlighted.has(targetId) ? 1 : 0.2;
      });

    // Highlight selected node
    svg.selectAll('.node-group')
      .select('circle, polygon, rect, ellipse')
      .transition()
      .duration(200)
      .attr('filter', d => selectedNode === d.id ? 'url(#glow)' : null);

  }, [selectedNode, highlightedNodes]);

  // Drag behavior
  function drag(simulation) {
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }

  // Shape generation helpers
  function getNodeRadius(d) {
    return (nodeTypes[d.group]?.size || 25) / 2;
  }

  function getHexagonPoints(radius) {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      points.push(`${radius * Math.cos(angle)},${radius * Math.sin(angle)}`);
    }
    return points.join(' ');
  }

  function getDiamondPoints(radius) {
    return `0,${-radius} ${radius},0 0,${radius} ${-radius},0`;
  }

  function getTrianglePoints(radius) {
    const height = radius * Math.sqrt(3);
    return `0,${-radius} ${radius},${radius * 0.6} ${-radius},${radius * 0.6}`;
  }

  function getStarPoints(radius, points) {
    const result = [];
    const innerRadius = radius * 0.4;
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? radius : innerRadius;
      const angle = (Math.PI / points) * i - Math.PI / 2;
      result.push(`${r * Math.cos(angle)},${r * Math.sin(angle)}`);
    }
    return result.join(' ');
  }

  function truncateLabel(label, maxLength) {
    if (!label) return '';
    return label.length > maxLength ? label.substring(0, maxLength) + '...' : label;
  }

  // Tooltip functions
  let tooltipDiv = null;

  function showTooltip(event, d) {
    if (!tooltipDiv) {
      tooltipDiv = d3.select('body')
        .append('div')
        .attr('class', 'topology-tooltip')
        .style('position', 'absolute')
        .style('padding', '10px 14px')
        .style('background', 'rgba(15, 23, 42, 0.95)')
        .style('border', '1px solid rgba(148, 163, 184, 0.2)')
        .style('border-radius', '8px')
        .style('color', '#E2E8F0')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('z-index', '1000')
        .style('box-shadow', '0 10px 25px rgba(0,0,0,0.3)')
        .style('opacity', 0);
    }

    const typeConfig = nodeTypes[d.group] || {};

    tooltipDiv.html(`
      <div style="font-weight: 600; margin-bottom: 4px; color: ${typeConfig.color || '#fff'}">
        ${typeConfig.label || d.group}
      </div>
      <div style="color: #94A3B8; margin-bottom: 4px">${d.label || d.id}</div>
      <div style="display: flex; gap: 8px; font-size: 11px">
        <span style="color: ${d.verified ? '#10B981' : '#EF4444'}">
          ${d.verified ? 'Verified' : 'Unverified'}
        </span>
        ${d.status ? `<span style="color: #6366F1">${d.status}</span>` : ''}
      </div>
    `)
    .style('left', (event.pageX + 15) + 'px')
    .style('top', (event.pageY - 10) + 'px')
    .transition()
    .duration(200)
    .style('opacity', 1);
  }

  function hideTooltip() {
    if (tooltipDiv) {
      tooltipDiv.transition()
        .duration(200)
        .style('opacity', 0);
    }
  }

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      if (svgRef.current && zoomRef.current) {
        svgRef.current.transition()
          .duration(CONFIG.animation.duration)
          .call(zoomRef.current.scaleBy, 1.3);
      }
    },
    zoomOut: () => {
      if (svgRef.current && zoomRef.current) {
        svgRef.current.transition()
          .duration(CONFIG.animation.duration)
          .call(zoomRef.current.scaleBy, 0.7);
      }
    },
    resetView: () => {
      if (svgRef.current && zoomRef.current) {
        svgRef.current.transition()
          .duration(CONFIG.animation.duration)
          .call(zoomRef.current.transform, d3.zoomIdentity);
      }
    },
    fitToScreen: () => {
      if (svgRef.current && zoomRef.current && containerRef.current && data?.nodes) {
        const container = containerRef.current;
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Calculate bounds
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        data.nodes.forEach(n => {
          if (n.x !== undefined) {
            minX = Math.min(minX, n.x);
            maxX = Math.max(maxX, n.x);
            minY = Math.min(minY, n.y);
            maxY = Math.max(maxY, n.y);
          }
        });

        if (minX === Infinity) return;

        const padding = 50;
        const graphWidth = maxX - minX + padding * 2;
        const graphHeight = maxY - minY + padding * 2;

        const scale = Math.min(
          width / graphWidth,
          height / graphHeight,
          1.5
        );

        const translateX = width / 2 - (minX + maxX) / 2 * scale;
        const translateY = height / 2 - (minY + maxY) / 2 * scale;

        svgRef.current.transition()
          .duration(CONFIG.animation.duration * 2)
          .call(
            zoomRef.current.transform,
            d3.zoomIdentity.translate(translateX, translateY).scale(scale)
          );
      }
    },
    exportAsPNG: () => {
      if (!svgRef.current) return;

      const svg = svgRef.current.node();
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);

      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width * 2;
        canvas.height = img.height * 2;
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Download
        const a = document.createElement('a');
        a.download = `topology-${Date.now()}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
    },
    getSimulation: () => simulationRef.current,
    reheat: () => {
      if (simulationRef.current) {
        simulationRef.current.alpha(0.5).restart();
      }
    }
  }), [data]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-slate-900/50"
      style={{ minHeight: '400px' }}
    />
  );
});

// Make available globally
window.TopologyGraph = TopologyGraph;
