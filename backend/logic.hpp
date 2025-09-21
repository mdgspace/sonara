#include <vector>
#include <cstdint>

std::vector<int16_t> generatePCM(
    double frequency,
    double duration,
    int sampleRate,
    double amplitude
);