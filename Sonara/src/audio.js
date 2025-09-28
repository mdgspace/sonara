/**
 * Creates an AudioContext, generates PCM data using the WASM module,
 * and plays the sound.
 * @param {object} wasmModule The initialized WASM module.
 * @param {Array<[number, number]>} frequencies An array of [frequency, amplitude] pairs.
 * @returns {Promise<object|null>} A promise that resolves to an object with a `stop` method, or null on failure.
 */
export async function play(wasmModule, frequencies) {
    if (!wasmModule) {
        console.error("WASM module not ready.");
        return null;
    }

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Resume AudioContext if it's in a suspended state (required by modern browsers)
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }

    const sampleRate = 44100;
    const duration = 1.0; // 1-second buffer, which will be looped

    // Convert JS array of pairs to WASM Vector of Vectors
    const freqAmpPairs = new wasmModule.VectorVectorDouble();
    frequencies.forEach(([freq, amp]) => {
        const pair = new wasmModule.VectorDouble();
        pair.push_back(freq);
        pair.push_back(amp);
        freqAmpPairs.push_back(pair);
        pair.delete();
    });

    // 1. Generate PCM data from WASM
    const pcmDataVector = wasmModule.generatePcmData(freqAmpPairs, sampleRate, duration);
    freqAmpPairs.delete(); // Clean up the C++ vector of vectors

    const pcmData = new Int16Array(pcmDataVector.size());
    for (let i = 0; i < pcmDataVector.size(); i++) {
        pcmData[i] = pcmDataVector.get(i);
    }
    pcmDataVector.delete(); // Clean up the C++ vector memory

    // 2. Convert int16 PCM to float32 for Web Audio API
    const float32Data = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
        float32Data[i] = pcmData[i] / 32767.0;
    }

    // 3. Create and play audio buffer
    const audioBuffer = audioContext.createBuffer(1, float32Data.length, sampleRate);
    audioBuffer.copyToChannel(float32Data, 0);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = true; // Loop the sound
    source.connect(audioContext.destination);
    source.start(0);

    return {
        stop: () => {
            source.stop();
            audioContext.close();
        }
    };
}