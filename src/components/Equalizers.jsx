import { useState, useEffect } from 'react';
import Display from './Display';

/**
 * A component for editing a frequency envelope (EQ).
 * It uses the Display component to visualize and interact with the envelope nodes and curves.
 * When the envelope is changed, it applies it to the incoming frequencies.
 * @param {{
 *   wasmModule: any,
 *   width: number,
 *   height: number,
 *   setEq: (eq: { nodes: any[], curves: number[] }) => void}}
 */
function EQ({ wasmModule, width, height, freqs: liveFreqs, setEq }) {
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

    // Update the parent component's state when nodes or curves change.
    useEffect(() => {
        setEq({ nodes, curves });
    }, [nodes, curves, setEq]);

    return (
        <div className='EQ'>
            <h3>Frequency EQ</h3>
            <div style={{ position: 'relative', width: `${width}px`, height: `${height}px` }}>
                <Display
                    width={width}
                    height={height}
                    nodes={nodes}
                    xRange={xRange}
                    yRange={[0, 1.5]} // Define Y-axis range for gain. This is an assumption for label placement.
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

                        const wasmResult = wasmModule.applyEnvelope(nodesVec, curvesVec, freqsVec);

                        // Convert WASM vector to JS array
                        const result = [];
                        for (let i = 0; i < wasmResult.size(); i++) {
                            const pair = wasmResult.get(i);
                            result.push([pair.get(0), pair.get(1)]);
                        }
                        wasmResult.delete();

                        // Clean up the memory allocated by Embind
                        nodesVec.delete();
                        curvesVec.delete();
                        freqsVec.delete();

                        return result;
                    })() : []}
                    isLogarithmic={true}
                    wasmModule={wasmModule}
                />
                <div className="y-axis-labels" style={{ position: 'absolute', top: 0, left: 0, height: '100%', pointerEvents: 'none' }}>
                    {/* These labels assume a fixed Y-axis gain range of [0, 1.5]. They may not be accurate if the view is panned or zoomed. */}
                    {[3, 0, -6, -12, -20].map(db => {
                        const gain = 10 ** (db / 20);
                        const yMax = 1.5; // Corresponds to yRange[1]
                        const topPercent = (1 - (gain / yMax)) * 100;

                        if (topPercent < 0 || topPercent > 100) return null;

                        return (
                            <div key={db} style={{
                                position: 'absolute',
                                top: `${topPercent}%`,
                                transform: 'translateY(-50%)',
                                padding: '2px 4px',
                                fontSize: '10px',
                                color: '#ccc',
                                background: 'rgba(0, 0, 0, 0.6)',
                                borderRadius: '2px'
                            }}>
                                {db >= 0 ? '+' : ''}{db}dB
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default EQ;