// js/state.js

export const state = {
    canvas: null,
    activePreset: null,
    
    setCanvas(canvasInstance) {
        this.canvas = canvasInstance;
        window.canvas = canvasInstance; // Expor globalmente por precaução
    },
    
    getCanvas() {
        return this.canvas;
    },

    setActivePreset(preset) {
        this.activePreset = preset;
    },

    getActivePreset() {
        return this.activePreset;
    }
};
