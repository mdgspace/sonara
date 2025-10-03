# Features

This document provides a detailed overview of all the features implemented in the Sonara web audio synthesizer.

## Current Features

### Core Functionality
- **Interactive Piano Keys**: 
  - Allows users to play musical notes interactively using a virtual keyboard.
  - Supports key mappings for easy note generation via the computer keyboard.
- **Adjustable ADSR Envelope**:
  - Provides controls for Attack, Decay, Sustain, and Release to shape the sound dynamically.
  - Enables users to create unique sound profiles by modifying the envelope parameters.
- **Frequency Equalizer**:
  - Allows fine-tuning of sound frequencies for better audio control.
  - Provides real-time adjustments to enhance the audio output.
- **Real-Time Waveform Visualization**:
  - Displays the waveform of the sound being generated in real-time.
  - Helps users visually understand the impact of their adjustments.

### Waveform Support
- **Multiple Waveforms**:
  - Supports the following waveforms for sound generation:
    - **Sine**: Produces a pure tone with only the fundamental frequency.
    - **Square**: Combines the fundamental frequency with odd harmonics for a richer sound.
    - **Triangle**: Similar to square but with softer odd harmonics.
    - **Sawtooth**: Includes both even and odd harmonics for a fuller sound.
  - Users can switch between waveforms to explore different tonal qualities.

### Audio Processing
- **Additive and Subtractive Synthesis**:
  - Additive synthesis: Combines multiple waveforms at different frequencies to create complex sounds.
  - Subtractive synthesis: Shapes sounds by applying filters to remove certain frequencies.
- **Envelope Application**:
  - Dynamically applies an envelope to the sound, modifying its amplitude over time.
  - Ensures smooth transitions between notes and enhances sound quality.
- **Custom Waveform Generation**:
  - Generates waveforms programmatically based on user input or predefined parameters.
  - Provides flexibility for advanced sound design.

### Performance and Optimization
- **WebAssembly (WASM) Integration**:
  - Leverages WebAssembly for high-performance Digital Signal Processing (DSP).
  - Ensures low-latency audio processing directly in the browser.
  - Combines the speed of C++ with the accessibility of web technologies.

### UI/UX
- **Intuitive Interface**:
  - Designed for both beginners and advanced users to create and manipulate sound effortlessly.
  - Provides clear and interactive controls for all features.
- **Real-Time Feedback**:
  - Offers immediate visual and auditory feedback for every adjustment.
  - Enhances the user experience by making sound design more engaging.

---

This document will be updated as new features are added to the project. Stay tuned for more exciting updates!