const MIN_GAIN = 1e-4;
const MIN_SEGMENT_SECONDS = 0.005;
const RELEASE_STOP_PADDING_SECONDS = 0.05;
const VOICE_LEVEL_TARGET = 0.18;
const MASTER_OUTPUT_GAIN = 0.9;

const masterBusByContext = new WeakMap();

function clampAdsr(adsr = {}) {
    return {
        attack: Math.max(0, Number(adsr.attack) || 0),
        decay: Math.max(0, Number(adsr.decay) || 0),
        sustain: Math.min(1, Math.max(0, Number(adsr.sustain) || 0)),
        release: Math.max(0, Number(adsr.release) || 0),
    };
}

function getOrCreateMasterBus(audioContext) {
    const existingBus = masterBusByContext.get(audioContext);
    if (existingBus) {
        return existingBus;
    }

    const input = audioContext.createGain();
    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 18;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.12;

    const output = audioContext.createGain();
    output.gain.value = MASTER_OUTPUT_GAIN;

    input.connect(compressor);
    compressor.connect(output);
    output.connect(audioContext.destination);

    const bus = { input, compressor, output };
    masterBusByContext.set(audioContext, bus);
    return bus;
}

function holdAtTime(audioParam, time) {
    if (typeof audioParam.cancelAndHoldAtTime === "function") {
        audioParam.cancelAndHoldAtTime(time);
        return;
    }

    audioParam.cancelScheduledValues(time);
    audioParam.setValueAtTime(Math.max(audioParam.value, MIN_GAIN), time);
}

function buildWave(audioContext, frequencies = []) {
    const nyquistFrequency = audioContext.sampleRate * 0.5;
    const usableFrequencies = frequencies.filter(([frequency, amplitude]) => (
        Number.isFinite(frequency)
        && Number.isFinite(amplitude)
        && frequency > 0
        && Math.abs(amplitude) > 0
    ));

    if (usableFrequencies.length === 0) {
        return {
            outputLevel: VOICE_LEVEL_TARGET,
            periodicWave: audioContext.createPeriodicWave(
                new Float32Array([0, 0]),
                new Float32Array([0, 1]),
                { disableNormalization: true },
            ),
            fundamentalFrequency: 440,
        };
    }

    const fundamentalFrequency = usableFrequencies.reduce(
        (minFrequency, [frequency]) => Math.min(minFrequency, frequency),
        usableFrequencies[0][0],
    );

    const harmonicAmplitudes = new Map();
    let highestHarmonic = 1;
    let rmsEnergy = 0;

    usableFrequencies.forEach(([frequency, amplitude]) => {
        if (frequency >= nyquistFrequency) {
            return;
        }

        const harmonic = Math.max(1, Math.round(frequency / fundamentalFrequency));
        const expectedFrequency = harmonic * fundamentalFrequency;

        if (Math.abs(expectedFrequency - frequency) > 1e-6 * expectedFrequency) {
            return;
        }

        harmonicAmplitudes.set(
            harmonic,
            (harmonicAmplitudes.get(harmonic) || 0) + amplitude,
        );
        highestHarmonic = Math.max(highestHarmonic, harmonic);
        rmsEnergy += amplitude * amplitude;
    });

    if (harmonicAmplitudes.size === 0) {
        harmonicAmplitudes.set(1, 1);
        highestHarmonic = 1;
        rmsEnergy = 1;
    }

    const real = new Float32Array(highestHarmonic + 1);
    const imag = new Float32Array(highestHarmonic + 1);

    harmonicAmplitudes.forEach((amplitude, harmonic) => {
        imag[harmonic] = amplitude;
    });

    const periodicWave = audioContext.createPeriodicWave(real, imag, {
        disableNormalization: true,
    });

    return {
        outputLevel: VOICE_LEVEL_TARGET / Math.max(1, Math.sqrt(rmsEnergy)),
        periodicWave,
        fundamentalFrequency,
    };
}

export class Voice {
    constructor(audioContext, wasmModule, frequencies, adsr) {
        this.audioContext = audioContext;
        this.wasmModule = wasmModule;
        this.frequencies = frequencies;
        this.adsr = clampAdsr(adsr);

        this.masterBus = getOrCreateMasterBus(audioContext);
        this.outputGain = this.audioContext.createGain();
        this.outputGain.connect(this.masterBus.input);

        this.envelopeGain = this.audioContext.createGain();
        this.envelopeGain.gain.setValueAtTime(MIN_GAIN, this.audioContext.currentTime);
        this.envelopeGain.connect(this.outputGain);

        this.oscillator = this.audioContext.createOscillator();

        const { periodicWave, fundamentalFrequency, outputLevel } = buildWave(
            this.audioContext,
            this.frequencies,
        );

        this.outputGain.gain.setValueAtTime(outputLevel, this.audioContext.currentTime);
        this.oscillator.setPeriodicWave(periodicWave);
        this.oscillator.frequency.setValueAtTime(fundamentalFrequency, this.audioContext.currentTime);
        this.oscillator.connect(this.envelopeGain);
        this.oscillator.onended = () => this.cleanup();

        this.hasStarted = false;
        this.hasReleased = false;
    }

    start(when = this.audioContext.currentTime) {
        const now = this.audioContext.currentTime;
        const startTime = Math.max(now, when);
        const attack = Math.max(this.adsr.attack, MIN_SEGMENT_SECONDS);
        const decay = Math.max(this.adsr.decay, MIN_SEGMENT_SECONDS);
        const sustainLevel = Math.max(this.adsr.sustain, MIN_GAIN);
        const gainParam = this.envelopeGain.gain;

        if (!this.hasStarted) {
            this.oscillator.start(now);
            this.hasStarted = true;
        }

        gainParam.cancelScheduledValues(now);
        gainParam.setValueAtTime(MIN_GAIN, now);
        gainParam.setValueAtTime(MIN_GAIN, startTime);
        gainParam.linearRampToValueAtTime(1, startTime + attack);
        gainParam.exponentialRampToValueAtTime(sustainLevel, startTime + attack + decay);

        this.hasReleased = false;
    }

    stop(when = this.audioContext.currentTime) {
        if (!this.hasStarted || this.hasReleased) {
            return;
        }

        const stopTime = Math.max(this.audioContext.currentTime, when);
        const release = Math.max(this.adsr.release, MIN_SEGMENT_SECONDS);
        const gainParam = this.envelopeGain.gain;

        holdAtTime(gainParam, stopTime);
        gainParam.setTargetAtTime(MIN_GAIN, stopTime, Math.max(release * 0.25, MIN_SEGMENT_SECONDS));
        this.oscillator.stop(stopTime + release + RELEASE_STOP_PADDING_SECONDS);
        this.hasReleased = true;
    }

    cleanup() {
        this.oscillator.disconnect();
        this.envelopeGain.disconnect();
        this.outputGain.disconnect();
    }
}
