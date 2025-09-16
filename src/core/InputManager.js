export class InputManager {
    constructor() {
        this.keys = new Map();
        this.mousePos = { x: 0, y: 0 };
        this.mouseButtons = new Map();
        
        // Touch support
        this.touches = new Map();
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Input state
        this.inputState = {
            left: false,
            right: false,
            pause: false,
            restart: false
        };
        
        // Virtual controls for mobile
        this.virtualButtons = new Map();
        
        this.initialize();
    }
    
    initialize() {
        this.setupKeyboardEvents();
        this.setupMouseEvents();
        this.setupTouchEvents();
        this.setupVirtualControls();
    }
    
    setupKeyboardEvents() {
        document.addEventListener('keydown', (event) => {
            this.keys.set(event.code, true);
            this.updateInputState();
            
            // Prevent default for game keys
            const gameKeys = ['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space', 'Escape'];
            if (gameKeys.includes(event.code)) {
                event.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (event) => {
            this.keys.set(event.code, false);
            this.updateInputState();
        });
        
        // Handle lost focus
        window.addEventListener('blur', () => {
            this.keys.clear();
            this.updateInputState();
        });
    }
    
    setupMouseEvents() {
        document.addEventListener('mousemove', (event) => {
            this.mousePos.x = event.clientX;
            this.mousePos.y = event.clientY;
        });
        
        document.addEventListener('mousedown', (event) => {
            this.mouseButtons.set(event.button, true);
        });
        
        document.addEventListener('mouseup', (event) => {
            this.mouseButtons.set(event.button, false);
        });
        
        // Prevent right-click context menu
        document.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    }
    
    setupTouchEvents() {
        if (!this.isMobile) return;
        
        document.addEventListener('touchstart', (event) => {
            event.preventDefault();
            
            for (const touch of event.changedTouches) {
                this.touches.set(touch.identifier, {
                    x: touch.clientX,
                    y: touch.clientY,
                    startTime: Date.now()
                });
            }
            
            this.updateVirtualControls();
        }, { passive: false });
        
        document.addEventListener('touchmove', (event) => {
            event.preventDefault();
            
            for (const touch of event.changedTouches) {
                if (this.touches.has(touch.identifier)) {
                    this.touches.set(touch.identifier, {
                        ...this.touches.get(touch.identifier),
                        x: touch.clientX,
                        y: touch.clientY
                    });
                }
            }
            
            this.updateVirtualControls();
        }, { passive: false });
        
        document.addEventListener('touchend', (event) => {
            event.preventDefault();
            
            for (const touch of event.changedTouches) {
                this.touches.delete(touch.identifier);
            }
            
            this.updateVirtualControls();
        }, { passive: false });
    }
    
    setupVirtualControls() {
        if (!this.isMobile) return;
        
        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');
        
        if (leftBtn) {
            const leftBounds = leftBtn.getBoundingClientRect();
            this.virtualButtons.set('left', {
                element: leftBtn,
                bounds: leftBounds,
                active: false
            });
        }
        
        if (rightBtn) {
            const rightBounds = rightBtn.getBoundingClientRect();
            this.virtualButtons.set('right', {
                element: rightBtn,
                bounds: rightBounds,
                active: false
            });
        }
        
        // Update bounds on resize
        window.addEventListener('resize', () => {
            setTimeout(() => this.updateVirtualButtonBounds(), 100);
        });
    }
    
    updateVirtualButtonBounds() {
        for (const [name, button] of this.virtualButtons) {
            if (button.element) {
                button.bounds = button.element.getBoundingClientRect();
            }
        }
    }
    
    updateVirtualControls() {
        if (!this.isMobile) return;
        
        // Reset virtual button states
        for (const button of this.virtualButtons.values()) {
            button.active = false;
        }
        
        // Check which virtual buttons are being touched
        for (const touch of this.touches.values()) {
            for (const [name, button] of this.virtualButtons) {
                if (this.isPointInBounds(touch.x, touch.y, button.bounds)) {
                    button.active = true;
                }
            }
        }
        
        this.updateInputState();
    }
    
    isPointInBounds(x, y, bounds) {
        return x >= bounds.left && 
               x <= bounds.right && 
               y >= bounds.top && 
               y <= bounds.bottom;
    }
    
    updateInputState() {
        // Keyboard controls
        const leftKeys = this.keys.get('ArrowLeft') || this.keys.get('KeyA');
        const rightKeys = this.keys.get('ArrowRight') || this.keys.get('KeyD');
        
        // Virtual controls (mobile)
        const leftVirtual = this.virtualButtons.get('left')?.active || false;
        const rightVirtual = this.virtualButtons.get('right')?.active || false;
        
        // Combine inputs
        this.inputState.left = leftKeys || leftVirtual;
        this.inputState.right = rightKeys || rightVirtual;
        this.inputState.pause = this.keys.get('Escape') || false;
        this.inputState.restart = this.keys.get('Space') || false;
    }
    
    // Public API
    getInputState() {
        return { ...this.inputState };
    }
    
    isKeyPressed(keyCode) {
        return this.keys.get(keyCode) || false;
    }
    
    isMouseButtonPressed(button) {
        return this.mouseButtons.get(button) || false;
    }
    
    getMousePosition() {
        return { ...this.mousePos };
    }
    
    getTouchCount() {
        return this.touches.size;
    }
    
    getTouches() {
        return Array.from(this.touches.values());
    }
    
    // Utility methods
    anyInputActive() {
        return this.inputState.left || 
               this.inputState.right || 
               this.inputState.pause || 
               this.inputState.restart;
    }
    
    // For debugging
    getDebugInfo() {
        return {
            isMobile: this.isMobile,
            activeKeys: Array.from(this.keys.entries()).filter(([_, pressed]) => pressed),
            inputState: this.inputState,
            touchCount: this.touches.size,
            virtualButtons: Object.fromEntries(
                Array.from(this.virtualButtons.entries()).map(([name, btn]) => [name, btn.active])
            )
        };
    }
    
    // Clean up event listeners
    destroy() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mousedown', this.handleMouseDown);
        document.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('touchstart', this.handleTouchStart);
        document.removeEventListener('touchmove', this.handleTouchMove);
        document.removeEventListener('touchend', this.handleTouchEnd);
    }
}