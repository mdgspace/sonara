import { applyShape } from "./applyShape";

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

    // Find the segment for each xyPair and apply the envelope value.
    return xyPairs.map(([x, y]) => {
        // Find which node segment this x value falls into.
        let startNode, endNode, shape;
        for (let i = 0; i < nodes.length - 1; i++) {
            if (x >= nodes[i].x && x <= nodes[i + 1].x) {
                startNode = nodes[i];
                endNode = nodes[i + 1];
                shape = curves[i];
                break;
            }
        }

        if (!startNode) {
            // If x is outside the range of nodes, don't modify it.
            return [x, y];
        }

        // Normalize x to a 0-1 range (t) between the two nodes in log space.
        const logX = Math.log(x);
        const logStartX = Math.log(startNode.x);
        const logEndX = Math.log(endNode.x);
        const t = (logX - logStartX) / (logEndX - logStartX);

        // Calculate the envelope's y-value at this point, including the curve.
        const linearY = startNode.y + t * (endNode.y - startNode.y);
        const curveOffset = applyShape(t, shape);
        const envelopeY = linearY - curveOffset * t * (1 - t);

        return [x, Math.min(y, envelopeY)];
    });
};
