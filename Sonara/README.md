emcc src/dsp.cpp -o public/dsp.js -s MODULARIZE=1 -s EXPORT_ES6=0 -s "EXPORTED_RUNTIME_METHODS=['cwrap']" --bind
