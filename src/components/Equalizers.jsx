import { useState } from 'react';
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
function EQ({ wasmModule, width, height, freqs: liveFreqs }) {
    const xRange = [20, 20000];

    // Initialize nodes and curves for the EQ
    const logXMin = Math.log(xRange[0]);
    const logXMax = Math.log(xRange[1]);
    const initialNodes = Array.from({ length: 5 }, (_, i) => ({
        x: Math.exp(logXMin + (i / 4) * (logXMax - logXMin)),
        y: 0.8
    }));
    const initialCurves = Array(initialNodes.length - 1).fill(0);

    const [nodes, setNodes] = useState(initialNodes);
    const [curves, setCurves] = useState(initialCurves);

    return (
        <div className='EQ'>
            <h3>Frequency EQ</h3>
            <Display
                width={width}
                height={height}
                nodes={nodes}
                xRange={xRange}
                curves={curves}
                onNodesChange={setNodes}
                onCurvesChange={setCurves}
                freqs={wasmModule ? (() => {
                    // Manually convert JS arrays to the Embind Vector types.
                    const nodesVec = new wasmModule.VectorNode();
                    nodes.forEach(node => nodesVec.push_back(node));

                    const curvesVec = new wasmModule.VectorDouble();
                    curves.forEach(curve => curvesVec.push_back(curve));

                    const freqsVec = new wasmModule.VectorVectorDouble();
                    (liveFreqs || []).forEach(freqPair => {
                        const pair = new wasmModule.VectorDouble();
                        pair.push_back(freqPair[0]);
                        pair.push_back(freqPair[1]);
                        freqsVec.push_back(pair);
                        pair.delete();
                    });

                    const result = wasmModule.applyEnvelope(nodesVec, curvesVec, freqsVec);

                    // Clean up the memory allocated by Embind
                    nodesVec.delete();
                    curvesVec.delete();
                    freqsVec.delete();

                    return result;
                })() : []}
                isLogarithmic={true}
                wasmModule={wasmModule}
            />
        </div>
    );
}

export default EQ;