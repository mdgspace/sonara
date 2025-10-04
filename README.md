# Sonara: Web Audio Synthesizer

Sonara is a web-based audio synthesizer that allows users to create and manipulate sound using various components like keys, ADSR envelopes, equalizers, and more.

## Features

- Interactive piano keys for note generation.
- Adjustable ADSR (Attack, Decay, Sustain, Release) envelope for sound shaping.
- Frequency equalizer for fine-tuning sound frequencies.
- Real-time waveform visualization.

## Setup Instructions

### Prerequisites

- Bun.js (v1.2.0 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/mdgspace/sonara.git
   cd sonara
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Start the development server:
   ```bash
   bun run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.


## Project Structure

The project is organized as follows:

- **src/pages**: Contains the main application pages. See [src/pages/README.md](src/pages/README.md) for details.
- **src/components**: Contains reusable UI components like keys, ADSR, and equalizers. See [src/components/README.md](src/components/README.md) for details.
- **src/hooks**: Contains custom React hooks for canvas interactions and drawing. See [src/hooks/README.md](src/hooks/README.md) for details.
- **src/styles**: Contains CSS files for styling the application. See [src/styles/README.md](src/styles/README.md) for details.
- **src/utils**: Contains utility functions for waveform generation and other logic. See [src/utils/README.md](src/utils/README.md) for details.

Each subdirectory contains its own `README.md` file with more specific information.

## Project Overview

For a non-technical overview of the project, including its purpose, vision, and how it empowers users to create sound effortlessly, see the [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) file. 

**Contributors are encouraged to read this document first** to understand the project's goals and the context behind its development.

## Features

For a comprehensive overview of the features currently implemented in the project, refer to the [FEATURES.md](FEATURES.md) file.

## Technical Details

For an in-depth explanation of the audio synthesis concepts used in this project, including waveforms, harmonics, and synthesis techniques, see the [TECHNICAL_DETAILS.md](TECHNICAL_DETAILS.md) file.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request. See the [CONTRIBUTING](CONTRIBUTING.md) file for details.

## Acknowledgments

- Built using React and the Web Audio API.
- Inspired by modern synthesizers and audio tools.
