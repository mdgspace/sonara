import { useState, useEffect } from 'react';
import Display from './Display';
import { applyEnvelope } from '../utils/applyEnvelope';

/**
 * A component for editing a frequency envelope (EQ).
 * It uses the Display component to visualize and interact with the envelope nodes and curves.
 * When the envelope is changed, it applies it to the incoming frequencies.
 * @param {{
 *   setEq: (eq: { nodes: Array<{x: number, y: number}>, curves: number[] }) => void,
 *   width: number,
 *   height: number}}
 */
function EQ({ setEq, width, height, freqs: liveFreqs }) {
    const xRange = [20, 20000];

    // Initialize nodes and curves for the EQ
    const initialNodes = Array.from({ length: 5 }, (_, i) => ({
        x: xRange[0] + (i / 4) * (xRange[1] - xRange[0]),
        y: 0.8
    }));
    const initialCurves = Array(initialNodes.length - 1).fill(1);

    const [nodes, setNodes] = useState(initialNodes);
    const [curves, setCurves] = useState(initialCurves);

    // Update EQ state when nodes or curves change
    useEffect(() => {
        setEq({ nodes, curves });
    }, [nodes, curves, setEq]);

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
                freqs={applyEnvelope(nodes, curves, liveFreqs || [])}
                isLogarithmic={true}
            />
        </div>
    );
}

export default EQ;