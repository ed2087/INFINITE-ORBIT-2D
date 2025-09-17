// At the top of AudioManager.js, add the CONFIG import:
import { CONFIG } from '../utils/Config.js';

export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.audioElement = null;
        this.analyser = null;
        this.dataArray = null;
        this.source = null;
        
        // Real-time audio data
        this.frequencyData = new Uint8Array(CONFIG.FFT_SIZE / 2);
        this.currentAmplitude = 0;
        this.currentBass = 0;
        this.currentMids = 0;
        this.currentHighs = 0;
        
        // Enhanced musical analysis
        this.bassHistory = [];
        this.energyLevel = 0; // 0-4 scale: chill, building, intense, peak, chaos
        this.bassSpikes = [];
        this.musicalPhaseIntensity = 0;
        this.recentBassAverage = 0;
        this.bassVariance = 0;
        
        // Beat detection
        this.beatHistory = [];
        this.lastBeatTime = 0;
        this.currentBPM = 128;
        this.strongBeats = [];
        this.nextBeatPrediction = 0;
        
        // Musical progression tracking
        this.songIntensityHistory = [];
        this.currentSongEnergy = 0;
        this.energyTrend = 0; // -1 declining, 0 stable, 1 building
        
        this.isInitialized = false;
    }
    
    async initialize() {
        try {
            this.audioElement = new Audio();
            this.audioElement.src = 'assets/audio/electronic-mix-60min.mp3';
            this.audioElement.crossOrigin = 'anonymous';
            this.audioElement.loop = false;
            this.audioElement.preload = 'metadata';
            
            this.audioElement.addEventListener('canplaythrough', () => {
                console.log('Audio file loaded and ready to play');
            });
            
            this.audioElement.addEventListener('error', (e) => {
                console.error('Audio file error:', e);
                this.isInitialized = false;
            });
            
            this.isInitialized = true;
            console.log('AudioManager initialized - waiting for user interaction');
            
        } catch (error) {
            console.warn('Audio initialization failed, running in silent mode:', error);
            this.isInitialized = false;
        }
    }

    async play() {
        if (!this.isInitialized) return false;
        
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = CONFIG.FFT_SIZE;
                this.analyser.smoothingTimeConstant = 0.8;
                
                this.source = this.audioContext.createMediaElementSource(this.audioElement);
                this.source.connect(this.analyser);
                this.analyser.connect(this.audioContext.destination);
                
                this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            }
            
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            await this.audioElement.play();
            console.log('60-minute electronic mix started');
            return true;
            
        } catch (error) {
            console.warn('Failed to play audio:', error);
            return false;
        }
    }
    
    update() {
        if (!this.isInitialized || !this.analyser) return;
        
        this.analyser.getByteFrequencyData(this.frequencyData);
        
        // Calculate frequency bands
        const nyquist = CONFIG.SAMPLE_RATE / 2;
        const bassEnd = Math.floor((250 / nyquist) * this.frequencyData.length);
        const midsEnd = Math.floor((4000 / nyquist) * this.frequencyData.length);
        
        this.currentBass = this.getAverageFrequency(0, bassEnd);
        this.currentMids = this.getAverageFrequency(bassEnd, midsEnd);
        this.currentHighs = this.getAverageFrequency(midsEnd, this.frequencyData.length);
        
        this.currentAmplitude = (this.currentBass + this.currentMids + this.currentHighs) / 3;
        
        // Enhanced musical analysis
        this.updateBassAnalysis();
        this.updateEnergyLevels();
        this.detectBeats();
        this.updateMusicalProgression();
    }
    
    updateBassAnalysis() {
        // Track bass history for spike detection
        this.bassHistory.push(this.currentBass);
        if (this.bassHistory.length > 120) { // 2 seconds at 60fps
            this.bassHistory.shift();
        }
        
        // Calculate recent bass average and variance
        if (this.bassHistory.length > 10) {
            this.recentBassAverage = this.bassHistory.slice(-30).reduce((a, b) => a + b) / 30;
            const variance = this.bassHistory.slice(-30).reduce((sum, val) => {
                return sum + Math.pow(val - this.recentBassAverage, 2);
            }, 0) / 30;
            this.bassVariance = Math.sqrt(variance);
        }
        
        // Detect bass spikes (panic attack triggers)
        const currentTime = this.audioContext ? this.audioContext.currentTime : Date.now() / 1000;
        const bassThreshold = this.recentBassAverage + (this.bassVariance * 2);
        
        if (this.currentBass > bassThreshold && this.currentBass > 0.6) {
            this.bassSpikes.push({
                time: currentTime,
                intensity: this.currentBass,
                threshold: bassThreshold
            });
        }
        
        // Clean old spikes
        this.bassSpikes = this.bassSpikes.filter(spike => 
            currentTime - spike.time < 2.0 // Keep spikes for 2 seconds
        );
    }
    
    updateEnergyLevels() {
        // Calculate current song energy (0-4 scale)
        const totalEnergy = this.currentAmplitude;
        const bassWeight = this.currentBass * 1.2;
        const midsWeight = this.currentMids * 1.0;
        const highsWeight = this.currentHighs * 0.8;
        
        this.currentSongEnergy = (totalEnergy + bassWeight + midsWeight + highsWeight) / 4;
        
        // Classify energy levels
        if (this.currentSongEnergy < 0.2) {
            this.energyLevel = 0; // Chill
        } else if (this.currentSongEnergy < 0.4) {
            this.energyLevel = 1; // Building
        } else if (this.currentSongEnergy < 0.6) {
            this.energyLevel = 2; // Intense
        } else if (this.currentSongEnergy < 0.8) {
            this.energyLevel = 3; // Peak
        } else {
            this.energyLevel = 4; // Chaos
        }
        
        // Track intensity history for trend analysis
        this.songIntensityHistory.push(this.currentSongEnergy);
        if (this.songIntensityHistory.length > 300) { // 5 seconds of history
            this.songIntensityHistory.shift();
        }
        
        // Calculate energy trend
        if (this.songIntensityHistory.length > 60) {
            const recent = this.songIntensityHistory.slice(-30);
            const older = this.songIntensityHistory.slice(-90, -60);
            const recentAvg = recent.reduce((a, b) => a + b) / recent.length;
            const olderAvg = older.reduce((a, b) => a + b) / older.length;
            
            const diff = recentAvg - olderAvg;
            if (diff > 0.1) {
                this.energyTrend = 1; // Building
            } else if (diff < -0.1) {
                this.energyTrend = -1; // Declining
            } else {
                this.energyTrend = 0; // Stable
            }
        }
    }
    
    detectBeats() {
        const currentTime = this.audioContext ? this.audioContext.currentTime : Date.now() / 1000;
        const beatThreshold = 0.3;
        
        if (this.currentBass > beatThreshold && 
            currentTime - this.lastBeatTime > 0.1) { // Minimum 100ms between beats
            
            const beatStrength = this.currentBass;
            const isStrongBeat = beatStrength > 0.6;
            
            this.beatHistory.push({
                time: currentTime,
                strength: beatStrength,
                isStrong: isStrongBeat
            });
            
            if (isStrongBeat) {
                this.strongBeats.push(currentTime);
            }
            
            this.lastBeatTime = currentTime;
            
            // Keep only recent beats
            this.beatHistory = this.beatHistory.filter(beat => 
                currentTime - beat.time < 10
            );
            this.strongBeats = this.strongBeats.filter(beat => 
                currentTime - beat < 5
            );
            
            // Calculate BPM
            if (this.beatHistory.length > 4) {
                const intervals = [];
                for (let i = 1; i < this.beatHistory.length; i++) {
                    intervals.push(this.beatHistory[i].time - this.beatHistory[i-1].time);
                }
                const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
                this.currentBPM = Math.round(60 / avgInterval);
            }
            
            // Predict next beat
            if (this.beatHistory.length > 2) {
                const lastInterval = this.beatHistory[this.beatHistory.length - 1].time - 
                                   this.beatHistory[this.beatHistory.length - 2].time;
                this.nextBeatPrediction = currentTime + lastInterval;
            }
        }
    }
    
    updateMusicalProgression() {
        // Calculate musical phase intensity based on overall progression
        const gameTime = this.getCurrentTime();
        const songProgress = gameTime / CONFIG.SONG_DURATION;
        
        // Musical intensity follows song progression
        this.musicalPhaseIntensity = Math.min(songProgress * 2, 1.0) + 
                                   (this.currentSongEnergy * 0.5);
    }
    
    getAverageFrequency(startIndex, endIndex) {
        let sum = 0;
        for (let i = startIndex; i < endIndex; i++) {
            sum += this.frequencyData[i];
        }
        return sum / (endIndex - startIndex) / 255;
    }
    
    getCurrentTime() {
        return this.audioElement ? this.audioElement.currentTime : 0;
    }
    
    getGamePhase() {
        const time = this.getCurrentTime();
        for (const [phase, timing] of Object.entries(CONFIG.PHASES)) {
            if (time >= timing.start && time < timing.end) {
                return phase;
            }
        }
        return 'ENDGAME';
    }
    
    // Enhanced musical analysis methods
    isBassSpikeActive() {
        const currentTime = this.audioContext ? this.audioContext.currentTime : Date.now() / 1000;
        return this.bassSpikes.some(spike => currentTime - spike.time < 0.5);
    }
    
    getBassSpikeIntensity() {
        if (!this.isBassSpikeActive()) return 0;
        const currentTime = this.audioContext ? this.audioContext.currentTime : Date.now() / 1000;
        const recentSpike = this.bassSpikes.find(spike => currentTime - spike.time < 0.5);
        return recentSpike ? recentSpike.intensity : 0;
    }
    
    shouldTriggerPanicAttack() {
        return this.isBassSpikeActive() && this.getBassSpikeIntensity() > 0.7;
    }
    
    getTimeToNextBeat() {
        if (!this.nextBeatPrediction || !this.audioContext) return 60; // Default aim time
        const currentTime = this.audioContext.currentTime;
        const timeToNext = Math.max(0, this.nextBeatPrediction - currentTime);
        return Math.floor(timeToNext * 60); // Convert to frames
    }
    
    getBeatSyncMultiplier() {
        const beatStrength = this.getBeatStrength();
        return 0.5 + (beatStrength * 1.5); // 0.5x to 2x speed based on beat
    }
    
    getEnergyBasedSpeedMultiplier() {
        const baseMultiplier = [0.7, 0.85, 1.0, 1.3, 1.8][this.energyLevel] || 1.0;
        const trendBonus = this.energyTrend === 1 ? 0.2 : 0;
        return baseMultiplier + trendBonus;
    }
    
    getFrequencyAggressionLevel(shapeType) {
        // Different shapes respond to different frequency ranges
        const aggressionMap = {
            // Bass-reactive shapes (geometric, heavy)
            triangle: this.currentBass,
            hexagon: this.currentBass,
            diamond: this.currentBass,
            octagon: this.currentBass,
            pentagon: this.currentBass,
            cross: this.currentBass,
            blade: this.currentBass,
            
            // Mid-reactive shapes (organic, flowing)  
            spiral: this.currentMids,
            flower: this.currentMids,
            wave: this.currentMids,
            comet: this.currentMids,
            boomerang: this.currentMids,
            
            // High-reactive shapes (energy, chaotic)
            lightning: this.currentHighs,
            star: this.currentHighs,
            crystal: this.currentHighs,
            plasma: this.currentHighs,
            
            // Full-spectrum shapes (mechanical, complex)
            gear: this.currentAmplitude,
            spinner: this.currentAmplitude,
            vortex: this.currentAmplitude,
            arrow: this.currentAmplitude
        };
        
        return aggressionMap[shapeType] || this.currentAmplitude;
    }
    
    shouldTriggerCoordinatedAttack() {
        // Trigger coordinated attacks during musical buildups or drops
        return (this.energyTrend === 1 && this.energyLevel >= 2) || 
               (this.strongBeats.length >= 3); // Recent strong beats
    }
    
    getMusicalAttackModifier() {
        // Overall attack intensity modifier based on music
        const energyMod = [0.6, 0.8, 1.0, 1.4, 2.0][this.energyLevel] || 1.0;
        const spikeMod = this.isBassSpikeActive() ? 1.8 : 1.0;
        const beatMod = this.getBeatStrength() * 0.5 + 1.0;
        
        return energyMod * spikeMod * beatMod;
    }
    
    // Audio-reactive values for game systems  
    getIntensityMultiplier() {
        return 1 + (this.currentAmplitude * CONFIG.SPEED_SCALING.AUDIO_MULTIPLIER);
    }
    
    getBeatStrength() {
        if (!this.audioContext) return 0;
        const currentTime = this.audioContext.currentTime;
        const timeSinceLastBeat = currentTime - this.lastBeatTime;
        return Math.max(0, 1 - (timeSinceLastBeat / 0.5));
    }
    
    getFrequencyColor() {
        if (!CONFIG.AUDIO_REACTIVE_COLORS) return '#ffffff';
        
        const hue = (this.currentBass * 120) + (this.currentMids * 240) + (this.currentHighs * 60);
        const saturation = 70 + (this.currentAmplitude * 30);
        const lightness = 50 + (this.currentAmplitude * 20);
        
        return `hsl(${hue % 360}, ${saturation}%, ${lightness}%)`;
    }
}