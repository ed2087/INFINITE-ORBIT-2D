import { BaseShape } from '../BaseShape.js';

export class Flower extends BaseShape {
    constructor(x, y, dna = null) {
        super(x, y, dna);
        this.shapeType = 'flower';
        this.petalCount = 5 + Math.floor(Math.random() * 3);
        this.petalSize = this.size * 0.4;
    }
    
    renderShape(ctx, color) {
        ctx.fillStyle = color;
        
        // Draw petals
        for (let i = 0; i < this.petalCount; i++) {
            const angle = (i / this.petalCount) * Math.PI * 2;
            const petalX = Math.cos(angle) * this.petalSize;
            const petalY = Math.sin(angle) * this.petalSize;
            
            ctx.save();
            ctx.translate(petalX, petalY);
            ctx.rotate(angle + Math.PI/2);
            
            // Petal shape
            ctx.beginPath();
            ctx.ellipse(0, 0, this.petalSize * 0.3, this.petalSize * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
        
        // Center
        ctx.fillStyle = `hsl(${(this.dna.traits.get('colorHue') + 60) % 360}, 80%, 60%)`;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // Audio-reactive petal glow
        if (this.isFrequencyReactive && this.glowRadius > 5) {
            ctx.shadowBlur = this.glowRadius;
            ctx.shadowColor = color;
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 0.15, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
}