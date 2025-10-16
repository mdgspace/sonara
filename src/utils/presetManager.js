// handles JSON export/import logic safely
export function savePreset(synthState) {
  try {
    const json = JSON.stringify(synthState, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const a = document.createElement('a');
    a.href = url;
    a.download = `preset_${timestamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    alert("✅ Preset saved successfully!");
  } catch (error) {
    console.error("Error saving preset:", error);
    alert("❌ Failed to save preset.");
  }
}

export function loadPreset(file, onLoad, onError) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const preset = JSON.parse(e.target.result);
      // Basic validation
      if (!preset.adsr || !preset.eq) throw new Error("Invalid preset format");
      onLoad(preset);
    } catch (err) {
      console.error("Error loading preset:", err);
      onError?.(err.message);
    }
  };
  reader.readAsText(file);
}
