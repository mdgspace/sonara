import sine from './assets/sine.png';
import square from './assets/square.png';
import triangle from './assets/triangle.png';
import sawtooth from './assets/sawtooth.png';

export const waveimages = {
    sine,
    square,
    triangle,
    sawtooth
};
export const noteFrequencies = {
    'C': 261.63, // C4
    'D': 293.66,
    'E': 329.63,
    'F': 349.23,
    'G': 392.00,
    'A': 440.00,
    'B': 493.88,
};

export const keyMap = { 'z': 'C', 'x': 'D', 'c': 'E', 'v': 'F', 'b': 'G', 'n': 'A', 'm': 'B' };
export const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

export const style = {
    backgroundColor: "#1b2021",
    borderColor: "#89023e",
    barColor: "rgba(234, 99, 140, 0.3)",
    borderWidth: 0,
    nodeColor: "#89023e",
    connectorColor: "#ffd9da",
    connectorWidth: 2,
    nodeRadius: 6,
    hitRadius: 8,
    shapeSpeed: 0.1
};
