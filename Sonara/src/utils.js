/**
 * A mathematical shaping function to transform a linear value (t) into a curved value.
 * It is clamped to prevent division-by-zero errors at the extremes.
 * @param {number} t - The input value, typically from 0 to 1.
 * @param {number} shape - The shape parameter, from -1 (concave) to 1 (convex).
 * @returns {number} The transformed value, from 0 to 1.
 */
export const applyShape = (t, shape) => {
    // Clamp shape to prevent singularity at 1 and -1
    const s = Math.max(-0.99999, Math.min(0.99999, shape));

    if (s === 0) return t; // Linear

    const k = 2 * s / (1 - s);
    return (1 + k) * t / (1 + k * t);
};

/**
 * Creates an array of frequency and amplitude pairs for a given waveform.
 * @param {string} waveform - The name of the waveform ("sine", "square", "triangle", "sawtooth").
 * @param {number} baseFreq - The fundamental frequency.
 * @returns {Array<[number, number]>} A 2D array of [frequency, amplitude] pairs.
 */
export const createWaveform = (waveform, baseFreq) => {
    const harmonics = [];
    const nyquist = 20000; // Use 20kHz as the upper limit

    if (baseFreq > nyquist) {
        return [[baseFreq, 1]];
    }

    switch (waveform) {
        case "sine":
            // A sine wave has only the fundamental frequency.
            harmonics.push([baseFreq, 1]);
            break;

        case "square":
            // Square wave: odd harmonics, amplitude 1/n.
            for (let n = 1; ; n += 2) {
                const freq = baseFreq * n;
                if (freq > nyquist) break;
                harmonics.push([freq, 1 / n]);
            }
            break;

        case "triangle":
            // Triangle wave: odd harmonics, amplitude 1/n^2.
            for (let n = 1; ; n += 2) {
                const freq = baseFreq * n;
                if (freq > nyquist) break;
                // The sign alternates, but for additive synthesis amplitude is what matters.
                harmonics.push([freq, 1 / (n * n)]);
            }
            break;

        case "sawtooth":
            // Sawtooth wave: all harmonics, amplitude 1/n.
            for (let n = 1; ; n += 1) {
                const freq = baseFreq * n;
                if (freq > nyquist) break;
                harmonics.push([freq, 1 / n]);
            }
            break;

        default:
            // Default to a sine wave if waveform is unknown.
            harmonics.push([baseFreq, 1]);
            break;
    }

    return harmonics;
};

/**
 * Calculates the y-value of an envelope at a given x-coordinate.
 * The envelope is defined by a series of nodes and the curves between them.
 * @param {Array<{x: number, y: number}>} nodes - An array of node objects.
 * @param {number[]} curves - An array of shape values for the curves between nodes.
 * @param {number} x - The x-coordinate at which to find the envelope's value.
 * @returns {number} The calculated y-value on the envelope.
 */
export const getEnvelopeValue = (nodes, curves, x) => {
    if (!nodes || nodes.length === 0) {
        return 0; // No envelope to evaluate
    }

    // If x is before the first node, return the first node's y-value
    if (x <= nodes[0].x) {
        return nodes[0].y;
    }

    // If x is after the last node, return the last node's y-value
    if (x >= nodes[nodes.length - 1].x) {
        return nodes[nodes.length - 1].y;
    }

    // Find the two nodes that x is between
    for (let i = 0; i < nodes.length - 1; i++) {
        const startNode = nodes[i];
        const endNode = nodes[i + 1];

        if (x >= startNode.x && x <= endNode.x) {
            // Normalize x to a 0-1 range (t) between the two nodes
            const t = (x - startNode.x) / (endNode.x - startNode.x);
            const shape = curves[i];
            const curvedT = applyShape(t, shape);

            // Interpolate the y-value based on the curved t
            return startNode.y + curvedT * (endNode.y - startNode.y);
        }
    }

    return 0; // Should not be reached if nodes are sorted by x
};

/**
 * Applies an envelope to a 2D array of [x, y] pairs.
 * The new y-value will be the minimum of the original y-value and the envelope's value at x.
 * @param {Array<{x: number, y: number}>} nodes - An array of node objects for the envelope.
 * @param {number[]} curves - An array of shape values for the envelope curves.
 * @param {Array<[number, number]>} xyPairs - A 2D array of [x, y] pairs to be modified.
 * @returns {Array<[number, number]>} A new 2D array with the envelope applied.
 */
export const applyEnvelope = (nodes, curves, xyPairs) => {
    if (!xyPairs || xyPairs.length === 0) {
        return [];
    }
    return xyPairs.map(([x, y]) => [x, Math.min(1-getEnvelopeValue(nodes, curves, x), y)]);
};
