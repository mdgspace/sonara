import { useState, useEffect, useRef } from 'react';
import EQ from './components/EQ';
import { createWaveform } from './utils';
import { play } from './audio';

function App() {
    const displayWidth = 800;
    const displayHeight = 250;

    const [waveform, setWaveform] = useState('sawtooth');
    const [baseFreq, setBaseFreq] = useState(440);
    const [freqs, setFreqs] = useState([]); // Raw harmonics
    const [eqFreqs, setEqFreqs] = useState([]); // Harmonics after EQ
    const [isPlaying, setIsPlaying] = useState(false);
    const [wasmModule, setWasmModule] = useState(null);
    const audioControlRef = useRef(null);

    // Effect to load the WASM module and initialize AudioContext on component mount
    useEffect(() => {
        async function initWasmModule() {
            const wasm = await window.Module({
                locateFile: (path) => "/dsp.wasm",
            });
            setWasmModule(wasm);
        }
        initWasmModule();

        return () => {
            if (audioControlRef.current) {
                audioControlRef.current.stop();
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
            if (audioControlRef.current) {
                audioControlRef.current.stop();
                audioControlRef.current = null;
            }
            setIsPlaying(false);
        } else {
            const audioControl = await play(wasmModule, eqFreqs);
            if (audioControl) {
                audioControlRef.current = audioControl;
                setIsPlaying(true);
            }
        }
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
                        max="5000" 
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