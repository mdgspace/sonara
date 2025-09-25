#include <emscripten/bind.h>
#include <vector>
#include <cmath>

const double PI = 3.14159265358979323846;

/**
 * Generates PCM audio data as a vector of 16-bit signed integers.
 * The audio is synthesized by summing sine waves based on the provided frequency and amplitude pairs.
 * The formula for the wave is: sum(Ai * sin(2 * pi * fi * t))
 *
 * @param freqAmpPairs A 2D array (flattened) of frequency and amplitude pairs.
 *                     The format is [f1, A1, f2, A2, ...].
 * @param sampleRate The sample rate for the audio to be generated (e.g., 44100).
 * @param duration The duration of the audio to be generated in seconds.
 * @return A std::vector<int16_t> containing the generated PCM audio data.
 */
std::vector<int16_t> generatePcmData(const std::vector<std::vector<double>>& freqAmpPairs, int sampleRate, double duration) {
    // Convert the JavaScript array of arrays to a C++ vector of pairs
    // const std::vector<std::vector<double>> pairs = emscripten::vecFromJSArray<std::vector<double>>(freqAmpPairs);

    int numSamples = static_cast<int>(sampleRate * duration);
    std::vector<int16_t> pcmData(numSamples);

    double maxPossibleAmp = 0.0;
    for (const auto& pair : freqAmpPairs) {
        if (pair.size() == 2) {
            maxPossibleAmp += pair[1]; // Ai
        }
    }
    if (maxPossibleAmp == 0.0) {
        maxPossibleAmp = 1.0; // Avoid division by zero
    }

    for (int i = 0; i < numSamples; ++i) {
        double t = static_cast<double>(i) / sampleRate;
        double sampleValue = 0.0;

        // Sum of sine waves: sum(Ai * sin(2 * pi * fi * t))
        for (const auto& pair : freqAmpPairs) {
            if (pair.size() == 2) {
                double frequency = pair[0]; // fi
                double amplitude = pair[1]; // Ai
                sampleValue += amplitude * sin(2.0 * PI * frequency * t);
            }
        }

        // Normalize the sample to prevent clipping, then scale to int16 range
        double normalizedSample = sampleValue / maxPossibleAmp;
        pcmData[i] = static_cast<int16_t>(normalizedSample * 32767.0);
    }

    return pcmData;
}

EMSCRIPTEN_BINDINGS(sonara_dsp) {
    emscripten::function("generatePcmData", &generatePcmData);
    emscripten::register_vector<int16_t>("Int16Vector");
    emscripten::register_vector<double>("VectorDouble");
    emscripten::register_vector<std::vector<double>>("VectorVectorDouble");
}