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
        
        // Beat detection
        this.beatHistory = [];
        this.lastBeatTime = 0;
        this.currentBPM = 128;
        
        this.isInitialized = false;
    }
    
async initialize() {
    try {
        // Don't create AudioContext immediately - wait for user interaction
        this.audioElement = new Audio();
        this.audioElement.src = 'assets/audio/electronic-mix-60min.mp3';
        this.audioElement.crossOrigin = 'anonymous';
        this.audioElement.loop = false;
        this.audioElement.preload = 'metadata'; // Only load metadata, not full file
        
        // Add event listeners
        this.audioElement.addEventListener('canplaythrough', () => {
            console.log('Audio file loaded and ready to play');
        });
        
        this.audioElement.addEventListener('error', (e) => {
            console.error('Audio file error:', e);
            this.isInitialized = false;
        });
        
        // Mark as initialized but don't create AudioContext yet
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
        // Create AudioContext only when user starts the game
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create analyser
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = CONFIG.FFT_SIZE;
            this.analyser.smoothingTimeConstant = 0.8;
            
            // Connect audio graph
            this.source = this.audioContext.createMediaElementSource(this.audioElement);
            this.source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        }
        
        // Resume AudioContext if suspended
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        
        // Play the audio
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
        
        // Get frequency data
        this.analyser.getByteFrequencyData(this.frequencyData);
        
        // Calculate frequency bands
        const nyquist = CONFIG.SAMPLE_RATE / 2;
        const bassEnd = Math.floor((250 / nyquist) * this.frequencyData.length);
        const midsEnd = Math.floor((4000 / nyquist) * this.frequencyData.length);
        
        this.currentBass = this.getAverageFrequency(0, bassEnd);
        this.currentMids = this.getAverageFrequency(bassEnd, midsEnd);
        this.currentHighs = this.getAverageFrequency(midsEnd, this.frequencyData.length);
        
        // Overall amplitude
        this.currentAmplitude = (this.currentBass + this.currentMids + this.currentHighs) / 3;
        
        // Beat detection
        this.detectBeats();
    }
    
    getAverageFrequency(startIndex, endIndex) {
        let sum = 0;
        for (let i = startIndex; i < endIndex; i++) {
            sum += this.frequencyData[i];
        }
        return sum / (endIndex - startIndex) / 255; // Normalize to 0-1
    }
    
    detectBeats() {
        const currentTime = this.audioContext.currentTime;
        const threshold = 0.3; // Adjust based on your music
        
        if (this.currentBass > threshold && 
            currentTime - this.lastBeatTime > 0.3) { // Minimum 300ms between beats
            
            this.beatHistory.push(currentTime);
            this.lastBeatTime = currentTime;
            
            // Keep only recent beats for BPM calculation
            this.beatHistory = this.beatHistory.filter(time => 
                currentTime - time < 10 // Last 10 seconds
            );
            
            // Calculate current BPM
            if (this.beatHistory.length > 4) {
                const intervals = [];
                for (let i = 1; i < this.beatHistory.length; i++) {
                    intervals.push(this.beatHistory[i] - this.beatHistory[i-1]);
                }
                const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
                this.currentBPM = Math.round(60 / avgInterval);
            }
        }
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
    
    // Audio-reactive values for game systems
    getIntensityMultiplier() {
        return 1 + (this.currentAmplitude * CONFIG.SPEED_SCALING.AUDIO_MULTIPLIER);
    }
    
    getBeatStrength() {
        const timeSinceLastBeat = this.audioContext.currentTime - this.lastBeatTime;
        return Math.max(0, 1 - (timeSinceLastBeat / 0.5)); // Fade over 500ms
    }
    
    getFrequencyColor() {
        if (!CONFIG.AUDIO_REACTIVE_COLORS) return '#ffffff';
        
        const hue = (this.currentBass * 120) + (this.currentMids * 240) + (this.currentHighs * 60);
        const saturation = 70 + (this.currentAmplitude * 30);
        const lightness = 50 + (this.currentAmplitude * 20);
        
        return `hsl(${hue % 360}, ${saturation}%, ${lightness}%)`;
    }
}