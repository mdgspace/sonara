import { useState, useEffect, useCallback } from 'react';
import { noteFrequencies, keyMap, notes, waveimages } from '../static';
import useSequencePlayer from '../hooks/useSequencePlayer';

function Keys({ onNoteDown, onNoteUp, wasmModule, event = [], waveform, setWaveform, areKeysEnabled, audioContext }) {
    const [octave, setOctave] = useState(4);
    const [activeKeys, setActiveKeys] = useState(new Set());

    const { isPlaying, highlightedKey, play, stop } = useSequencePlayer({
        events: event,
        loop: true,
        onNoteDown,
        onNoteUp,
        wasmModule,
        waveform,
        octave,
        noteFrequencies,
        audioContext,
    });

    const handlePlay = () => {
        if (isPlaying) {
            stop();
        } else {
            play();
        }
    };
    
    // Handle key press to play a note
    const handleKeyDown = useCallback((note) => {
        if (!wasmModule) {
            return;
        }

        const baseFreq = noteFrequencies[note] * Math.pow(2, octave - 4);
        const wasmWave = wasmModule.createWaveform(waveform, baseFreq);

        // Convert the WASM vector to a JS array before passing it up
        const jsWave = [];
        for (let i = 0; i < wasmWave.size(); i++) {
            const pair = wasmWave.get(i);
            jsWave.push([pair.get(0), pair.get(1)]);
        }
        wasmWave.delete();

        onNoteDown(note, jsWave);
        setActiveKeys(prev => new Set(prev).add(note)); // For UI update
    }, [octave, waveform, onNoteDown, wasmModule]);

    // Handle key release to stop a note
    const handleKeyUp = useCallback((note) => {
        onNoteUp(note);
        setActiveKeys(prev => {
            const newSet = new Set(prev);
            newSet.delete(note);
            return newSet;
        }); // For UI update
    }, [onNoteUp]);

    useEffect(() => {
        if (!areKeysEnabled) return;
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
    }, [activeKeys, areKeysEnabled, handleKeyDown, handleKeyUp]);

    return (
        <div className="keys-container">
            <div className="oscillator">
                {/* Display selected waveform */}
                <div className="waveform-display">
                    <img src={waveimages[waveform]} alt={waveform} width="50%" height='50%' />
                </div>
                <div className="key-settings">
                    {/* Waveform selection */}
                    <div className="control-group">
                        <select id="osc-type" value={waveform} onChange={(e) => setWaveform(e.target.value)}>
                            <option value="sine">Sine</option>
                            <option value="square">Square</option>
                            <option value="sawtooth">Sawtooth</option>
                            <option value="triangle">Triangle</option>
                        </select>
                    </div>

                    {/* Octave selection */}
                    <div className="control-group">
                        <select id="octave" value={octave} onChange={(e) => setOctave(Number(e.target.value))}>
                            {[...Array(6)].map((_, i) => (
                                <option key={i + 3} value={i + 3}>
                                    {i + 3}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Render piano keys */}
            <div className="piano-keys-wrapper">
                <div className="piano-keys">
                    <button className="play-ai-button" onClick={handlePlay} disabled={!event || event.length === 0}>
                        {isPlaying ? 'Stop' : 'Play (AI)'}
                    </button>

                    {notes.map((note) => (
                        <div
                            key={note}
                            className={`key ${activeKeys.has(note) || highlightedKey === note ? 'active' : ''}`}
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
        </div>
    );
}

export default Keys;
