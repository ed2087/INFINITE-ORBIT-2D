import { CONFIG } from '../utils/Config.js';
import { AudioManager } from './AudioManager.js';
import { Canvas2D } from './Canvas2D.js';
import { InputManager } from './InputManager.js';
import { OrbitPlayer } from '../entities/player/OrbitPlayer.js';
import { ShapeFactory } from '../entities/shapes/ShapeFactory.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { MutationSystem } from '../systems/MutationSystem.js';
import { ProjectileSystem } from '../systems/ProjectileSystem.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { PhaseSystem } from '../systems/PhaseSystem.js';

export class Game {
    constructor() {
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.isInitialized = false;
        this.gameTime = 0;
        this.lastFrameTime = 0;
        this.deltaTime = 0;
        
        // Core systems
        this.canvas = null;
        this.audioManager = null;
        this.inputManager = null;
        
        // Game systems
        this.phaseSystem = null;
        this.collisionSystem = null;
        this.mutationSystem = null;
        this.projectileSystem = null;
        this.particleSystem = null;
        
        // Game entities
        this.player = null;
        this.shapes = [];
        this.backgroundStars = [];
        
        // Game state
        this.score = 0;
        this.bestScore = 0;
        this.survivalTime = 0;
        this.spawnTimer = 0;
        this.spawnInterval = CONFIG.SPAWN_RATE.MIN;
        
        // Performance tracking
        this.frameCount = 0;
        this.performanceStats = {
            fps: 60,
            shapes: 0,
            projectiles: 0,
            particles: 0,
            mutations: 0
        };
        
        this.initialize();
    }
    
    async initialize() {
        try {
            console.log('🎮 Initializing Infinite Orbit 2D...');
            
            // Initialize core systems
            this.canvas = new Canvas2D('gameCanvas');
            this.audioManager = new AudioManager();
            this.inputManager = new InputManager();
            
            // Initialize game systems
            this.particleSystem = new ParticleSystem();
            this.mutationSystem = new MutationSystem(this.particleSystem);
            this.collisionSystem = new CollisionSystem(this.mutationSystem, this.particleSystem);
            this.projectileSystem = new ProjectileSystem();
            this.phaseSystem = new PhaseSystem();
            
            // Initialize game entities
            this.player = new OrbitPlayer(this.canvas.width, this.canvas.height);
            this.createBackgroundStars();
            
            // Initialize audio (don't await - let it load in background)
            this.audioManager.initialize().catch(error => {
                console.warn('Audio initialization failed:', error);
            });
            
            // Load saved data
            this.loadGameData();
            
            this.isInitialized = true;
            console.log('✅ Game initialized successfully');
            
            // Start game loop
            this.startGameLoop();
            
        } catch (error) {
            console.error('❌ Failed to initialize game:', error);
        }
    }
    
    startGameLoop() {
        const gameLoop = (currentTime) => {
            this.deltaTime = currentTime - this.lastFrameTime;
            this.lastFrameTime = currentTime;
            
            this.update(this.deltaTime);
            this.render();
            
            requestAnimationFrame(gameLoop);
        };
        
        requestAnimationFrame(gameLoop);
    }
    
    update(deltaTime) {
        if (!this.isInitialized) return;
        
        // Update core systems
        this.audioManager.update();
        
        // Handle input
        this.handleInput();
        
        // Update game based on state
        switch (this.gameState) {
            case 'playing':
                this.updateGameplay(deltaTime);
                break;
            case 'paused':
                // Only update systems that should continue during pause
                break;
            case 'gameOver':
                this.updateGameOver(deltaTime);
                break;
        }
        
        // Always update performance stats
        this.updatePerformanceStats();
    }
    
    updateGameplay(deltaTime) {
        // Update game time
        this.gameTime = this.audioManager.getCurrentTime();
        this.survivalTime = this.gameTime;
        
        // Update phase system
        this.phaseSystem.update(this.gameTime, this.audioManager);
        
        // Update player
        this.player.update(deltaTime, this.audioManager);
        
        // Handle shape spawning
        this.updateShapeSpawning();
        
        // Update shapes (aiming and firing)
        this.updateShapes(deltaTime);
        
        // Update projectiles
        this.projectileSystem.update(deltaTime, this.player, this.audioManager);
        
        // Handle collisions
        this.handleCollisions();
        
        // Update particle effects
        this.particleSystem.update(deltaTime);
        
        // Update background stars
        this.updateBackgroundStars();
        
        // Update score
        this.updateScore();
        
        // Check for special events
        this.checkSpecialEvents();
    }
    
    updateShapeSpawning() {
        this.spawnTimer++;
        this.spawnInterval = this.phaseSystem.getSpawnInterval();
        
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnShape();
            this.spawnTimer = 0;
        }
    }
    
    spawnShape() {
        const position = ShapeFactory.createSpawnPosition();
        const currentPhase = this.phaseSystem.currentPhase;
        
        const shape = ShapeFactory.createRandomShape(
            position.x, 
            position.y, 
            currentPhase, 
            this.audioManager
        );
        
        // Apply phase-specific modifications
        shape.canReattack = Math.random() < this.phaseSystem.getReattackChance();
        
        this.shapes.push(shape);
    }
    
    updateShapes(deltaTime) {
        for (let i = this.shapes.length - 1; i >= 0; i--) {
            const shape = this.shapes[i];
            
            if (!shape.update(deltaTime, this.player, this.audioManager)) {
                // Shape expired or died
                this.shapes.splice(i, 1);
                continue;
            }
            
            // Convert firing shapes to projectiles
            if (shape.state === 'firing' && shape.stateTime === 1) {
                this.projectileSystem.addProjectile(shape);
                this.shapes.splice(i, 1);
            }
        }
    }
    
    handleCollisions() {
        const projectiles = this.projectileSystem.getProjectiles();
        
        // Handle projectile collisions
        const collisionResult = this.collisionSystem.update(this.shapes, projectiles, this.player);
        
        // Add new shapes from mutations
        if (collisionResult.newShapes && collisionResult.newShapes.length > 0) {
            this.shapes.push(...collisionResult.newShapes);
        }
        
        // Remove collided shapes
        if (collisionResult.shapesToRemove) {
            for (const shape of collisionResult.shapesToRemove) {
                const index = this.shapes.indexOf(shape);
                if (index !== -1) {
                    this.shapes.splice(index, 1);
                }
            }
        }
        
        // Remove collided projectiles
        if (collisionResult.projectilesToRemove) {
            this.projectileSystem.removeProjectiles(collisionResult.projectilesToRemove);
        }
        
        // Handle player collision
        if (collisionResult.playerHit) {
            this.handlePlayerHit();
        }
        
        // Handle wall collisions
        this.handleWallCollisions();
    }
    
    handleWallCollisions() {
        const projectiles = this.projectileSystem.getProjectiles();
        const wallHits = this.collisionSystem.checkWallCollisions(
            projectiles, 
            this.canvas.width, 
            this.canvas.height
        );
        
        for (const hit of wallHits) {
            // Create wall explosion
            this.particleSystem.createExplosion(hit.x, hit.y, hit.projectile.color, {
                particleCount: 10,
                intensity: 0.8
            });
        }
        
        // Remove wall-hit projectiles
        this.projectileSystem.removeProjectiles(wallHits.map(hit => hit.projectile));
    }
    
    handlePlayerHit() {
        if (this.player.die()) {
            this.gameOver();
        }
    }
    
    updateScore() {
        // Score based on survival time and difficulty
        const timeBonus = Math.floor(this.survivalTime);
        const difficultyBonus = Math.floor(this.phaseSystem.difficultyMultiplier * 10);
        this.score = timeBonus + difficultyBonus;
    }
    
    checkSpecialEvents() {
        const specialEvent = this.phaseSystem.shouldTriggerSpecialEvent();
        
        if (specialEvent) {
            this.triggerSpecialEvent(specialEvent);
        }
    }
    
    triggerSpecialEvent(event) {
        console.log(`🌟 Special Event: ${event.type} (intensity: ${event.intensity})`);
        
        switch (event.type) {
            case 'phase_finale':
                this.triggerPhaseFinale(event.intensity);
                break;
            case 'chaos_burst':
                this.triggerChaosBurst(event.intensity);
                break;
            case 'survival_wave':
                this.triggerSurvivalWave(event.intensity);
                break;
        }
    }
    
    triggerPhaseFinale(intensity) {
        // Spawn multiple shapes simultaneously
        for (let i = 0; i < 5; i++) {
            setTimeout(() => this.spawnShape(), i * 100);
        }
    }
    
    triggerChaosBurst(intensity) {
        // Randomly mutate existing projectiles
        const projectiles = this.projectileSystem.getProjectiles();
        for (const projectile of projectiles.slice(0, 10)) {
            if (projectile.dna) {
                projectile.dna.mutate();
            }
        }
    }
    
    triggerSurvivalWave(intensity) {
        // Create a coordinated attack pattern
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const distance = 200;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            
            if (x > 0 && x < this.canvas.width && y > 0 && y < this.canvas.height) {
                const shape = ShapeFactory.createRandomShape(x, y, 'ENDGAME', this.audioManager);
                shape.canReattack = true;
                this.shapes.push(shape);
            }
        }
    }
    
    updateBackgroundStars() {
        for (const star of this.backgroundStars) {
            star.y += star.speed;
            
            if (star.y > this.canvas.height) {
                star.y = -10;
                star.x = Math.random() * this.canvas.width;
            }
        }
    }
    
    updateGameOver(deltaTime) {
        // Continue particle effects during game over
        this.particleSystem.update(deltaTime);
    }
    
    handleInput() {
        const input = this.inputManager.getInputState();
        
        // Always handle pause
        if (input.pause && this.gameState === 'playing') {
            this.pause();
        } else if (input.pause && this.gameState === 'paused') {
            this.resume();
        }
        
        // Handle restart
        if (input.restart) {
            if (this.gameState === 'gameOver' || this.gameState === 'menu') {
                this.startGame();
            }
        }
        
        // Pass input to player
        if (this.gameState === 'playing') {
            this.player.setInput(input.left, input.right);
        }
    }
    
    render() {
        if (!this.isInitialized) return;
        
        // Clear canvas
        this.canvas.clear();
        
        // Render background
        this.canvas.renderBackground(
            this.player.centerX, 
            this.player.centerY, 
            this.audioManager
        );
        
        // Render background stars
        this.canvas.renderBackgroundStars(this.backgroundStars);
        
        // Apply screen shake if needed
        if (this.shouldApplyScreenShake()) {
            this.canvas.applyScreenShake(5, 10);
        }
        
        // Render game entities
        this.renderGameEntities();
        
        // Restore screen shake
        if (this.shouldApplyScreenShake()) {
            this.canvas.restoreScreenShake();
        }
        
        // Render UI
        this.renderUI();
        
        // Update performance tracking
        this.canvas.updateFPS();
    }
    
    renderGameEntities() {
        // Render particles (background layer)
        this.particleSystem.render(this.canvas.getContext());
        
        // Render shapes (aiming)
        for (const shape of this.shapes) {
            shape.render(this.canvas.getContext(), this.audioManager);
        }
        
        // Render projectiles
        const projectiles = this.projectileSystem.getProjectiles();
        for (const projectile of projectiles) {
            if (this.canvas.isVisible(projectile.x, projectile.y, projectile.size)) {
                projectile.render(this.canvas.getContext(), this.audioManager);
            }
        }
        
        // Render player (top layer)
        this.player.render(this.canvas.getContext(), this.audioManager);
    }
    
    renderUI() {
        const ctx = this.canvas.getContext();
        
        // Only render UI during gameplay
        if (this.gameState !== 'playing') return;
        
        // Score
        const scoreElement = document.getElementById('scoreDisplay');
        if (scoreElement) {
            scoreElement.textContent = Math.floor(this.score).toString();
        }
        
        // Current phase
        const phaseElement = document.getElementById('phaseDisplay');
        if (phaseElement) {
            phaseElement.textContent = this.phaseSystem.currentPhase;
        }
        
        // Survival time
        const timeElement = document.getElementById('timeDisplay');
        if (timeElement) {
            const minutes = Math.floor(this.survivalTime / 60);
            const seconds = Math.floor(this.survivalTime % 60);
            const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            timeElement.textContent = timeString;
        }
        
        // Debug info in development
        if (CONFIG.DEV?.SHOW_STATS) {
            this.renderDebugInfo();
        }
    }
    
    renderDebugInfo() {
        const stats = [
            `FPS: ${this.canvas.getFPS()}`,
            `Shapes: ${this.shapes.length}`,
            `Projectiles: ${this.projectileSystem.getProjectileCount()}`,
            `Particles: ${this.particleSystem.getParticleCount()}`,
            `Phase: ${this.phaseSystem.currentPhase} (${Math.floor(this.phaseSystem.phaseProgress * 100)}%)`,
            `Difficulty: ${this.phaseSystem.difficultyMultiplier.toFixed(2)}x`
        ];
        
        for (let i = 0; i < stats.length; i++) {
            this.canvas.drawText(
                stats[i], 
                10, 
                this.canvas.height - (stats.length - i) * 20 - 10,
                '#00ff00', 
                '14px Arial'
            );
        }
    }
    
    shouldApplyScreenShake() {
        // Add screen shake during intense moments
        return this.phaseSystem.currentPhase === 'CHAOS' || 
               this.phaseSystem.currentPhase === 'ENDGAME';
    }
    
    updatePerformanceStats() {
        this.performanceStats = {
            fps: this.canvas.getFPS(),
            shapes: this.shapes.length,
            projectiles: this.projectileSystem.getProjectileCount(),
            particles: this.particleSystem.getParticleCount(),
            mutations: this.mutationSystem.getStats().totalCollisions
        };
    }
    
    createBackgroundStars() {
        this.backgroundStars = [];
        for (let i = 0; i < 150; i++) {
            this.backgroundStars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 1 + 0.5,
                opacity: Math.random() * 0.6 + 0.2
            });
        }
    }
    
    // Game state management
    async startGame() {
        console.log('🚀 Starting new game...');
        
        this.gameState = 'playing';
        this.gameTime = 0;
        this.score = 0;
        this.survivalTime = 0;
        this.spawnTimer = 0;
        
        // Reset all systems
        this.phaseSystem.reset();
        this.particleSystem.clear();
        this.projectileSystem.clear();
        this.shapes = [];
        
        // Reset player
        this.player.reset();
        this.player.resize(this.canvas.width, this.canvas.height);
        
        // Start music (this will only work after user interaction)
        if (this.audioManager.isInitialized) {
            try {
                await this.audioManager.play();
            } catch (error) {
                console.warn('Could not start audio:', error);
            }
        }
        
        // Hide all UI overlays
        const startMenu = document.getElementById('startMenu');
        const gameOver = document.getElementById('gameOver');
        const pauseMenu = document.getElementById('pauseMenu');
        
        if (startMenu) startMenu.classList.add('hidden');
        if (gameOver) gameOver.classList.add('hidden');
        if (pauseMenu) pauseMenu.classList.add('hidden');
        
        console.log('✅ Game started');
    }
    
    pause() {
        if (this.gameState !== 'playing') return;
        
        console.log('⏸️ Game paused');
        this.gameState = 'paused';
        
        // Pause audio if available
        if (this.audioManager.audioElement) {
            this.audioManager.audioElement.pause();
        }
        
        // Show pause menu
        const pauseMenu = document.getElementById('pauseMenu');
        if (pauseMenu) {
            pauseMenu.classList.remove('hidden');
            
            // Update pause menu stats
            document.getElementById('pauseTime').textContent = 
                `${Math.floor(this.survivalTime / 60)}:${Math.floor(this.survivalTime % 60).toString().padStart(2, '0')}`;
            document.getElementById('pausePhase').textContent = this.phaseSystem.currentPhase;
            document.getElementById('pauseScore').textContent = Math.floor(this.score);
        }
    }
    
    resume() {
        if (this.gameState !== 'paused') return;
        
        console.log('▶️ Game resumed');
        this.gameState = 'playing';
        
        // Resume audio if available
        if (this.audioManager.audioElement) {
            this.audioManager.audioElement.play();
        }
        
        // Hide pause menu
        const pauseMenu = document.getElementById('pauseMenu');
        if (pauseMenu) {
            pauseMenu.classList.add('hidden');
        }
    }
    
    gameOver() {
        console.log('💀 Game Over');
        this.gameState = 'gameOver';
        
        // Stop music
        if (this.audioManager.audioElement) {
            this.audioManager.audioElement.pause();
        }
        
        // Update best score
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.saveGameData();
            const newRecord = document.getElementById('newRecord');
            if (newRecord) newRecord.classList.remove('hidden');
        } else {
            const newRecord = document.getElementById('newRecord');
            if (newRecord) newRecord.classList.add('hidden');
        }
        
        // Show game over screen
        const gameOverScreen = document.getElementById('gameOver');
        if (gameOverScreen) {
            gameOverScreen.classList.remove('hidden');
            
            // Update game over stats
            document.getElementById('finalScore').textContent = Math.floor(this.score);
            document.getElementById('bestScore').textContent = Math.floor(this.bestScore);
            document.getElementById('finalTime').textContent = 
                `${Math.floor(this.survivalTime / 60)}:${Math.floor(this.survivalTime % 60).toString().padStart(2, '0')}`;
            document.getElementById('finalPhase').textContent = this.phaseSystem.currentPhase;
        }
        
        // Create dramatic explosion
        this.particleSystem.createEvolutionExplosion(
            this.player.centerX, 
            this.player.centerY, 
            {
                particleCount: 60,
                colors: ['#ff0000', '#ff4400', '#ffff00'],
                duration: 180,
                shockwaveRadius: 150
            }
        );
    }
    
    // Data persistence
    loadGameData() {
        try {
            const saved = localStorage.getItem('infiniteOrbit2D_save');
            if (saved) {
                const data = JSON.parse(saved);
                this.bestScore = data.bestScore || 0;
                
                // Update menu best score display
                const menuBestScore = document.getElementById('menuBestScore');
                if (menuBestScore) {
                    menuBestScore.textContent = Math.floor(this.bestScore);
                }
            }
        } catch (error) {
            console.warn('Failed to load save data:', error);
        }
    }
    
    saveGameData() {
        try {
            const data = {
                bestScore: this.bestScore,
                lastPlayed: Date.now()
            };
            localStorage.setItem('infiniteOrbit2D_save', JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save data:', error);
        }
    }
    
    // Resize handling
    resize() {
        if (this.canvas) {
            this.canvas.resize();
        }
        
        if (this.player) {
            this.player.resize(this.canvas.width, this.canvas.height);
        }
        
        if (this.inputManager) {
            this.inputManager.updateVirtualButtonBounds();
        }
        
        // Recreate background stars for new dimensions
        this.createBackgroundStars();
    }
    
    // Public API for debugging/testing
    getGameStats() {
        return {
            gameState: this.gameState,
            gameTime: this.gameTime,
            score: this.score,
            survivalTime: this.survivalTime,
            currentPhase: this.phaseSystem.currentPhase,
            phaseProgress: this.phaseSystem.phaseProgress,
            performance: this.performanceStats,
            collision: this.collisionSystem.getCollisionStats(),
            mutation: this.mutationSystem.getStats(),
            projectile: this.projectileSystem.getStats()
        };
    }
    
    // Force phase change for testing
    setPhase(phaseName) {
        if (CONFIG.DEV?.GOD_MODE) {
            this.phaseSystem.forcePhase(phaseName);
        }
    }
    
    // Cleanup
    destroy() {
        if (this.inputManager) {
            this.inputManager.destroy();
        }
        
        if (this.audioManager && this.audioManager.audioElement) {
            this.audioManager.audioElement.pause();
        }
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    window.game = new Game();
    
    // Handle page unload
    window.addEventListener('beforeunload', () => {
        if (window.game) {
            window.game.destroy();
        }
    });
    
    // Handle resize
    window.addEventListener('resize', () => {
        if (window.game) {
            window.game.resize();
        }
    });
});

// Add UI event handlers after DOM loads
document.addEventListener('DOMContentLoaded', () => {
    // Start button
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (window.game && window.game.isInitialized) {
                window.game.startGame();
            }
        });
    }
    
    // Restart button
    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            if (window.game && window.game.isInitialized) {
                window.game.startGame();
            }
        });
    }
    
    // Resume button
    const resumeBtn = document.getElementById('resumeBtn');
    if (resumeBtn) {
        resumeBtn.addEventListener('click', () => {
            if (window.game && window.game.isInitialized) {
                window.game.resume();
            }
        });
    }
    
    // Main menu button
    const mainMenuBtn = document.getElementById('mainMenuBtn');
    if (mainMenuBtn) {
        mainMenuBtn.addEventListener('click', () => {
            if (window.game) {
                // Show start menu, hide pause menu
                document.getElementById('startMenu').classList.remove('hidden');
                document.getElementById('pauseMenu').classList.add('hidden');
                window.game.gameState = 'menu';
                
                // Stop audio
                if (window.game.audioManager.audioElement) {
                    window.game.audioManager.audioElement.pause();
                }
            }
        });
    }
    
    // Keyboard controls
    document.addEventListener('keydown', (event) => {
        if (!window.game || !window.game.isInitialized) return;
        
        switch (event.code) {
            case 'Space':
                event.preventDefault();
                if (window.game.gameState === 'menu') {
                    window.game.startGame();
                } else if (window.game.gameState === 'gameOver') {
                    window.game.startGame();
                }
                break;
                
            case 'Escape':
                event.preventDefault();
                if (window.game.gameState === 'playing') {
                    window.game.pause();
                } else if (window.game.gameState === 'paused') {
                    window.game.resume();
                }
                break;
        }
    });
    
    // Audio status updates
    const updateAudioStatus = () => {
        const audioStatus = document.getElementById('audioStatus');
        const audioIndicator = document.getElementById('audioIndicator');
        
        if (window.game && window.game.audioManager) {
            const isPlaying = window.game.audioManager.audioElement && 
                            !window.game.audioManager.audioElement.paused;
            
            if (audioStatus) {
                if (isPlaying) {
                    audioStatus.textContent = 'Audio: Enabled';
                    audioStatus.classList.add('enabled');
                } else {
                    audioStatus.textContent = 'Audio: Click BEGIN ORBIT to enable';
                    audioStatus.classList.remove('enabled');
                }
            }
            
            if (audioIndicator) {
                if (isPlaying) {
                    audioIndicator.className = 'audio-active';
                } else {
                    audioIndicator.className = 'audio-inactive';
                }
            }
        }
    };
    
    // Update audio status periodically
    setInterval(updateAudioStatus, 1000);
});

// Expose game to global scope for debugging
if (typeof window !== 'undefined') {
    window.InfiniteOrbit2D = Game;
}