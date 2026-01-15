
import { useState, useCallback } from 'react';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_KEY
// IMPORTANT SECURITY NOTE: In a real production application, you should NEVER expose 
// your Gemini API key in a client-side React component. Use a secure backend proxy 
// (like your original Express server) to hide the key.

const buildPrompt = (userText) => {
  return `
User request:
"${userText}"

You are a music-synthesis assistant. OUTPUT ONLY valid JSON that EXACTLY matches this schema (no prose, no code fences):

{
  "title": string,
  "tempo": number,                 // optional BPM
  "settings": {
    "octave": integer,             // 3-8 (single octave for whole sequence)
    "wave": "sine"|"square"|"sawtooth"|"triangle", //single wave for whole sequence
    "adsr": {
      "attack": number,            // seconds, 0.01 - 2.0
      "decay": number,             // seconds, 0.01 - 2.0
      "sustain": number,           // percentage 0 - 100 (amplitude percent of max)
      "release": number            // seconds, 0.01 - 5.0
    }
  },
  "events": [
    { "key": "C"|"D"|"E"|"F"|"G"|"A"|"B", "time": number}
    // "time" = seconds from start (>=0)
  ]
}

CONSTRAINTS:
- Keys must be uppercase C D E F G A B only (no accidentals).
- Octave must be integer 3..8.
- wave must be one of: sine, square, sawtooth, triangle.
- ADSR ranges: attack 0.01-2, decay 0.01-2, sustain 0-100 (percent), release 0.01-5.
- events[].time in seconds (float >= 0). events[].
- Output ONLY the JSON object (strict). Do NOT output any explanatory text or fences.
`;
};


function MusicSequenceGenerator({ setSequence, className}) {
  const updateSequence = (newsequence) => {
    setSequence(newsequence);
    console.log(newsequence)
  }
  const [userText, setUserText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const settings = ["title", "tempo", "octave", "waveform", "attack", "decay", "sustain", "release"];

  // Function to perform the client-side API call using the Gemini REST API
  const generateSequence = useCallback(async () => {
    if (!userText.trim()) {
      setError("Please enter a music request.");
      return;
    }
    if (GEMINI_API_KEY === "YOUR_GEMINI_API_KEY") {
      setError("API Key missing! Please replace 'YOUR_GEMINI_API_KEY' in the component.");
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    const prompt = buildPrompt(userText);

    // The Gemini REST API endpoint(can only do 20 req/day)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.15,
          },
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle API errors
        const errorMessage = data.error?.message || `API call failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      // Extract the text content from the Gemini response structure
      let text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      // Strip markdown fences (```json) if present
      text = text.replace(/^```json\s*/i, "").replace(/```$/g, "").trim();
      // SAFELY parse the JSON
      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        throw new Error(`AI returned invalid JSON: ${text}`);
      }

      const final_json = ValidateMusic(json); // just to ensure all values are okay
      // this is result array so later we can just iterate and display instead of manually writting all elements
      setResult([final_json.title, final_json.tempo, final_json.settings.octave, final_json.settings.wave, final_json.settings.adsr.attack, final_json.settings.adsr.decay, final_json.settings.adsr.sustain, final_json.settings.adsr.release])
      updateSequence(final_json);

    } catch (err) {
      console.error('Generation Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userText]); // Recreate function if userText changes

  return (
    <div className={`ai-integration-styles ${className}`}>
      <h2>AI Music Sequence Generator</h2>
      <p>Enter a prompt (e.g., "A short, sad melody in C minor with a sawtooth wave"):</p>

      <input
        type="text"
        value={userText}
        onChange={(e) => setUserText(e.target.value)}
        placeholder="Describe the music you want to generate..."
      />


      <button
        onClick={generateSequence}
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate Music Sequence'}
      </button>


      {error && (
        <blockquote>
          Error: {error}
        </blockquote>
      )}

      {result && (
        <>
          <h3>You can use the AI recommendations</h3>
          <pre>
            <ul>
              {settings.map((item, index) => (
                <li key={index}>{item}:{result[index]}</li>
              ))}
            </ul>
          </pre>
        </>
      )}
    </div>
  );
}


function ValidateMusic(json) {
  // --- Begin Validation ---
  if (!json || typeof json !== "object") {
    throw new Error("Invalid response: not a JSON object.");
  }

  // settings
  if (!json.settings || typeof json.settings !== "object") {
    throw new Error("Invalid schema: 'settings' missing or not an object.");
  }

  const VALID_KEYS = ["C", "D", "E", "F", "G", "A", "B"];
  const VALID_WAVES = ["sine", "square", "sawtooth", "triangle"];

  // validate octave
  const octave = json.settings.octave;
  if (!Number.isInteger(octave) || octave < 3 || octave > 8) {
    throw new Error(`Invalid settings.octave: ${octave}. Must be integer 3..8.`);
  }

  // validate wave
  const wave = json.settings.wave;
  if (!VALID_WAVES.includes(wave)) {
    throw new Error(`Invalid settings.wave: ${wave}. Must be one of ${VALID_WAVES.join(", ")}.`);
  }

  // validate ADSR
  const adsr = json.settings.adsr;
  if (!adsr || typeof adsr !== "object") {
    throw new Error("Invalid settings.adsr: missing or not an object.");
  }
  const { attack, decay, sustain, release } = adsr;
  if (typeof attack !== "number" || attack < 0.01 || attack > 2.0) {
    throw new Error(`Invalid ADSR.attack: ${attack}. Must be 0.01..2.0 seconds.`);
  }
  if (typeof decay !== "number" || decay < 0.01 || decay > 2.0) {
    throw new Error(`Invalid ADSR.decay: ${decay}. Must be 0.01..2.0 seconds.`);
  }
  // sustain is percentage 0..100
  if (typeof sustain !== "number" || sustain < 0 || sustain > 100) {
    throw new Error(`Invalid ADSR.sustain: ${sustain}. Must be 0..100 (percentage).`);
  }
  if (typeof release !== "number" || release < 0.01 || release > 5.0) {
    throw new Error(`Invalid ADSR.release: ${release}. Must be 0.01..5.0 seconds.`);
  }

  // validate events array
  if (!Array.isArray(json.events) || json.events.length === 0) {
    throw new Error("Invalid schema: 'events' missing, not an array, or empty.");
  }
  for (const ev of json.events) {
    if (!ev || typeof ev !== "object") {
      throw new Error(`Invalid event (not object): ${JSON.stringify(ev)}`);
    }
    if (!VALID_KEYS.includes(ev.key)) {
      throw new Error(`Invalid event.key: ${ev.key}. Allowed: ${VALID_KEYS.join(", ")}`);
    }
    if (typeof ev.time !== "number" || ev.time < 0) {
      throw new Error(`Invalid event.time for key ${ev.key}: ${ev.time}. Must be number >= 0.`);
    }
  }
  // --- End Validation ---

  // If you reach here, json is validated and safe to send to client
  return json

}
export default MusicSequenceGenerator;