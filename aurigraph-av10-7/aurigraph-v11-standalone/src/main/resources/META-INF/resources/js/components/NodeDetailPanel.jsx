/**
 * NodeDetailPanel.jsx - Node Detail Sidebar Component
 *
 * Sprint 10-11 Implementation (AV11-605-02)
 * Right sidebar panel for displaying detailed node information
 *
 * Features:
 * - Token properties display
 * - Compliance status indicators
 * - Connected nodes visualization
 * - Verification history
 * - Quick actions
 *
 * @author J4C Development Agent
 * @version 12.2.0
 * @since AV11-605-02
 */

function NodeDetailPanel({ node, nodeTypes, onClose }) {
  const { useState, useEffect, useMemo } = React;

  // Local state for expanded sections
  const [expandedSections, setExpandedSections] = useState({
    properties: true,
    connections: true,
    verification: false,
    data: false
  });

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Get node type configuration
  const typeConfig = useMemo(() => {
    if (!node?.type && !node?.group) return null;
    return nodeTypes[node.type || node.group] || {
      color: '#6B7280',
      label: node.type || node.group || 'Unknown',
      shape: 'circle'
    };
  }, [node, nodeTypes]);

  // Format property value for display
  const formatValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    if (typeof value === 'number') {
      if (value > 1000000) return (value / 1000000).toFixed(2) + 'M';
      if (value > 1000) return (value / 1000).toFixed(2) + 'K';
      return value.toLocaleString();
    }
    return String(value);
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    const statusMap = {
      'ACTIVE': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
      'VERIFIED': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
      'PENDING': { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
      'CREATED': { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
      'REJECTED': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
      'EXPIRED': { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' }
    };
    return statusMap[status] || { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' };
  };

  // Empty state
  if (!node) {
    return (
      <div className="glass p-6">
        <h3 className="text-lg font-bold mb-4">Node Details</h3>
        <div className="text-center py-8">
          <svg className="w-12 h-12 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-slate-400 text-sm">Click on a node to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50" style={{ background: `linear-gradient(135deg, ${typeConfig?.color}20, transparent)` }}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: typeConfig?.color + '30', border: `2px solid ${typeConfig?.color}` }}
            >
              <div
                className="w-4 h-4 rounded-sm"
                style={{ backgroundColor: typeConfig?.color }}
              />
            </div>
            <div>
              <h3 className="font-bold text-lg">{typeConfig?.label || 'Unknown Node'}</h3>
              <p className="text-xs text-slate-400 font-mono">{node.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-700 rounded-lg transition"
            title="Close panel"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Status Badges */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {node.verified !== undefined && (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              node.verified
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {node.verified ? (
                <>
                  <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified
                </>
              ) : (
                <>
                  <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Unverified
                </>
              )}
            </span>
          )}
          {node.status && (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
              getStatusBadge(node.status).bg
            } ${getStatusBadge(node.status).text} ${getStatusBadge(node.status).border}`}>
              {node.status}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="divide-y divide-slate-700/50 max-h-[500px] overflow-y-auto">
        {/* Properties Section */}
        <div className="p-4">
          <button
            onClick={() => toggleSection('properties')}
            className="w-full flex items-center justify-between text-left mb-3"
          >
            <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Properties
            </h4>
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              className={`transform transition-transform ${expandedSections.properties ? 'rotate-180' : ''}`}
            >
              <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {expandedSections.properties && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Label</span>
                <span className="text-slate-200 font-medium">{node.label || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Type</span>
                <span className="text-slate-200 font-medium">{node.type || node.group || 'Unknown'}</span>
              </div>
              {node.size && (
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Size</span>
                  <span className="text-slate-200 font-medium">{node.size}</span>
                </div>
              )}
              {node.color && (
                <div className="flex justify-between py-1.5 items-center">
                  <span className="text-slate-500">Color</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: node.color }}
                    />
                    <span className="text-slate-200 font-mono text-xs">{node.color}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Connections Section */}
        {(node.connectedEdges || node.edges || node.childCount) && (
          <div className="p-4">
            <button
              onClick={() => toggleSection('connections')}
              className="w-full flex items-center justify-between text-left mb-3"
            >
              <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Connections
                <span className="ml-auto mr-2 px-1.5 py-0.5 bg-slate-700 rounded text-xs">
                  {node.connectedEdges || (node.edges?.length) || 0}
                </span>
              </h4>
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                className={`transform transition-transform ${expandedSections.connections ? 'rotate-180' : ''}`}
              >
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {expandedSections.connections && node.edges && (
              <div className="space-y-2">
                {node.edges.map((edge, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg text-xs">
                    <span className="text-slate-400">{edge.type}</span>
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-slate-500">
                      <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-indigo-400 font-mono truncate" title={edge.target}>
                      {edge.target?.substring(0, 12)}...
                    </span>
                  </div>
                ))}
              </div>
            )}

            {expandedSections.connections && node.children && node.children.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-slate-500 mb-2">Child Nodes ({node.childCount || node.children.length})</p>
                <div className="space-y-1">
                  {node.children.map((child, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-slate-800/30 rounded text-xs">
                      <div
                        className="w-2 h-2 rounded-sm"
                        style={{ backgroundColor: nodeTypes[child.type]?.color || '#6B7280' }}
                      />
                      <span className="text-slate-300 truncate">{child.label || child.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Verification Section */}
        {node.verified !== undefined && (
          <div className="p-4">
            <button
              onClick={() => toggleSection('verification')}
              className="w-full flex items-center justify-between text-left mb-3"
            >
              <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Verification
              </h4>
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                className={`transform transition-transform ${expandedSections.verification ? 'rotate-180' : ''}`}
              >
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {expandedSections.verification && (
              <div className="space-y-3">
                <div className={`p-3 rounded-lg ${
                  node.verified ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-amber-500/10 border border-amber-500/20'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {node.verified ? (
                      <svg width="20" height="20" fill="none" stroke="#10B981" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" fill="none" stroke="#F59E0B" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    <span className={`font-medium ${node.verified ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {node.verified ? 'VVB Verified' : 'Pending Verification'}
                    </span>
                  </div>
                  {node.verified && (
                    <p className="text-xs text-slate-400">
                      This token has been verified by a trusted VVB (Validation/Verification Body).
                    </p>
                  )}
                </div>

                {node.data?.verifiedAt && (
                  <div className="text-xs text-slate-500">
                    Verified at: {new Date(node.data.verifiedAt).toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Additional Data Section */}
        {node.data && Object.keys(node.data).length > 0 && (
          <div className="p-4">
            <button
              onClick={() => toggleSection('data')}
              className="w-full flex items-center justify-between text-left mb-3"
            >
              <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Additional Data
                <span className="ml-auto mr-2 px-1.5 py-0.5 bg-slate-700 rounded text-xs">
                  {Object.keys(node.data).length}
                </span>
              </h4>
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                className={`transform transition-transform ${expandedSections.data ? 'rotate-180' : ''}`}
              >
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {expandedSections.data && (
              <div className="space-y-2 text-sm">
                {Object.entries(node.data).map(([key, value]) => (
                  <div key={key} className="py-1.5 border-b border-slate-700/30 last:border-0">
                    <div className="text-slate-500 text-xs uppercase tracking-wider mb-1">{key}</div>
                    <div className="text-slate-200 font-mono text-xs break-all">
                      {formatValue(value)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions Footer */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-800/30">
        <div className="flex gap-2">
          <button className="flex-1 px-3 py-2 bg-indigo-500/20 text-indigo-300 rounded-lg text-sm font-medium hover:bg-indigo-500/30 transition flex items-center justify-center gap-2">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            View Full
          </button>
          <button className="px-3 py-2 bg-slate-700/50 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-700 transition flex items-center justify-center gap-2">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Copy ID
          </button>
        </div>
      </div>
    </div>
  );
}

// Make available globally
window.NodeDetailPanel = NodeDetailPanel;
