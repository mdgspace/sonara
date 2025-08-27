# web-audio-synthesizer

Web based audio synthesizer plugin that leverages native speed Digital Signal Processing (DSP) offered by C++ Web Assembly built right into the frontend of the synthesizer.

---

# Audio Manipulation Notes

If we assume a vibrating string to form a standing wave between the two ends it is plucked at, it will have a fundamental frequency of vibration. 
Harmonics are frequencies that are whole number multiples of the fundamental frequency.

## What are Waveforms?
We identify certain combinations of harmonics which work well together, we call them "waveforms". The following are some common waveforms:
- **Sine:** Pure tone, only the fundamental frequency
- **Square:** Fundamental frequency + Odd harmonics 
- **Sawtooth:** Fundamental frequency + All harmonics
- **Triangle:** Fundamental frequency + Odd harmonics (softer than square)
*Odd harmonics imply frequencies that are odd multiples of the fundamental frequency*.
**Oscillators** are used for playing these waveforms.

## What is Additive & Subtractive Synthesis?
Synthesizing sounds by adding and mixing different waveforms at different fundamental frequencies together is called **additive synthesis**.
Synthesizing desired sound by subtracting frequencies from an existing mix of frequencies using filters is called **subtractive synthesis**.

## What is Timbre?
Timbre is also called the "color of the sound". It distinguishes two sounds with the same pitch, loudness and duration from one another. 
Timbre is the texture of sound considering its fundamental frequency along with all harmonics and their energies combined with ADSR envelope and filters.

## What are Filters?

**Filters** shape the sound by removing (filtering out) certain frequencies. The most common filter types are:
- **Low-pass:** Lets low frequencies through, cuts highs (makes sound duller)
- **High-pass:** Lets high frequencies through, cuts lows
- **Band-pass:** Lets a band of frequencies through, cuts above and below

## What is ADSR Envelope?

**ADSR** stands for **Attack, Decay, Sustain, Release**—the four stages of a sound’s volume envelope
- **Attack:** Time to reach full volume after a note is pressed
- **Decay:** Time to fall from full volume to sustain level
- **Sustain:** Level held while the note is held down
- **Release:** Time to fade out after the note is released
ADSR shapes how a sound starts, holds, and ends—essential for making sounds expressive.

## What is LFO?
LFO stands for Low Frequency Oscillator, it produces sound of very low frequency that's beyond the audible range.
**Key LFO Controls:**
- **Rate (Speed):** How fast the LFO cycles. A slow rate gives gradual changes; a fast rate gives rapid, rhythmic effects.
- **Depth (Amount):** How much the parameter moves. Low depth means subtle modulation; high depth means dramatic changes.
- **Waveform (Shape):** The pattern of movement.
- **Routing (Assignment):** Which parameter the LFO is controlling

## Sound Effects

### Delay
Delay creates echoes by repeating the original sound after a set time. It can make vocals sound spacious, add rhythm to instruments, or simulate the acoustics of large spaces. From subtle thickening to obvious echoes, delay is a staple in music and sound design
**Controls & Parameters:**
- **Delay Time:** Sets how long before the echo is heard
- **Feedback:** Determines how many times the echo repeats. High feedback can create long, decaying echoes or even self-oscillate.
- **Mix (Wet/Dry):** Balances the original (dry) sound with the delayed (wet) signal
- **Modulation:** Some delays add movement by modulating the delay time.
- **Filter/EQ:** Shapes the tone of the repeats (darker or brighter).
- **Ping-Pong:** Sends echoes bouncing between left and right speakers.

### Reverb  
Reverb simulates the sound of a space—like a room, hall, or cave—by creating a wash of echoes that blend together. It adds depth, makes sounds feel more “real,” and can transport listeners to different environments.
**Controls & Parameters:**
- **Pre-Delay:** Time between the direct sound and the start of reverb. Longer pre-delay makes the space feel larger.
- **Decay/Time:** How long the reverb lasts after the sound stops
- **Room Size:** Simulates small rooms to vast halls
- **Damping/EQ:** Controls how quickly high and low frequencies fade, shaping the reverb’s tone
- **Mix (Wet/Dry):** Adjusts the blend of original and reverberated sound.
- **Early Reflections:** Controls the initial echoes that define the space’s character
- **Modulation/Chorus:** Adds movement or thickness to the reverb tail.

### Chorus
Chorus makes a sound feel wider and richer by simulating multiple instruments or voices playing together. It adds shimmer and thickness, often used on guitars, synths, and vocals.
**Controls & Parameters:**
- **Depth:** How much the pitch of the duplicated signal is modulated.
- **Rate/Speed:** How fast the pitch modulation occurs.
- **Delay:** The time offset between the original and duplicated signals.
- **Mix (Wet/Dry):** Balances the original and chorused signals.
- **Feedback:** Feeds some of the output back in for a more intense effect.
- **Wave Shape:** Shape of the LFO used for modulation (sine, square, etc.)
- **Stereo Width/Phase:** Controls how wide the effect feels in the stereo field.

### Flanger
Flanger creates a dramatic, swirling “jet plane” or “whoosh” sound. It’s achieved by mixing a sound with a slightly delayed and modulated copy of itself, creating moving peaks and notches in the sound spectrum
**Controls & Parameters:**
- **Delay Time:** Very short (usually <20ms), sets the base delay.
- **Depth:** How much the delay time is modulated.
- **Rate:** How fast the modulation occurs.
- **Feedback:** Amount of processed signal fed back for a more pronounced effect.
- **Mix (Wet/Dry):** Balance between original and flanged sound.
- **Stereo Width:** Controls the spread of the effect in stereo.

### Phaser  
Phaser gives a sound a swirling, sweeping movement by shifting the phase of certain frequencies, creating moving notches in the sound. It’s subtler than flanger, often used for texture and motion.
**Controls & Parameters:**
- **Rate:** Speed of the sweep LFO modulation.    
- **Depth:** Intensity of the phase shift.
- **Center/Manual:** Sets the center frequency of the effect.
- **Stages/Poles:** Number of all-pass filters used, affecting the number of notches.
- **Feedback:** Adds resonance, making the effect more pronounced.
- **Mix (Wet/Dry):** Balance between original and phased sound.

### Distortion
Distortion adds grit, crunch, or fuzz by “clipping” the audio signal, making it sound more aggressive and harmonically rich. Used on guitars, synths, drums, and even vocals for energy and character.
**Controls & Parameters:**
- **Drive/Gain:** Controls how much the sound is distorted
- **Tone/EQ:** Shapes the frequency content before or after distortion.
- **Type:** Selects the style of distortion (overdrive, fuzz, bitcrush, etc.)
- **Bias/Base:** Alters the character or frequency focus of the distortion.
- **Mix (Wet/Dry):** Blends clean and distorted signals.
- **Output Level:** Adjusts final volume, as distortion increases loudness.

### Compression
Compression evens out the volume of audio, making loud parts quieter and quiet parts louder. It helps control dynamics, smooth out performances, and make sounds sit better in a mix.
**Controls & Parameters:**
- **Threshold:** The level above which compression kicks in.
- **Ratio:** How much the signal is reduced once it passes the threshold (e.g., 4:1)
- **Attack:** How quickly compression starts after the threshold is exceeded.
- **Release:** How quickly compression stops after the signal falls below the threshold.
- **Knee:** How smoothly compression is applied as the signal approaches the threshold.
- **Makeup Gain:** Boosts the compressed signal to match original loudness.
- **Sidechain/Filter:** Some compressors can respond only to certain frequencies.

| Effect      | Use                        | Key Controls/Parameters           | Other Notes                      |
| ----------- | -------------------------- | --------------------------------- | -------------------------------- |
| **Delay**       | Echoes, rhythm, space      | Time, Feedback, Mix, Mod, Filter  | Haas effect for widening         |
| **Reverb**      | Space, depth, ambiance     | Pre-delay, Decay, Size, Damping   | Early reflections, modulation    |
| **Chorus**      | Thickness, width, shimmer  | Depth, Rate, Delay, Mix, Feedback | Simulates multiple performers    |
| **Flanger**     | Swirl, jet, whoosh         | Delay, Depth, Rate, Feedback, Mix | Metallic, dramatic, stereo width |
| **Phaser**      | Sweep, swirl, texture      | Rate, Depth, Center, Stages, Mix  | Subtle to dramatic movement      |
| **Distortion**  | Grit, energy, harmonics    | Drive, Tone, Type, Mix, Output    | Adds harmonics, flattens peaks   |
| **Compression** | Control, punch, smoothness | Threshold, Ratio, Attack, Release | Parallel, sidechain, makeup gain |
| **EQ**          | Tone shaping, clarity      | Freq, Gain, Q, Type               | Corrective & creative uses       |


# Development Notes

The following are detailed notes that describe and document technologies used to build web-audio-sythesizer.

## Pulse-Code Modulation (PCM)

## Waveform Audio File Format
