import { BaseShape } from '../BaseShape.js';

export class Hexagon extends BaseShape {
    constructor(x, y, dna = null) {
        super(x, y, dna);
        this.shapeType = 'hexagon';
        this.sides = 6;
    }
    
    renderShape(ctx, color) {
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        for (let i = 0; i < this.sides; i++) {
            const angle = (i / this.sides) * Math.PI * 2;
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
        
        // Hexagonal grid pattern for evolved hexagons
        if (this.dna.generation > 2) {
            ctx.strokeStyle = `hsl(${this.dna.traits.get('colorHue')}, 100%, 80%)`;
            const innerSize = this.size * 0.5;
            ctx.beginPath();
            for (let i = 0; i < this.sides; i++) {
                const angle = (i / this.sides) * Math.PI * 2;
                const x = Math.cos(angle) * innerSize / 2;
                const y = Math.sin(angle) * innerSize / 2;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.stroke();
        }
        
        if (this.beatPhase > 0.6) {
            ctx.stroke();
        }
    }
}