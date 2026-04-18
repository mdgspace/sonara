import { useEffect, useMemo, useRef, useState } from "react";

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_SECONDS = 0.1;
const START_LATENCY_SECONDS = 0.05;
const UI_RELEASE_PADDING_MS = 30;

function getSequenceDuration(events) {
    if (!events || events.length === 0) {
        return 0;
    }

    return events.reduce(
        (maxDuration, event) => Math.max(maxDuration, event.time + (event.duration || 0)),
        0,
    );
}

function buildWaveform(wasmModule, waveform, frequency) {
    const wasmWave = wasmModule.createWaveform(waveform, frequency);
    const jsWave = [];

    for (let i = 0; i < wasmWave.size(); i += 1) {
        const pair = wasmWave.get(i);
        jsWave.push([pair.get(0), pair.get(1)]);
    }

    wasmWave.delete();
    return jsWave;
}

function useSequencePlayer({
    events = [],
    loop = false,
    onNoteDown,
    onNoteUp,
    wasmModule,
    waveform,
    octave,
    noteFrequencies,
    audioContext,
}) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [highlightedKey, setHighlightedKey] = useState(null);
    const nextEventIndexRef = useRef(0);
    const loopStartTimeRef = useRef(0);
    const schedulerRef = useRef(null);
    const completionTimeoutRef = useRef(null);
    const scheduledUiTimeoutsRef = useRef([]);
    const activeNotesRef = useRef(new Map());
    const playbackTokenRef = useRef(0);

    const sequenceDuration = useMemo(() => getSequenceDuration(events), [events]);

    const clearUiTimeouts = () => {
        scheduledUiTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
        scheduledUiTimeoutsRef.current = [];
    };

    const clearScheduler = () => {
        if (schedulerRef.current) {
            window.clearInterval(schedulerRef.current);
            schedulerRef.current = null;
        }

        if (completionTimeoutRef.current) {
            window.clearTimeout(completionTimeoutRef.current);
            completionTimeoutRef.current = null;
        }
    };

    const releaseAllNotes = (releaseTime) => {
        activeNotesRef.current.forEach((_, note) => {
            if (onNoteUp) {
                onNoteUp(note, releaseTime);
            }
        });
        activeNotesRef.current.clear();
    };

    const stopPlaybackState = (releaseTime = audioContext?.currentTime || 0) => {
        clearScheduler();
        clearUiTimeouts();
        releaseAllNotes(releaseTime);
        nextEventIndexRef.current = 0;
        setHighlightedKey(null);
        setIsPlaying(false);
    };

    const scheduleUiFeedback = (note, noteOnTime, noteOffTime, playbackToken) => {
        if (!audioContext) {
            return;
        }

        const now = audioContext.currentTime;
        const noteOnDelay = Math.max(0, (noteOnTime - now) * 1000);
        const noteOffDelay = Math.max(0, (noteOffTime - now) * 1000 + UI_RELEASE_PADDING_MS);

        const noteOnTimeoutId = window.setTimeout(() => {
            if (playbackTokenRef.current !== playbackToken) {
                return;
            }

            setHighlightedKey(note);
        }, noteOnDelay);

        const noteOffTimeoutId = window.setTimeout(() => {
            if (playbackTokenRef.current !== playbackToken) {
                return;
            }

            const activeCount = activeNotesRef.current.get(note) || 0;
            if (activeCount <= 1) {
                activeNotesRef.current.delete(note);
            } else {
                activeNotesRef.current.set(note, activeCount - 1);
            }
            setHighlightedKey((currentKey) => (currentKey === note ? null : currentKey));
        }, noteOffDelay);

        scheduledUiTimeoutsRef.current.push(noteOnTimeoutId, noteOffTimeoutId);
    };

    const scheduleEvent = (event, playbackToken) => {
        if (!audioContext || !onNoteDown || !onNoteUp || !wasmModule || !noteFrequencies) {
            return;
        }

        const baseFrequency = noteFrequencies[event.key] * Math.pow(2, octave - 4);
        const rawWave = buildWaveform(wasmModule, waveform, baseFrequency);
        const noteOnTime = loopStartTimeRef.current + event.time;
        const noteOffTime = noteOnTime + Math.max(0, event.duration || 0);

        onNoteDown(event.key, rawWave, noteOnTime);
        onNoteUp(event.key, noteOffTime);
        activeNotesRef.current.set(event.key, (activeNotesRef.current.get(event.key) || 0) + 1);
        scheduleUiFeedback(event.key, noteOnTime, noteOffTime, playbackToken);
    };

    const play = async () => {
        if (isPlaying || !audioContext || !events || events.length === 0) {
            return;
        }

        if (audioContext.state === "suspended") {
            await audioContext.resume();
        }

        playbackTokenRef.current += 1;
        clearScheduler();
        clearUiTimeouts();
        activeNotesRef.current.clear();

        const playbackToken = playbackTokenRef.current;
        const transportStartTime = audioContext.currentTime + START_LATENCY_SECONDS;

        nextEventIndexRef.current = 0;
        loopStartTimeRef.current = transportStartTime;
        setHighlightedKey(null);
        setIsPlaying(true);

        const scheduleAhead = () => {
            if (!audioContext) {
                return;
            }

            const horizon = audioContext.currentTime + SCHEDULE_AHEAD_SECONDS;

            while (events.length > 0) {
                if (nextEventIndexRef.current >= events.length) {
                    if (!loop || sequenceDuration <= 0) {
                        break;
                    }

                    nextEventIndexRef.current = 0;
                    loopStartTimeRef.current += sequenceDuration;
                }

                const event = events[nextEventIndexRef.current];
                const eventStartTime = loopStartTimeRef.current + event.time;

                if (eventStartTime > horizon) {
                    break;
                }

                scheduleEvent(event, playbackToken);
                nextEventIndexRef.current += 1;
            }
        };

        schedulerRef.current = window.setInterval(scheduleAhead, LOOKAHEAD_MS);
        scheduleAhead();

        if (!loop) {
            const stopDelay = (START_LATENCY_SECONDS + sequenceDuration) * 1000;
            completionTimeoutRef.current = window.setTimeout(() => {
                if (playbackTokenRef.current !== playbackToken) {
                    return;
                }

                clearScheduler();
                setIsPlaying(false);
            }, Math.max(stopDelay, 0));
        }
    };

    const stop = () => {
        if (!isPlaying) {
            return;
        }

        playbackTokenRef.current += 1;
        stopPlaybackState(audioContext?.currentTime || 0);
    };

    useEffect(() => () => {
        playbackTokenRef.current += 1;
        clearScheduler();
        clearUiTimeouts();
        releaseAllNotes(audioContext?.currentTime || 0);
    }, [audioContext]);

    return { isPlaying, highlightedKey, play, stop };
}

export default useSequencePlayer;
