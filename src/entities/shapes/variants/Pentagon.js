import { BaseShape } from '../BaseShape.js';

export class Pentagon extends BaseShape {
    constructor(x, y, dna = null) {
        super(x, y, dna);
        this.shapeType = 'pentagon';
        this.sides = 5;
    }
    
    renderShape(ctx, color) {
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        for (let i = 0; i < this.sides; i++) {
            const angle = (i / this.sides) * Math.PI * 2 - Math.PI / 2; // Start from top
            const x = Math.cos(angle) * this.size / 2;
            const y = Math.sin(angle) * this.size / 2;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        
        // Pentagon star pattern for evolved versions
        if (this.dna.generation > 2) {
            ctx.strokeStyle = `hsl(${this.dna.traits.get('colorHue')}, 100%, 80%)`;
            ctx.lineWidth = 1;
            
            // Draw pentagram inside
            for (let i = 0; i < this.sides; i++) {
                const angle1 = (i / this.sides) * Math.PI * 2 - Math.PI / 2;
                const angle2 = ((i + 2) % this.sides / this.sides) * Math.PI * 2 - Math.PI / 2;
                
                ctx.beginPath();
                ctx.moveTo(Math.cos(angle1) * this.size / 2, Math.sin(angle1) * this.size / 2);
                ctx.lineTo(Math.cos(angle2) * this.size / 2, Math.sin(angle2) * this.size / 2);
                ctx.stroke();
            }
        }
    }
}