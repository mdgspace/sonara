/**
 * Represents a single synthesizer voice, handling its entire lifecycle
 * from note-on to note-off, including the ADSR envelope.
 */
export class Voice {
    constructor(audioContext, wasmModule, frequencies, adsr, waveform = 'sine', octave = 4) {
        this.audioContext = audioContext;
        this.wasmModule = wasmModule;
        this.frequencies = frequencies;
        this.adsr = adsr;
        this.waveform = waveform;
        this.octave = octave;

        // Create the GainNode for ADSR volume control
        this.gainNode = this.audioContext.createGain();
        this.gainNode.connect(this.audioContext.destination);

        // Create the sound source
        this.source = this._createSource();
        this.source.connect(this.gainNode);
    }

    _createSource() {
        const sampleRate = 44100;
        const duration = 1.0; // 1-second buffer, which will be looped

        // Convert JS array of pairs to WASM Vector of Vectors
        const freqAmpPairs = new this.wasmModule.VectorVectorDouble();
        this.frequencies.forEach(([freq, amp]) => {
            const pair = new this.wasmModule.VectorDouble();
             const adjustedFreq = freq * Math.pow(2, this.octave - 4);
            pair.push_back(freq);
            pair.push_back(amp);
            freqAmpPairs.push_back(pair);
            pair.delete();
        });

        // 1. Generate PCM data from WASM
        const pcmDataVector = this.wasmModule.generatePcmData(freqAmpPairs, sampleRate, duration);
        freqAmpPairs.delete();

        const pcmData = new Int16Array(pcmDataVector.size());
        for (let i = 0; i < pcmDataVector.size(); i++) {
            pcmData[i] = pcmDataVector.get(i);
        }
        pcmDataVector.delete();

        // 2. Convert int16 PCM to float32 for Web Audio API
        const float32Data = new Float32Array(pcmData.length);
        for (let i = 0; i < pcmData.length; i++) {
            float32Data[i] = pcmData[i] / 32767.0;
        }

        // 3. Create audio buffer
        const audioBuffer = this.audioContext.createBuffer(1, float32Data.length, sampleRate);
        audioBuffer.copyToChannel(float32Data, 0);

        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.loop = true;
        return source;
    }

    start() {
        const now = this.audioContext.currentTime;
        const { attack, decay, sustain } = this.adsr;

        this.source.start(now);
        this.gainNode.gain.cancelScheduledValues(now);
        this.gainNode.gain.setValueAtTime(0, now); // Start at 0 volume
        this.gainNode.gain.linearRampToValueAtTime(1.0, now + attack); // Attack
        this.gainNode.gain.linearRampToValueAtTime(sustain, now + attack + decay); // Decay to Sustain
    }

    stop() {
        const now = this.audioContext.currentTime;
        const { release } = this.adsr;
        this.gainNode.gain.cancelScheduledValues(now);
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now); // Start from current gain
        this.gainNode.gain.linearRampToValueAtTime(0, now + release); // Release
        // Schedule the source to stop after the release phase is complete
        this.source.stop(now + release);
    }
}