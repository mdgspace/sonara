import { useState, useEffect, useRef } from 'react';
import EQ from './components/EQ';
import Keys from './components/Keys';
import ADSR from './components/ADSR';
import { Voice } from './audio';
import './components/ADSR.css';
import './App.css';
import './components/Keys.css';
import './components/Display.css';
import './components/EQ.css';

import { applyEnvelope } from './utils';

function App() {
    const displayWidth = 800;
    const displayHeight = 250;

    const [adsr, setAdsr] = useState({ attack: 0.1, decay: 0.2, sustain: 0.7, release: 0.5 });
    const [wasmModule, setWasmModule] = useState(null);
    const [rawwave, setRawwave] = useState([]);
    // Refs for audio context and active voices
    const audioContextRef = useRef(null);
    const voicesRef = useRef({}); // Map of note -> Voice object

    // Effect to load WASM and initialize AudioContext
    useEffect(() => {
        async function initWasmModule() {
            const wasm = await window.Module({
                locateFile: (path) => "/dsp.wasm",
            });
            setWasmModule(wasm);
        }

        // Initialize AudioContext
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }

        initWasmModule();

        return () => {
            // Cleanup audio context on component unmount
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
        };
    }, []);

    // This state will hold the envelope shape from the EQ component
    const [eq, setEq] = useState({ nodes: [], curves: [] });


    const handleNoteDown = async (note, rawWave) => {
        if (!wasmModule || !audioContextRef.current) return;

        // Resume AudioContext if it's suspended
        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        // Stop existing voice for this note if it exists
        if (voicesRef.current[note]) {
            voicesRef.current[note].stop();
        }

        // Apply the current EQ envelope to the raw waveform from the Keys component
        const freq = applyEnvelope(eq.nodes, eq.curves, rawWave)
        setRawwave(rawWave); console.log(rawwave);

        // Create and start a new voice
        const voice = new Voice(audioContextRef.current, wasmModule, freq, adsr);
        voicesRef.current[note] = voice;
        voice.start();
    };

    const handleNoteUp = (note) => {
        if (voicesRef.current[note]) {
            voicesRef.current[note].stop();
            delete voicesRef.current[note];
        }
    };

        return (
            <div className="App">
                <h1>Sonara</h1>

                <Keys onNoteDown={handleNoteDown} onNoteUp={handleNoteUp} />

                <ADSR adsr={adsr} setAdsr={setAdsr} />

                <EQ
                    setEq={setEq}
                    eq={eq}
                    width={displayWidth}
                    height={displayHeight}
                    freqs={rawwave}
                />

            </div>
        );
}

export default App;