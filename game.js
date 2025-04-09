class Ball {
    constructor(game, container) {
        this.game = game;
        this.container = container;
        
        // Main container element
        this.element = document.createElement('div');
        this.element.className = 'target';

        // Frequency Progress Bar Elements
        this.frequencyContainer = document.createElement('div');
        this.frequencyContainer.className = 'frequency-progress-container';
        this.frequencyFillElement = document.createElement('div');
        this.frequencyFillElement.className = 'frequency-progress-fill';
        this.targetRangeElement = document.createElement('div'); // New element
        this.targetRangeElement.className = 'frequency-target-range'; // New class
        
        // Append elements in correct order (target range behind fill)
        this.frequencyContainer.appendChild(this.targetRangeElement); 
        this.frequencyContainer.appendChild(this.frequencyFillElement); 

        // Ball Visual Element
        this.ballVisualElement = document.createElement('div');
        this.ballVisualElement.className = 'ball-visual';

        // Append elements to main target element
        this.element.appendChild(this.frequencyContainer);
        this.element.appendChild(this.ballVisualElement);
        
        // Adjust size based on screen size (Reduced)
        const isMobile = window.innerWidth <= 768;
        this.currentSize = isMobile ? 
            Math.random() * 35 + 60 : // Mobile: 60-95px (was 75-120px)
            Math.random() * 100 + 200;  // Desktop: 200-300px (was 255-375px)
            
        // --- Speedometer Gameplay Variables (Refined) ---
        this.requiredTaps = 0;          // Counts successful clicks in sweet spot (Set in spawn)
        this.taps = 0;                  
        this.currentSpeed = 0;          // Current speed (0-100)
        this.maxSpeed = 100;            // Max speed for bar scaling
        this.targetSpeedMin = 60;       // Sweet spot min speed
        this.targetSpeedMax = 80;       // Sweet spot max speed
        this.accelerationPerClick = 15; // Speed boost per click (Increased from 10)
        this.decelerationRate = 50;     // Speed decay per second (100/2s)
        this.isInSweetSpot = false;     // Tracks if currentSpeed is 60-80
        this.lastUpdateTime = 0;
        this.currentScale = 1;          // Ball growth

        this.position = { x: 0, y: 0 };
        this.container.appendChild(this.element);
        
        this.game.playPopSound();
        this.spawn();
    }

    spawn() {
        // Find a valid position (Overlap check removed for single ball)
        this.generateRandomPosition();

        // Set position and size
        this.element.style.width = `${this.currentSize}px`;
        this.element.style.height = `${this.currentSize}px`;
        this.element.style.left = `${this.position.x}px`;
        this.element.style.top = `${this.position.y}px`;
        
        // Reset variables
        this.taps = 0;
        this.currentSpeed = 0; 
        this.requiredTaps = Math.floor(Math.random() * 10 + 8); 
        this.currentScale = 1;
        this.isInSweetSpot = false;
        
        // --- Randomize Sweet Spot Position (Fixed Width) --- 
        const sweetSpotWidth = 25; // Fixed width
        const maxPossibleStart = this.maxSpeed - sweetSpotWidth; // Max start is 75 (100 - 25)
        // Allow start position from 0 up to the maximum possible start position
        this.targetSpeedMin = Math.random() * maxPossibleStart; // Random start 0 - 75
        this.targetSpeedMax = this.targetSpeedMin + sweetSpotWidth;
        // --- End Randomize Sweet Spot --- 

        // Reset visuals
        this.updateProgressBar(0);
        this.frequencyFillElement.classList.remove('sweet-spot');
        this.ballVisualElement.classList.remove('correct-frequency');
        this.ballVisualElement.style.transform = 'scale(1)';
        this.updateTargetRangeIndicator(); // Update red target indicator position
        
        this.lastUpdateTime = performance.now(); 
    }
    
    updateTargetRangeIndicator() { // Uses fixed 60-80 range
        const startPercent = (this.targetSpeedMin / this.maxSpeed) * 100;
        const endPercent = (this.targetSpeedMax / this.maxSpeed) * 100;
        const widthPercent = endPercent - startPercent;
        
        if (this.targetRangeElement) {
            this.targetRangeElement.style.left = `${startPercent}%`;
            this.targetRangeElement.style.width = `${widthPercent}%`;
        } else {
            console.error("Target range element not found");
        }
    }
    
    updateProgressBar(speed) {
        const fillPercent = Math.min(100, Math.max(0, (speed / this.maxSpeed) * 100));
        this.frequencyFillElement.style.width = `${fillPercent}%`;
    }

    generateRandomPosition() {
        const containerRect = this.container.getBoundingClientRect();
        const topSafeZone = 100; // Safe zone for UI elements (progress bar + menu)
        
        // Calculate available space
        const maxX = containerRect.width - this.currentSize;
        const maxY = containerRect.height - this.currentSize;
        
        // Generate random position, ensuring the ball stays within bounds
        // and respects the top safe zone
        this.position = {
            x: Math.random() * maxX,
            y: Math.random() * (maxY - topSafeZone) + topSafeZone // Add topSafeZone to minimum Y
        };
    }

    showFloatingScore(scoreResult) {
        // Create the score element
        const scoreElement = document.createElement('div');
        scoreElement.className = 'floating-score';
        
        // Display points
        scoreElement.textContent = `+${scoreResult.points}`;
        
        // If there's bonus text, display it
        if (scoreResult.bonusText) {
            // Add a line break and the bonus text
            const bonusElement = document.createElement('div');
            bonusElement.className = 'bonus-text';
            bonusElement.textContent = scoreResult.bonusText;
            scoreElement.appendChild(bonusElement);
        }
        
        // Position the score above the ball
        scoreElement.style.left = `${this.position.x}px`;
        scoreElement.style.top = `${this.position.y - this.currentSize/2}px`;
        
        this.container.appendChild(scoreElement);
        
        // Remove the score element after animation
        setTimeout(() => {
            if (scoreElement.parentNode) {
                scoreElement.parentNode.removeChild(scoreElement);
            }
        }, 1000);
    }

    showMissText(x, y) {
        // Remove any existing miss text
        const existingMissTexts = document.querySelectorAll('.miss-text');
        existingMissTexts.forEach(text => text.remove());
        
        // Create and show new miss text
        const missText = document.createElement('div');
        missText.className = 'miss-text';
        missText.textContent = 'Miss!';
        missText.style.left = x + 'px';
        missText.style.top = y + 'px';
        document.body.appendChild(missText);
        
        // Remove the text after animation
        setTimeout(() => {
            if (missText.parentNode) {
                missText.parentNode.removeChild(missText);
            }
        }, 1000);
    }

    showFloatingPoints(points) {
        // Create the text element
        const pointsElement = document.createElement('div');
        pointsElement.className = 'floating-text'; 
        
        let textContent = `+${points}`;
        const currentStreak = this.game.streak; 
        let fireEmojis = '';
        if (currentStreak >= 12) {       
            fireEmojis = ' 🔥🔥🔥🔥';
        } else if (currentStreak >= 8) { 
            fireEmojis = ' 🔥🔥🔥';
        } else if (currentStreak >= 4) { 
            fireEmojis = ' 🔥🔥';
        } else if (currentStreak >= 2) { 
            fireEmojis = ' 🔥';
        }
        textContent += fireEmojis;
        pointsElement.textContent = textContent;
        
        // Position the text above the ball and progress bar
        const verticalOffset = 30; // Pixels to move text above the ball's top edge
        pointsElement.style.left = `${this.position.x + this.currentSize / 2}px`; // Center horizontally
        pointsElement.style.top = `${this.position.y - verticalOffset}px`; // Position above
        
        // Append to the game container
        this.container.appendChild(pointsElement);
        
        // Remove the text element after animation
        setTimeout(() => {
            if (pointsElement.parentNode) {
                pointsElement.parentNode.removeChild(pointsElement);
            }
        }, 800); 
    }

    // --- Core Update Loop (Handles DECAY and VISUAL STATE only) ---
    update(timestamp) {
        if (this.game.isPaused) {
            this.lastUpdateTime = timestamp; 
            return; 
        }
        const deltaTime = (timestamp - this.lastUpdateTime) / 1000; 
        this.lastUpdateTime = timestamp;

        // 1. Apply Deceleration
        if (this.currentSpeed > 0) {
            this.currentSpeed -= this.decelerationRate * deltaTime;
            this.currentSpeed = Math.max(0, this.currentSpeed); 
            this.updateProgressBar(this.currentSpeed); 
        }
        
        // 2. Check if current speed is still in sweet spot (for visual state)
        const stillInSweetSpot = this.currentSpeed >= this.targetSpeedMin && this.currentSpeed <= this.targetSpeedMax;
        
        // 3. Update Visual Indicators if state changed due to decay
        if (this.isInSweetSpot !== stillInSweetSpot) {
            this.isInSweetSpot = stillInSweetSpot; // Update state
            this.frequencyFillElement.classList.toggle('sweet-spot', this.isInSweetSpot);
            this.ballVisualElement.classList.toggle('correct-frequency', this.isInSweetSpot);
            
            // If speed decayed OUT of the sweet spot, reset streak
            if (!this.isInSweetSpot) {
                 this.game.handleFrequencyMiss();
            }
        }
        // Scoring, growth, and completion are handled in handleClick
    }

    createConfettiBurst() {
        const numParticles = 20; // Number of confetti particles
        const colors = ['#f39c12', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f1c40f']; // Example colors
        const burstRadius = this.currentSize * 0.8; // How far particles fly (related to ball size)
        
        // Create a container at the ball's center
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        // Position at the center of the ball's element
        confettiContainer.style.left = `${this.position.x + this.currentSize / 2}px`;
        confettiContainer.style.top = `${this.position.y + this.currentSize / 2}px`;
        this.container.appendChild(confettiContainer);

        for (let i = 0; i < numParticles; i++) {
            const particle = document.createElement('div');
            particle.className = 'confetti-particle';
            
            // Random color
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            // Random direction and distance
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * burstRadius;
            const translateX = Math.cos(angle) * distance;
            const translateY = Math.sin(angle) * distance;
            
            // Set animation properties
            particle.style.setProperty('--tx', `${translateX}px`);
            particle.style.setProperty('--ty', `${translateY}px`);
            const duration = Math.random() * 0.5 + 0.5; // 0.5 - 1.0 seconds
            particle.style.animation = `confetti-burst ${duration}s ease-out forwards`;
            
            confettiContainer.appendChild(particle);
        }
        
        // Remove the container after the longest animation finishes
        setTimeout(() => {
            if (confettiContainer.parentNode) {
                confettiContainer.parentNode.removeChild(confettiContainer);
            }
        }, 1000); // Corresponds to max duration
    }

    remove() {
        // Create confetti before removing the element
        this.createConfettiBurst();
        
        if (this.element.parentNode) {
            this.container.removeChild(this.element);
        }
        this.game.removeBall(this);
    }

    handleClick() { // Handles the click action
        console.log("Logic: handleClick called");
        if (this.game.isPaused) {
             console.log("Logic: handleClick aborted - game paused");
             return;
        }

        // Apply acceleration boost FIRST
        this.currentSpeed += this.accelerationPerClick;
        this.currentSpeed = Math.min(this.maxSpeed, this.currentSpeed); // Clamp speed
        this.updateProgressBar(this.currentSpeed); // Update visual bar immediately

        // Check if the speed AFTER the click is in the sweet spot
        const nowInSweetSpot = this.currentSpeed >= this.targetSpeedMin && this.currentSpeed <= this.targetSpeedMax;
        
        if (nowInSweetSpot) {
            // SUCCESSFUL Click
            this.taps++; // Increment successful taps
            const basePoints = 1;
            const pointsEarned = this.game.addScore(basePoints); // This increments streak internally
            
            // Call showFloatingPoints without streak name
            this.showFloatingPoints(pointsEarned); 
            
            this.game.playHitSound(); // Sound for correct tap
            
            // Grow ball on correct tap
            this.currentScale += 0.03; 
            this.ballVisualElement.style.transform = `scale(${this.currentScale})`;
            
            // Update internal state
            this.isInSweetSpot = true;

        } else {
            // MISSED Click (too low or too high AFTER boost)
            this.game.handleFrequencyMiss(); // Reset streak
            this.isInSweetSpot = false; // Explicitly set state
            // Optional: Play miss sound or different feedback?
            // this.game.playMissSound();
        }
        
        // Always update visual indicators based on the NEW sweet spot state
        this.frequencyFillElement.classList.toggle('sweet-spot', this.isInSweetSpot);
        this.ballVisualElement.classList.toggle('correct-frequency', this.isInSweetSpot);

        // Check if required taps reached
        if (this.taps >= this.requiredTaps) {
            this.remove(); 
        }
    }
}

class Game {
    constructor() {
        this.score = 0;
        this.streak = 0;
        this.scoreElement = document.getElementById('score');
        this.pauseScoreElement = document.getElementById('pauseScore');
        this.pauseOverlay = document.getElementById('pauseOverlay');
        this.resumeButton = document.getElementById('resumeButton');
        this.gameContainer = document.querySelector('.game-container');
        this.videoBackground = document.querySelector('.background-video');
        this.videoSource = document.getElementById('videoSource');
        this.pauseButton = document.getElementById('pauseButton');
        this.soundButton = document.getElementById('soundButton');
        
        // Environment selection buttons
        this.startJungleButton = document.getElementById('startJungleButton');
        this.startArcticButton = document.getElementById('startArcticButton');
        this.pauseJungleButton = document.getElementById('pauseJungleButton');
        this.pauseArcticButton = document.getElementById('pauseArcticButton');
        
        this.balls = [];
        this.maxBalls = 1; // Only one ball at a time
        this.gameStarted = false;
        this.isPaused = false;
        this.isMuted = false;
        this.environment = 'jungle'; // Default environment
        this.soundEnabled = true;
        this.currentEnvironment = 'jungle';
        
        // Streak Levels & Multipliers
        this.streakLevels = [
            { threshold: 12, name: 'Max!', multiplier: 16 },
            { threshold: 8, name: 'x8!', multiplier: 8 },
            { threshold: 4, name: 'x4!', multiplier: 4 },
            { threshold: 2, name: 'x2', multiplier: 2 },
            { threshold: 0, name: 'x1', multiplier: 1 }
        ];
        
        // Initialize sounds
        this.initSounds();
        
        // Initialize video
        this.initVideo();
        
        // Add event listeners for sound state
        this.setupSoundHandlers();
        
        // Setup control buttons
        this.setupControlButtons();
        
        // Setup environment buttons
        this.setupEnvironmentButtons();
        
        // Start screen is already in HTML
        this.setupStartScreen();
        
        // Add resize handler
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Add touch event prevention
        this.gameContainer.addEventListener('touchmove', (e) => {
            e.preventDefault(); 
        }, { passive: false });
        
        // --- Add Event Delegation Listeners ---
        this.setupTapListeners();
        
        this.gameLoopId = null; 
        this.lastTimestamp = 0;
    }

    initSounds() {
        // Initialize sound state
        this.soundEnabled = true;
        this.currentEnvironment = 'jungle'; // Default environment
        
        // Create audio element for background music
        this.bgMusic = new Audio('assets/bg.m4a');
        this.bgMusic.loop = true;
        
        // Set initial sound button state
        this.updateSoundButtonState();
    }

    updateSoundButtonState() {
        if (this.soundEnabled) {
            this.soundButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
            `;
            this.soundButton.classList.remove('active');
        } else {
            this.soundButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                </svg>
            `;
            this.soundButton.classList.add('active');
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.updateSoundButtonState();
        
        if (this.soundEnabled) {
            // Resume background music if game is running and not paused
            if (this.gameStarted && !this.isPaused) {
                this.bgMusic.play().catch(e => console.log('Error playing background music:', e));
            }
        } else {
            // Stop all sounds
            this.bgMusic.pause();
        }
    }

    resumeBackgroundMusic() {
        if (this.gameStarted && !this.isPaused && this.bgMusic.paused && this.soundEnabled) {
            this.bgMusic.play()
                .then(() => {
                    console.log('Background music resumed');
                })
                .catch(error => {
                    console.log('Failed to resume background music:', error);
                });
        }
    }

    initVideo() {
        // Set up the ended event listener
        this.videoBackground.addEventListener('ended', () => {
            if (this.gameStarted && !this.isPaused) {
                this.videoBackground.play().catch(console.error);
            }
        });
    }
    
    setupEnvironmentButtons() {
        // Start screen environment buttons
        this.startJungleButton.addEventListener('click', () => {
            this.setEnvironment('jungle', 'start');
        });
        
        this.startArcticButton.addEventListener('click', () => {
            this.setEnvironment('arctic', 'start');
        });
        
        // Pause screen environment buttons
        this.pauseJungleButton.addEventListener('click', () => {
            this.setEnvironment('jungle', 'pause');
        });
        
        this.pauseArcticButton.addEventListener('click', () => {
            this.setEnvironment('arctic', 'pause');
        });
        
        // Set initial active states
        this.updateEnvironmentButtonStates();
    }
    
    setEnvironment(environment, source) {
        if (this.environment === environment) return;
        
        this.environment = environment;
        this.currentEnvironment = environment; // Set the current environment for sounds
        
        // Update video source
        const videoUrl = environment === 'jungle' ? 'assets/video.mp4' : 'assets/arctic.mp4';
        this.videoSource.src = videoUrl;
        
        // Reload the video
        this.videoBackground.load();
        
        // If game is running, play the video
        if (this.gameStarted && !this.isPaused) {
            this.videoBackground.play().catch(console.error);
        }
        
        // If sound was playing, switch to new environment sound
        const wasPlaying = !this.bgMusic.paused;
        
        // Pause current background music
        this.bgMusic.pause();
        
        // Switch to new background music
        this.bgMusic = new Audio(environment === 'jungle' ? 'assets/bg.m4a' : 'assets/arctic_bg.m4a');
        this.bgMusic.loop = true;
        
        // If game is running and not paused and sound was playing, play new background music
        if (this.gameStarted && !this.isPaused && wasPlaying && this.soundEnabled) {
            this.bgMusic.play().catch(console.error);
        }
        
        // Update button states
        this.updateEnvironmentButtonStates();
    }
    
    updateEnvironmentButtonStates() {
        // Start screen buttons
        this.startJungleButton.classList.toggle('active', this.environment === 'jungle');
        this.startArcticButton.classList.toggle('active', this.environment === 'arctic');
        
        // Pause screen buttons
        this.pauseJungleButton.classList.toggle('active', this.environment === 'jungle');
        this.pauseArcticButton.classList.toggle('active', this.environment === 'arctic');
    }

    setupStartScreen() {
        const startButton = document.getElementById('startButton');
        startButton.addEventListener('click', () => this.startGame());
    }

    setupSoundHandlers() {
        // Handle visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.gameStarted && !this.isPaused) {
                this.resumeBackgroundMusic();
            } else if (document.visibilityState === 'hidden' && this.gameStarted) {
                // Pause sounds when tab is hidden
                this.pauseAllSounds();
            }
        });

        // Handle page focus
        window.addEventListener('focus', () => {
            if (this.gameStarted && !this.isPaused) {
                this.resumeBackgroundMusic();
            }
        });

        // Handle audio context
        document.addEventListener('click', () => {
            if (this.gameStarted && !this.isPaused && this.isSoundPaused('background') && !this.isMuted) {
                this.resumeBackgroundMusic();
            }
        });
    }

    isSoundPaused(soundType) {
        if (soundType === 'background') {
            return this.bgMusic.paused;
        } else if (soundType === 'hit') {
            return this.hitSound.paused;
        } else if (soundType === 'miss') {
            return this.missSound.paused;
        } else if (soundType === 'pop') {
            return this.popSound.paused;
        }
        return true;
    }

    pauseAllSounds() {
        // Pause all background music only
        this.bgMusic.pause();
    }

    startGame() {
        // Hide start screen
        document.getElementById('startScreen').classList.add('hidden');
        this.gameStarted = true;
        this.score = 0; // Reset score/streak
        this.streak = 0;
        this.updateScore();
        
        // Ensure video is playing
        this.videoBackground.play().catch(console.error);
        
        // Start background music only if sound is enabled
        if (this.soundEnabled) {
            this.bgMusic.play()
                .then(() => { console.log('BG music started'); })
                .catch(error => { console.log('BG music failed:', error); });
        }
        
        // Spawn initial ball
        this.spawnNewBall();
        
        // Start the game loop
        this.lastTimestamp = performance.now();
        this.gameLoopId = requestAnimationFrame(this.gameLoop.bind(this));
    }

    gameLoop(timestamp) {
        if (!this.gameStarted || this.isPaused) {
            this.lastTimestamp = timestamp; // Prevent large deltaTime after pause
            this.gameLoopId = requestAnimationFrame(this.gameLoop.bind(this));
            return;
        }

        // Update the current ball (if one exists)
        if (this.balls.length > 0) {
            this.balls[0].update(timestamp);
        }

        // Continue the loop
        this.gameLoopId = requestAnimationFrame(this.gameLoop.bind(this));
    }

    stopGameLoop() {
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
    }

    togglePause() {
        if (!this.gameStarted) return;
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.stopGameLoop(); // Stop loop updates
            // Change pause button to play icon
            this.pauseButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white">
                    <path d="M8 5v14l11-7z"/>
                </svg>
            `;
            this.pauseButton.classList.add('active');
            // Show pause overlay
            this.pauseOverlay.classList.add('visible');
            // Update pause overlay score
            this.pauseScoreElement.textContent = this.score;
            // Update environment button states
            this.updateEnvironmentButtonStates();
        } else {
            // Change play button back to pause icon
            this.pauseButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
            `;
            this.pauseButton.classList.remove('active');
            // Hide pause overlay
            this.pauseOverlay.classList.remove('visible');
            // Restart the game loop
            this.lastTimestamp = performance.now();
            this.gameLoopId = requestAnimationFrame(this.gameLoop.bind(this));
            this.resumeGame(); // Resume sounds etc.
        }
    }

    spawnNewBall() {
        // Only spawn if no ball exists
        if (this.balls.length < this.maxBalls && this.gameStarted && !this.isPaused) {
            const ball = new Ball(this, this.gameContainer);
            this.balls.push(ball);
        }
    }

    removeBall(ball) {
        const index = this.balls.indexOf(ball);
        if (index > -1) {
            this.balls.splice(index, 1);
        }
        // Don't immediately spawn, let the loop handle spawning if needed? Or spawn directly?
        // For simplicity, let's spawn directly for now.
        this.spawnNewBall(); 
    }

    getCurrentStreakLevel() {
        for (const level of this.streakLevels) {
            if (this.streak >= level.threshold) {
                return level;
            }
        }
        return this.streakLevels[this.streakLevels.length - 1]; // Should be x1
    }

    addScore(pointsToAddFloat) {
        const oldLevel = this.getCurrentStreakLevel();
        this.streak++;
        const streakIncremented = true; 
        
        const currentLevel = this.getCurrentStreakLevel();
        const pointsToAdd = Math.ceil(pointsToAddFloat * currentLevel.multiplier); 
        
        this.score += pointsToAdd;
        this.updateScore();

        // Announce level change if needed
        if (currentLevel.threshold > 0 && currentLevel !== oldLevel) {
            // this.announceStreakChange(`Streak Up! ${currentLevel.name}`); // REMOVED ANNOUNCEMENT
        }
        
        return pointsToAdd; 
    }

    handleFrequencyMiss() {
        if (this.streak > 0) {
            const oldLevel = this.getCurrentStreakLevel();
            if (oldLevel.threshold > 0) { 
                // this.announceStreakChange(`Streak Lost! 💔`); // REMOVED ANNOUNCEMENT
            }
            this.streak = 0;
            this.updateScore();
        } 
    }

    updateScore() {
        this.scoreElement.textContent = this.score;
    }

    handleResize() {
       // No longer needed as maxBalls is fixed at 1
    }

    setupControlButtons() {
        // Ensure elements exist before adding listeners
        if (this.pauseButton) {
            this.pauseButton.addEventListener('click', () => {
                this.togglePause();
            });
        }
        if (this.soundButton) {
            this.soundButton.addEventListener('click', () => {
                this.toggleSound();
            });
        }
        if (this.resumeButton) {
            this.resumeButton.addEventListener('click', () => {
                this.togglePause(); // Resume is handled by togglePause
            });
        }
    }

    // --- ADDED MISSING SOUND METHODS --- 
    playHitSound() {
        if (!this.soundEnabled) return;
        // Assumes arctic_hit.m4a exists or will be added
        const soundPath = this.currentEnvironment === 'jungle' ? 'assets/hit.m4a' : 'assets/arctic_hit.m4a'; 
        const hitSound = new Audio(soundPath);
        hitSound.volume = 0.3; 
        hitSound.play().catch(e => console.log(`Error playing hit sound (${soundPath}):`, e));
    }

    playMissSound() { // Currently only called manually if needed, not by frequency miss
        if (!this.soundEnabled) return;
        // Assumes arctic_miss.m4a exists or will be added
        const soundPath = this.currentEnvironment === 'jungle' ? 'assets/miss.m4a' : 'assets/arctic_miss.m4a'; 
        const missSound = new Audio(soundPath);
        missSound.volume = 0.3;
        missSound.play().catch(e => console.log(`Error playing miss sound (${soundPath}):`, e));
    }

    playPopSound() {
        if (!this.soundEnabled) return;
        // Use pop.mp3 for jungle, require arctic_pop.m4a for arctic
        const soundPath = this.currentEnvironment === 'jungle' ? 'assets/pop.mp3' : 'assets/arctic_pop.m4a'; 
        const popSound = new Audio(soundPath);
        popSound.volume = 0.5;
        popSound.play().catch(e => console.log(`Error playing pop sound (${soundPath}):`, e));
    }
    // --- END ADDED METHODS --- 

    setupTapListeners() {
        const handleTapStart = (e) => {
            if (!this.gameStarted || this.isPaused || this.balls.length === 0) return;
            
            const currentBall = this.balls[0]; // Get the active ball
            
            // --- Coordinate-based Check --- 
            let touchX, touchY;
            if (e.type === 'touchstart') {
                if (e.touches.length === 0) return; // No touch points
                touchX = e.touches[0].clientX;
                touchY = e.touches[0].clientY;
            } else if (e.type === 'mousedown') {
                touchX = e.clientX;
                touchY = e.clientY;
            } else {
                return; // Not a relevant start event
            }

            const ballRect = currentBall.element.getBoundingClientRect();

            // Check if touch coordinates are within the ball's bounds
            const tappedOnBall = (
                touchX >= ballRect.left &&
                touchX <= ballRect.right &&
                touchY >= ballRect.top &&
                touchY <= ballRect.bottom
            );
            // --- End Coordinate-based Check ---
            
            if (tappedOnBall) {
                e.preventDefault(); // Prevent potential double interactions or scrolling
                console.log("Delegated Event: Tap Start on Ball (Coords)");
                currentBall.element.classList.add('pressed');
                currentBall.handleClick(); // Call the ball's logic handler
            } else {
                 console.log("Delegated Event: Tap Start outside Ball (Coords)");
            }
        };

        const handleTapEnd = (e) => {
            if (!this.gameStarted || this.balls.length === 0) return;
            const currentBall = this.balls[0];
            
            // Check if the END target is related to the ball (optional, but good practice)
            // We mostly just need to remove the pressed state if it exists
            if (currentBall.element.classList.contains('pressed')) {
                 console.log("Delegated Event: Tap End on Ball (removing pressed)");
                 currentBall.element.classList.remove('pressed');
            }
        };

        // Use mousedown/up for desktop to mirror touch
        this.gameContainer.addEventListener('mousedown', handleTapStart);
        this.gameContainer.addEventListener('mouseup', handleTapEnd);
        this.gameContainer.addEventListener('mouseleave', handleTapEnd); // Handle mouse leaving container

        // Use touchstart/end for mobile
        this.gameContainer.addEventListener('touchstart', handleTapStart, { passive: false });
        this.gameContainer.addEventListener('touchend', handleTapEnd);
        this.gameContainer.addEventListener('touchcancel', handleTapEnd); 
    }
}

// Start the game when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Game();
}); 