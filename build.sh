#!/bin/bash

# Check if emscripten is available
if ! command -v emcc &> /dev/null; then
    echo "Error: emcc not found. Please install Emscripten."
    exit 1
fi

# Create directories
mkdir -p wasm
mkdir -p frontend/public/wasm

echo "Building callback-based WebAssembly synthesizer..."

# Clean previous builds
rm -f wasm/synthesizer.*

# Build with callback approach - no shared memory
emcc backend/synthesizer.cpp -o wasm/synthesizer.js \
  -s WASM=1 \
  -s EXPORTED_FUNCTIONS="['_init_synth','_set_parameter','_note_on','_note_off','_generate_sample','_get_active_voices','_test_audio']" \
  -s EXPORTED_RUNTIME_METHODS="['ccall','cwrap']" \
  -s MODULARIZE=1 \
  -s EXPORT_NAME="SynthesizerModule" \
  -s ENVIRONMENT='web' \
  -s ALLOW_MEMORY_GROWTH=1 \
  -O1

if [ $? -eq 0 ]; then
    echo "Build successful!"
    
    # Copy files
    cp wasm/synthesizer.js frontend/public/wasm/
    cp wasm/synthesizer.wasm frontend/public/wasm/
    
    echo "Files copied to frontend/public/wasm/"
    ls -la wasm/synthesizer.*
else
    echo "Build failed!"
    exit 1
fi
