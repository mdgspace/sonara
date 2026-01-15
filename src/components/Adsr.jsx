import React from 'react';

function ADSR({ adsr, setAdsr, className }) {
    // Update ADSR parameter values
    const handleChange = (param, value) => {
        setAdsr(prev => ({ ...prev, [param]: Number(value) }));
    };

    return (
        <div className={`adsr-container ${className}`}>
            <h3>ADSR</h3>
            <div className="adsr-controls">
                {/* Attack control */}
                <div className="adsr-control-group">
                    <label htmlFor="attack">A</label>
                    <input
                        type="range"
                        id="attack"
                        min="0.01"
                        max="2"
                        step="0.01"
                        value={adsr.attack}
                        onChange={(e) => handleChange('attack', e.target.value)}
                    />
                    <span>{adsr.attack.toFixed(2)}s</span>
                </div>
                {/* Decay control */}
                <div className="adsr-control-group">
                    <label htmlFor="decay">D</label>
                    <input
                        type="range"
                        id="decay"
                        min="0.01"
                        max="2"
                        step="0.01"
                        value={adsr.decay}
                        onChange={(e) => handleChange('decay', e.target.value)}
                    />
                    <span>{adsr.decay.toFixed(2)}s</span>
                </div>
                {/* Sustain control */}
                <div className="adsr-control-group">
                    <label htmlFor="sustain">S</label>
                    <input
                        type="range"
                        id="sustain"
                        min="0"
                        max="1"
                        step="0.01"
                        value={adsr.sustain}
                        onChange={(e) => handleChange('sustain', e.target.value)}
                    />
                    <span>{(adsr.sustain * 100).toFixed(0)}%</span>
                </div>
                {/* Release control */}
                <div className="adsr-control-group">
                    <label htmlFor="release">R</label>
                    <input
                        type="range"
                        id="release"
                        min="0.01"
                        max="5"
                        step="0.01"
                        value={adsr.release}
                        onChange={(e) => handleChange('release', e.target.value)}
                    />
                    <span>{adsr.release.toFixed(2)}s</span>
                </div>
            </div>
        </div>
    );
}

export default ADSR;