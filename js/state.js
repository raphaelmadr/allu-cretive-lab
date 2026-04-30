// js/state.js

export const state = {
    canvases: [],
    activeCanvasIndex: 0,
    activePreset: null,
    
    setCanvas(canvasInstance) {
        this.canvases = [canvasInstance];
        this.activeCanvasIndex = 0;
        window.canvas = canvasInstance;
    },
    
    getCanvas() {
        return this.canvases[this.activeCanvasIndex];
    },

    setActiveCanvas(index) {
        this.activeCanvasIndex = index;
        window.canvas = this.canvases[index];
    },

    addCanvas(canvasInstance) {
        this.canvases.push(canvasInstance);
        this.activeCanvasIndex = this.canvases.length - 1;
        window.canvas = canvasInstance;
    },

    setActivePreset(preset) {
        this.activePreset = preset;
    },

    getActivePreset() {
        return this.activePreset;
    }
};
