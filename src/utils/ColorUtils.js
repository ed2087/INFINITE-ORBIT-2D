export class ColorUtils {
    // Color manipulation utilities for shape mutations and audio reactivity
    
    static hexToHsl(hex) {
        // Convert hex to HSL for easier manipulation
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0; // Achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        
        return { h: h * 360, s: s * 100, l: l * 100 };
    }
    
    static hslToHex(h, s, l) {
        h = h % 360;
        s = Math.max(0, Math.min(100, s)) / 100;
        l = Math.max(0, Math.min(100, l)) / 100;
        
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        
        let r, g, b;
        
        if (h >= 0 && h < 60) {
            r = c; g = x; b = 0;
        } else if (h >= 60 && h < 120) {
            r = x; g = c; b = 0;
        } else if (h >= 120 && h < 180) {
            r = 0; g = c; b = x;
        } else if (h >= 180 && h < 240) {
            r = 0; g = x; b = c;
        } else if (h >= 240 && h < 300) {
            r = x; g = 0; b = c;
        } else {
            r = c; g = 0; b = x;
        }
        
        const toHex = (val) => {
            const hex = Math.round((val + m) * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
    
    static hslString(h, s, l, a = 1) {
        return `hsl(${Math.round(h % 360)}, ${Math.round(s)}%, ${Math.round(l)}%, ${a})`;
    }
    
    // Blend two colors for hybrid offspring
    static blendColors(color1, color2, ratio = 0.5) {
        const hsl1 = this.parseColor(color1);
        const hsl2 = this.parseColor(color2);
        
        if (!hsl1 || !hsl2) return color1;
        
        // Blend hue with wraparound consideration
        let blendedHue = this.blendHues(hsl1.h, hsl2.h, ratio);
        
        // Blend saturation and lightness
        const blendedSat = hsl1.s * (1 - ratio) + hsl2.s * ratio;
        const blendedLight = hsl1.l * (1 - ratio) + hsl2.l * ratio;
        
        return this.hslString(blendedHue, blendedSat, blendedLight);
    }
    
    static blendHues(hue1, hue2, ratio) {
        // Handle hue blending with circular wraparound
        const diff = Math.abs(hue2 - hue1);
        
        if (diff <= 180) {
            // Direct interpolation
            return hue1 * (1 - ratio) + hue2 * ratio;
        } else {
            // Wrap around the shorter path
            if (hue1 < hue2) {
                hue1 += 360;
            } else {
                hue2 += 360;
            }
            const blended = hue1 * (1 - ratio) + hue2 * ratio;
            return blended % 360;
        }
    }
    
    // Generate complementary colors for mutations
    static getComplementaryColor(color) {
        const hsl = this.parseColor(color);
        if (!hsl) return color;
        
        const compHue = (hsl.h + 180) % 360;
        return this.hslString(compHue, hsl.s, hsl.l);
    }
    
    static getTriadicColors(color) {
        const hsl = this.parseColor(color);
        if (!hsl) return [color, color, color];
        
        return [
            this.hslString(hsl.h, hsl.s, hsl.l),
            this.hslString((hsl.h + 120) % 360, hsl.s, hsl.l),
            this.hslString((hsl.h + 240) % 360, hsl.s, hsl.l)
        ];
    }
    
    static getAnalogousColors(color, count = 3) {
        const hsl = this.parseColor(color);
        if (!hsl) return Array(count).fill(color);
        
        const colors = [];
        const step = 30; // 30 degree steps
        
        for (let i = 0; i < count; i++) {
            const hue = (hsl.h + (i - Math.floor(count/2)) * step) % 360;
            colors.push(this.hslString(hue, hsl.s, hsl.l));
        }
        
        return colors;
    }
    
    // Audio-reactive color generation
    static getAudioReactiveColor(baseColor, audioData) {
        const hsl = this.parseColor(baseColor);
        if (!hsl || !audioData) return baseColor;
        
        // Shift hue based on audio frequencies
        const hueShift = (audioData.bass * 60) + (audioData.mids * 120) + (audioData.highs * 180);
        const newHue = (hsl.h + hueShift) % 360;
        
        // Increase saturation with amplitude
        const newSat = Math.min(100, hsl.s + (audioData.amplitude * 30));
        
        // Pulse lightness with beats
        const lightnessPulse = audioData.beatStrength * 20;
        const newLight = Math.max(20, Math.min(80, hsl.l + lightnessPulse));
        
        return this.hslString(newHue, newSat, newLight);
    }
    
    // Mutation color generation
    static mutateColor(color, intensity = 1.0) {
        const hsl = this.parseColor(color);
        if (!hsl) return color;
        
        // Random hue shift
        const hueShift = (Math.random() - 0.5) * 60 * intensity;
        const newHue = (hsl.h + hueShift + 360) % 360;
        
        // Saturation drift
        const satShift = (Math.random() - 0.5) * 40 * intensity;
        const newSat = Math.max(30, Math.min(100, hsl.s + satShift));
        
        // Lightness drift
        const lightShift = (Math.random() - 0.5) * 30 * intensity;
        const newLight = Math.max(30, Math.min(70, hsl.l + lightShift));
        
        return this.hslString(newHue, newSat, newLight);
    }
    
    // Generation-based color evolution
    static evolveColor(color, generation) {
        const hsl = this.parseColor(color);
        if (!hsl) return color;
        
        // Colors become more saturated and shift toward specific ranges with evolution
        const evolutionHueTargets = [0, 60, 120, 180, 240, 300]; // Primary and secondary hues
        const targetHue = evolutionHueTargets[generation % evolutionHueTargets.length];
        
        // Gradually shift toward target hue
        const hueProgress = Math.min(generation * 0.1, 0.8);
        const evolvedHue = this.blendHues(hsl.h, targetHue, hueProgress);
        
        // Increase saturation with generation
        const evolvedSat = Math.min(100, hsl.s + generation * 5);
        
        // Adjust lightness based on generation pattern
        const lightnessCycle = Math.sin(generation * 0.5) * 15;
        const evolvedLight = Math.max(20, Math.min(80, hsl.l + lightnessCycle));
        
        return this.hslString(evolvedHue, evolvedSat, evolvedLight);
    }
    
    // Color harmony generation for particle effects
    static generateHarmony(baseColor, type = 'complementary') {
        switch (type) {
            case 'complementary':
                return [baseColor, this.getComplementaryColor(baseColor)];
            case 'triadic':
                return this.getTriadicColors(baseColor);
            case 'analogous':
                return this.getAnalogousColors(baseColor, 3);
            case 'monochromatic':
                return this.getMonochromaticColors(baseColor, 4);
            default:
                return [baseColor];
        }
    }
    
    static getMonochromaticColors(color, count = 4) {
        const hsl = this.parseColor(color);
        if (!hsl) return Array(count).fill(color);
        
        const colors = [];
        const lightStep = 60 / count;
        
        for (let i = 0; i < count; i++) {
            const lightness = 20 + (i * lightStep);
            colors.push(this.hslString(hsl.h, hsl.s, lightness));
        }
        
        return colors;
    }
    
    // Utility to parse different color formats
    static parseColor(color) {
        if (typeof color !== 'string') return null;
        
        // HSL format
        const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (hslMatch) {
            return {
                h: parseInt(hslMatch[1]),
                s: parseInt(hslMatch[2]),
                l: parseInt(hslMatch[3])
            };
        }
        
        // Hex format
        const hexMatch = color.match(/^#([0-9a-f]{6})$/i);
        if (hexMatch) {
            return this.hexToHsl(color);
        }
        
        // Named colors (basic support)
        const namedColors = {
            red: { h: 0, s: 100, l: 50 },
            green: { h: 120, s: 100, l: 50 },
            blue: { h: 240, s: 100, l: 50 },
            yellow: { h: 60, s: 100, l: 50 },
            cyan: { h: 180, s: 100, l: 50 },
            magenta: { h: 300, s: 100, l: 50 },
            white: { h: 0, s: 0, l: 100 },
            black: { h: 0, s: 0, l: 0 }
        };
        
        return namedColors[color.toLowerCase()] || null;
    }
    
    // Color distance calculation for similarity matching
    static colorDistance(color1, color2) {
        const hsl1 = this.parseColor(color1);
        const hsl2 = this.parseColor(color2);
        
        if (!hsl1 || !hsl2) return Infinity;
        
        // Calculate distance in HSL space
        const hueDiff = Math.min(Math.abs(hsl1.h - hsl2.h), 360 - Math.abs(hsl1.h - hsl2.h));
        const satDiff = Math.abs(hsl1.s - hsl2.s);
        const lightDiff = Math.abs(hsl1.l - hsl2.l);
        
        // Weighted distance (hue has more impact)
        return Math.sqrt((hueDiff * 2) ** 2 + satDiff ** 2 + lightDiff ** 2);
    }
    
    // Generate color for specific DNA lineage
    static getLineageColor(lineageId, generation = 0) {
        // Convert lineage ID to consistent hue
        let hash = 0;
        for (let i = 0; i < lineageId.length; i++) {
            hash = ((hash << 5) - hash + lineageId.charCodeAt(i)) & 0xffffffff;
        }
        
        const baseHue = Math.abs(hash) % 360;
        const saturation = 60 + (generation * 3); // More saturated with each generation
        const lightness = 45 + Math.sin(generation * 0.5) * 10;
        
        return this.hslString(baseHue, Math.min(saturation, 90), lightness);
    }
    
    // Utility for creating gradients
    static createGradient(ctx, x1, y1, x2, y2, colors) {
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        
        for (let i = 0; i < colors.length; i++) {
            const stop = i / (colors.length - 1);
            gradient.addColorStop(stop, colors[i]);
        }
        
        return gradient;
    }
    
    static createRadialGradient(ctx, x, y, r1, r2, colors) {
        const gradient = ctx.createRadialGradient(x, y, r1, x, y, r2);
        
        for (let i = 0; i < colors.length; i++) {
            const stop = i / (colors.length - 1);
            gradient.addColorStop(stop, colors[i]);
        }
        
        return gradient;
    }
}