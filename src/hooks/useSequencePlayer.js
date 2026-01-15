import { useState, useRef, useEffect } from "react";

function useSequencePlayer({ events = [], loop = false, onNoteDown, onNoteUp, wasmModule, waveform, octave, noteFrequencies }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [highlightedKey, setHighlightedKey] = useState(null);
    const idxRef = useRef(0);
    const timeoutRef = useRef(null);
    const startTimeRef = useRef(null);

    const clear = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    const scheduleNext = () => {
        clear();
        const idx = idxRef.current;
        if (!events || idx >= events.length) {
            if (loop) {
                const duration = events.length > 0 ? events[events.length - 1].time + 0.5 : 0;
                startTimeRef.current += duration * 1000;
                idxRef.current = 0;
                scheduleNext();
            } else {
                setIsPlaying(false);
                setHighlightedKey(null);
            }
            return;
        }

        const ev = events[idx];
        const now = performance.now();
        const targetMs = startTimeRef.current + ev.time * 1000;
        const delay = Math.max(0, Math.round(targetMs - now));

        timeoutRef.current = setTimeout(() => {
            setHighlightedKey(ev.key);

            if (onNoteDown && wasmModule && noteFrequencies) {
                const baseFreq = noteFrequencies[ev.key] * Math.pow(2, octave - 4);
                const wasmWave = wasmModule.createWaveform(waveform, baseFreq);
                const jsWave = [];
                for (let i = 0; i < wasmWave.size(); i++) {
                    const pair = wasmWave.get(i);
                    jsWave.push([pair.get(0), pair.get(1)]);
                }
                wasmWave.delete();
                onNoteDown(ev.key, jsWave);
            }

            setTimeout(() => {
                if (onNoteUp) {
                    onNoteUp(ev.key);
                }
            }, 200); // Fixed duration for the note

            idxRef.current = idx + 1;
            scheduleNext();
        }, delay);
    };

    const play = () => {
        if (isPlaying || !events || events.length === 0) return;
        setIsPlaying(true);
        startTimeRef.current = performance.now();
        idxRef.current = 0;
        scheduleNext();
    };

    const stop = () => {
        if (!isPlaying) return;
        setIsPlaying(false);
        clear();
        idxRef.current = 0;
        setHighlightedKey(null);
    };

    useEffect(() => {
        return () => clear();
    }, []);

    return { isPlaying, highlightedKey, play, stop };
}

export default useSequencePlayer;
