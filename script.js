class TicTacToe {
    /**
     * Initialize the Tic-Tac-Toe game instance
     * Sets up game state, scoring, validation, and UI initialization
     */
    constructor() {
        // Core game state
        this.board = Array(9).fill(''); // Game board state (9 cells, empty strings represent empty cells)
        this.currentPlayer = 'X'; // Current player ('X' always goes first)
        this.gameActive = true; // Flag to control if game is currently playable
        this.gameMode = 'pvp'; // Game mode: 'pvp' (Player vs Player) or 'ai' (Player vs AI)
        this.aiDifficulty = 'medium'; // AI difficulty: 'easy', 'medium', or 'hard'

        // Score tracking with secure localStorage and validation
        this.scores = {
            X: parseInt(this.safeGetLocalStorage('scoreX', '0')) || 0, // Player X wins
            O: parseInt(this.safeGetLocalStorage('scoreO', '0')) || 0, // Player O wins  
            draw: parseInt(this.safeGetLocalStorage('scoreDraw', '0')) || 0 // Draw games
        };

        // Error handling timeout reference for auto-hiding error messages
        this.errorTimeout = null;

        // All possible winning combinations on a 3x3 grid
        // Each sub-array represents cell indices that form a winning line
        this.winningCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Horizontal rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Vertical columns
            [0, 4, 8], [2, 4, 6] // Diagonal lines
        ];

        // Initialize game components with error handling
        try {
            this.initializeGame();
            this.initializeTheme();
        } catch (error) {
            this.showError('Failed to initialize game. Please refresh the page.', error);
        }
    }

    /**
     * Error Handling System
     * Displays user-friendly error messages with automatic timeout
     * Includes fallback mechanisms for when error UI elements are unavailable
     * 
     * @param {string} message - User-friendly error message to display
     * @param {Error|null} error - Optional error object for console logging
     */
    showError(message, error = null) {
        try {
            // Log detailed error information for debugging
            console.error('Game Error:', message, error);

            // Get error notification UI elements
            const errorNotification = document.getElementById('error-notification');
            const errorMessage = document.getElementById('error-message');

            // Fallback to browser alert if error UI is unavailable
            if (!errorNotification || !errorMessage) {
                console.error('Error notification elements not found');
                alert(message); // Secure fallback - no HTML injection risk
                return;
            }

            // Safely set error message using textContent to prevent XSS
            errorMessage.textContent = message;
            errorNotification.style.display = 'block';
            errorNotification.classList.remove('hiding');

            // Clear any existing auto-hide timeout
            if (this.errorTimeout) {
                clearTimeout(this.errorTimeout);
            }

            // Auto-hide error message after 5 seconds for better UX
            this.errorTimeout = setTimeout(() => {
                this.hideError();
            }, 5000);
        } catch (err) {
            // Ultimate fallback if all error handling fails
            console.error('Failed to show error:', err);
            alert(message); // Secure browser alert as last resort
        }
    }

    /**
     * Hide the error notification with smooth animation
     * Removes error message from display and cleans up classes
     */
    hideError() {
        try {
            const errorNotification = document.getElementById('error-notification');
            if (errorNotification) {
                // Add hiding animation class
                errorNotification.classList.add('hiding');

                // Hide element after animation completes
                setTimeout(() => {
                    errorNotification.style.display = 'none';
                    errorNotification.classList.remove('hiding');
                }, 300); // Match CSS animation duration
            }
        } catch (error) {
            console.error('Failed to hide error:', error);
        }
    }

    /**
     * Input Validation Methods
     * Comprehensive validation for all user inputs and game parameters
     * Prevents invalid data from causing errors or security issues
     */

    /**
     * Validate cell index for game board
     * @param {number} index - Cell index (0-8)
     * @returns {boolean} - True if valid
     * @throws {Error} - If index is invalid
     */
    validateCellIndex(index) {
        if (typeof index !== 'number' || isNaN(index)) {
            throw new Error('Invalid cell index: must be a number');
        }
        if (index < 0 || index > 8) {
            throw new Error('Invalid cell index: must be between 0 and 8');
        }
        return true;
    }

    /**
     * Validate player symbol
     * @param {string} player - Player symbol ('X' or 'O')
     * @returns {boolean} - True if valid
     * @throws {Error} - If player symbol is invalid
     */
    validatePlayer(player) {
        if (typeof player !== 'string') {
            throw new Error('Invalid player: must be a string');
        }
        if (player !== 'X' && player !== 'O') {
            throw new Error('Invalid player: must be X or O');
        }
        return true;
    }

    /**
     * Validate game mode
     * @param {string} mode - Game mode ('pvp' or 'ai')
     * @returns {boolean} - True if valid
     * @throws {Error} - If game mode is invalid
     */

    validateGameMode(mode) {
        if (typeof mode !== 'string') {
            throw new Error('Invalid game mode: must be a string');
        }
        if (mode !== 'pvp' && mode !== 'ai') {
            throw new Error('Invalid game mode: must be pvp or ai');
        }
        return true;
    }

    validateAIDifficulty(difficulty) {
        if (typeof difficulty !== 'string') {
            throw new Error('Invalid AI difficulty: must be a string');
        }
        const validDifficulties = ['easy', 'medium', 'hard'];
        if (!validDifficulties.includes(difficulty)) {
            throw new Error('Invalid AI difficulty: must be easy, medium, or hard');
        }
        return true;
    }

    validateDOMElement(element, elementName) {
        if (!element) {
            throw new Error(`Required DOM element not found: ${elementName}`);
        }
        return true;
    }
    /**
   * Validate localStorage availability and security
   * Tests localStorage functionality and protects against storage attacks
   * @returns {boolean} - True if localStorage is available and safe to use
   */
    validateLocalStorage() {
        try {
            // Check if localStorage exists
            if (typeof localStorage === 'undefined') {
                return false;
            }

            // Test basic functionality with a safe key
            const testKey = '__tic_tac_toe_test__';
            const testValue = 'safe_test_value';

            // Test write operation
            localStorage.setItem(testKey, testValue);

            // Test read operation and verify integrity
            const retrievedValue = localStorage.getItem(testKey);
            if (retrievedValue !== testValue) {
                console.warn('localStorage integrity check failed');
                return false;
            }

            // Clean up test data
            localStorage.removeItem(testKey);

            return true;
        } catch (error) {
            // localStorage might be disabled, full, or restricted
            console.warn('localStorage not available:', error.message);
            return false;
        }
    }

    /**
     * Safely get a value from localStorage with validation
     * @param {string} key - The localStorage key
     * @param {*} defaultValue - Default value if key doesn't exist or is invalid
     * @returns {*} - The stored value or default value
     */
    safeGetLocalStorage(key, defaultValue) {
        try {
            if (!this.validateLocalStorage()) {
                return defaultValue;
            }

            // Validate key parameter
            if (typeof key !== 'string' || key.length === 0) {
                console.warn('Invalid localStorage key provided');
                return defaultValue;
            }

            const value = localStorage.getItem(key);
            return value !== null ? value : defaultValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error.message);
            return defaultValue;
        }
    }

    /**
     * Safely set a value in localStorage with validation
     * @param {string} key - The localStorage key
     * @param {*} value - The value to store
     * @returns {boolean} - True if successfully stored
     */
    safeSetLocalStorage(key, value) {
        try {
            if (!this.validateLocalStorage()) {
                return false;
            }

            // Validate key parameter
            if (typeof key !== 'string' || key.length === 0) {
                console.warn('Invalid localStorage key provided');
                return false;
            }

            // Convert value to string safely
            const stringValue = String(value);

            localStorage.setItem(key, stringValue);
            return true;
        } catch (error) {
            console.warn(`Error writing to localStorage key "${key}":`, error.message);
            return false;
        }
    }

    initializeTheme() {
        try {
            // Check localStorage availability
            if (!this.validateLocalStorage()) {
                this.showError('Local storage not available. Theme preferences will not be saved.');
            }

            // Get saved theme or default to light
            const savedTheme = localStorage.getItem('theme') || 'light';
            this.setTheme(savedTheme);

            // Update theme toggle icon
            this.updateThemeIcon(savedTheme);
        } catch (error) {
            this.showError('Failed to initialize theme system. Using default light theme.', error);
            this.setTheme('light');
            this.updateThemeIcon('light');
        }
    }

    setTheme(theme) {
        try {
            if (!theme || typeof theme !== 'string') {
                throw new Error('Invalid theme parameter');
            }

            const validThemes = ['light', 'dark'];
            if (!validThemes.includes(theme)) {
                throw new Error('Invalid theme: must be light or dark');
            }

            document.documentElement.setAttribute('data-theme', theme);

            if (this.validateLocalStorage()) {
                this.safeSetLocalStorage('theme', theme);
            }
        } catch (error) {
            this.showError('Failed to set theme. Using default theme.', error);
            document.documentElement.setAttribute('data-theme', 'light');
        }
    }

    toggleTheme() {
        try {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            this.setTheme(newTheme);
            this.updateThemeIcon(newTheme);
        } catch (error) {
            this.showError('Failed to toggle theme.', error);
        }
    }

    updateThemeIcon(theme) {
        try {
            const themeIcon = document.querySelector('.theme-icon');
            const themeToggle = document.getElementById('theme-toggle');

            this.validateDOMElement(themeIcon, 'theme icon');
            this.validateDOMElement(themeToggle, 'theme toggle button');

            if (theme === 'dark') {
                themeIcon.textContent = '☀️';
                themeToggle.setAttribute('aria-label', 'Switch to light mode');
            } else {
                themeIcon.textContent = '🌙';
                themeToggle.setAttribute('aria-label', 'Switch to dark mode');
            }
        } catch (error) {
            this.showError('Failed to update theme icon.', error);
        }
    }
    initializeGame() {
        try {
            this.bindEvents();
            this.updateScoreDisplay();
            this.updateCurrentPlayerDisplay();

            // Validate game board
            const cells = document.querySelectorAll('.cell');
            if (cells.length !== 9) {
                throw new Error('Invalid game board: must have exactly 9 cells');
            }
        } catch (error) {
            this.showError('Failed to initialize game components.', error);
        }
    }

    bindEvents() {
        try {
            // Cell clicks and keyboard navigation
            const cells = document.querySelectorAll('.cell');
            cells.forEach(cell => {
                cell.addEventListener('click', (e) => this.handleCellClick(e));
                cell.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.handleCellClick(e);
                    }
                });
            });

            // Game mode buttons
            const pvpBtn = document.getElementById('pvp-mode');
            const aiBtn = document.getElementById('ai-mode');
            this.validateDOMElement(pvpBtn, 'PvP mode button');
            this.validateDOMElement(aiBtn, 'AI mode button');

            pvpBtn.addEventListener('click', () => this.setGameMode('pvp'));
            aiBtn.addEventListener('click', () => this.setGameMode('ai'));

            // Theme toggle
            const themeToggle = document.getElementById('theme-toggle');
            this.validateDOMElement(themeToggle, 'theme toggle button');
            themeToggle.addEventListener('click', () => this.toggleTheme());

            // Control buttons
            const resetGameBtn = document.getElementById('reset-game');
            const resetScoresBtn = document.getElementById('reset-scores');
            const playAgainBtn = document.getElementById('play-again');

            this.validateDOMElement(resetGameBtn, 'reset game button');
            this.validateDOMElement(resetScoresBtn, 'reset scores button');
            this.validateDOMElement(playAgainBtn, 'play again button');

            resetGameBtn.addEventListener('click', () => this.resetGame());
            resetScoresBtn.addEventListener('click', () => this.resetScores());
            playAgainBtn.addEventListener('click', () => this.playAgain());

            // AI difficulty
            const difficultySelect = document.getElementById('difficulty');
            this.validateDOMElement(difficultySelect, 'difficulty select');
            difficultySelect.addEventListener('change', (e) => {
                try {
                    this.validateAIDifficulty(e.target.value);
                    this.aiDifficulty = e.target.value;
                } catch (error) {
                    this.showError('Invalid AI difficulty selected.', error);
                    e.target.value = this.aiDifficulty; // Reset to previous valid value
                }
            });

            // Error notification close button
            const errorCloseBtn = document.getElementById('error-close');
            if (errorCloseBtn) {
                errorCloseBtn.addEventListener('click', () => this.hideError());
            }

            // Keyboard navigation for game board
            document.addEventListener('keydown', (e) => {
                try {
                    if (e.key >= '1' && e.key <= '9') {
                        const index = parseInt(e.key) - 1;
                        this.validateCellIndex(index);

                        const cell = document.querySelector(`[data-index="${index}"]`);
                        if (cell && !cell.classList.contains('disabled')) {
                            cell.click();
                        }
                    }
                } catch (error) {
                    this.showError('Invalid keyboard input.', error);
                }
            });
        } catch (error) {
            this.showError('Failed to bind event listeners.', error);
        }
    }

    handleCellClick(e) {
        const index = parseInt(e.target.dataset.index);

        if (!this.gameActive || this.board[index] !== '') {
            return;
        }

        this.makeMove(index, this.currentPlayer);

        if (this.gameActive && this.gameMode === 'ai' && this.currentPlayer === 'O') {
            setTimeout(() => this.makeAIMove(), 500);
        }
    }

    makeMove(index, player) {
        this.board[index] = player;
        this.updateCellDisplay(index, player);

        const result = this.checkGameEnd();
        if (result) {
            this.endGame(result);
        } else {
            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
            this.updateCurrentPlayerDisplay();
        }
    }

    updateCellDisplay(index, player) {
        const cell = document.querySelector(`[data-index="${index}"]`);
        cell.textContent = player;
        cell.classList.add(player.toLowerCase());
        cell.classList.add('disabled');
        cell.setAttribute('aria-label', `Cell ${index + 1}, ${player}`);
        cell.setAttribute('tabindex', '-1');
    }

    checkGameEnd() {
        // Check for win
        for (let combination of this.winningCombinations) {
            const [a, b, c] = combination;
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                return { type: 'win', player: this.board[a], combination };
            }
        }
        // Check for draw
        if (this.board.every(cell => cell !== '')) {
            return { type: 'draw' };
        }

        return null;
    }

    endGame(result) {
        this.gameActive = false;

        if (result.type === 'win') {
            this.highlightWinningCombination(result.combination);
            this.updateScore(result.player);
            this.showResult(`Player ${result.player} Wins!`, `win-${result.player.toLowerCase()}`);
        } else if (result.type === 'draw') {
            this.updateScore('draw');
            this.showResult("It's a Draw!", 'draw');
        }

        // Disable all cells
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.add('disabled');
        });
    }

    highlightWinningCombination(combination) {
        combination.forEach(index => {
            document.querySelector(`[data-index="${index}"]`).classList.add('winning');
        });
    }

    /**
     * Updates the score for the winning player or draw count
     * Uses secure localStorage methods for persistent storage
     * @param {string} winner - The winner ('X', 'O', or 'draw')
     */
    updateScore(winner) {
        if (winner === 'draw') {
            this.scores.draw++;
            this.safeSetLocalStorage('scoreDraw', this.scores.draw.toString());
        } else {
            this.scores[winner]++;
            this.safeSetLocalStorage(`score${winner}`, this.scores[winner].toString());
        }
        this.updateScoreDisplay();
    }

    /**
     * Updates the score display elements in the DOM
     * Safely updates textContent to prevent XSS attacks
     */
    updateScoreDisplay() {
        document.getElementById('score-x').textContent = this.scores.X;
        document.getElementById('score-o').textContent = this.scores.O;
        document.getElementById('score-draw').textContent = this.scores.draw;
    }

    updateCurrentPlayerDisplay() {
        const display = document.getElementById('current-player-text');
        if (this.gameMode === 'ai') {
            display.textContent = this.currentPlayer === 'X' ? "Your Turn" : "AI's Turn";
        } else {
            display.textContent = `Player ${this.currentPlayer}'s Turn`;
        }
    }

    showResult(message, className) {
        const resultText = document.getElementById('result-text');
        resultText.textContent = message;
        resultText.className = className;
        document.getElementById('game-result').style.display = 'flex';
    }

    setGameMode(mode) {
        this.gameMode = mode;

        // Update button states and ARIA attributes
        const pvpBtn = document.getElementById('pvp-mode');
        const aiBtn = document.getElementById('ai-mode');

        if (mode === 'pvp') {
            pvpBtn.classList.add('active');
            aiBtn.classList.remove('active');
            pvpBtn.setAttribute('aria-selected', 'true');
            aiBtn.setAttribute('aria-selected', 'false');
        } else {
            aiBtn.classList.add('active');
            pvpBtn.classList.remove('active');
            aiBtn.setAttribute('aria-selected', 'true');
            pvpBtn.setAttribute('aria-selected', 'false');
        }

        // Show/hide AI settings
        const aiSettings = document.getElementById('ai-difficulty');
        aiSettings.style.display = mode === 'ai' ? 'block' : 'none';

        this.resetGame();
    } resetGame() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameActive = true;

        // Clear board display and reset accessibility attributes
        document.querySelectorAll('.cell').forEach((cell, index) => {
            cell.textContent = '';
            cell.className = 'cell';
            cell.setAttribute('aria-label', `Cell ${index + 1}, empty`);
            cell.setAttribute('tabindex', '0');
        });

        // Hide result overlay
        document.getElementById('game-result').style.display = 'none';

        this.updateCurrentPlayerDisplay();
    }

    resetScores() {
        this.scores = { X: 0, O: 0, draw: 0 };
        localStorage.removeItem('scoreX');
        localStorage.removeItem('scoreO');
        localStorage.removeItem('scoreDraw');
        this.updateScoreDisplay();
    }

    playAgain() {
        this.resetGame();
    }

    // AI Logic
    makeAIMove() {
        if (!this.gameActive) return;

        let move;
        switch (this.aiDifficulty) {
            case 'easy':
                move = this.getRandomMove();
                break;
            case 'medium':
                move = this.getMediumMove();
                break;
            case 'hard':
                move = this.getHardMove();
                break;
        }

        if (move !== -1) {
            this.makeMove(move, 'O');
        }
    }

    getRandomMove() {
        const availableMoves = this.board.map((cell, index) => cell === '' ? index : null)
            .filter(index => index !== null);
        return availableMoves.length > 0 ?
            availableMoves[Math.floor(Math.random() * availableMoves.length)] : -1;
    }

    getMediumMove() {
        // 70% strategic, 30% random
        if (Math.random() < 0.7) {
            return this.getStrategicMove();
        } else {
            return this.getRandomMove();
        }
    }

    getHardMove() {
        return this.getStrategicMove();
    }

    getStrategicMove() {
        // 1. Try to win
        for (let combination of this.winningCombinations) {
            const [a, b, c] = combination;
            if (this.board[a] === 'O' && this.board[b] === 'O' && this.board[c] === '') return c;
            if (this.board[a] === 'O' && this.board[c] === 'O' && this.board[b] === '') return b;
            if (this.board[b] === 'O' && this.board[c] === 'O' && this.board[a] === '') return a;
        }

        // 2. Block player from winning
        for (let combination of this.winningCombinations) {
            const [a, b, c] = combination;
            if (this.board[a] === 'X' && this.board[b] === 'X' && this.board[c] === '') return c;
            if (this.board[a] === 'X' && this.board[c] === 'X' && this.board[b] === '') return b;
            if (this.board[b] === 'X' && this.board[c] === 'X' && this.board[a] === '') return a;
        }

        // 3. Take center if available
        if (this.board[4] === '') return 4;

        // 4. Take corners
        const corners = [0, 2, 6, 8];
        for (let corner of corners) {
            if (this.board[corner] === '') return corner;
        }

        // 5. Take any available side
        const sides = [1, 3, 5, 7];
        for (let side of sides) {
            if (this.board[side] === '') return side;
        }

        // Fallback to random
        return this.getRandomMove();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TicTacToe();
});