// js/state.js

export const state = {
    canvases: [],
    activeCanvasIndex: 0,
    activePreset: null,
    currentUser: null,
    activeDesignId: null,
    cropModeActive: false,

    
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

    removeCanvas(index) {
        if (this.canvases.length <= 1) return;
        this.canvases.splice(index, 1);
        if (this.activeCanvasIndex >= this.canvases.length) {
            this.activeCanvasIndex = this.canvases.length - 1;
        }
        window.canvas = this.canvases[this.activeCanvasIndex];
    },


    setActivePreset(preset) {
        this.activePreset = preset;
    },

    getActivePreset() {
        return this.activePreset;
    }
};
