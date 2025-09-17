import { BaseShape } from '../BaseShape.js';

export class Crystal extends BaseShape {
    constructor(x, y, dna = null) {
        super(x, y, dna);
        this.shapeType = 'crystal';
        this.facetCount = 6 + Math.floor(Math.random() * 4);
        this.innerRadius = this.size * 0.3;
    }
    
    renderShape(ctx, color) {
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        
        // Outer crystal
        ctx.beginPath();
        for (let i = 0; i < this.facetCount; i++) {
            const angle = (i / this.facetCount) * Math.PI * 2;
            const radius = this.size/2 + Math.sin(i * 1.3) * (this.size * 0.1);
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
        
        // Inner crystal core
        ctx.fillStyle = `hsl(${this.dna.traits.get('colorHue')}, 100%, 80%)`;
        ctx.beginPath();
        for (let i = 0; i < this.facetCount; i++) {
            const angle = (i / this.facetCount) * Math.PI * 2;
            const x = Math.cos(angle) * this.innerRadius;
            const y = Math.sin(angle) * this.innerRadius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        
        // Facet lines
        ctx.strokeStyle = `hsl(${this.dna.traits.get('colorHue')}, 100%, 90%)`;
        for (let i = 0; i < this.facetCount; i++) {
            const angle = (i / this.facetCount) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * this.size/2, Math.sin(angle) * this.size/2);
            ctx.stroke();
        }
    }
}