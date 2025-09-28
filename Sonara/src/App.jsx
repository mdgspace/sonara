import { useState, useEffect, useRef } from 'react';
import EQ from './components/EQ';
import Keys from './components/Keys';
import { play } from './audio';

function App() {
    const displayWidth = 800;
    const displayHeight = 250;

    const [freqs, setFreqs] = useState([]); // Harmonics from Keys component
    const [eqFreqs, setEqFreqs] = useState([]); // Harmonics after EQ is applied
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

    // Effect to automatically play/stop sound when eqFreqs change
    useEffect(() => {
        const handlePlayback = async () => {
            // Stop any currently playing sound
            if (audioControlRef.current) {
                audioControlRef.current.stop();
                audioControlRef.current = null;
            }

            // If there are frequencies to play and the WASM module is loaded, start new sound
            if (wasmModule && eqFreqs.length > 0) {
                const audioControl = await play(wasmModule, eqFreqs);
                if (audioControl) {
                    audioControlRef.current = audioControl;
                }
            }
        };

        handlePlayback();
    }, [eqFreqs, wasmModule]);
    return (
        <div className="App">
            <h1>Sonara</h1>

            <Keys setFreqs={setFreqs} />

            <EQ
                freqs={freqs}
                setEqFreqs={setEqFreqs}
                width={displayWidth}
                height={displayHeight}
            />

        </div>
    );
}

export default App;