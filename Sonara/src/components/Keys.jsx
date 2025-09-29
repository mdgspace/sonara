import { useState, useEffect, useRef, useCallback, use } from 'react';
import { createWaveform } from '../utils';
import './Keys.css';

const waveimages = {
    sine:'../../sine.png', 
    square:'../../square.png', 
    triangle:'../../triangle.png', 
    sawtooth:'../../sawtooth.png'
};
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

function Keys({ onNoteDown, onNoteUp }) {
    const [waveform, setWaveform] = useState('sawtooth');
    const [octave, setOctave] = useState(4);
    const [activeKeys, setActiveKeys] = useState(new Set());


    const handleKeyDown = useCallback((note) => {
        const baseFreq = noteFrequencies[note] * Math.pow(2, octave - 4);
        const wave = createWaveform(waveform, baseFreq);
        onNoteDown(note, wave);
        setActiveKeys(prev => new Set(prev).add(note)); // For UI update
    }, [octave, waveform, onNoteDown]);

    const handleKeyUp = useCallback((note) => {
        onNoteUp(note);
        setActiveKeys(prev => {
            const newSet = new Set(prev);
            newSet.delete(note);
            return newSet;
        }); // For UI update
    }, [onNoteUp]);

    useEffect(() => {
        const keydownListener = (e) => {
            const note = keyMap[e.key.toLowerCase()];
            if (note && !activeKeys.has(note)) {
                e.preventDefault();
                handleKeyDown(note);
            }
        };

        const keyupListener = (e) => {
            const note = keyMap[e.key.toLowerCase()];
            if (note) {
                e.preventDefault();
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
                    <img src={waveimages[waveform]} alt={waveform} width="50%" height='50%' />
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