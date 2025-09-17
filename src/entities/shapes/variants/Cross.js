import { BaseShape } from '../BaseShape.js';

export class Cross extends BaseShape {
    constructor(x, y, dna = null) {
        super(x, y, dna);
        this.shapeType = 'cross';
    }
    
    renderShape(ctx, color) {
        ctx.fillStyle = color;
        
        const armWidth = this.size * 0.3;
        const armLength = this.size;
        
        // Vertical arm
        ctx.fillRect(-armWidth/2, -armLength/2, armWidth, armLength);
        
        // Horizontal arm
        ctx.fillRect(-armLength/2, -armWidth/2, armLength, armWidth);
        
        // Beat sync outline
        if (this.beatPhase > 0.4) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.strokeRect(-armWidth/2, -armLength/2, armWidth, armLength);
            ctx.strokeRect(-armLength/2, -armWidth/2, armLength, armWidth);
        }
    }
}