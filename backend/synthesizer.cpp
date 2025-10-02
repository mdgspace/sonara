#include <emscripten/emscripten.h>
#include <cmath>
#include <cstring>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

// Simple constants
const int MAX_VOICES = 4;
const float SAMPLE_RATE = 44100.0f;

// Single voice structure
struct Voice
{
    bool active;
    int note;
    float phase;
    float amplitude;

    Voice() : active(false), note(0), phase(0.0f), amplitude(0.0f) {}
};

// Global state
static Voice voices[MAX_VOICES];
static float masterVolume = 0.5f;

// Convert MIDI note to frequency
float noteToFreq(int note)
{
    return 440.0f * powf(2.0f, (note - 69) / 12.0f);
}

// Generate sine wave
float sineWave(float phase)
{
    return sinf(phase * 2.0f * M_PI);
}

extern "C"
{

    EMSCRIPTEN_KEEPALIVE
    int init_synth()
    {
        // Clear everything
        for (int i = 0; i < MAX_VOICES; i++)
        {
            voices[i] = Voice();
        }
        return 1;
    }

    EMSCRIPTEN_KEEPALIVE
    void set_parameter(int paramId, float value)
    {
        if (paramId == 0)
        {
            masterVolume = value;
            if (masterVolume < 0.05f)
                masterVolume = 0.05f; // Ensure minimum volume
        }
    }

    EMSCRIPTEN_KEEPALIVE
    void note_on(int noteNumber, float velocity)
    {
        // Find free voice
        for (int i = 0; i < MAX_VOICES; i++)
        {
            if (!voices[i].active)
            {
                voices[i].active = true;
                voices[i].note = noteNumber;
                voices[i].phase = 0.0f;
                voices[i].amplitude = 0.4f; // Fixed amplitude
                break;
            }
        }
    }

    EMSCRIPTEN_KEEPALIVE
    void note_off(int noteNumber)
    {
        // Find and stop voice
        for (int i = 0; i < MAX_VOICES; i++)
        {
            if (voices[i].active && voices[i].note == noteNumber)
            {
                voices[i].active = false;
                break;
            }
        }
    }

    // NEW: Generate a single sample instead of a buffer
    EMSCRIPTEN_KEEPALIVE
    float generate_sample()
    {
        float output = 0.0f;

        // Process each voice
        for (int v = 0; v < MAX_VOICES; v++)
        {
            if (!voices[v].active)
                continue;

            // Calculate frequency and phase increment
            float freq = noteToFreq(voices[v].note);
            float phaseInc = freq / SAMPLE_RATE;

            // Generate sine wave
            float sine = sineWave(voices[v].phase);
            output += sine * voices[v].amplitude;

            // Update phase
            voices[v].phase += phaseInc;
            if (voices[v].phase >= 1.0f)
            {
                voices[v].phase -= 1.0f;
            }
        }

        // Apply master volume
        output *= masterVolume;

        // Clamp output
        if (output > 1.0f)
            output = 1.0f;
        if (output < -1.0f)
            output = -1.0f;

        return output;
    }

    EMSCRIPTEN_KEEPALIVE
    int get_active_voices()
    {
        int count = 0;
        for (int i = 0; i < MAX_VOICES; i++)
        {
            if (voices[i].active)
                count++;
        }
        return count;
    }

    // NEW: Test function that returns a known value
    EMSCRIPTEN_KEEPALIVE
    float test_audio()
    {
        return 0.5f; // Return a test value
    }
}
