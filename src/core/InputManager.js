export class InputManager {
    constructor() {
        this.keys = new Map();
        this.mousePos = { x: 0, y: 0 };
        this.mouseButtons = new Map();
        
        // Touch support
        this.touches = new Map();
        
        // Input state
        this.inputState = {
            left: false,
            right: false,
            pause: false,
            restart: false
        };
        
        // Virtual controls - always enabled
        this.virtualButtons = new Map();
        
        // Gamepad support
        this.gamepadIndex = null;
        this.gamepadDeadzone = 0.3;
        
        this.initialize();
    }
    
    initialize() {
        this.setupKeyboardEvents();
        this.setupMouseEvents();
        this.setupTouchEvents();
        this.setupGamepadEvents();
        
        // Setup virtual controls when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => {
                    this.setupVirtualControls();
                    this.setupMouseVirtualControls();
                }, 100);
            });
        } else {
            setTimeout(() => {
                this.setupVirtualControls();
                this.setupMouseVirtualControls();
            }, 100);
        }
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
        
        document.addEventListener('touchcancel', (event) => {
            event.preventDefault();
            
            for (const touch of event.changedTouches) {
                this.touches.delete(touch.identifier);
            }
            
            this.updateVirtualControls();
        }, { passive: false });
    }
    
    setupGamepadEvents() {
        window.addEventListener('gamepadconnected', (event) => {
            console.log('Gamepad connected:', event.gamepad.id);
            this.gamepadIndex = event.gamepad.index;
        });
        
        window.addEventListener('gamepaddisconnected', (event) => {
            console.log('Gamepad disconnected:', event.gamepad.id);
            if (this.gamepadIndex === event.gamepad.index) {
                this.gamepadIndex = null;
            }
        });
    }
    
    setupVirtualControls() {
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
        
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.updateVirtualButtonBounds(), 100);
        });
    }
    
    setupMouseVirtualControls() {
        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');
        
        if (leftBtn) {
            leftBtn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const button = this.virtualButtons.get('left');
                if (button) {
                    button.active = true;
                    button.element.classList.add('active');
                    this.updateInputState();
                }
            });
            
            leftBtn.addEventListener('mouseup', (e) => {
                e.preventDefault();
                const button = this.virtualButtons.get('left');
                if (button) {
                    button.active = false;
                    button.element.classList.remove('active');
                    this.updateInputState();
                }
            });
            
            leftBtn.addEventListener('mouseleave', (e) => {
                const button = this.virtualButtons.get('left');
                if (button) {
                    button.active = false;
                    button.element.classList.remove('active');
                    this.updateInputState();
                }
            });
        }
        
        if (rightBtn) {
            rightBtn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                const button = this.virtualButtons.get('right');
                if (button) {
                    button.active = true;
                    button.element.classList.add('active');
                    this.updateInputState();
                }
            });
            
            rightBtn.addEventListener('mouseup', (e) => {
                e.preventDefault();
                const button = this.virtualButtons.get('right');
                if (button) {
                    button.active = false;
                    button.element.classList.remove('active');
                    this.updateInputState();
                }
            });
            
            rightBtn.addEventListener('mouseleave', (e) => {
                const button = this.virtualButtons.get('right');
                if (button) {
                    button.active = false;
                    button.element.classList.remove('active');
                    this.updateInputState();
                }
            });
        }
    }
    
    updateVirtualButtonBounds() {
        for (const [name, button] of this.virtualButtons) {
            if (button.element) {
                button.bounds = button.element.getBoundingClientRect();
            }
        }
    }
    
    updateVirtualControls() {
        // Reset virtual button states
        for (const button of this.virtualButtons.values()) {
            if (!button.active) { // Don't reset if actively pressed by mouse
                button.active = false;
                if (button.element) {
                    button.element.classList.remove('active');
                }
            }
        }
        
        // Check which virtual buttons are being touched
        for (const touch of this.touches.values()) {
            for (const [name, button] of this.virtualButtons) {
                if (this.isPointInBounds(touch.x, touch.y, button.bounds)) {
                    button.active = true;
                    if (button.element) {
                        button.element.classList.add('active');
                    }
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
    
    getGamepadInput() {
        if (this.gamepadIndex === null) return { left: false, right: false };
        
        const gamepad = navigator.getGamepads()[this.gamepadIndex];
        if (!gamepad) return { left: false, right: false };
        
        // Left stick or D-pad
        const leftStickX = gamepad.axes[0] || 0;
        const dpadLeft = gamepad.buttons[14]?.pressed || false;
        const dpadRight = gamepad.buttons[15]?.pressed || false;
        
        // Face buttons (A/X for left, B/Circle for right)
        const buttonA = gamepad.buttons[0]?.pressed || false;
        const buttonB = gamepad.buttons[1]?.pressed || false;
        
        return {
            left: leftStickX < -this.gamepadDeadzone || dpadLeft || buttonA,
            right: leftStickX > this.gamepadDeadzone || dpadRight || buttonB
        };
    }
    
    updateInputState() {
        // Keyboard controls
        const leftKeys = this.keys.get('ArrowLeft') || this.keys.get('KeyA');
        const rightKeys = this.keys.get('ArrowRight') || this.keys.get('KeyD');
        
        // Virtual controls (touch/mouse)
        const leftVirtual = this.virtualButtons.get('left')?.active || false;
        const rightVirtual = this.virtualButtons.get('right')?.active || false;
        
        // Gamepad controls
        const gamepadInput = this.getGamepadInput();
        
        // Combine all inputs
        this.inputState.left = leftKeys || leftVirtual || gamepadInput.left;
        this.inputState.right = rightKeys || rightVirtual || gamepadInput.right;
        this.inputState.pause = this.keys.get('Escape') || false;
        this.inputState.restart = this.keys.get('Space') || false;
    }
    
    // Public API
    getInputState() {
        // Update gamepad state on each call since gamepad state doesn't generate events
        this.updateInputState();
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
    
    getGamepadCount() {
        const gamepads = navigator.getGamepads();
        return Array.from(gamepads).filter(gp => gp !== null).length;
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
        const gamepadInput = this.getGamepadInput();
        return {
            activeKeys: Array.from(this.keys.entries()).filter(([_, pressed]) => pressed),
            inputState: this.inputState,
            touchCount: this.touches.size,
            gamepadConnected: this.gamepadIndex !== null,
            gamepadInput: gamepadInput,
            virtualButtons: Object.fromEntries(
                Array.from(this.virtualButtons.entries()).map(([name, btn]) => [name, btn.active])
            )
        };
    }
    
    // Clean up event listeners
    destroy() {
        console.log('InputManager destroyed');
    }
}