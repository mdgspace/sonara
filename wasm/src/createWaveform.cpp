#include "dsp.hpp"
#include <string>    // For std::string
#include <vector>    // For std::vector
#include <algorithm> // For std::transform
#include <cctype>    // For std::tolower

// Helper function to convert a string to lowercase for case-insensitive comparisons.
std::string toLower(std::string s) {
    std::transform(s.begin(), s.end(), s.begin(),
                   [](unsigned char c){ return std::tolower(c); });
    return s;
}

/**
 * @brief Generates a waveform's harmonic components (frequency and amplitude).
 *
 * This function creates a spectral representation of common waveforms by
 * calculating their fundamental frequency and relevant harmonics, along with
 * their respective amplitudes. The fundamental frequency's amplitude is normalized to 1.0.
 *
 * @param waveformType A string indicating the type of waveform (e.g., "sine", "square", "sawtooth", "triangle").
 *                     Comparison is case-insensitive.
 * @param baseFreq The fundamental frequency of the waveform in Hertz (Hz).
 * @return A std::vector of std::vector<double>, where each inner vector represents a harmonic.
 *         The inner vector contains two elements: [frequency, amplitude].
 *         Returns an empty vector if the waveformType is not recognized.
 */
std::vector<std::vector<double>> createWaveform(
    const std::string& waveformType, // Waveform name like "sine", "square", etc.
    double baseFreq                  // The fundamental frequency in Hz
) {
    std::vector<std::vector<double>> harmonics;
    std::string type = toLower(waveformType); // Convert to lowercase for robust comparison

    // Define a reasonable number of harmonics for complex waves.
    // This value can be adjusted based on desired fidelity vs. computational cost.
    const int MAX_HARMONICS_COUNT = 15;

    if (type == "sine") {
        // A pure sine wave only consists of its fundamental frequency.
        harmonics.push_back({baseFreq, 1.0});
    } else if (type == "square") {
        // A square wave consists of odd harmonics. The amplitude of the nth harmonic is 1/n.
        for (int n = 1; n <= MAX_HARMONICS_COUNT * 2 - 1; n += 2) { // Iterate through odd numbers
            harmonics.push_back({static_cast<double>(n) * baseFreq, 1.0 / static_cast<double>(n)});
        }
    } else if (type == "sawtooth") {
        // A sawtooth wave consists of all integer harmonics. The amplitude of the nth harmonic is 1/n.
        for (int n = 1; n <= MAX_HARMONICS_COUNT; ++n) { // Iterate through all integers
            harmonics.push_back({static_cast<double>(n) * baseFreq, 1.0 / static_cast<double>(n)});
        }
    } else if (type == "triangle") {
        // A triangle wave consists of odd harmonics. The amplitude of the nth harmonic is 1/(n^2).
        for (int n = 1; n <= MAX_HARMONICS_COUNT * 2 - 1; n += 2) { // Iterate through odd numbers
            harmonics.push_back({static_cast<double>(n) * baseFreq, 1.0 / (static_cast<double>(n) * static_cast<double>(n))});
        }
    }
    // If an unknown waveform type is provided, an empty vector will be returned.

    return harmonics;
}