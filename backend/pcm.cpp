#include "logic.hpp"
#include <cmath>

std::vector<int16_t> generatePCM(
    double frequency,
    double duration,
    int sampleRate,
    double amplitude = 1.0
) {
    const int numSamples = static_cast<int>(duration * sampleRate);
    std::vector<int16_t> pcmData(numSamples);

    const double maxAmplitude = 32767.0 * amplitude;

    for (int i = 0; i < numSamples; ++i) {
        double t = static_cast<double>(i) / sampleRate;
        double sample = maxAmplitude * sin(2.0 * M_PI * frequency * t);
        pcmData[i] = static_cast<int16_t>(std::round(sample));
    }

    return pcmData;
}