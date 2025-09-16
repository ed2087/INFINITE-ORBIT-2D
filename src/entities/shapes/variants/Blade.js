import { BaseShape } from '../BaseShape.js';

export class Blade extends BaseShape {
    constructor(x, y, dna = null) {
        super(x, y, dna);
        this.shapeType = 'blade';
        this.edgeSharpness = 0.8 + Math.random() * 0.4;
    }
    
    renderShape(ctx, color) {
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        
        const width = this.size * 0.2;
        const length = this.size;
        
        ctx.beginPath();
        // Blade edge
        ctx.moveTo(length/2, 0);
        ctx.lineTo(length/2 * this.edgeSharpness, -width/2);
        ctx.lineTo(-length/2, -width/4);
        ctx.lineTo(-length/2, width/4);
        ctx.lineTo(length/2 * this.edgeSharpness, width/2);
        ctx.closePath();
        ctx.fill();
        
        // Edge highlight
        ctx.strokeStyle = `hsl(${this.dna.traits.get('colorHue')}, 100%, 80%)`;
        ctx.beginPath();
        ctx.moveTo(length/2, 0);
        ctx.lineTo(length/2 * this.edgeSharpness, -width/2);
        ctx.stroke();
    }
}