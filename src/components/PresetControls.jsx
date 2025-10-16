import React, { useRef } from "react";
import { savePreset, loadPreset } from "../utils/presetManager";

export default function PresetControls({ synthState, onPresetLoad }) {
  const fileInputRef = useRef();

  const handleLoadClick = () => fileInputRef.current.click();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    loadPreset(
      file,
      (preset) => {
        onPresetLoad(preset);
        alert("✅ Preset loaded successfully!");
      },
      (error) => alert("❌ Error loading preset: " + error)
    );
  };

  const handleReset = () => {
  const defaultPreset = {
    waveform: "sine",
    octave: 4,
    adsr: { attack: 0.1, decay: 0.2, sustain: 0.7, release: 0.3 },
    eq: {
      nodes: [
        { x: 20, y: 0.8 },
        { x: 200, y: 0.8 },
        { x: 1000, y: 0.8 },
        { x: 5000, y: 0.8 },
        { x: 20000, y: 0.8 }
      ],
      curves: [0, 0, 0, 0]
    }
  };
  onPresetLoad(defaultPreset);
  alert("🔄 Reset to default settings!");
};

  return (
  <div
    className="preset-controls"
    style={{ marginTop: "1rem", display: "flex", gap: "10px", flexWrap: "wrap" }}
  >
    <button
      onClick={() => savePreset(synthState)}
      style={{
        padding: "8px 12px",
        borderRadius: "6px",
        border: "1px solid #444",
        background: "#1e1e1e",
        color: "#fff",
        cursor: "pointer",
      }}
    >
      💾 Save Preset
    </button>

    <button
      onClick={handleLoadClick}
      style={{
        padding: "8px 12px",
        borderRadius: "6px",
        border: "1px solid #444",
        background: "#1e1e1e",
        color: "#fff",
        cursor: "pointer",
      }}
    >
      📂 Load Preset
    </button>

    <button
      onClick={handleReset}
      style={{
        padding: "8px 12px",
        borderRadius: "6px",
        border: "1px solid #444",
        background: "#1e1e1e",
        color: "#fff",
        cursor: "pointer",
      }}
    >
      🔄 Reset
    </button>

    <input
      type="file"
      accept="application/json"
      ref={fileInputRef}
      onChange={handleFileChange}
      style={{ display: "none" }}
    />
  </div>
);

}
