import { useState, useEffect, useRef } from 'react';
import EQ from './components/EQ';
import { createWaveform } from './utils';

function App() {
    const displayWidth = 800;
    const displayHeight = 250;

    const [waveform, setWaveform] = useState('sawtooth');
    const [baseFreq, setBaseFreq] = useState(440);
    const [freqs, setFreqs] = useState([]); // Raw harmonics
    const [eqFreqs, setEqFreqs] = useState([]); // Harmonics after EQ
    const [isPlaying, setIsPlaying] = useState(false);
    const [wasmModule, setWasmModule] = useState(null);

    const audioContextRef = useRef(null);
    const sourceNodeRef = useRef(null);

    // Effect to load the WASM module and initialize AudioContext on component mount
    useEffect(() => {
        async function initWasmModule() {
            const wasm = await window.Module({
                locateFile: (path) => "/dsp.wasm",
            });
            setWasmModule(wasm);
        }

        initWasmModule();
        // Initialize AudioContext
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();

        return () => {
            // Cleanup audio context on component unmount
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    // Effect to regenerate the base waveform when type or frequency changes
    useEffect(() => {
        const newFreqs = createWaveform(waveform, baseFreq);
        setFreqs(newFreqs);
    }, [waveform, baseFreq]);

    const handlePlayClick = async () => {
        if (isPlaying) {
            if (sourceNodeRef.current) {
                sourceNodeRef.current.stop();
                sourceNodeRef.current = null;
            }
            setIsPlaying(false);
            return;
        }

        if (!wasmModule || !audioContextRef.current) {
            console.error("WASM module or AudioContext not ready.");
            return;
        }

        // Resume AudioContext if it's in a suspended state (required by modern browsers)
        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        const sampleRate = 44100;
        const duration = 1.0; // 2 seconds duration

        // Convert JS array of pairs to WASM Vector of Vectors
        const freqAmpPairs = new wasmModule.VectorVectorDouble();
        eqFreqs.forEach(([freq, amp]) => {
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
        const audioBuffer = audioContextRef.current.createBuffer(1, float32Data.length, sampleRate);
        audioBuffer.copyToChannel(float32Data, 0);

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.loop = true; // Loop the sound
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
            setIsPlaying(false);
            sourceNodeRef.current = null;
        };
        source.start(0);
        sourceNodeRef.current = source;
        setIsPlaying(true);
    };

    return (
        <div className="App">
            <h1>Sonara</h1>
            <div className="controls">
                <div className="control-group">
                    <label htmlFor="osc-type">Waveform: </label>
                    <select id="osc-type" value={waveform} onChange={(e) => setWaveform(e.target.value)}>
                        <option value="sine">Sine</option>
                        <option value="square">Square</option>
                        <option value="sawtooth">Sawtooth</option>
                        <option value="triangle">Triangle</option>
                    </select>
                </div>
                <div className="control-group">
                    <label htmlFor="frequency">Base Frequency: {baseFreq.toFixed(0)} Hz</label>
                    <input
                        type="range"
                        id="frequency"
                        min="20"
                        max="5000" // A max of 5kHz is more practical for a slider
                        step="1"
                        value={baseFreq}
                        onChange={(e) => setBaseFreq(Number(e.target.value))}
                    />
                </div>
            </div>

            <EQ
                freqs={freqs}
                setEqFreqs={setEqFreqs}
                width={displayWidth}
                height={displayHeight}
            />

            <button onClick={handlePlayClick} disabled={!wasmModule}>
                {isPlaying ? 'Stop' : 'Play'}
            </button>
        </div>
    );
}

export default App;