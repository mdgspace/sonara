#include <vector>
#include <string>
#include <cmath>
#include <algorithm>
#include <stdexcept>

// Define a clear type for a frequency/amplitude pair.
using FreqAmpPair = std::vector<double>;

// Define a clear type for a list of such pairs.
using Waveform = std::vector<FreqAmpPair>;

// Define a clear type for an envelope node (x, y).
using Node = std::vector<double>;

/**
 * A mathematical shaping function to transform a linear value (t) into a curved value.
 * This is a direct C++ port of the 'applyShape' function from your utils.js.
 * @param t The input value, typically from 0 to 1.
 * @param shape The shape parameter, from -1 (concave) to 1 (convex).
 * @return The transformed value, from 0 to 1.
 */
double applyShape(double t, double shape) {
    // Clamp shape to prevent singularity at 1 and -1
    double s = std::max(-0.99999, std::min(0.99999, shape));
    if (s == 0.0) return t;
    double k = 2 * s / (1 - s);
    return (1 + k) * t / (1 + k * t);
}

/**
 * Generates a series of harmonics for a given waveform type.
 * @param baseFrequency The fundamental frequency of the waveform.
 * @param waveformName The name of the waveform ("sine", "square", "sawtooth").
 * @return A Waveform (vector of [frequency, amplitude] pairs).
 */
Waveform createWaveform(int baseFrequency, const std::string& waveformName) {
    Waveform freqs;
    // The base frequency always has an amplitude of 1.
    freqs.push_back({(double)baseFrequency, 1.0});

    int maxHarmonics = 16; // Limit the number of harmonics to generate

    if (waveformName == "square") {
        for (int n = 3; n <= maxHarmonics; n += 2) { // Odd harmonics
            freqs.push_back({(double)baseFrequency * n, 1.0 / n});
        }
    } else if (waveformName == "sawtooth") {
        for (int n = 2; n <= maxHarmonics; ++n) { // All harmonics
            freqs.push_back({(double)baseFrequency * n, 1.0 / n});
        }
    }
    // For "sine", we do nothing extra as it only has the fundamental frequency.

    return freqs;
}

/**
 * Applies an EQ envelope to a waveform, modifying its amplitudes.
 * This is a C++ port of the 'getEnvelopeValue' logic from your App.jsx.
 * @param freqs The input waveform to modify.
 * @param nodes The list of envelope nodes that define the EQ shape.
 * @param curves The list of shape parameters for the connectors between nodes.
 * @return The modified waveform with updated amplitudes.
 */
Waveform applyEQ(Waveform freqs, const std::vector<Node>& nodes, const std::vector<double>& curves) {
    if (nodes.empty()) {
        return freqs; // Return unmodified if there's no envelope.
    }

    Waveform modifiedFreqs;
    modifiedFreqs.reserve(freqs.size());

    for (const auto& freqPair : freqs) {
        double freq = freqPair[0];
        double originalAmp = freqPair[1];

        // --- Find the envelope value for the current frequency ---
        double gain = 0.0;

        // Find the segment where the frequency is located.
        int segmentIndex = -1;
        for (size_t i = 0; i < nodes.size() - 1; ++i) {
            if (freq >= nodes[i][0] && freq < nodes[i+1][0]) {
                segmentIndex = i;
                break;
            }
        }

        if (segmentIndex != -1) {
            // The frequency is within a defined segment.
            const Node& startNode = nodes[segmentIndex];
            const Node& endNode = nodes[segmentIndex + 1];
            double shape = curves[segmentIndex];

            double segmentDuration = endNode[0] - startNode[0];
            if (segmentDuration == 0) {
                gain = startNode[1];
            } else {
                // Normalize frequency within the segment to get t (0 to 1)
                double t = (freq - startNode[0]) / segmentDuration;
                double curvedT = applyShape(t, shape);
                // Interpolate to find the gain
                gain = startNode[1] + (endNode[1] - startNode[1]) * curvedT;
            }
        } else {
            // Handle edge cases: frequency is outside the defined node range.
            if (freq <= nodes[0][0]) {
                gain = nodes[0][1];
            } else { // freq >= nodes.back()[0]
                gain = nodes.back()[1];
            }
        }

        // Apply the calculated gain to the original amplitude.
        modifiedFreqs.push_back({freq, originalAmp * gain});
    }

    return modifiedFreqs;
}