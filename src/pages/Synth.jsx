import { useState, useEffect, useRef, useMemo } from 'react';
import EQ from '../components/Equalizers';
import Keys from '../components/Keys';
import ADSR from '../components/Adsr';
import MusicSequenceGenerator from '../components/AI_Integration';
import { Voice } from '../audio/Voice';
 
function Synth() {
    const displayWidth = 800;
    const displayHeight = 350;

    const [sequence, setSequence] = useState([]);
    const memoEvents = useMemo(() => sequence.events || [], [sequence.events]);
    const [adsr, setAdsr] = useState({ attack: 0.1, decay: 0.2, sustain: 0.7, release: 0.5 });
    const [wasmModule, setWasmModule] = useState(null);
    const [rawwave, setRawwave] = useState([]);
    const audioContextRef = useRef(null);
    const voicesRef = useRef({}); 
    const [eq, setEq] = useState(null);

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

        let freq = rawWave;
        if (eq && eq.nodes && eq.curves && wasmModule) {
            const nodesVec = new wasmModule.VectorNode();
            eq.nodes.forEach(node => nodesVec.push_back(node));

            const curvesVec = new wasmModule.VectorDouble();
            eq.curves.forEach(curve => curvesVec.push_back(curve));

            const freqsVec = new wasmModule.VectorVectorDouble();
            rawWave.forEach(freqPair => {
                const pair = new wasmModule.VectorDouble();
                pair.push_back(freqPair[0]);
                pair.push_back(freqPair[1]);
                freqsVec.push_back(pair);
                pair.delete();
            });
 
            const wasmFreq = wasmModule.applyEnvelope(nodesVec, curvesVec, freqsVec);
            // Convert the wasm vector to a JS array before passing to Voice
            const jsFreq = [];
            for (let i = 0; i < wasmFreq.size(); i++) {
                const pair = wasmFreq.get(i);
                jsFreq.push([pair.get(0), pair.get(1)]);
            }
            freq = jsFreq;
            wasmFreq.delete();

            nodesVec.delete();
            curvesVec.delete();
            freqsVec.delete();
        }
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

    return (
        <div className="App">
            <div className="grid-container">
                <div className="title">
                    <h1>Sonara</h1>
                </div>
                <MusicSequenceGenerator
                    setSequence={setSequence}
                    className="ai-integration"
                />
                <Keys 
                    onNoteDown={handleNoteDown} 
                    onNoteUp={handleNoteUp} 
                    wasmModule={wasmModule}
                    event={memoEvents} 
                    sequence={sequence}
                />
                <ADSR 
                    adsr={adsr} 
                    setAdsr={setAdsr}
                    className="adsr" 
                />
                <EQ
                    setEq={setEq}
                    eq={eq}
                    width={displayWidth}
                    height={displayHeight}
                    freqs={rawwave}
                    wasmModule={wasmModule}
                />
            </div>
        </div>
    );
}

export default Synth;
