import { BaseShape } from '../BaseShape.js';
import { MathUtils } from '../../../utils/MathUtils.js';

export class Lightning extends BaseShape {
    constructor(x, y, dna = null) {
        super(x, y, dna);
        this.shapeType = 'lightning';
        this.segments = 8;
        this.jaggedness = 0.3;
    }
    
    renderShape(ctx, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
        
        // Generate lightning bolt pattern
        const points = [];
        for (let i = 0; i < this.segments; i++) {
            const progress = i / (this.segments - 1);
            const x = (progress - 0.5) * this.size;
            const y = (Math.random() - 0.5) * this.jaggedness * this.size;
            points.push({ x, y });
        }
        
        // Draw lightning segments
        ctx.beginPath();
        for (let i = 0; i < points.length; i++) {
            if (i === 0) {
                ctx.moveTo(points[i].x, points[i].y);
            } else {
                ctx.lineTo(points[i].x, points[i].y);
            }
        }
        ctx.stroke();
        
        // Add branches
        if (this.dna.generation > 2) {
            ctx.lineWidth = 2;
            for (let i = 1; i < points.length - 1; i++) {
                if (Math.random() < 0.3) {
                    const branchLength = this.size * 0.3;
                    const branchAngle = (Math.random() - 0.5) * Math.PI;
                    ctx.beginPath();
                    ctx.moveTo(points[i].x, points[i].y);
                    ctx.lineTo(
                        points[i].x + Math.cos(branchAngle) * branchLength,
                        points[i].y + Math.sin(branchAngle) * branchLength
                    );
                    ctx.stroke();
                }
            }
        }
    }
}