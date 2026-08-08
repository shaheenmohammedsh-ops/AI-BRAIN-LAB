import { useEffect, useRef, useState } from 'react';

interface Node {
  id: number;
  x: number;
  y: number;
  phase: number;
}

interface Connection {
  from: number;
  to: number;
  signalProgress: number;
}

function LandingNeuralVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [signals, setSignals] = useState<{ connectionIndex: number; progress: number }[]>([]);

  useEffect(() => {
    // Initialize nodes in a layered neural network pattern
    const initialNodes: Node[] = [];
    const layers = [4, 6, 4]; // Input, hidden, output layers
    const layerSpacing = 200;
    const nodeSpacing = 80;
    const startX = 150;
    const startY = 100;

    let nodeId = 0;
    layers.forEach((count, layerIndex) => {
      const layerY = startY + (3 - count) * (nodeSpacing / 2);
      for (let i = 0; i < count; i++) {
        initialNodes.push({
          id: nodeId++,
          x: startX + layerIndex * layerSpacing,
          y: layerY + i * nodeSpacing,
          phase: Math.random() * Math.PI * 2
        });
      }
    });

    setNodes(initialNodes);

    // Create connections between adjacent layers
    const initialConnections: Connection[] = [];
    for (let l = 0; l < layers.length - 1; l++) {
      const currentLayerStart = layers.slice(0, l).reduce((a, b) => a + b, 0);
      const nextLayerStart = layers.slice(0, l + 1).reduce((a, b) => a + b, 0);
      
      for (let i = 0; i < layers[l]; i++) {
        for (let j = 0; j < layers[l + 1]; j++) {
          initialConnections.push({
            from: currentLayerStart + i,
            to: nextLayerStart + j,
            signalProgress: -1
          });
        }
      }
    }

    setConnections(initialConnections);

    // Initialize signals
    const initialSignals = initialConnections.map((_, idx) => ({
      connectionIndex: idx,
      progress: Math.random() > 0.7 ? Math.random() : -1
    }));
    setSignals(initialSignals);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      connections.forEach((conn, idx) => {
        const fromNode = nodes[conn.from];
        const toNode = nodes[conn.to];
        if (!fromNode || !toNode) return;

        // Base connection line
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Signal pulse
        const signal = signals[idx];
        if (signal && signal.progress >= 0 && signal.progress < 1) {
          const signalX = fromNode.x + (toNode.x - fromNode.x) * signal.progress;
          const signalY = fromNode.y + (toNode.y - fromNode.y) * signal.progress;

          ctx.beginPath();
          ctx.arc(signalX, signalY, 3, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(14, 165, 233, 0.8)';
          ctx.fill();

          // Glow
          const gradient = ctx.createRadialGradient(signalX, signalY, 0, signalX, signalY, 10);
          gradient.addColorStop(0, 'rgba(14, 165, 233, 0.4)');
          gradient.addColorStop(1, 'rgba(14, 165, 233, 0)');
          ctx.beginPath();
          ctx.arc(signalX, signalY, 10, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }
      });

      // Draw nodes
      nodes.forEach((node) => {
        const pulse = Math.sin(time * 0.002 + node.phase) * 0.15 + 0.85;
        
        // Node glow
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 20);
        gradient.addColorStop(0, `rgba(14, 165, 233, ${0.3 * pulse})`);
        gradient.addColorStop(1, 'rgba(14, 165, 233, 0)');
        ctx.beginPath();
        ctx.arc(node.x, node.y, 20, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Node core
        ctx.beginPath();
        ctx.arc(node.x, node.y, 6 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(14, 165, 233, ${0.9 * pulse})`;
        ctx.fill();

        // Node border
        ctx.beginPath();
        ctx.arc(node.x, node.y, 6 * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Update signals
      setSignals(prev => prev.map(s => {
        if (s.progress >= 0 && s.progress < 1) {
          return { ...s, progress: s.progress + 0.008 };
        } else if (s.progress >= 1) {
          return { ...s, progress: -1 };
        } else if (Math.random() > 0.995) {
          return { ...s, progress: 0 };
        }
        return s;
      }));

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes, connections, signals]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={400}
      className="w-full h-full"
      style={{ maxWidth: '800px', margin: '0 auto' }}
    />
  );
};

export default LandingNeuralVisualization;
