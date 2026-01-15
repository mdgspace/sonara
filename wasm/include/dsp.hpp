#ifndef DSP_HPP
#define DSP_HPP

#include <vector>
#include <cstdint>
#include <string>

// A struct to hold node data, similar to the JS object {x, y}
struct Node {
    double x;
    double y;
};

// Function declarations
double applyShape(double t, double shape);

std::vector<std::vector<double>> applyEnvelope(
    const std::vector<Node>& nodes,
    const std::vector<double>& curves,
    const std::vector<std::vector<double>>& xyPairs);

std::vector<int16_t> generatePcmData(
    const std::vector<std::vector<double>>& freqAmpPairs,
    int sampleRate,
    double duration);

std::vector<std::vector<double>> createWaveform(
    const std::string& waveformType, 
    double baseFreq
);

#endif // DSP_HPP