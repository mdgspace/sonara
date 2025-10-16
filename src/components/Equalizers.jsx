import { useState, useEffect, useRef } from 'react';
import Display from './Display';

/**
 * A component for editing a frequency envelope (EQ).
 * It uses the Display component to visualize and interact with the envelope nodes and curves.
 * When the envelope is changed, it applies it to the incoming frequencies.
 * @param {{
 *   wasmModule: any,
 *   width: number,
 *   height: number}}
 */
function EQ({ wasmModule, width, height, freqs: liveFreqs, eq, setEq }) {
    const xRange = [20, 20000];

  const initialNodes = useRef(
    eq?.nodes?.length
      ? eq.nodes
      : Array.from({ length: 5 }, (_, i) => ({
          x: Math.exp(Math.log(xRange[0]) + (i / 4) * (Math.log(xRange[1]) - Math.log(xRange[0]))),
          y: 0.8,
        }))
  ).current;

    const initialCurves = useRef(eq?.curves?.length ? eq.curves : Array(initialNodes.length - 1).fill(0)).current;

    const [nodes, setNodesLocal] = useState(initialNodes);
    const [curves, setCurvesLocal] = useState(initialCurves);

    const lastParentEqRef = useRef(JSON.stringify(eq || {}));

 // When local nodes/curves change (user edits), push to parent only if different
  useEffect(() => {
    const parentSerialized = lastParentEqRef.current;
    const localSerialized = JSON.stringify({ nodes, curves });
    if (parentSerialized !== localSerialized) {
      setEq({ nodes, curves });
      lastParentEqRef.current = localSerialized;
    }
  }, [nodes, curves, setEq]);

  // When parent eq prop changes (preset load), update local nodes/curves but only if really different
  useEffect(() => {
    if (!eq) return;
    const parentSerialized = JSON.stringify(eq);
    const localSerialized = JSON.stringify({ nodes, curves });
    if (parentSerialized !== localSerialized) {
      if (eq.nodes) setNodesLocal(eq.nodes);
      if (eq.curves) setCurvesLocal(eq.curves);
      lastParentEqRef.current = parentSerialized;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eq]);

    const processedFreqs = wasmModule
        ? (() => {
              const nodesVec = new wasmModule.VectorNode();
              nodes.forEach((node) => nodesVec.push_back(node));

              const curvesVec = new wasmModule.VectorDouble();
              curves.forEach((curve) => curvesVec.push_back(curve));

              const freqsVec = new wasmModule.VectorVectorDouble();
              (liveFreqs || []).forEach(([f, a]) => {
                  const pair = new wasmModule.VectorDouble();
                  pair.push_back(f);
                  pair.push_back(a);
                  freqsVec.push_back(pair);
                  pair.delete();
              });

              const result = wasmModule.applyEnvelope(nodesVec, curvesVec, freqsVec);

              nodesVec.delete();
              curvesVec.delete();
              freqsVec.delete();

              return result;
          })()
        : [];

     return (
    <div className="EQ">
      <h3>Frequency EQ</h3>
      <Display
        width={width}
        height={height}
        nodes={nodes}
        xRange={xRange}
        curves={curves}
        onNodesChange={setNodesLocal}
        onCurvesChange={setCurvesLocal}
        freqs={processedFreqs}
        isLogarithmic={true}
        wasmModule={wasmModule}
      />
    </div>
  );
}

export default EQ;