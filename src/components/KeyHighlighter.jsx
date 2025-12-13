import { useState, useRef, useEffect } from "react";


//  Simple scheduler using one-shot setTimeouts.
  // events is a sorted array of { key, time } where time is seconds from start.
 

// here we just update the highlighted keys by checking the time after which the subsequent key has to be gihlighted
function useSimpleEventHighlighter(events = []) {
  const [highlightedKey, setHighlightedKey] = useState(null);
  const idxRef = useRef(0);
  const timeoutRef = useRef(null);
  const startTimeRef = useRef(null); // stores the time when sequence started/function was called

  const clear = () => { //clear the timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const scheduleNext = () => { // core logic
    clear();
    const idx = idxRef.current;
    if (!events || idx >= events.length) {
      setHighlightedKey(null);
      return;
    }

    const ev = events[idx];
    const now = performance.now();
    const targetMs = startTimeRef.current + ev.time * 1000; //how many sec after start the event is present
    const delay = Math.max(0, Math.round(targetMs - now));// sub the current time to get the delay

    if (delay > 60000) {
      return; // dont proceed if delay too large
    }

    timeoutRef.current = setTimeout(() => { 
      setHighlightedKey(ev.key);
        console.log("highlighted key:", ev.key);
      idxRef.current = idx + 1;
      scheduleNext();
    }, delay);
  };

  const start = (startWallTimeMs = performance.now()) => { // to start the sequence
    clear();
    startTimeRef.current = startWallTimeMs;
    idxRef.current = 0;
    scheduleNext();
  };

  const stop = () => {
    clear();
    idxRef.current = 0;
    setHighlightedKey(null);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => clear();
  }, []);



  return { highlightedKey, start, stop };
}



export default useSimpleEventHighlighter;