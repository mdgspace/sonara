# Utils Directory

This directory contains utility functions used in the Sonara synthesizer.

## Files

- **getEnvelopeValue.js**: Calculates the y-value of an envelope at a given x-coordinate, based on nodes and curve shapes.
- **createWaveform.js**: Generates an array of frequency and amplitude pairs for a given waveform (sine, square, triangle, sawtooth).
- **applyEnvelope.js**: Applies an envelope to a 2D array of [x, y] pairs, modifying the y-values based on the envelope.
- **applyShape.js**: Transforms a linear value into a curved value using a mathematical shaping function.

## Purpose

The `utils` directory is used to store reusable logic and helper functions that are not directly tied to the UI. These functions handle core audio processing tasks, such as waveform generation, envelope application, and mathematical transformations.