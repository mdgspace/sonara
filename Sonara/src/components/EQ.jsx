import { useState, useEffect, useMemo } from 'react';
import Display from './Display';
import { applyEnvelope } from '../utils';

/**
 * A component for editing a frequency envelope (EQ).
 * It uses the Display component to visualize and interact with the envelope nodes and curves.
 * When the envelope is changed, it applies it to the incoming frequencies.
 * @param {{
 *   freqs: Array<[number, number]>,
 *   setEqFreqs: (freqs: Array<[number, number]>) => void,
 *   width: number,
 *   height: number
 * }} props
 */
function EQ({ freqs, setEqFreqs, width, height }) {
    const xRange = [20, 20000];

    // Initial state for 5 nodes, evenly spaced in the xRange with a default y of 0.8
    const initialNodes = Array.from({ length: 5 }, (_, i) => ({
        x: xRange[0] + (i / 4) * (xRange[1] - xRange[0]),
        y: 0.8
    }));

    // Initial state for 4 curves (for 5 nodes), all set to 1 (convex)
    const initialCurves = Array(initialNodes.length - 1).fill(1);

    const [nodes, setNodes] = useState(initialNodes);
    const [curves, setCurves] = useState(initialCurves);

    const eqFreqs = useMemo(() => {
        if (freqs && freqs.length > 0) {
            return applyEnvelope(nodes, curves, freqs);
        }
        return [];
    }, [nodes, curves, freqs]);

    // When the envelope (nodes or curves) changes, apply it to the frequencies.
    useEffect(() => {
        setEqFreqs(eqFreqs);
    }, [eqFreqs, setEqFreqs]);

    return (
        <div>
            <h3>Frequency EQ</h3>
            <Display
                width={width}
                height={height}
                nodes={nodes}
                xRange={xRange}
                curves={curves}
                onNodesChange={setNodes}
                onCurvesChange={setCurves}
                freqs={eqFreqs}
                isLogarithmic={true}
            />
        </div>
    );
}

export default EQ;