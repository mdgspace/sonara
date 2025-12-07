#include "dsp.hpp"
#include <string>    // For std::string
#include <vector>    // For std::vector
#include <algorithm>

using namespace std;

vector<vector<double>> createWaveform(const string& type,double baseFreq) {
    
    vector<vector<double>> harmonics;

    const int MAX_HARMONICS_COUNT = 15;

    if (type == "sine") {
        harmonics.push_back({baseFreq, 1.0});
    } else if (type == "square") {
        // A square wave consists of odd harmonics. The amplitude of the nth harmonic is 1/n.	
        for (int n = 1; n <= MAX_HARMONICS_COUNT * 2 - 1; n += 2) {
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
