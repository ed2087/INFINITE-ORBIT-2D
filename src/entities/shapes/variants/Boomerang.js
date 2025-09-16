import { BaseShape } from '../BaseShape.js';

export class Boomerang extends BaseShape {
    constructor(x, y, dna = null) {
        super(x, y, dna);
        this.shapeType = 'boomerang';
        this.returnPhase = false;
        this.originalTarget = { x: 0, y: 0 };
    }
    
    update(deltaTime, orbitPlayer, audioManager) {
        const result = super.update(deltaTime, orbitPlayer, audioManager);
        
        // Boomerang behavior - return after traveling certain distance
        if (this.state === 'firing' && !this.returnPhase) {
            const distanceTraveled = Math.sqrt(
                Math.pow(this.x - this.originalTarget.x, 2) + 
                Math.pow(this.y - this.originalTarget.y, 2)
            );
            
            if (distanceTraveled > this.size * 3) {
                this.returnPhase = true;
                this.vx *= -0.8;
                this.vy *= -0.8;
            }
        }
        
        return result;
    }
    
    fire() {
        super.fire();
        this.originalTarget = { x: this.targetX, y: this.targetY };
    }
    
    renderShape(ctx, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        
        const armLength = this.size * 0.4;
        const armAngle = Math.PI * 0.3;
        
        // First arm
        ctx.beginPath();
        ctx.arc(0, 0, armLength, -armAngle/2, armAngle/2, false);
        ctx.stroke();
        
        // Second arm
        ctx.beginPath();
        ctx.arc(0, 0, armLength, Math.PI - armAngle/2, Math.PI + armAngle/2, false);
        ctx.stroke();
        
        // Center connection
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}