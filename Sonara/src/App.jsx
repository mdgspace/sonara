import { useState, useEffect, useRef } from 'react';
import Display from './components/Display';

function App() {
    const xRange = [20, 20000];
    const displayWidth = 800;
    const displayHeight = 400;

    // Initial state for 5 nodes, evenly spaced in the new xRange
    const initialNodes = Array.from({ length: 5 }, (_, i) => ({
        x: xRange[0] + (i / 4) * (xRange[1] - xRange[0]),
        y: 0.5
    }));

    // Initial state for 4 curves (for 5 nodes), all set to 1
    const initialCurves = Array(initialNodes.length - 1).fill(1);

    const [nodes, setNodes] = useState(initialNodes);
    const [curves, setCurves] = useState(initialCurves);
    const [oscillatorType, setOscillatorType] = useState('sine');
    const [frequency, setFrequency] = useState(440);
    const [isPlaying, setIsPlaying] = useState(false);
    const [wasmModule, setWasmModule] = useState(null);

    const audioContextRef = useRef(null);
    const sourceNodeRef = useRef(null);

    // Effect to load the WASM module on component mount
    useEffect(() => {

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

    async function initWasmModule() {
        const wasm = await window.Module({
            locateFile: (path) => "/dsp.wasm",
        });
        setWasmModule(wasm);
    }

    const handlePlayClick = async () => {
        console.log("handlePlayClick called");
        if (isPlaying) {
            // Stop the sound
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

        setIsPlaying(true);

        // const sampleRate = audioContextRef.current.sampleRate;
        const sampleRate = 44100;
        const duration = 1.0; // 1 second duration
        const freqAmpPairs = [[500, 1]]; // 500Hz sine wave with amplitude 1

        // 1. Generate PCM data from WASM
        const pcmDataVector = wasmModule.generatePcmData(freqAmpPairs, sampleRate, duration);
        alert(`pcmDataVector: ${JSON.stringify(pcmDataVector)}`);
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
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
            setIsPlaying(false);
            sourceNodeRef.current = null;
        };
        source.start(0);
        sourceNodeRef.current = source;
    };

    return (
        <div className="App">
            <h1>Sonara</h1>
            <div>
                <label htmlFor="osc-type">Oscillator Type: </label>
                <select id="osc-type" value={oscillatorType} onChange={(e) => setOscillatorType(e.target.value)}>
                    <option value="sine">Sine</option>
                    <option value="square">Square</option>
                    <option value="sawtooth">Sawtooth</option>
                    <option value="triangle">Triangle</option>
                </select>
            </div>
            <div>
                <label htmlFor="frequency">Frequency: {frequency.toFixed(2)} Hz</label>
                <input
                    type="range"
                    id="frequency"
                    min="20"
                    max="20000"
                    step="1"
                    value={frequency}
                    onChange={(e) => setFrequency(Number(e.target.value))}
                />
            </div>
            <Display
                width={displayWidth}
                height={displayHeight}
                nodes={nodes}
                xRange={xRange}
                curves={curves}
                onNodesChange={setNodes}
                onCurvesChange={setCurves}
            />
            <button onClick={handlePlayClick}>
                {isPlaying ? 'Stop' : 'Play'}
            </button>
        </div>
    );
}
export default App;