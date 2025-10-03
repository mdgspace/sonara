import { getEnvelopeValue} from "./getEnvelopeValue";

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
    return xyPairs.map(([x, y]) => {
        const envelopeMultiplier = 1 - getEnvelopeValue(nodes, curves, x);
        return [x, envelopeMultiplier * y];
    });
};
