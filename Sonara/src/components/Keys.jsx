import { useState, useEffect, useRef, useCallback } from 'react';
import { createWaveform } from '../utils';
import './Keys.css';

const noteFrequencies = {
    'C': 261.63, // C4
    'D': 293.66,
    'E': 329.63,
    'F': 349.23,
    'G': 392.00,
    'A': 440.00,
    'B': 493.88,
};

const keyMap = { 'z': 'C', 'x': 'D', 'c': 'E', 'v': 'F', 'b': 'G', 'n': 'A', 'm': 'B' };
const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

function Keys({ setFreqs }) {
    const [waveform, setWaveform] = useState('sawtooth');
    const [octave, setOctave] = useState(4);
    const [activeKeys, setActiveKeys] = useState(new Set());
    const canvasRef = useRef(null);

    const drawWaveform = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#00c8ff';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const wave = createWaveform(waveform, 1); // Use base freq of 1 for shape
        const combinedWave = (x) => {
            let y = 0;
            for (const [freq, amp] of wave) {
                y += Math.sin(x * 2 * Math.PI * freq) * amp;
            }
            return y;
        };

        let maxAmp = 0;
        for (let i = 0; i < width; i++) {
            const x = i / width * 2; // 2 cycles
            maxAmp = Math.max(maxAmp, Math.abs(combinedWave(x)));
        }
        
        const yScale = maxAmp > 0 ? (height / 2 * 0.8) / maxAmp : 1;

        ctx.moveTo(0, height / 2);
        for (let i = 0; i < width; i++) {
            const x = i / width * 2; // Draw 2 cycles
            const y = combinedWave(x);
            ctx.lineTo(i, height / 2 - y * yScale);
        }
        ctx.stroke();
    }, [waveform]);

    useEffect(() => {
        drawWaveform();
    }, [drawWaveform]);

    const updateParentFreqs = useCallback(() => {
        if (activeKeys.size === 0) {
            setFreqs([]);
            return;
        }

        let allFreqs = [];
        activeKeys.forEach(note => {
            const baseFreq = noteFrequencies[note] * Math.pow(2, octave - 4);
            const newWave = createWaveform(waveform, baseFreq);
            allFreqs = allFreqs.concat(newWave);
        });

        setFreqs(allFreqs);
    }, [activeKeys, octave, waveform, setFreqs]);

    useEffect(() => {
        updateParentFreqs();
    }, [updateParentFreqs]);

    const handleKeyDown = useCallback((note) => {
        setActiveKeys(prev => new Set(prev).add(note));
    }, []);

    const handleKeyUp = useCallback((note) => {
        setActiveKeys(prev => {
            const newSet = new Set(prev);
            newSet.delete(note);
            return newSet;
        });
    }, []);

    useEffect(() => {
        const keydownListener = (e) => {
            const note = keyMap[e.key.toLowerCase()];
            if (note && !activeKeys.has(note)) {
                handleKeyDown(note);
            }
        };

        const keyupListener = (e) => {
            const note = keyMap[e.key.toLowerCase()];
            if (note) {
                handleKeyUp(note);
            }
        };

        window.addEventListener('keydown', keydownListener);
        window.addEventListener('keyup', keyupListener);

        return () => {
            window.removeEventListener('keydown', keydownListener);
            window.removeEventListener('keyup', keyupListener);
        };
    }, [activeKeys, handleKeyDown, handleKeyUp]);

    return (
        <div className="keys-container">
            <div className="settings-row">
                <div className="control-group">
                    <label htmlFor="osc-type">Waveform</label>
                    <select id="osc-type" value={waveform} onChange={(e) => setWaveform(e.target.value)}>
                        <option value="sine">Sine</option>
                        <option value="square">Square</option>
                        <option value="sawtooth">Sawtooth</option>
                        <option value="triangle">Triangle</option>
                    </select>
                </div>

                <div className="waveform-display">
                    <canvas ref={canvasRef} width="150" height="50"></canvas>
                </div>

                <div className="control-group">
                    <label htmlFor="octave">Octave</label>
                    <select id="octave" value={octave} onChange={(e) => setOctave(Number(e.target.value))}>
                        {[...Array(6)].map((_, i) => (
                            <option key={i + 3} value={i + 3}>
                                {i + 3}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="piano-keys">
                {notes.map((note) => (
                    <div
                        key={note}
                        className={`key ${activeKeys.has(note) ? 'active' : ''}`}
                        onMouseDown={() => handleKeyDown(note)}
                        onMouseUp={() => handleKeyUp(note)}
                        onMouseLeave={() => handleKeyUp(note)}
                    >
                        <span className="key-label-note">{note}</span>
                        <span className="key-label-binding">{Object.keys(keyMap).find(k => keyMap[k] === note).toUpperCase()}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Keys;