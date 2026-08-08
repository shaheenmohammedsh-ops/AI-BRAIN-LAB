import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Background,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { Connection } from 'reactflow';
import type { SimulationState } from '../types';

interface NeuralNetworkProps {
  state: SimulationState;
  onAction: (actionType: string, targetNode?: string, energyAllocated?: number, sourceNode?: string, targetNodeConnect?: string) => void;
}

const CustomNode = ({ data, selected }: { data: any; selected?: boolean }) => {
  const healthPercent = data.health_percent || 0;
  const networkAccuracy = data.networkAccuracy || 0;
  const networkHealth = data.networkHealth || 0;

  // Determine node state with professional color system
  let nodeState = 'healthy';
  let borderColor = '#0ea5e9';
  let backgroundColor = 'rgba(17, 24, 39, 0.95)';
  let textColor = '#e5e7eb';
  let statusIndicator = '#10b981';
  let animationClass = 'node-healthy';

  if (healthPercent > 70 && networkAccuracy > 0.7) {
    nodeState = 'healthy';
    borderColor = '#0ea5e9';
    backgroundColor = 'rgba(17, 24, 39, 0.95)';
    textColor = '#e5e7eb';
    statusIndicator = '#10b981';
    animationClass = 'node-healthy';
  } else if (healthPercent > 40) {
    nodeState = networkAccuracy > 0.5 ? 'learning' : 'training';
    borderColor = networkAccuracy > 0.5 ? '#3b82f6' : '#7c3aed';
    backgroundColor = 'rgba(17, 24, 39, 0.9)';
    textColor = '#e5e7eb';
    statusIndicator = networkAccuracy > 0.5 ? '#3b82f6' : '#7c3aed';
    animationClass = networkAccuracy > 0.5 ? 'node-healthy' : 'node-healthy';
  } else if (healthPercent > 20) {
    nodeState = networkHealth < 0.4 ? 'corrupted' : 'damaged';
    borderColor = networkHealth < 0.4 ? '#ef4444' : '#f59e0b';
    backgroundColor = 'rgba(17, 24, 39, 0.85)';
    textColor = '#e5e7eb';
    statusIndicator = networkHealth < 0.4 ? '#ef4444' : '#f59e0b';
    animationClass = 'node-warning';
  } else {
    nodeState = 'critical';
    borderColor = '#ef4444';
    backgroundColor = 'rgba(239, 68, 68, 0.1)';
    textColor = '#e5e7eb';
    statusIndicator = '#ef4444';
    animationClass = 'node-warning';
  }

  const importance = data.importance || 0.5;
  const selectedBorder = selected ? '2px solid #ffffff' : `1px solid ${borderColor}`;

  // Subtle styling based on health
  const opacity = 0.6 + (healthPercent / 250);
  const healthColor = healthPercent > 50 ? '#10b981' : healthPercent > 25 ? '#f59e0b' : '#ef4444';

  return (
    <div
      className={`px-4 py-3 rounded transition-all duration-200 cursor-pointer ${animationClass}`}
      style={{
        backgroundColor,
        border: selectedBorder,
        opacity,
        minWidth: '140px',
        boxShadow: selected ? '0 0 0 2px rgba(14, 165, 233, 0.3)' : 'none'
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium" style={{ color: textColor }}>{data.label}</div>
        <div 
          className="w-2 h-2 rounded-full"
          style={{ 
            backgroundColor: statusIndicator,
            opacity: healthPercent > 50 ? 1 : 0.7
          }}
        />
      </div>

      <div className="flex items-center justify-between text-xs mb-2" style={{ color: '#9ca3af' }}>
        <span className="flex items-center gap-1">
          <span style={{ color: '#0ea5e9' }}>⚡</span>
          {data.energy}/{data.max_energy}
        </span>
        <span style={{ color: healthColor, fontWeight: healthPercent < 40 ? 500 : 400 }}>
          {healthPercent.toFixed(0)}%
        </span>
      </div>

      <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ backgroundColor: '#374151' }}>
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${healthPercent}%`,
            backgroundColor: healthColor
          }}
        />
      </div>

      <div className="flex items-center justify-between text-xs" style={{ color: '#6b7280' }}>
        <span>
          {nodeState === 'healthy' && 'Optimal'}
          {nodeState === 'learning' && 'Learning'}
          {nodeState === 'training' && 'Training'}
          {nodeState === 'damaged' && 'Degraded'}
          {nodeState === 'corrupted' && 'Corrupted'}
          {nodeState === 'critical' && 'Critical'}
        </span>
        {importance > 0.3 && (
          <span style={{ color: '#f59e0b' }}>●</span>
        )}
      </div>
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

const NeuralNetwork: React.FC<NeuralNetworkProps> = ({ state, onAction }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    // Calculate overall network health for edge styling
    const avgHealth = Object.values(state.nodes).reduce((sum: number, node: any) => 
      sum + (node.health_percent || 0), 0) / Math.max(1, Object.keys(state.nodes).length);
    
    // Professional edge styling based on network accuracy
    const edgeColor = state.accuracy > 0.8 ? '#0ea5e9' : state.accuracy > 0.6 ? '#3b82f6' : '#6b7280';
    const edgeWidth = 1.5 + (state.accuracy * 1);
    const edgeOpacity = 0.3 + (state.accuracy * 0.4);
    
    // Fixed deterministic positions for perceptron-style structure
    const fixedPositions: Record<string, { x: number; y: number }> = {
      'Input_Layer': { x: 100, y: 200 },
      'Hidden_1': { x: 350, y: 100 },
      'Hidden_2': { x: 350, y: 200 },
      'Hidden_3': { x: 350, y: 300 },
      'Output_Layer': { x: 600, y: 200 }
    };
    
    const desiredNodes = Object.entries(state.nodes).map(([id, info]: [string, any]) => {
      const nodeHealth = info.health_percent || 0;
      const position = fixedPositions[id] || { x: 100, y: 200 };
      
      return {
        id,
        type: 'custom',
        position: position,
        data: {
          label: id.replace('_', ' '),
          ...info,
          networkAccuracy: state.accuracy,
          networkHealth: avgHealth
        },
        selected: selectedNode === id,
        style: {
          opacity: 0.7 + (nodeHealth / 200)
        }
      };
    });

    const desiredEdges = [
      {
        id: 'e1',
        source: 'Input_Layer',
        target: 'Hidden_1',
        animated: state.accuracy > 0.7,
        type: 'smooth',
        markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
        style: {
          stroke: edgeColor,
          strokeWidth: edgeWidth,
          opacity: edgeOpacity
        },
        className: state.accuracy > 0.7 ? 'connection-active' : ''
      },
      {
        id: 'e2',
        source: 'Input_Layer',
        target: 'Hidden_2',
        animated: state.accuracy > 0.7,
        type: 'smooth',
        markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
        style: {
          stroke: edgeColor,
          strokeWidth: edgeWidth,
          opacity: edgeOpacity
        },
        className: state.accuracy > 0.7 ? 'connection-active' : ''
      },
      {
        id: 'e3',
        source: 'Input_Layer',
        target: 'Hidden_3',
        animated: state.accuracy > 0.7,
        type: 'smooth',
        markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
        style: {
          stroke: edgeColor,
          strokeWidth: edgeWidth,
          opacity: edgeOpacity
        },
        className: state.accuracy > 0.7 ? 'connection-active' : ''
      },
      {
        id: 'e4',
        source: 'Hidden_1',
        target: 'Output_Layer',
        animated: state.accuracy > 0.7,
        type: 'smooth',
        markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
        style: {
          stroke: edgeColor,
          strokeWidth: edgeWidth,
          opacity: edgeOpacity
        },
        className: state.accuracy > 0.7 ? 'connection-active' : ''
      },
      {
        id: 'e5',
        source: 'Hidden_2',
        target: 'Output_Layer',
        animated: state.accuracy > 0.7,
        type: 'smooth',
        markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
        style: {
          stroke: edgeColor,
          strokeWidth: edgeWidth,
          opacity: edgeOpacity
        },
        className: state.accuracy > 0.7 ? 'connection-active' : ''
      },
      {
        id: 'e6',
        source: 'Hidden_3',
        target: 'Output_Layer',
        animated: state.accuracy > 0.7,
        type: 'smooth',
        markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
        style: {
          stroke: edgeColor,
          strokeWidth: edgeWidth,
          opacity: edgeOpacity
        },
        className: state.accuracy > 0.7 ? 'connection-active' : ''
      }
    ];

    // Update nodes deterministically without changing positions
    if (nodes.length === 0) {
      setNodes(desiredNodes);
    } else {
      setNodes((prev) => {
        const prevMap: Record<string, any> = Object.fromEntries(prev.map(n => [n.id, n]));
        return desiredNodes.map(d => {
          const prevNode = prevMap[d.id];
          return {
            id: d.id,
            type: d.type,
            position: d.position, // keep fixed position
            data: { ...(prevNode?.data || {}), ...d.data },
            selected: selectedNode === d.id,
            style: d.style
          };
        });
      });
    }

    setEdges(desiredEdges);
  }, [state, selectedNode]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, animated: true, type: 'smooth', markerEnd: { type: MarkerType.ArrowClosed } }, eds));
      if (params.source && params.target) {
        onAction('connect_nodes', undefined, undefined, params.source, params.target);
      }
    },
    [setEdges, onAction]
  );

  const onNodeClick = useCallback((_: any, node: any) => {
    setSelectedNode(node.id);
    setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === node.id })));
    onAction('inspect_node', node.id);
    
    const showFeedback = (window as any).showFloatingText;
    const playSound = (window as any).playSound;
    if (showFeedback) {
      showFeedback(window.innerWidth / 2, window.innerHeight / 2, `Selected: ${node.data.label}`, 'text-cyan-400', 'text-lg');
    }
    if (playSound) playSound('click');
  }, [onAction, setNodes]);

  return (
    <div className="flex flex-col h-full">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-2 px-1 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-[#0ea5e9]/20 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-[#0ea5e9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xs font-semibold text-white tracking-tight">Neural Network</h2>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <div className="px-2 py-0.5 bg-gray-800/50 rounded text-[10px]">
            <span className="text-gray-400">Health:</span>
            <span className="text-[#0ea5e9] font-medium ml-1">
              {Object.values(state.nodes).reduce((sum: number, node: any) => sum + (node.health_percent || 0), 0) / Math.max(1, Object.keys(state.nodes).length) > 70 ? 'Optimal' : 'Degraded'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Compact Network Container */}
      <div className="flex-1 relative rounded-lg overflow-hidden border border-gray-800/50 bg-gray-900/50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={false}
          panOnScroll={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          minZoom={1}
          maxZoom={1}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          className="bg-gray-900"
          style={{ background: '#111827', width: '100%', height: '100%' }}
          fitView={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#374151" gap={24} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
};

export default NeuralNetwork;
