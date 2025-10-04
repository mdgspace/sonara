
/**
 * A mathematical shaping function to transform a linear value (t) into a curved value.
 * It is clamped to prevent division-by-zero errors at the extremes.
 * @param {number} t - The input value, typically from 0 to 1.
 * @param {number} shape - The shape parameter, from -1 (concave) to 1 (convex).
 * @returns {number} The transformed value, from 0 to 1.
 */
export const applyShape = (t, shape) => {
    if (shape === 0) {
        return 0; // No curve, so the offset from the straight line is 0.
    }
    // This formula creates a parabolic curve that is 0 at t=0 and t=1, and has a maximum/minimum of 1/-1 at t=0.5.
    // The `shape` parameter scales this curve.
    return shape * 4 * (t - t * t);
};