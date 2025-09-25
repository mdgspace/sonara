import { useState, useMemo, useEffect } from "react";
import Display from "./components/Display";

function App() {
  const [nodes, setNodes] = useState([
    { x: 0, y: 0.5 },
    { x: 1, y: 0.2 },
    { x: 2, y: 0.8 },
    { x: 3, y: 0.4 },
    { x: 4, y: 0.6 },
  ]);

  const xRange = [0, 4];
  const [curves, setCurves] = useState([4, 0.25, 2, 0.5]);

  const getEnvelopeValue = useMemo(() => {
    return (x) => {
      const segmentIndex = nodes.findIndex((node, i) => {
        const nextNode = nodes[i + 1];
        return nextNode && x >= node.x && x < nextNode.x;
      });
      if (segmentIndex === -1) {
        if (x <= nodes[0].x) return nodes[0].y;
        if (x >= nodes[nodes.length - 1].x) return nodes[nodes.length - 1].y;
        return 0;
      }
      const startNode = nodes[segmentIndex];
      const endNode = nodes[segmentIndex + 1];
      const c = curves[segmentIndex];
      const segmentDuration = endNode.x - startNode.x;
      if (segmentDuration === 0) {
        return startNode.y;
      }
      const t = (x - startNode.x) / segmentDuration;
      const curvedT = Math.pow(t, c);
      return startNode.y + (endNode.y - startNode.y) * curvedT;
    };
  }, [nodes, curves]);

  useEffect(() => {
    console.log(`Value at x=2.5 is: ${getEnvelopeValue(2.5)}`);
  }, [getEnvelopeValue]);

  return (
    <>
      <h1>Sonara Synthesizer</h1>
      <Display
        width={400}
        height={200}
        nodes={nodes}
        onNodesChange={setNodes}
        xRange={xRange}
        curves={curves}
        onCurvesChange={setCurves} />
    </>
  )
}

export default App
