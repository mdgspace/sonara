import React, { useState, useEffect, useRef, useCallback } from 'react';

const Synthesizer = () => {
  const [wasmModule, setWasmModule] = useState(null);
  const [audioContext, setAudioContext] = useState(null);
  const [scriptProcessor, setScriptProcessor] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeNotes, setActiveNotes] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);

  const startedNotes = useRef(new Set());

  const [params, setParams] = useState({
    master_volume: 0.5,
    attack: 0.1,
    release: 0.5
  });

  // Initialize WASM first (without audio)
  useEffect(() => {
    const initializeWasm = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Loading WebAssembly module...');
        
        // Load WASM module
        const wasmInstance = await window.SynthesizerModule({
          locateFile: (path) => `/wasm/${path}`
        });

        console.log('WASM module loaded:', wasmInstance);
        
        // Initialize the synthesizer
        const initResult = wasmInstance.ccall('init_synth', 'number', [], []);
        if (initResult !== 1) {
          throw new Error('Failed to initialize synthesizer');
        }

        console.log('Synthesizer initialized successfully');
        
        // No need to get audio buffer anymore - we use callbacks
        setWasmModule(wasmInstance);
        setIsLoading(false);
        setNeedsUserInteraction(true);
        
      } catch (error) {
        console.error('Failed to initialize WASM:', error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    // Load the WASM script first
    const script = document.createElement('script');
    script.src = '/wasm/synthesizer.js';
    script.onload = () => {
      if (typeof window.SynthesizerModule === 'function') {
        initializeWasm();
      } else {
        setError('SynthesizerModule not found after loading script');
        setIsLoading(false);
      }
    };
    script.onerror = () => {
      setError('Failed to load WASM script. Make sure synthesizer.js exists in public/wasm/');
      setIsLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Initialize Audio using callback-based approach
  const initializeAudio = async () => {
    if (!wasmModule || audioContext) return;

    try {
      console.log('Initializing audio system...');

      // Initialize AudioContext
      const ctx = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 44100,
        latencyHint: 'interactive'
      });

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      console.log('AudioContext state:', ctx.state);
      setAudioContext(ctx);

      // Use callback-based audio processing
      const bufferSize = 2048;
      const processor = ctx.createScriptProcessor(bufferSize, 0, 2);
      
      processor.onaudioprocess = (audioProcessingEvent) => {
        try {
          const outputBuffer = audioProcessingEvent.outputBuffer;
          const outputData0 = outputBuffer.getChannelData(0);
          const outputData1 = outputBuffer.getChannelData(1);
          const bufferLength = outputBuffer.length;

          // Generate audio sample by sample using WASM callback
          for (let i = 0; i < bufferLength; i++) {
            try {
              // Call WASM to generate each sample individually
              const sample = wasmModule.ccall('generate_sample', 'number', [], []);
              outputData0[i] = sample;
              outputData1[i] = sample; // Mono to stereo
            } catch (sampleError) {
              // If individual sample fails, use silence
              outputData0[i] = 0;
              outputData1[i] = 0;
            }
          }
          
        } catch (error) {
          console.error('Audio processing error:', error);
          // Keep output silent on any error
          const outputBuffer = audioProcessingEvent.outputBuffer;
          const outputData0 = outputBuffer.getChannelData(0);
          const outputData1 = outputBuffer.getChannelData(1);
          outputData0.fill(0);
          outputData1.fill(0);
        }
      };
      
      processor.connect(ctx.destination);
      setScriptProcessor(processor);
      
      // Set initial parameters
      try {
        wasmModule.ccall('set_parameter', null, ['number', 'number'], [0, params.master_volume]);
      } catch (paramError) {
        console.error('Failed to set initial parameters:', paramError);
      }
      
      setIsInitialized(true);
      setNeedsUserInteraction(false);
      
      console.log('Audio system initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      setError(error.message);
    }
  };

  // Update parameters
  const updateParameter = useCallback((paramName, value) => {
    setParams(prev => ({ ...prev, [paramName]: value }));
    
    if (wasmModule && isInitialized) {
      const paramMap = {
        'master_volume': 0,
        'attack': 1,
        'release': 2
      };
      
      const paramId = paramMap[paramName];
      if (paramId !== undefined) {
        try {
          wasmModule.ccall('set_parameter', null, ['number', 'number'], [paramId, value]);
        } catch (error) {
          console.error('Failed to set parameter:', error);
        }
      }
    }
  }, [wasmModule, isInitialized]);

  // Play note
  const playNote = useCallback(async (noteNumber) => {
    if (!wasmModule || !isInitialized) {
      console.log('Cannot play note - not initialized');
      return;
    }
    
    if (activeNotes.has(noteNumber)) {
      console.log('Note already playing:', noteNumber);
      return;
    }
    
    if (audioContext && audioContext.state === 'suspended') {
      try {
        await audioContext.resume();
      } catch (error) {
        console.error('Failed to resume audio context:', error);
        return;
      }
    }
    
    try {
      console.log('Playing note:', noteNumber);
      wasmModule.ccall('note_on', null, ['number', 'number'], [noteNumber, 1.0]);
      setActiveNotes(prev => new Set([...prev, noteNumber]));
      startedNotes.current.add(noteNumber); // Track that this note was actually started
    } catch (error) {
      console.error('Failed to play note:', error);
    }
  }, [wasmModule, audioContext, isInitialized, activeNotes]);

  // Stop note - only if it was actually started
  const stopNote = useCallback((noteNumber) => {
    if (!wasmModule || !isInitialized) return;
    
    // Only stop the note if it was actually started
    if (!startedNotes.current.has(noteNumber)) {
      return; // Note was never started, don't try to stop it
    }
    
    try {
      console.log('Stopping note:', noteNumber);
      wasmModule.ccall('note_off', null, ['number'], [noteNumber]);
      setActiveNotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(noteNumber);
        return newSet;
      });
      startedNotes.current.delete(noteNumber); // Remove from started notes
    } catch (error) {
      console.error('Failed to stop note:', error);
    }
  }, [wasmModule, isInitialized]);

  // Debug WASM function - updated for callback approach
  const debugWASM = useCallback(() => {
    if (!wasmModule || !isInitialized) {
      console.log('WASM not ready');
      return;
    }
    
    console.log('=== WASM Debug ===');
    console.log('Master volume:', params.master_volume);
    
    try {
      // Test the basic functionality
      const testValue = wasmModule.ccall('test_audio', 'number', [], []);
      console.log('Test function returned:', testValue);
      
      const activeVoicesBefore = wasmModule.ccall('get_active_voices', 'number', [], []);
      console.log('Active voices before:', activeVoicesBefore);
      
      // Play a note
      wasmModule.ccall('note_on', null, ['number', 'number'], [60, 1.0]);
      const activeVoicesAfter = wasmModule.ccall('get_active_voices', 'number', [], []);
      console.log('Active voices after note_on:', activeVoicesAfter);
      
      // Generate a few samples manually
      console.log('Generated samples:');
      for (let i = 0; i < 5; i++) {
        const sample = wasmModule.ccall('generate_sample', 'number', [], []);
        console.log(`Sample ${i}:`, sample);
      }
      
      // Stop the note
      setTimeout(() => {
        wasmModule.ccall('note_off', null, ['number'], [60]);
        const finalVoices = wasmModule.ccall('get_active_voices', 'number', [], []);
        console.log('Active voices after note_off:', finalVoices);
      }, 1000);
      
    } catch (debugError) {
      console.error('Debug error:', debugError);
    }
  }, [wasmModule, isInitialized, params.master_volume]);

  // Test audio function with Web Audio API fallback
  const testWebAudio = useCallback(async () => {
    if (!audioContext) return;
    
    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);
      
      console.log('Web Audio test played successfully');
    } catch (error) {
      console.error('Web Audio test failed:', error);
    }
  }, [audioContext]);

  // Test JS Audio
  const testJSAudio = useCallback(() => {
    if (!audioContext || !scriptProcessor) return;
    
    // Create a simple JavaScript sine wave generator
    let phase = 0;
    const frequency = 440; // A4
    const phaseIncrement = frequency / audioContext.sampleRate;
    
    // Replace the processor temporarily
    const originalProcessor = scriptProcessor.onaudioprocess;
    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
      const outputBuffer = audioProcessingEvent.outputBuffer;
      const outputData0 = outputBuffer.getChannelData(0);
      const outputData1 = outputBuffer.getChannelData(1);
      const bufferLength = outputBuffer.length;

      for (let i = 0; i < bufferLength; i++) {
        const sineWave = Math.sin(phase * 2 * Math.PI) * 0.3; // 440Hz sine wave
        outputData0[i] = sineWave;
        outputData1[i] = sineWave;
        
        phase += phaseIncrement;
        if (phase >= 1.0) phase -= 1.0;
      }
    };
    
    // Stop after 1 second
    setTimeout(() => {
      scriptProcessor.onaudioprocess = originalProcessor; // Restore original processor
    }, 1000);
  }, [audioContext, scriptProcessor]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (scriptProcessor) {
        scriptProcessor.disconnect();
      }
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, [scriptProcessor, audioContext]);

  // Keyboard event handlers
  useEffect(() => {
    if (!isInitialized) return;

    const keyMap = {
      'KeyA': 60, 'KeyW': 61, 'KeyS': 62, 'KeyE': 63, 'KeyD': 64, 
      'KeyF': 65, 'KeyT': 66, 'KeyG': 67, 'KeyY': 68, 'KeyH': 69, 
      'KeyU': 70, 'KeyJ': 71, 'KeyK': 72
    };

    const handleKeyDown = (e) => {
      if (keyMap[e.code] && !e.repeat) {
        e.preventDefault();
        playNote(keyMap[e.code]);
      }
    };

    const handleKeyUp = (e) => {
      if (keyMap[e.code]) {
        e.preventDefault();
        stopNote(keyMap[e.code]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [playNote, stopNote, isInitialized]);

  // Simple Piano Component - Fixed mouse handling
  const Piano = () => {
    const keys = Array.from({ length: 25 }, (_, i) => i + 48);
    const isBlackKey = (note) => {
      const keyPattern = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0];
      return keyPattern[note % 12] === 1;
    };

    const whiteKeys = keys.filter(key => !isBlackKey(key));
    const blackKeys = keys.filter(key => isBlackKey(key));

    const handleMouseDown = async (key) => {
      if (needsUserInteraction) {
        await initializeAudio();
      }
      playNote(key);
    };

    // Only stop notes that are actually playing
    const handleMouseUp = (key) => {
      if (startedNotes.current.has(key)) {
        stopNote(key);
      }
    };

    // Only stop notes that are actually playing when mouse leaves
    const handleMouseLeave = (key) => {
      if (startedNotes.current.has(key)) {
        stopNote(key);
      }
    };

    return (
      <div className="relative h-40 bg-gray-100 border-2 border-gray-300 rounded-lg overflow-hidden">
        <div className="flex h-full">
          {whiteKeys.map((key) => (
            <button
              key={key}
              className={`flex-1 border-r border-gray-300 transition-all duration-75 ${
                activeNotes.has(key) 
                  ? 'bg-blue-200' 
                  : 'bg-white hover:bg-gray-50'
              }`}
              onMouseDown={() => handleMouseDown(key)}
              onMouseUp={() => handleMouseUp(key)}
              onMouseLeave={() => handleMouseLeave(key)}
            />
          ))}
        </div>
        
        {blackKeys.map(key => {
          const whiteKeysBefore = keys.filter(k => k < key && !isBlackKey(k)).length;
          const totalWhiteKeys = whiteKeys.length;
          const leftPercent = ((whiteKeysBefore - 0.35) / totalWhiteKeys) * 100;
          
          return (
            <button
              key={key}
              className={`absolute w-6 h-24 top-0 rounded-b-md transition-all duration-75 z-10 ${
                activeNotes.has(key) 
                  ? 'bg-gray-600' 
                  : 'bg-black hover:bg-gray-800'
              }`}
              style={{ left: `${leftPercent}%` }}
              onMouseDown={() => handleMouseDown(key)}
              onMouseUp={() => handleMouseUp(key)}
              onMouseLeave={() => handleMouseLeave(key)}
            />
          );
        })}
      </div>
    );
  };

  // Slider Component
  const Slider = ({ label, value, onChange, min = 0, max = 1, step = 0.01 }) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
          {value.toFixed(3)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading Synthesizer...</p>
          <p className="text-sm text-gray-500 mt-2">Initializing WebAssembly module...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-red-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (needsUserInteraction) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-blue-600 mb-4">🎹 Ready to Play!</h2>
          <p className="text-gray-600 mb-6">
            WASM module loaded successfully. Click the button below to initialize audio.
          </p>
          <button 
            onClick={initializeAudio}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Start Synthesizer
          </button>
          <p className="text-xs text-gray-500 mt-4">
            (Required due to browser autoplay policies)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">WebAssembly Synthesizer</h1>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm ${
            isInitialized ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isInitialized ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            {isInitialized ? 'Ready to Play' : 'Initializing...'}
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Controls</h3>
            <Slider
              label="Master Volume"
              value={params.master_volume}
              onChange={(value) => updateParameter('master_volume', value)}
              min={0}
              max={1}
            />
            <Slider
              label="Attack Time"
              value={params.attack}
              onChange={(value) => updateParameter('attack', value)}
              min={0.001}
              max={2}
            />
            <Slider
              label="Release Time"
              value={params.release}
              onChange={(value) => updateParameter('release', value)}
              min={0.001}
              max={2}
            />
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Status</h3>
            <div className="text-sm space-y-2">
              <div>Active voices: {activeNotes.size}</div>
              <div>Context: {audioContext?.state || 'Not started'}</div>
              <div>WASM: {wasmModule ? 'Loaded' : 'Loading'}</div>
              <div>Mode: Callback-based</div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Instructions</h3>
            <div className="text-sm space-y-1">
              <div>• Use A-K keys to play</div>
              <div>• Click piano keys</div>
              <div>• Adjust controls on the left</div>
            </div>
          </div>
        </div>

        {/* Piano */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Piano</h3>
          <Piano />
          <div className="mt-4 text-center space-x-2">
            <button
              onClick={() => playNote(60)}
              onMouseUp={() => stopNote(60)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Test WASM Note (C4)
            </button>
            <button
              onClick={testWebAudio}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Test Web Audio
            </button>
            <button
              onClick={testJSAudio}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              Test JS Audio
            </button>
            <button
              onClick={debugWASM}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Debug WASM
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Synthesizer;