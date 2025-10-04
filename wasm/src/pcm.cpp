#include "dsp.hpp"
#include <vector>
#include <cmath>
#include <cstdint>

const double PI = 3.14159265358979323846;

std::vector<int16_t> generatePcmData(
    const std::vector<std::vector<double>>& freqAmpPairs,
    int sampleRate,
    double duration) {

    const int numSamples = static_cast<int>(duration * sampleRate);
    std::vector<int16_t> pcmData(numSamples, 0);
    const double maxAmplitude = 32767.0;

    for (int i = 0; i < numSamples; ++i) {
        double t = static_cast<double>(i) / sampleRate;
        double sample = 0.0;

        // Additive synthesis: sum of sine waves
        for (const auto& pair : freqAmpPairs) {
            double frequency = pair[0];
            double amplitude = pair[1];
            sample += amplitude * sin(2.0 * PI * frequency * t);
        }

        pcmData[i] = static_cast<int16_t>(std::round(sample * maxAmplitude));
    }

    return pcmData;
}