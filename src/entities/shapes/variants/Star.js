import { BaseShape } from '../BaseShape.js';

export class Star extends BaseShape {
    constructor(x, y, dna = null) {
        super(x, y, dna);
        this.shapeType = 'star';
        this.points = 5 + Math.floor(Math.random() * 3); // 5-7 points
        this.innerRadius = this.size * 0.4;
        this.outerRadius = this.size * 0.5;
    }
    
    renderShape(ctx, color) {
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        for (let i = 0; i < this.points * 2; i++) {
            const angle = (i / (this.points * 2)) * Math.PI * 2 - Math.PI / 2;
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
        
        // Glowing center for evolved stars
        if (this.dna.generation > 1) {
            ctx.fillStyle = `hsl(${this.dna.traits.get('colorHue')}, 100%, 80%)`;
            ctx.shadowBlur = 8;
            ctx.shadowColor = color;
            ctx.beginPath();
            ctx.arc(0, 0, this.innerRadius * 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        // Star rays for high-generation stars
        if (this.dna.generation > 3) {
            ctx.strokeStyle = `hsl(${this.dna.traits.get('colorHue')}, 100%, 90%)`;
            ctx.lineWidth = 1;
            for (let i = 0; i < this.points; i++) {
                const angle = (i / this.points) * Math.PI * 2 - Math.PI / 2;
                const rayLength = this.outerRadius * 1.5;
                
                ctx.beginPath();
                ctx.moveTo(Math.cos(angle) * this.outerRadius, Math.sin(angle) * this.outerRadius);
                ctx.lineTo(Math.cos(angle) * rayLength, Math.sin(angle) * rayLength);
                ctx.stroke();
            }
        }
    }
}