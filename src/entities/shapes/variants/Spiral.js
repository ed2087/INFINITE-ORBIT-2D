import { BaseShape } from '../BaseShape.js';

export class Spiral extends BaseShape {
    constructor(x, y, dna = null) {
        super(x, y, dna);
        this.shapeType = 'spiral';
        this.spiralTurns = 3;
        this.spiralDensity = 0.1;
    }
    
    renderShape(ctx, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        for (let i = 0; i < this.spiralTurns * 100; i++) {
            const angle = i * this.spiralDensity;
            const radius = (i / (this.spiralTurns * 100)) * this.size / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        
        // Center dot
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}