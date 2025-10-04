#include "dsp.hpp"
#include <cmath>
#include <algorithm>

std::vector<std::vector<double>> applyEnvelope(
    const std::vector<Node>& nodes,
    const std::vector<double>& curves,
    const std::vector<std::vector<double>>& xyPairs) {

    std::vector<std::vector<double>> newXyPairs;
    newXyPairs.reserve(xyPairs.size());

    for (const auto& pair : xyPairs) {
        double x = pair[0];
        double y = pair[1];

        const Node* startNode = nullptr;
        const Node* endNode = nullptr;
        double shape = 0.0;

        for (size_t i = 0; i < nodes.size() - 1; ++i) {
            if (x >= nodes[i].x && x <= nodes[i + 1].x) {
                startNode = &nodes[i];
                endNode = &nodes[i + 1];
                shape = curves[i];
                break;
            }
        }

        if (startNode) {
            double logX = std::log(x);
            double logStartX = std::log(startNode->x);
            double logEndX = std::log(endNode->x);
            double t = (logX - logStartX) / (logEndX - logStartX);

            double linearY = startNode->y + t * (endNode->y - startNode->y);
            double curveOffset = applyShape(t, shape);
            double envelopeY = linearY - curveOffset * t * (1.0 - t);
            newXyPairs.push_back({x, std::min(y, envelopeY)});
        } else {
            newXyPairs.push_back({x, y});
        }
    }
    return newXyPairs;
}