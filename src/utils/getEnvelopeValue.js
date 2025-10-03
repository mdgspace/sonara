import { applyShape } from "./applyShape";

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
            // We must do this in log space to match the visual representation of the EQ.
            const logX = Math.log(x);
            const logStartX = Math.log(startNode.x);
            const logEndX = Math.log(endNode.x);
            const t = (logX - logStartX) / (logEndX - logStartX);
            const shape = curves[i];

            const curvedT = applyShape(t, shape);

            // Interpolate the y-value based on the curved t
            return startNode.y + curvedT * (endNode.y - startNode.y);
        }
    }

    return 0; // Should not be reached if nodes are sorted by x
};