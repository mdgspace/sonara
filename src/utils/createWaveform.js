
/**
 * Creates an array of frequency and amplitude pairs for a given waveform.
 * @param {string} waveform - The name of the waveform ("sine", "square", "triangle", "sawtooth").
 * @param {number} baseFreq - The fundamental frequency.
 * @returns {Array<[number, number]>} A 2D array of [frequency, amplitude] pairs.
 */
export const createWaveform = (waveform, baseFreq) => {
    const harmonics = [];
    const nyquist = 20000; // Use 20kHz as the upper limit

    if (baseFreq > nyquist) {
        return [[baseFreq, 1]];
    }

    switch (waveform) {
        case "sine":
            // A sine wave has only the fundamental frequency.
            harmonics.push([baseFreq, 1]);
            break;

        case "square":
            // Square wave: odd harmonics, amplitude 1/n.
            for (let n = 1; ; n += 2) {
                const freq = baseFreq * n;
                if (freq > nyquist) break;
                harmonics.push([freq, 1 / n]);
            }
            break;

        case "triangle":
            // Triangle wave: odd harmonics, amplitude 1/n^2.
            for (let n = 1; ; n += 2) {
                const freq = baseFreq * n;
                if (freq > nyquist) break;
                // The sign alternates, but for additive synthesis amplitude is what matters.
                harmonics.push([freq, 1 / (n * n)]);
            }
            break;

        case "sawtooth":
            // Sawtooth wave: all harmonics, amplitude 1/n.
            for (let n = 1; ; n += 1) {
                const freq = baseFreq * n;
                if (freq > nyquist) break;
                harmonics.push([freq, 1 / n]);
            }
            break;

        default:
            // Default to a sine wave if waveform is unknown.
            harmonics.push([baseFreq, 1]);
            break;
    }

    return harmonics;
};