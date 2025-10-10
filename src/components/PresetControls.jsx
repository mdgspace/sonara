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

  return (
    <div className="preset-controls" style={{ marginTop: "1rem" }}>
      <button onClick={() => savePreset(synthState)}>💾 Save Preset</button>
      <button onClick={handleLoadClick}>📂 Load Preset</button>
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
