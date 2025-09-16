export class MathUtils {
    static random(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    static randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }
    
    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
    
    static distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    static angleToTarget(fromX, fromY, toX, toY) {
        return Math.atan2(toY - fromY, toX - fromX);
    }
    
    static normalizeAngle(angle) {
        while (angle > Math.PI) angle -= Math.PI * 2;
        while (angle < -Math.PI) angle += Math.PI * 2;
        return angle;
    }
    
    // Vector operations
    static vectorLength(x, y) {
        return Math.sqrt(x * x + y * y);
    }
    
    static normalizeVector(x, y) {
        const length = this.vectorLength(x, y);
        return length > 0 ? { x: x / length, y: y / length } : { x: 0, y: 0 };
    }
    
    // Smooth step function for easing
    static smoothstep(edge0, edge1, x) {
        x = this.clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
        return x * x * (3 - 2 * x);
    }
}