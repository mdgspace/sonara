
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