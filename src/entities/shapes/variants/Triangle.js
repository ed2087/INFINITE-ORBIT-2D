import { BaseShape } from '../BaseShape.js';

export class Triangle extends BaseShape {
    constructor(x, y, dna = null) {
        super(x, y, dna);
        this.shapeType = 'triangle';
        this.points = 3;
    }
    
    renderShape(ctx, color) {
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        for (let i = 0; i < this.points; i++) {
            const angle = (i / this.points) * Math.PI * 2 - Math.PI / 2;
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
        
        // Beat sync effect
        if (this.beatPhase > 0.5) {
            ctx.stroke();
        }
    }
}