import { BaseShape } from '../BaseShape.js';

export class Gear extends BaseShape {
    constructor(x, y, dna = null) {
        super(x, y, dna);
        this.shapeType = 'gear';
        this.toothCount = 8 + Math.floor(Math.random() * 4);
        this.innerRadius = this.size * 0.3;
        this.outerRadius = this.size * 0.5;
    }
    
    renderShape(ctx, color) {
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        
        // Draw gear teeth
        ctx.beginPath();
        for (let i = 0; i < this.toothCount * 2; i++) {
            const angle = (i / (this.toothCount * 2)) * Math.PI * 2;
            const radius = i % 2 === 0 ? this.outerRadius : this.innerRadius;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        
        // Inner circle
        ctx.beginPath();
        ctx.arc(0, 0, this.innerRadius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        
        // Center hub
        ctx.fillStyle = `hsl(${this.dna.traits.get('colorHue')}, 100%, 80%)`;
        ctx.beginPath();
        ctx.arc(0, 0, this.innerRadius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Spokes
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * this.innerRadius * 0.6, Math.sin(angle) * this.innerRadius * 0.6);
            ctx.stroke();
        }
    }
}