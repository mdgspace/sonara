import { useState, useEffect, useRef } from 'react';
import EQ from '../components/Equalizers';
import Keys from '../components/Keys';
import ADSR from '../components/Adsr';
import PresetControls from '../components/PresetControls';
import { Voice } from '../audio/Voice';

import { applyEnvelope } from '../utils/applyEnvelope';

function Sonara() {
    const displayWidth = 800;
    const displayHeight = 350;

    const DEFAULT_ADSR = { attack: 0.1, decay: 0.2, sustain: 0.7, release: 0.5 };
    const DEFAULT_EQ = { nodes: [], curves: [] };
    const DEFAULT_WAVEFORM = 'sine';
    const DEFAULT_OCTAVE = 4;

    const [adsr, setAdsr] = useState(DEFAULT_ADSR);
    const [eq, setEq] = useState(DEFAULT_EQ);
    const [waveform, setWaveform] = useState(DEFAULT_WAVEFORM);
    const [octave, setOctave] = useState(DEFAULT_OCTAVE);
    const [wasmModule, setWasmModule] = useState(null);
    const [rawwave, setRawwave] = useState([]);

    const audioContextRef = useRef(null);
    const voicesRef = useRef({});

    const synthState = {
    adsr,
    eq,
    waveform,
    octave,
    rawwave,
    };

    useEffect(() => {
        async function initWasmModule() {
            const wasm = await window.Module({
                locateFile: () => "/dsp.wasm",
            });
            setWasmModule(wasm);
        }

        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }

        initWasmModule();

        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
        };
    }, []);


    const handleNoteDown = async (note, rawWave) => {
        if (!wasmModule || !audioContextRef.current) return;

        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        if (voicesRef.current[note]) {
            voicesRef.current[note].stop();
        }

        const freq = applyEnvelope(eq.nodes, eq.curves, rawWave);
        setRawwave(rawWave);

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

    const handlePresetLoad = (preset) => {
    if (preset.adsr) setAdsr(preset.adsr);
    if (preset.eq) setEq(preset.eq);
    if (preset.waveform) setWaveform(preset.waveform);
    if (preset.octave) setOctave(preset.octave);
    if (preset.rawwave) setRawwave(preset.rawwave);
    };

    return (
        <div className="App">
            <h1>Sonara</h1>

            <PresetControls synthState={synthState} onPresetLoad={handlePresetLoad} /> 

            <Keys onNoteDown={handleNoteDown} onNoteUp={handleNoteUp} />
            <ADSR adsr={adsr} setAdsr={setAdsr} />
            <EQ
                setEq={setEq}
                eq={eq}
                width={displayWidth}
                height={displayHeight}
                freqs={rawwave}
                wasmModule={wasmModule}
            />
        </div>
    );
}

export default Sonara;
