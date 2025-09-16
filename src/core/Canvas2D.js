export class Canvas2D {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        this.width = 0;
        this.height = 0;
        this.pixelRatio = window.devicePixelRatio || 1;
        
        // Rendering state
        this.clearColor = '#000010';
        this.smoothing = true;
        
        // Performance tracking
        this.frameCount = 0;
        this.lastFPSUpdate = 0;
        this.fps = 60;
        
        this.initialize();
    }
    
    initialize() {
        this.resize();
        this.setupCanvas();
        
        // Handle resize events
        window.addEventListener('resize', () => this.resize());
    }
    
    setupCanvas() {
        // Set up canvas properties for crisp rendering
        this.ctx.imageSmoothingEnabled = this.smoothing;
        this.ctx.textBaseline = 'top';
        
        // Optimize for performance
        this.ctx.globalCompositeOperation = 'source-over';
    }
    
    resize() {
        const rect = this.canvas.getBoundingClientRect();
        
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        // Set actual canvas size accounting for pixel ratio
        this.canvas.width = this.width * this.pixelRatio;
        this.canvas.height = this.height * this.pixelRatio;
        
        // Scale canvas back down using CSS
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        
        // Scale the drawing context so everything draws at the correct size
        this.ctx.scale(this.pixelRatio, this.pixelRatio);
        
        this.setupCanvas();
    }
    
    clear() {
        this.ctx.fillStyle = this.clearColor;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    createBackgroundGradient(centerX, centerY, audioManager = null) {
        const gradient = this.ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, Math.max(this.width, this.height)
        );
        
        let color1 = '#000010';
        let color2 = '#000030';
        
        // Audio-reactive background colors
        if (audioManager) {
            const bass = audioManager.currentBass;
            const mids = audioManager.currentMids;
            const highs = audioManager.currentHighs;
            
            if (bass > 0.7) {
                color1 = '#0a0208';
                color2 = '#1a0000';
            } else if (mids > 0.7) {
                color1 = '#000814';
                color2 = '#000030';
            } else if (highs > 0.7) {
                color1 = '#001a2e';
                color2 = '#0a0020';
            }
        }
        
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        
        return gradient;
    }
    
    renderBackground(centerX, centerY, audioManager = null) {
        const gradient = this.createBackgroundGradient(centerX, centerY, audioManager);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    renderBackgroundStars(stars) {
        this.ctx.fillStyle = '#ffffff';
        
        for (const star of stars) {
            this.ctx.globalAlpha = star.opacity;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.globalAlpha = 1;
    }
    
    // Screen shake effect
    applyScreenShake(intensity, duration) {
        if (duration <= 0) return;
        
        const shakeX = (Math.random() - 0.5) * intensity;
        const shakeY = (Math.random() - 0.5) * intensity;
        
        this.ctx.save();
        this.ctx.translate(shakeX, shakeY);
    }
    
    restoreScreenShake() {
        this.ctx.restore();
    }
    
    // Utility methods for common drawing operations
    drawCircle(x, y, radius, color, filled = true) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        
        if (filled) {
            this.ctx.fillStyle = color;
            this.ctx.fill();
        } else {
            this.ctx.strokeStyle = color;
            this.ctx.stroke();
        }
    }
    
    drawLine(x1, y1, x2, y2, color, width = 1) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }
    
    drawText(text, x, y, color = '#ffffff', font = '16px Arial') {
        this.ctx.fillStyle = color;
        this.ctx.font = font;
        this.ctx.fillText(text, x, y);
    }
    
    // Performance monitoring
    updateFPS() {
        this.frameCount++;
        const now = performance.now();
        
        if (now - this.lastFPSUpdate >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFPSUpdate));
            this.frameCount = 0;
            this.lastFPSUpdate = now;
        }
    }
    
    getFPS() {
        return this.fps;
    }
    
    // Viewport utilities
    getViewBounds() {
        return {
            left: 0,
            top: 0,
            right: this.width,
            bottom: this.height,
            width: this.width,
            height: this.height
        };
    }
    
    isVisible(x, y, radius = 0) {
        return x + radius >= 0 && 
               x - radius <= this.width && 
               y + radius >= 0 && 
               y - radius <= this.height;
    }
    
    // Save/restore context state
    save() {
        this.ctx.save();
    }
    
    restore() {
        this.ctx.restore();
    }
    
    // Get context for direct access when needed
    getContext() {
        return this.ctx;
    }
    
    getCanvas() {
        return this.canvas;
    }
}