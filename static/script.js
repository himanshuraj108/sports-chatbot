// Constants and Configuration
const MISTRAL_API_KEY = 'sAtFQbj6YlnK1TXe7H5kJdPOSfnDdIBo';
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

// Cached questions for offline mode
const FALLBACK_QUESTIONS = {
    football: [
        {
            question: "Which team has won the most Super Bowls?",
            options: ["New England Patriots", "Pittsburgh Steelers", "Dallas Cowboys", "San Francisco 49ers"],
            correctAnswer: "New England Patriots"
        },
        {
            question: "Who holds the NFL record for most career passing yards?",
            options: ["Tom Brady", "Drew Brees", "Peyton Manning", "Brett Favre"],
            correctAnswer: "Drew Brees"
        },
        {
            question: "Which player has won the most NFL MVP awards?",
            options: ["Tom Brady", "Aaron Rodgers", "Peyton Manning", "Jim Brown"],
            correctAnswer: "Peyton Manning"
        },
        {
            question: "How many points is a touchdown worth in American football?",
            options: ["3 points", "6 points", "7 points", "2 points"],
            correctAnswer: "6 points"
        },
        {
            question: "Which college football team has the nickname 'Crimson Tide'?",
            options: ["University of Alabama", "Harvard University", "University of Oklahoma", "University of Georgia"],
            correctAnswer: "University of Alabama"
        }
    ],
    // Similar fallback questions for other categories
    basketball: [
        {
            question: "Which NBA player has scored the most points in their career?",
            options: ["LeBron James", "Kareem Abdul-Jabbar", "Michael Jordan", "Kobe Bryant"],
            correctAnswer: "LeBron James"
        },
        {
            question: "How many players are on the court for each team in a basketball game?",
            options: ["4", "5", "6", "7"],
            correctAnswer: "5"
        },
        {
            question: "Which team has won the most NBA championships?",
            options: ["Boston Celtics", "Los Angeles Lakers", "Chicago Bulls", "Golden State Warriors"],
            correctAnswer: "Boston Celtics"
        },
        {
            question: "Who invented the game of basketball?",
            options: ["James Naismith", "William Morgan", "Walter Camp", "Amos Alonzo Stagg"],
            correctAnswer: "James Naismith"
        },
        {
            question: "How high is a basketball hoop from the ground?",
            options: ["8 feet", "9 feet", "10 feet", "11 feet"],
            correctAnswer: "10 feet"
        }
    ]
};

// Initialize game state
const gameState = {
    questions: [],
    currentQuestion: 0,
    score: 0,
    incorrectAnswers: 0,
    skippedQuestions: 0,
    isGameActive: false,
    timerInterval: null,
    timeLeft: 0,
    selectedCategory: 'all',
    selectedDifficulty: 'all',
    numQuestions: 5,
    timePerQuestion: 15,
    negativeMark: 0.5,
    securityWarnings: 0,
    MAX_WARNINGS: 5,
    skipEnabled: false,
    lastMouseX: 0,
    lastMouseY: 0,
    testSecurity: {
        enabled: false,
        fullscreenRequired: false,
        preventTabSwitch: false
    },
    // Track user answers and cheating attempts
    userAnswers: [],
    securityViolations: [],
    questionViolations: {}
};

// DOM Elements
const elements = {
    // Sections
    heroSection: document.getElementById('hero'),
    gameCategoriesSection: document.getElementById('game-categories'),
    gameSection: document.getElementById('game-section'),
    resultsSection: document.getElementById('results-section'),
    
    // Buttons and interactive elements
    startPlayingBtn: document.getElementById('start-playing'),
    gameCards: document.querySelectorAll('.game-card'),
    configModal: document.getElementById('config-modal'),
    questionCountSlider: document.getElementById('question-count'),
    questionCountValue: document.getElementById('question-count-value'),
    questionTimeSlider: document.getElementById('question-time'),
    questionTimeValue: document.getElementById('question-time-value'),
    pointsPerQuestionSlider: document.getElementById('points-per-question'),
    pointsPerQuestionValue: document.getElementById('points-per-question-value'),
    difficultyBtns: document.querySelectorAll('.difficulty-btn'),
    startGameBtn: document.getElementById('start-game'),
    closeModalBtns: document.querySelectorAll('.close-modal'),
    
    // Game display elements
    categoryIcon: document.querySelector('.category-icon'),
    categoryName: document.querySelector('.category-name'),
    currentQuestionElement: document.getElementById('current-question'),
    totalQuestionsElement: document.getElementById('total-questions'),
    timerElement: document.getElementById('timer-value'),
    timerProgress: document.querySelector('.timer-progress'),
    currentScoreElement: document.getElementById('current-score'),
    questionText: document.getElementById('question-text'),
    answersContainer: document.getElementById('answers-container'),
    endGameBtn: document.getElementById('end-game'),
    
    // End game modal
    endConfirmModal: document.getElementById('end-confirm-modal'),
    confirmEndBtn: document.getElementById('confirm-end'),
    continueGameBtn: document.getElementById('continue-game'),
    
    // Results elements
    finalScoreElement: document.getElementById('final-score'),
    correctAnswersElement: document.getElementById('correct-answers'),
    resultsTotalQuestionsElement: document.getElementById('results-total-questions'),
    totalTimeElement: document.getElementById('total-time'),
    accuracyElement: document.getElementById('accuracy'),
    tryAgainBtn: document.getElementById('try-again'),
    newGameBtn: document.getElementById('new-game'),
    backToHomeBtn: document.getElementById('back-to-home'),
    
    // Theme toggle
    themeToggle: document.getElementById('theme-toggle'),
    
    // AI assistant
    aiAssistantWidget: document.querySelector('.ai-assistant-widget'),
    closeChatBtn: document.getElementById('close-chat'),
    chatInput: document.getElementById('chat-input'),
    sendMessageBtn: document.getElementById('send-message'),
    messagesContainer: document.getElementById('messages-container'),
    voiceInputBtn: document.getElementById('voice-input'),
    
    // Connection status
    statusIndicator: document.querySelector('.status-indicator'),
    statusText: document.querySelector('.status-text'),
    
    // New elements
    negativeMarkingSlider: document.getElementById('negative-marking'),
    negativeMarkingValue: document.getElementById('negative-marking-value'),
    skipQuestionBtn: document.getElementById('skip-question'),
    
    // New elements for enhanced UI
    rawScoreElement: document.getElementById('raw-score'),
    negativeScoreElement: document.getElementById('negative-score'),
    endGameTooltip: document.getElementById('end-game-tooltip'),
    starRating: document.querySelectorAll('.star-rating i'),
    suggestionText: document.getElementById('suggestion-text'),
    maxPossibleScoreElement: document.getElementById('max-possible-score'),
};

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.className = `${savedTheme}-mode`;
    elements.themeToggle.checked = savedTheme === 'light';
}

function toggleTheme() {
    const isDark = document.body.classList.contains('dark-mode');
    
    // Remove both classes first to avoid having both
    document.body.classList.remove('dark-mode');
    document.body.classList.remove('light-mode');
    
    // Add the correct class based on the checkbox state
    if (elements.themeToggle.checked) {
        document.body.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
    } else {
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
    }
    
    console.log("Theme toggled to:", elements.themeToggle.checked ? 'light' : 'dark');
}

// Navigation and Section Management
function navigateTo(section) {
    // Hide all sections
    elements.heroSection.classList.add('hidden');
    elements.gameCategoriesSection.classList.add('hidden');
    elements.gameSection.classList.add('hidden');
    elements.resultsSection.classList.add('hidden');
    
    // Show requested section
    section.classList.remove('hidden');
}

// Game Category Selection
function selectCategory(category) {
    gameState.currentCategory = category;
    gameState.selectedCategory = category;
    
    // Ensure difficulty is initialized (default to 'easy' if not set)
    if (!gameState.difficulty) {
        gameState.difficulty = 'easy';
        // Also update UI to show the default selection
        elements.difficultyBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.difficulty === 'easy') {
                btn.classList.add('active');
            }
        });
    }
    
    showConfigModal();
    
    // Update UI with selected category
    const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
    document.querySelector('.modal-header h3').textContent = `${categoryLabel} Trivia Setup`;
    
    // Add logging for debugging
    console.log("Category selected:", category);
    console.log("Current game state:", {
        category: gameState.currentCategory,
        difficulty: gameState.difficulty,
        questionCount: elements.questionCountSlider.value,
        timePerQuestion: elements.questionTimeSlider.value,
        pointsPerQuestion: elements.pointsPerQuestionSlider.value
    });
}

// Configuration Modal Management
function showConfigModal() {
    elements.configModal.classList.remove('hidden');
    elements.configModal.classList.add('show');
}

function hideConfigModal() {
    elements.configModal.classList.remove('show');
    setTimeout(() => {
        elements.configModal.classList.add('hidden');
    }, 300);
}

function updateConfigDisplay() {
    elements.questionCountValue.textContent = elements.questionCountSlider.value;
    elements.questionTimeValue.textContent = elements.questionTimeSlider.value;
    elements.pointsPerQuestionValue.textContent = elements.pointsPerQuestionSlider.value;
    
    // Format negative marking to always show 2 decimal places
    const negativeValue = parseFloat(elements.negativeMarkingSlider.value).toFixed(2);
    elements.negativeMarkingValue.textContent = negativeValue;
}

function setDifficulty(difficulty) {
    gameState.difficulty = difficulty;
    
    // Update UI
    elements.difficultyBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.difficulty === difficulty) {
            btn.classList.add('active');
        }
    });
}

// Game Initialization
async function startGame() {
    // Check if category is selected
    if (!gameState.currentCategory) {
        console.error("No category selected!");
        showNotification("Please select a category first", "error", 3000);
        return;
    }

    // Ensure difficulty is set (fallback to easy)
    if (!gameState.difficulty) {
        console.log("Setting default difficulty to 'easy'");
        gameState.difficulty = 'easy';
    }

    console.log("Starting game with:", {
        category: gameState.currentCategory,
        difficulty: gameState.difficulty,
        questionCount: elements.questionCountSlider.value,
        timePerQuestion: elements.questionTimeSlider.value
    });
    
    // Show guidelines notification first
    try {
        showGuidelinesModal();
    } catch (error) {
        console.error("Error showing guidelines modal:", error);
        showNotification("An error occurred. Please try again.", "error", 3000);
    }
}

// Guidelines Modal
function showGuidelinesModal() {
    // Safety check - ensure category and difficulty are set
    if (!gameState.currentCategory) {
        console.error("No category selected before showing guidelines");
        showNotification("Please select a category first", "error", 3000);
        return;
    }
    
    if (!gameState.difficulty) {
        console.log("No difficulty set, defaulting to 'easy'");
        gameState.difficulty = 'easy';
    }
    
    // Create modal container
    const guidelinesModal = document.createElement('div');
    guidelinesModal.id = 'guidelines-modal';
    guidelinesModal.className = 'guidelines-modal';
    
    // Get user preferences from the current settings
    const category = gameState.currentCategory.charAt(0).toUpperCase() + gameState.currentCategory.slice(1);
    const questionCount = elements.questionCountSlider.value;
    const timePerQuestion = elements.questionTimeSlider.value;
    const pointsPerQuestion = elements.pointsPerQuestionSlider.value;
    const negativeMarking = elements.negativeMarkingSlider.value;
    const difficulty = gameState.difficulty.charAt(0).toUpperCase() + gameState.difficulty.slice(1);
    
    // Create modal content
    guidelinesModal.innerHTML = `
        <div class="guidelines-content">
            <h2><i class="fas fa-info-circle"></i> Test Guidelines</h2>
            
            <!-- User Preferences Table -->
            <div class="user-preferences-table">
                <h3><i class="fas fa-cog"></i> Your Test Configuration</h3>
                <table class="preferences-table">
                    <tr>
                        <td><i class="fas fa-${getCategoryIcon(gameState.currentCategory)}"></i> Category</td>
                        <td>${category}</td>
                    </tr>
                    <tr>
                        <td><i class="fas fa-list-ol"></i> Questions</td>
                        <td>${questionCount}</td>
                    </tr>
                    <tr>
                        <td><i class="fas fa-clock"></i> Time per Question</td>
                        <td>${timePerQuestion} seconds</td>
                    </tr>
                    <tr>
                        <td><i class="fas fa-star"></i> Points per Question</td>
                        <td>${pointsPerQuestion}</td>
                    </tr>
                    <tr>
                        <td><i class="fas fa-minus-circle"></i> Negative Marking</td>
                        <td>${negativeMarking} points</td>
                    </tr>
                    <tr>
                        <td><i class="fas fa-tachometer-alt"></i> Difficulty</td>
                        <td>${difficulty}</td>
                    </tr>
                </table>
            </div>
            
            <div class="guidelines-section">
                <h3 class="do-section"><i class="fas fa-check-circle"></i> Please Do:</h3>
                <ul class="do-list">
                    <li><i class="fas fa-check"></i> Remain in full-screen mode for the entire test duration</li>
                    <li><i class="fas fa-check"></i> Complete all questions in one sitting</li>
                    <li><i class="fas fa-check"></i> Use only the provided interface to answer questions</li>
                    <li><i class="fas fa-check"></i> Focus only on the test during the entire duration</li>
                    <li><i class="fas fa-check"></i> Ensure a stable internet connection</li>
                </ul>
            </div>
            <div class="guidelines-section">
                <h3 class="dont-section"><i class="fas fa-times-circle"></i> Please Don't:</h3>
                <ul class="dont-list">
                    <li><i class="fas fa-times"></i> Exit fullscreen mode during the test</li>
                    <li><i class="fas fa-times"></i> Switch between tabs or windows</li>
                    <li><i class="fas fa-times"></i> Use keyboard shortcuts (Alt+Tab, Windows key, etc.)</li>
                    <li><i class="fas fa-times"></i> Copy or paste content</li>
                    <li><i class="fas fa-times"></i> Try to access other resources during the test</li>
                </ul>
            </div>
            <div class="guidelines-section warning-section">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Any violation of these guidelines will be recorded and may result in automatic test submission.</p>
            </div>
            <div class="agreement-section">
                <label class="agreement-label">
                    <input type="checkbox" id="agreement-checkbox">
                    <span class="checkmark"></span>
                    I have read and agree to follow all test guidelines
                </label>
            </div>
            <div class="guidelines-buttons">
                <button id="cancel-test" class="btn secondary-btn">Cancel</button>
                <button id="proceed-test" class="btn primary-btn" disabled>Proceed</button>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.appendChild(guidelinesModal);
    
    // Add modal styles
    const modalStyles = document.createElement('style');
    modalStyles.textContent = `
        .guidelines-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(5px);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: opacity 0.3s ease;
            animation: fadeIn 0.3s ease forwards;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .guidelines-content {
            background-color: var(--card-dark);
            color: var(--text-dark);
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            width: 90%;
            max-width: 700px;
            max-height: 90vh;
            overflow-y: auto;
            padding: 30px;
            position: relative;
            border: 1px solid rgba(255, 255, 255, 0.1);
            animation: slideUp 0.4s ease forwards;
        }
        
        @keyframes slideUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        .light-mode .guidelines-content {
            background-color: var(--card-light);
            color: var(--text-light);
            border: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .guidelines-content h2 {
            text-align: center;
            margin-bottom: 20px;
            font-size: 1.8rem;
            color: var(--primary-color);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .user-preferences-table {
            background-color: rgba(74, 108, 255, 0.1);
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 25px;
            border: 1px solid rgba(74, 108, 255, 0.3);
        }
        
        .user-preferences-table h3 {
            color: var(--primary-color);
            margin-bottom: 15px;
            font-size: 1.3rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .preferences-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .preferences-table tr {
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .light-mode .preferences-table tr {
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .preferences-table tr:last-child {
            border-bottom: none;
        }
        
        .preferences-table td {
            padding: 10px 15px;
            font-size: 1.05rem;
        }
        
        .preferences-table td:first-child {
            font-weight: bold;
            color: var(--primary-color);
            display: flex;
            align-items: center;
            gap: 10px;
            width: 50%;
        }
        
        .preferences-table td:last-child {
            text-align: right;
            font-weight: 500;
        }
        
        .guidelines-section {
            margin-bottom: 20px;
            padding: 15px;
            border-radius: 8px;
        }
        
        .do-section {
            color: #4CAF50;
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .dont-section {
            color: #F44336;
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .do-list, .dont-list {
            list-style: none;
            padding-left: 10px;
        }
        
        .do-list li, .dont-list li {
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 1.05rem;
        }
        
        .do-list li i {
            color: #4CAF50;
        }
        
        .dont-list li i {
            color: #F44336;
        }
        
        .warning-section {
            background-color: rgba(255, 152, 0, 0.1);
            border-left: 4px solid #FF9800;
            padding: 15px;
            display: flex;
            align-items: center;
            gap: 15px;
            font-weight: bold;
        }
        
        .warning-section i {
            color: #FF9800;
            font-size: 1.5rem;
        }
        
        .agreement-section {
            margin: 25px 0;
            display: flex;
            justify-content: center;
        }
        
        .agreement-label {
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            font-weight: bold;
            position: relative;
            padding-left: 35px;
        }
        
        .agreement-label input {
            position: absolute;
            opacity: 0;
            cursor: pointer;
            height: 0;
            width: 0;
        }
        
        .checkmark {
            position: absolute;
            top: 0;
            left: 0;
            height: 25px;
            width: 25px;
            background-color: rgba(255, 255, 255, 0.1);
            border: 2px solid var(--primary-color);
            border-radius: 4px;
            transition: all 0.2s ease;
        }
        
        .agreement-label:hover input ~ .checkmark {
            background-color: rgba(74, 108, 255, 0.2);
        }
        
        .agreement-label input:checked ~ .checkmark {
            background-color: var(--primary-color);
        }
        
        .checkmark:after {
            content: "";
            position: absolute;
            display: none;
        }
        
        .agreement-label input:checked ~ .checkmark:after {
            display: block;
        }
        
        .agreement-label .checkmark:after {
            left: 9px;
            top: 5px;
            width: 5px;
            height: 10px;
            border: solid white;
            border-width: 0 2px 2px 0;
            transform: rotate(45deg);
        }
        
        .guidelines-buttons {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 20px;
        }
        
        .guidelines-buttons button {
            min-width: 120px;
            padding: 12px 20px;
            font-size: 1rem;
            transition: all 0.3s ease;
        }
        
        .guidelines-buttons button:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        
        .guidelines-buttons button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
    `;
    document.head.appendChild(modalStyles);
    
    // Add event listeners
    const agreementCheckbox = document.getElementById('agreement-checkbox');
    const proceedButton = document.getElementById('proceed-test');
    const cancelButton = document.getElementById('cancel-test');
    
    agreementCheckbox.addEventListener('change', function() {
        proceedButton.disabled = !this.checked;
    });
    
    cancelButton.addEventListener('click', function() {
        document.body.removeChild(guidelinesModal);
    });
    
    proceedButton.addEventListener('click', function() {
        document.body.removeChild(guidelinesModal);
        startGameAfterAgreement();
    });
}

// Actual game start after agreement
function startGameAfterAgreement() {
    // Reset warnings counters
    gameState.securityWarnings = 0;
    gameState.lastFocusTime = Date.now();
    gameState.forcedEnd = false;
    
    // Update game state from configuration
    gameState.questionCount = parseInt(elements.questionCountSlider.value);
    gameState.timePerQuestion = parseInt(elements.questionTimeSlider.value);
    gameState.pointsPerQuestion = parseInt(elements.pointsPerQuestionSlider.value);
    gameState.negativeMarking = parseFloat(elements.negativeMarkingSlider.value);
    
    // Set selected category from current category
    gameState.selectedCategory = gameState.currentCategory;
    
    // Enable security features
    gameState.testSecurity.enabled = true;
    gameState.testSecurity.fullscreenRequired = true;
    gameState.testSecurity.preventTabSwitch = true;
    
    console.log("Security features enabled:", gameState.testSecurity);
    console.log("Selected category:", gameState.selectedCategory);
    
    // Notify user about keyboard restrictions
    showNotification("Keyboard is restricted during the test. Only ESC, Enter, Space, Shift and Ctrl keys are allowed.", "warning", 5000);
    
    // Hide modal and remain on categories section until questions are loaded
    hideConfigModal();
    
    // Enter fullscreen mode when game starts
    requestFullscreen(document.documentElement);
    
    // Update UI elements
    elements.categoryIcon.className = `category-icon fas fa-${getCategoryIcon(gameState.currentCategory)}`;
    elements.categoryName.textContent = gameState.currentCategory.charAt(0).toUpperCase() + gameState.currentCategory.slice(1);
    elements.totalQuestionsElement.textContent = gameState.questionCount;
    elements.resultsTotalQuestionsElement.textContent = gameState.questionCount;
    elements.currentScoreElement.textContent = gameState.score;
    
    // Enable the skip button and show but disable end game button
    elements.skipQuestionBtn.disabled = true;
    elements.endGameBtn.disabled = true;
    
    // Collapse chat when game starts
    const widget = elements.aiAssistantWidget;
    widget.classList.add('icon-only');
    
    // Reset position of chatbot to corner
    widget.style.left = 'auto';
    widget.style.top = 'auto';
    widget.style.right = '20px';
    widget.style.bottom = '80px';
    
    // Initialize game state first
    initializeGame();
    
    // Show loading message to user
    elements.questionText.textContent = "Loading questions...";
    elements.answersContainer.innerHTML = '<div class="loading-spinner"></div>';
    
    // Load questions and then navigate to game section
    loadQuestions().then(() => {
        if (gameState.questions.length === 0) {
            showNotification("Failed to load questions. Please try again.", "error", 5000);
            navigateTo(elements.gameCategoriesSection);
            return;
        }
        
        // Start the game
        gameState.isGameActive = true;
        gameState.isGameOver = false;
        
        // Now navigate to game section after questions are loaded
        navigateTo(elements.gameSection);
        
        // Show first question
        showQuestion();
        
        // Initialize event handling for test security if configured
        if (gameState.testSecurity.enabled) {
            console.log("Initializing security detection");
            initSecurityDetection();
        }
    }).catch(error => {
        console.error("Error starting game:", error);
        showNotification("Failed to start the game. Please try again.", "error", 5000);
        navigateTo(elements.gameCategoriesSection);
    });
}

function initializeGame() {
    // Reset game state
    gameState.currentQuestion = 0;
    gameState.score = 0;
    gameState.rawScore = 0;
    gameState.penaltyScore = 0;
    gameState.correctAnswers = 0;
    gameState.wrongAnswers = 0;
    gameState.skippedQuestions = 0;
    gameState.securityWarnings = 0;
    gameState.questionTimes = [];
    gameState.selectedAnswer = null;
    gameState.isGameActive = true;
    gameState.isGameOver = false;
    gameState.forcedEnd = false;
    gameState.lastFocusTime = null;
    gameState.skipEnabled = false;
    gameState.userAnswers = [];
    gameState.securityViolations = [];
    gameState.questionViolations = {};
    
    // Record start time
    gameState.startTime = new Date();
    
    // Enable security if configured
    if (gameState.testSecurity.enabled) {
        enableTestSecurity();
    }
    
    // Note: We no longer navigate to game section here
    // as this will be handled after questions are loaded
}

// Question Loading and Display
async function loadQuestions() {
    try {
        // Loading indicators are now set in startGameAfterAgreement
        
        // Check if online
        if (navigator.onLine) {
            try {
                // Generate questions using API with timeout
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error("Request timeout")), 5000)
                );
                
                const questionsPromise = generateQuestionsWithAPI();
                gameState.questions = await Promise.race([questionsPromise, timeoutPromise]);
                
                // If API didn't return valid questions or returned null, throw error
                if (!gameState.questions || !Array.isArray(gameState.questions) || gameState.questions.length === 0) {
                    throw new Error("Invalid questions from API");
                }
                
                console.log("Successfully loaded questions from API");
            } catch (apiError) {
                console.error("API error, using fallback questions:", apiError);
                // Use fallback if API fails
                throw new Error("API failed: " + apiError.message);
            }
        } else {
            // Use fallback questions if offline
            throw new Error("Offline mode");
        }
    } catch (error) {
        // Fallback to cached questions
        console.log("Using fallback questions:", error);
        
        if (FALLBACK_QUESTIONS[gameState.selectedCategory]) {
            // Use category-specific questions
            gameState.questions = [...FALLBACK_QUESTIONS[gameState.selectedCategory]];
        } else {
            // If no category-specific questions, use football as default
            gameState.questions = [...FALLBACK_QUESTIONS.football];
        }
        
        // If we need more questions than available in fallback, repeat them
        while (gameState.questions.length < gameState.questionCount) {
            if (FALLBACK_QUESTIONS[gameState.selectedCategory]) {
                gameState.questions = gameState.questions.concat(FALLBACK_QUESTIONS[gameState.selectedCategory]);
            } else {
                gameState.questions = gameState.questions.concat(FALLBACK_QUESTIONS.football);
            }
        }
        
        // Trim to the requested count
        gameState.questions = gameState.questions.slice(0, gameState.questionCount);
        
        // Debug
        console.log("Fallback questions loaded:", gameState.questions.length);
    }
    
    // Safety check - if no questions loaded at all, create some basic ones
    if (!gameState.questions || !Array.isArray(gameState.questions) || gameState.questions.length === 0) {
        console.error("Failed to load any questions, creating emergency questions");
        gameState.questions = [];
        
        // Create basic emergency questions
        for (let i = 0; i < gameState.questionCount; i++) {
            gameState.questions.push({
                question: `Emergency Question ${i+1}`,
                options: ["Option A", "Option B", "Option C", "Option D"],
                correctAnswer: "Option A"
            });
        }
    }
}

async function generateQuestionsWithAPI() {
    try {
        const categoryParam = gameState.selectedCategory ? `&category=${gameState.selectedCategory}` : '';
        const difficultyParam = `&difficulty=${gameState.difficulty}`;
        const amount = gameState.questionCount;
        
        const response = await fetch(`https://opentdb.com/api.php?amount=${amount}${categoryParam}${difficultyParam}&type=multiple`);
        const data = await response.json();
        
        if (data.response_code === 0 && data.results.length > 0) {
            return data.results.map(q => {
                // Always ensure we have 4 options for each question (1 correct + 3 incorrect)
                const correctAnswer = q.correct_answer.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, "&");
                
                // Process incorrect answers the same way
                const incorrectAnswers = q.incorrect_answers.map(answer => 
                    answer.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, "&")
                );
                
                // Make sure we have exactly 3 incorrect answers
                while (incorrectAnswers.length < 3) {
                    incorrectAnswers.push(`Alternative ${incorrectAnswers.length + 1}`);
                }
                
                // Combine all options (1 correct + 3 incorrect)
                const allOptions = [correctAnswer, ...incorrectAnswers];
                
                return {
                    question: q.question.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, "&"),
                    options: allOptions,
                    correctAnswer: correctAnswer
                };
            });
        } else {
            throw new Error('Failed to fetch questions from API');
        }
    } catch (error) {
        console.error('API error:', error);
        return null;
    }
}

function showQuestion() {
    // Reset for new question
    clearInterval(gameState.timerInterval);
    gameState.selectedAnswer = null;
    
    // Safety check to ensure questions array exists and has questions
    if (!gameState.questions || !Array.isArray(gameState.questions) || gameState.questions.length === 0) {
        console.error("No questions available to display");
        showNotification("Error: No questions available", "error", 3000);
        return;
    }
    
    // Safety check for current question index
    if (gameState.currentQuestion >= gameState.questions.length) {
        console.error("Question index out of bounds:", gameState.currentQuestion, "vs", gameState.questions.length);
        gameState.currentQuestion = 0; // Reset to first question as fallback
    }
    
    const currentQ = gameState.questions[gameState.currentQuestion];
    console.log("Showing question", gameState.currentQuestion + 1, ":", currentQ.question);
    
    // Update UI
    elements.currentQuestionElement.textContent = gameState.currentQuestion + 1;
    elements.questionText.textContent = currentQ.question;
    
    // Create answer options - ensure we have exactly 4 options
    elements.answersContainer.innerHTML = '';
    
    // Make sure we have a valid options array with 4 items
    const options = currentQ.options || [];
    
    // If we don't have enough options, handle this case
    if (!options || options.length < 4) {
        console.error('Question does not have enough options:', currentQ);
        
        // Create placeholder options if needed
        if (!options || options.length === 0) {
            currentQ.options = [
                currentQ.correctAnswer,
                'Option 2',
                'Option 3',
                'Option 4'
            ];
        } else if (options.length < 4) {
            // Fill in missing options
            for (let i = options.length; i < 4; i++) {
                currentQ.options.push(`Option ${i+1}`);
            }
        }
    }
    
    // Ensure correct answer is in the options
    if (!currentQ.options.includes(currentQ.correctAnswer)) {
        currentQ.options[0] = currentQ.correctAnswer;
    }
    
    // Randomize the order of options
    const shuffledOptions = [...currentQ.options].sort(() => Math.random() - 0.5);
    
    // Create the four option elements
    shuffledOptions.forEach((option) => {
        const answerElement = document.createElement('div');
        answerElement.classList.add('answer-option');
        answerElement.dataset.answer = option;
        answerElement.textContent = option;
        
        // Use a closure to capture the option value
        const handleClick = () => selectAnswer(option);
        answerElement.addEventListener('click', handleClick);
        
        elements.answersContainer.appendChild(answerElement);
    });
    
    // Start timer
    startTimer();
    
    // Record start time for this question
    gameState.questionStartTime = new Date();
    
    // Enable skip button
    elements.skipQuestionBtn.disabled = false;
    
    // Check if we've reached halfway point to enable end game button
    const halfwayPoint = Math.floor(gameState.questionCount / 2);
    if (gameState.currentQuestion >= halfwayPoint) {
        elements.endGameBtn.disabled = false;
        elements.endGameTooltip.textContent = "End the game and see your results";
    } else {
        elements.endGameBtn.disabled = true;
        elements.endGameTooltip.textContent = "Enabled after completing 50% of questions";
    }
}

// Timer Management
function startTimer() {
    console.log("Starting timer with timePerQuestion:", gameState.timePerQuestion);
    
    // Find the timer elements
    const timerElement = document.getElementById('timer-value');
    const timerProgress = document.querySelector('.timer-progress');
    
    // Always reset the timeLeft to the configured time per question for each new question
    gameState.timeLeft = gameState.timePerQuestion || 30; // Default to 30 seconds if not set
    
    if (timerElement && timerProgress) {
        // Update UI immediately
        timerElement.textContent = gameState.timeLeft;
        timerProgress.style.width = '100%';
        timerProgress.classList.remove('warning', 'danger');
        
        // Clear any existing intervals to prevent duplicates
        if (gameState.timerInterval) {
            clearInterval(gameState.timerInterval);
            console.log("Cleared existing timer interval");
        }
        
        console.log("Setting up new timer interval");
        
        // Start new timer
        gameState.timerInterval = setInterval(() => {
            gameState.timeLeft--;
            
            if (timerElement) {
                timerElement.textContent = gameState.timeLeft;
            }
            
            if (timerProgress) {
                const percentage = (gameState.timeLeft / gameState.timePerQuestion) * 100;
                timerProgress.style.width = `${percentage}%`;
                
                // Add warning classes
                if (gameState.timeLeft <= Math.floor(gameState.timePerQuestion * 0.25)) {
                    timerProgress.classList.add('danger');
                } else if (gameState.timeLeft <= Math.floor(gameState.timePerQuestion * 0.5)) {
                    timerProgress.classList.add('warning');
                }
            }
            
            // Time's up
            if (gameState.timeLeft <= 0) {
                console.log("Timer reached zero - clearing interval");
                clearInterval(gameState.timerInterval);
                moveToNextQuestion();
            }
        }, 1000);
        
        console.log("Timer started successfully");
    } else {
        console.error("Timer elements not found in the DOM:", 
                      {timerElement: !!timerElement, timerProgress: !!timerProgress});
    }
}

function handleTimeUp() {
    // Record time spent on this question
    const timeSpent = gameState.questionTime;
    gameState.questionTimes.push(timeSpent);
    
    // Save the fact that user didn't answer in time
    const currentQ = gameState.questions[gameState.currentQuestion];
    gameState.userAnswers[gameState.currentQuestion] = {
        question: currentQ.question,
        options: currentQ.options,
        correctAnswer: currentQ.correctAnswer,
        userAnswer: "Time Up - No Answer",
        isCorrect: false,
        timeSpent: timeSpent,
        hasViolations: gameState.questionViolations[gameState.currentQuestion] ? true : false
    };
    
    // Show correct answer
    showCorrectAnswer();
    
    // Move to next question after delay
    setTimeout(() => {
        moveToNextQuestion();
    }, 2000);
}

// Answer Selection
function selectAnswer(answer) {
    // Prevent selecting multiple answers or selecting after question is answered
    if (gameState.selectedAnswer !== null) return;
    
    gameState.selectedAnswer = answer;
    clearInterval(gameState.timerInterval);
    
    // Calculate time spent
    const now = new Date();
    const timeSpent = Math.round((now - gameState.questionStartTime) / 1000);
    gameState.questionTimes.push(timeSpent);
    
    // Update UI
    const answerElements = document.querySelectorAll('.answer-option');
    answerElements.forEach(element => {
        if (element.dataset.answer === answer) {
            element.classList.add('selected');
        }
        
        // Disable all options immediately to prevent multiple clicks
        element.removeEventListener('click', () => selectAnswer(element.dataset.answer));
        element.style.pointerEvents = 'none';
    });
    
    // Check if answer is correct
    const currentQ = gameState.questions[gameState.currentQuestion];
    if (answer === currentQ.correctAnswer) {
        // Correct answer - add points based on configuration
        const pointsEarned = gameState.pointsPerQuestion;
        gameState.rawScore += pointsEarned;
        gameState.score += pointsEarned;
        gameState.correctAnswers++;
    } else {
        // Wrong answer - apply negative marking if configured
        if (gameState.negativeMarking > 0) {
            // Calculate penalty as percentage of points per question
            const penalty = gameState.pointsPerQuestion * (gameState.negativeMarking / 3);
            gameState.penaltyScore += penalty;
            gameState.score -= penalty;
        }
        gameState.wrongAnswers++;
    }
    
    // Save user's answer in the tracking array
    gameState.userAnswers[gameState.currentQuestion] = {
        question: currentQ.question,
        options: currentQ.options,
        correctAnswer: currentQ.correctAnswer,
        userAnswer: answer,
        isCorrect: answer === currentQ.correctAnswer,
        timeSpent: timeSpent,
        hasViolations: gameState.questionViolations[gameState.currentQuestion] ? true : false
    };
    
    // Update score display (make sure it doesn't go below 0)
    gameState.score = Math.max(0, gameState.score);
    elements.currentScoreElement.textContent = gameState.score.toFixed(1);
    
    // Show correct answer
    showCorrectAnswer();
    
    // Move to next question after delay
    setTimeout(() => {
        moveToNextQuestion();
    }, 2000);
}

function showCorrectAnswer() {
    const currentQ = gameState.questions[gameState.currentQuestion];
    const correctAnswer = currentQ.correctAnswer;
    
    // Update UI to show correct/incorrect answers
    const answerElements = document.querySelectorAll('.answer-option');
    answerElements.forEach(element => {
        const answer = element.dataset.answer;
        
        if (answer === correctAnswer) {
            element.classList.add('correct');
        } else if (answer === gameState.selectedAnswer && answer !== correctAnswer) {
            element.classList.add('incorrect');
        }
    });
}

function moveToNextQuestion() {
    gameState.currentQuestion++;
    
    // Check if we've reached the question limit
    if (gameState.currentQuestion >= gameState.questionCount) {
        // Game over - we've reached the maximum number of questions
        endGame();
        return;
    }
    
    // More questions remain, show the next one
    showQuestion();
}

// Game End
function endGame(forcedEnd = false) {
    gameState.isGameActive = false;
    gameState.isGameOver = true;
    gameState.forcedEnd = forcedEnd; // Store if the game was forcibly ended
    clearInterval(gameState.timerInterval);
    
    // Disable test security features
    disableTestSecurity();
    
    // Exit fullscreen when game ends
    exitFullscreen();
    
    // Prepare results
    prepareResults();
    
    // Navigate to results section
    navigateTo(elements.resultsSection);
}

function showEndGameConfirmation() {
    elements.endConfirmModal.classList.remove('hidden');
    elements.endConfirmModal.classList.add('show');
}

function hideEndGameConfirmation() {
    elements.endConfirmModal.classList.remove('show');
    setTimeout(() => {
        elements.endConfirmModal.classList.add('hidden');
    }, 300);
}

// Results Dashboard
function prepareResults() {
    // Check if the test was forcibly ended
    if (gameState.forcedEnd) {
        // Create results denied overlay
        const deniedOverlay = document.createElement('div');
        deniedOverlay.className = 'results-denied-overlay';
        deniedOverlay.innerHTML = `
            <div class="denied-content">
                <div class="denied-icon"><i class="fas fa-ban"></i></div>
                <h2>Results Denied</h2>
                <p>Your test was forcibly submitted due to suspicious activity.</p>
                <p>Full screen mode is required to maintain test integrity.</p>
                <div class="pdf-download-section">
                    <p class="download-info">Download a detailed report of suspicious activities:</p>
                    <button id="download-suspicious-pdf" class="btn pdf-download-btn">
                        <i class="fas fa-file-pdf"></i> Download Suspicious Activity Report
                    </button>
                </div>
            </div>
        `;
        elements.resultsSection.appendChild(deniedOverlay);
        
        // Add overlay styles
        const deniedStyles = document.createElement('style');
        deniedStyles.textContent = `
            .results-denied-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(244, 67, 54, 0.1);
                backdrop-filter: blur(2px);
                z-index: 5;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 2rem;
                pointer-events: none;
            }
            .denied-content {
                background-color: #fff;
                color: #333;
                padding: 2rem;
                border-radius: 10px;
                border-left: 5px solid #F44336;
                text-align: center;
                max-width: 600px;
                box-shadow: 0 5px 30px rgba(0, 0, 0, 0.3);
                pointer-events: auto;
            }
            .denied-icon {
                font-size: 4rem;
                color: #F44336;
                margin-bottom: 1rem;
            }
            .denied-content h2 {
                margin-bottom: 1rem;
                color: #F44336;
                font-size: 2rem;
            }
            .denied-content p {
                margin-bottom: 0.5rem;
                font-size: 1.1rem;
            }
            .pdf-download-section {
                margin-top: 1.5rem;
                padding-top: 1rem;
                border-top: 1px dashed rgba(244, 67, 54, 0.3);
            }
            .download-info {
                font-size: 0.95rem;
                margin-bottom: 0.8rem;
                color: #555;
            }
            .pdf-download-btn {
                background-color: #F44336;
                color: white;
                border: none;
                padding: 10px 15px;
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.3s ease;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                font-size: 0.9rem;
            }
            .pdf-download-btn:hover {
                background-color: #d32f2f;
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            }
            .results-section .charts-container, 
            .results-section .results-summary,
            .results-section .performance-feedback {
                filter: blur(3px);
                pointer-events: none;
            }
            /* Keep the action buttons visible and clickable */
            .results-section .results-actions {
                position: relative;
                z-index: 10;
                filter: none;
                pointer-events: auto;
            }
            /* Make buttons more prominent */
            .results-section .results-actions button {
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                transform: scale(1.05);
                margin: 0 10px;
            }
        `;
        document.head.appendChild(deniedStyles);
        
        // Add event listener for the download button
        setTimeout(() => {
            const downloadBtn = document.getElementById('download-suspicious-pdf');
            if (downloadBtn) {
                downloadBtn.addEventListener('click', generateSuspiciousActivityPDF);
            }
        }, 100);
    } else {
        // Add PDF download button for fair results
        const fairResultsDownload = document.createElement('div');
        fairResultsDownload.className = 'fair-results-download';
        fairResultsDownload.innerHTML = `
            <button id="download-fair-results-pdf" class="btn pdf-download-btn">
                <i class="fas fa-file-pdf"></i> Download Activity Report
            </button>
        `;
        
        // Insert before results-actions
        const resultsActions = elements.resultsSection.querySelector('.results-actions');
        elements.resultsSection.insertBefore(fairResultsDownload, resultsActions);
        
        // Add styles for fair results download
        const fairStyles = document.createElement('style');
        fairStyles.textContent = `
            .fair-results-download {
                text-align: center;
                margin: 1.5rem 0;
            }
            .pdf-download-btn {
                background-color: #4a6cff;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.3s ease;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                font-size: 1rem;
            }
            .pdf-download-btn:hover {
                background-color: #3b56cc;
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            }
        `;
        document.head.appendChild(fairStyles);
        
        // Add event listener for the download button
        setTimeout(() => {
            const downloadBtn = document.getElementById('download-fair-results-pdf');
            if (downloadBtn) {
                downloadBtn.addEventListener('click', generateFairActivityPDF);
            }
        }, 100);
    }
    
    // Continue with normal results preparation
    
    // Calculate max possible score
    const maxPossibleScore = gameState.questionCount * gameState.pointsPerQuestion;
    
    // Update basic stats
    elements.finalScoreElement.textContent = gameState.score.toFixed(1);
    elements.maxPossibleScoreElement.textContent = maxPossibleScore;
    
    // For forced end games, show what we completed vs total
    if (gameState.forcedEnd) {
        elements.correctAnswersElement.textContent = gameState.correctAnswers;
        
        // Update the total questions to show "X of Y" format
        const totalQuestionsFormatted = `${gameState.currentQuestion}/${gameState.questionCount}`;
        elements.resultsTotalQuestionsElement.textContent = totalQuestionsFormatted;
        
        // Also add a message about incomplete test
        const incompleteMessage = document.createElement('p');
        incompleteMessage.className = 'incomplete-test-message';
        incompleteMessage.innerHTML = `<i class="fas fa-exclamation-circle"></i> Test submitted at question ${gameState.currentQuestion} of ${gameState.questionCount}`;
        
        // Find the results summary container and append the message
        const resultsSummary = document.querySelector('.results-summary');
        if (resultsSummary) {
            resultsSummary.appendChild(incompleteMessage);
            
            // Add styles for the message
            const messageStyles = document.createElement('style');
            messageStyles.textContent = `
                .incomplete-test-message {
                    color: #FF9800;
                    font-style: italic;
                    margin-top: 10px;
                    font-size: 0.9rem;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .incomplete-test-message i {
                    color: #FF9800;
                }
            `;
            document.head.appendChild(messageStyles);
        }
    } else {
        // Normal completed test
        elements.correctAnswersElement.textContent = gameState.correctAnswers;
        elements.resultsTotalQuestionsElement.textContent = gameState.questionCount;
    }
    
    // Show score breakdown
    elements.rawScoreElement.textContent = `Base: ${gameState.rawScore.toFixed(1)}`;
    elements.negativeScoreElement.textContent = `Penalty: -${gameState.penaltyScore.toFixed(1)}`;
    
    // Calculate accuracy - exclude skipped questions from calculation
    const attemptedQuestions = gameState.correctAnswers + gameState.wrongAnswers;
    const accuracy = attemptedQuestions > 0 
        ? Math.round((gameState.correctAnswers / attemptedQuestions) * 100) 
        : 0;
    elements.accuracyElement.textContent = `${accuracy}%`;
    
    // Calculate total time
    const totalSeconds = gameState.questionTimes.reduce((total, time) => total + time, 0);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    elements.totalTimeElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Calculate performance rating and suggestions
    updatePerformanceRating();
    
    // Create charts with improved timing and handling
    setTimeout(() => {
        // Force a reflow to ensure container dimensions are correct
        const chartsContainer = document.querySelector('.charts-container');
        const dummy = chartsContainer.offsetHeight; // Force reflow
        
        createAnswersChart();
        createTimeChart();
        
        // Add a mutation observer to ensure charts fit correctly if DOM changes
        const observer = new MutationObserver((mutations) => {
            if (window.answersChart) {
                window.answersChart.resize();
            }
            if (window.timeChart) {
                window.timeChart.resize();
            }
        });
        
        observer.observe(chartsContainer, { 
            attributes: true, 
            childList: true,
            subtree: true
        });
        
        // Also handle window resize specifically for charts
        const handleChartResize = () => {
            if (window.answersChart) {
                window.answersChart.resize();
            }
            if (window.timeChart) {
                window.timeChart.resize();
            }
        };
        
        window.addEventListener('resize', handleChartResize);
        
        // Clean up when navigating away
        const cleanupCharts = () => {
            observer.disconnect();
            window.removeEventListener('resize', handleChartResize);
        };
        
        // Add event listeners to results action buttons for cleanup
        elements.tryAgainBtn.addEventListener('click', cleanupCharts);
        elements.newGameBtn.addEventListener('click', cleanupCharts);
        elements.backToHomeBtn.addEventListener('click', cleanupCharts);
        
    }, 300); // Longer delay to ensure DOM is fully rendered
}

// Performance Rating
function updatePerformanceRating() {
    // Calculate rating from 1-5 based on score, accuracy, and completion time
    const maxPossibleScore = gameState.questionCount * gameState.pointsPerQuestion;
    const scoreRatio = gameState.score / maxPossibleScore; 
    const accuracy = gameState.correctAnswers / (gameState.correctAnswers + gameState.wrongAnswers) || 0;
    const avgTimePerQuestion = gameState.questionTimes.reduce((a, b) => a + b, 0) / gameState.questionCount;
    const timeEfficiency = Math.max(0, 1 - (avgTimePerQuestion / gameState.questionTime));
    
    // Weighted score calculation
    let ratingScore = (scoreRatio * 0.4) + (accuracy * 0.4) + (timeEfficiency * 0.2);
    
    // Adjust for difficulty
    if (gameState.difficulty === 'medium') {
        ratingScore *= 1.1;
    } else if (gameState.difficulty === 'hard') {
        ratingScore *= 1.2;
    }
    
    // Convert to 1-5 scale
    let rating = Math.min(5, Math.max(1, Math.round(ratingScore * 5)));
    
    // Update star display
    elements.starRating.forEach((star, index) => {
        if (index < rating) {
            star.className = 'fas fa-star';
        } else {
            star.className = 'far fa-star';
        }
    });
    
    // Generate suggestion text based on performance
    generateSuggestion(rating, accuracy, timeEfficiency);
}

function generateSuggestion(rating, accuracy, timeEfficiency) {
    let suggestion = '';
    
    if (rating >= 4) {
        suggestion = "Excellent job! You have a strong knowledge of " + gameState.currentCategory + " trivia. ";
        
        if (timeEfficiency < 0.7) {
            suggestion += "Try to answer a bit faster to maximize your score.";
        } else if (gameState.skippedQuestions > 0) {
            suggestion += "Reduce skipping questions to further improve your score.";
        } else {
            suggestion += "Try increasing the difficulty level for more challenge!";
        }
    } else if (rating >= 3) {
        suggestion = "Good performance! You show solid knowledge of " + gameState.currentCategory + ". ";
        
        if (accuracy < 0.7) {
            suggestion += "Focus on accuracy to increase your score.";
        } else if (timeEfficiency < 0.6) {
            suggestion += "Work on answering questions more quickly.";
        } else {
            suggestion += "Keep practicing to improve your knowledge!";
        }
    } else {
        suggestion = "There's room for improvement in your " + gameState.currentCategory + " knowledge. ";
        
        if (accuracy < 0.5) {
            suggestion += "Try an easier difficulty level and focus on learning the correct answers.";
        } else if (gameState.skippedQuestions > gameState.questionCount * 0.3) {
            suggestion += "Try answering more questions instead of skipping them.";
        } else {
            suggestion += "Practice more to improve your knowledge and speed!";
        }
    }
    
    elements.suggestionText.textContent = suggestion;
}

function createAnswersChart() {
    const canvas = document.getElementById('answers-chart');
    
    // Destroy previous chart if it exists
    if (window.answersChart) {
        window.answersChart.destroy();
    }
    
    // Better colors with higher contrast
    const chartColors = {
        correct: {
            bg: 'rgba(76, 175, 80, 0.8)',
            border: 'rgba(76, 175, 80, 1)'
        },
        incorrect: {
            bg: 'rgba(244, 67, 54, 0.8)',
            border: 'rgba(244, 67, 54, 1)'
        },
        skipped: {
            bg: 'rgba(255, 152, 0, 0.8)',
            border: 'rgba(255, 152, 0, 1)'
        }
    };
    
    // Create new chart with skipped questions included
    window.answersChart = new Chart(canvas, {
        type: 'pie',
        data: {
            labels: ['Correct', 'Incorrect', 'Skipped'],
            datasets: [{
                data: [
                    gameState.correctAnswers, 
                    gameState.wrongAnswers, 
                    gameState.skippedQuestions
                ],
                backgroundColor: [
                    chartColors.correct.bg,
                    chartColors.incorrect.bg,
                    chartColors.skipped.bg
                ],
                borderColor: [
                    chartColors.correct.border,
                    chartColors.incorrect.border,
                    chartColors.skipped.border
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: 5
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        padding: 10,
                        font: {
                            size: 10,
                            weight: 'bold'
                        },
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    bodyFont: {
                        size: 11
                    },
                    titleFont: {
                        size: 11,
                        weight: 'bold'
                    },
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            let value = context.raw || 0;
                            let percentage = Math.round((value / gameState.questionCount) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function createTimeChart() {
    const canvas = document.getElementById('time-chart');
    
    // Destroy previous chart if it exists
    if (window.timeChart) {
        window.timeChart.destroy();
    }
    
    // Limit the number of labels if there are many questions
    let labels = [];
    let data = [];
    let backgrounds = [];
    
    // Max 5 data points for better display
    const maxBars = Math.min(5, gameState.questionTimes.length);
    
    if (gameState.questionTimes.length > maxBars) {
        // Average time in groups if more than maxBars questions
        const groupSize = Math.ceil(gameState.questionTimes.length / maxBars);
        
        for (let i = 0; i < gameState.questionTimes.length; i += groupSize) {
            const chunk = gameState.questionTimes.slice(i, i + groupSize);
            const avgTime = chunk.reduce((sum, time) => sum + time, 0) / chunk.length;
            data.push(Math.round(avgTime));
            labels.push(`Q${i+1}-${Math.min(i+groupSize, gameState.questionTimes.length)}`);
            
            // Color based on time percentage
            const timePercentage = avgTime / gameState.questionTime;
            if (timePercentage < 0.5) {
                backgrounds.push('rgba(76, 175, 80, 0.8)'); // Fast - green
            } else if (timePercentage < 0.75) {
                backgrounds.push('rgba(255, 193, 7, 0.8)'); // Medium - amber
            } else {
                backgrounds.push('rgba(255, 87, 34, 0.8)'); // Slow - deep orange
            }
        }
    } else {
        // Use all questions if 5 or fewer
        data = gameState.questionTimes;
        for (let i = 0; i < gameState.questionTimes.length; i++) {
            labels.push(`Q${i + 1}`);
            
            // Color based on time percentage
            const timePercentage = gameState.questionTimes[i] / gameState.questionTime;
            if (timePercentage < 0.5) {
                backgrounds.push('rgba(76, 175, 80, 0.8)'); // Fast - green
            } else if (timePercentage < 0.75) {
                backgrounds.push('rgba(255, 193, 7, 0.8)'); // Medium - amber
            } else {
                backgrounds.push('rgba(255, 87, 34, 0.8)'); // Slow - deep orange
            }
        }
    }
    
    // Create new chart
    window.timeChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Seconds',
                data: data,
                backgroundColor: backgrounds,
                borderColor: backgrounds.map(color => color.replace('0.8', '1')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: 5
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: gameState.questionTime + 5,
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 9
                        },
                        maxTicksLimit: 5
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 9
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    bodyFont: {
                        size: 10
                    },
                    titleFont: {
                        size: 10
                    },
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            return `Time: ${value}s`;
                        }
                    }
                }
            }
        }
    });
}

// AI Assistant
function initAIAssistant() {
    const widget = elements.aiAssistantWidget;
    const header = widget.querySelector('.chat-header');
    const chatBody = widget.querySelector('.chat-body');
    
    // Drag functionality removed as per requirements
    let isDragging = false;
    
    // Toggle between icon-only and expanded modes
    widget.addEventListener('click', (e) => {
        // Don't trigger on close button clicks
        if (e.target.closest('.close-chat')) {
            return;
        }
        
        // Check if a game is active
        if (gameState.isGameActive) {
            // Instead of showing in chat, display as notification
            showNotification("Chatbot is disabled during the test. It will be available when you finish.", 'warning');
            return;
        }
        
        // Normal behavior when game is not active and we're clicking on the icon
        if (widget.classList.contains('icon-only')) {
            e.preventDefault();
            widget.classList.remove('icon-only');
            chatBody.style.display = 'flex';
            elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
            console.log("Expanding chat");
        }
    });
    
    // Ensure the close button works properly by stopping propagation
    elements.closeChatBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        collapseChat();
    });
    
    function collapseChat() {
        widget.classList.add('icon-only');
        chatBody.style.display = 'none'; // Ensure the body is hidden
        
        // Reset position to original bottom-right corner
        widget.style.position = 'fixed';
        widget.style.left = 'auto';
        widget.style.top = 'auto';
        widget.style.right = '20px';
        widget.style.bottom = '80px'; // Match the CSS bottom value
        widget.style.transform = 'none'; // Reset any transform
        
        console.log("Chat collapsed to icon mode");
    }
    
    // Drag functionality removed
    
    // Initialize in icon-only mode
    collapseChat();
}

function toggleAIAssistant() {
    const widget = elements.aiAssistantWidget;
    
    if (widget.classList.contains('icon-only')) {
        widget.classList.remove('icon-only');
    } else {
        widget.classList.add('icon-only');
        
        // Reset position
        widget.style.left = 'auto';
        widget.style.top = 'auto';
        widget.style.right = '20px';
        widget.style.bottom = '80px'; // Updated to match other bottom values
    }
}

function sendMessage() {
    const message = elements.chatInput.value.trim();
    if (!message) return;
    
    // Add user message to chat
    addMessageToChat('user', message);
    
    // Clear input
    elements.chatInput.value = '';
    
    // Generate AI response
    processAIResponse(message);
}

function addMessageToChat(sender, content, asNotification = false) {
    if (sender === 'ai' && asNotification) {
        showNotification(content);
        return;
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);
    
    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    contentDiv.innerHTML = `<p>${content}</p>`;
    
    messageDiv.appendChild(contentDiv);
    elements.messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
}

async function processAIResponse(userMessage) {
    // Show typing indicator
    addMessageToChat('ai', '<div class="typing-indicator"><span></span><span></span><span></span></div>');
    
    try {
        // Create context-aware prompt based on game state
        let contextPrompt = "You are a helpful Sports Trivia Assistant. ";
        
        if (gameState.isGameActive) {
            contextPrompt += `The user is currently playing a ${gameState.difficulty} difficulty trivia game about ${gameState.currentCategory}. They are on question ${gameState.currentQuestion + 1} of ${gameState.questionCount}.`;
        } else if (gameState.isGameOver) {
            contextPrompt += `The user just finished a ${gameState.difficulty} difficulty trivia game about ${gameState.currentCategory}. They scored ${gameState.score} points with ${gameState.correctAnswers} correct answers out of ${gameState.questionCount}.`;
        } else {
            contextPrompt += "The user is browsing sports trivia categories.";
        }
        
        contextPrompt += " Provide a brief, helpful response to their question about sports or the game. Keep your answer concise (under 3 sentences if possible).";
        
        // If offline, use predefined responses
        if (!navigator.onLine) {
            // Remove typing indicator
            elements.messagesContainer.removeChild(elements.messagesContainer.lastChild);
            
            // Add offline response
            const response = getOfflineAIResponse(userMessage);
            addMessageToChat('ai', response);
            return;
        }
        
        // Make API request
        const response = await fetch(MISTRAL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MISTRAL_API_KEY}`
            },
            body: JSON.stringify({
                model: 'mistral-tiny',
                messages: [
                    {
                        role: 'system',
                        content: contextPrompt
                    },
                    {
                        role: 'user',
                        content: userMessage
                    }
                ],
                temperature: 0.7,
                max_tokens: 150
            })
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        const content = data.choices[0].message.content;
        
        // Remove typing indicator
        elements.messagesContainer.removeChild(elements.messagesContainer.lastChild);
        
        // Add AI response
        addMessageToChat('ai', content);
        
    } catch (error) {
        console.error('Failed to get AI response:', error);
        
        // Remove typing indicator
        elements.messagesContainer.removeChild(elements.messagesContainer.lastChild);
        
        // Add error message
        addMessageToChat('ai', "I'm having trouble connecting right now. Please try again later or check your internet connection.");
    }
}

function getOfflineAIResponse(message) {
    // Simple offline responses based on keywords
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('rule') || lowerMessage.includes('how to play')) {
        return "In this game, you'll answer multiple-choice questions about sports. The faster you answer correctly, the more points you'll earn!";
    } else if (lowerMessage.includes('hint') || lowerMessage.includes('help')) {
        return "I'm not allowed to give hints during the game, but I encourage you to think carefully about each question!";
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        return "Hello there! I'm your Sports Trivia Assistant. How can I help you today?";
    } else if (lowerMessage.includes('thank')) {
        return "You're welcome! Enjoy the game!";
    } else {
        return "I can't provide a specific answer right now as I'm in offline mode. Please check your internet connection.";
    }
}

// Voice Input
function startVoiceInput() {
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        addMessageToChat('ai', "Sorry, your browser doesn't support voice input. Try using a modern browser like Chrome.");
        return;
    }
    
    // Create speech recognition object
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    // Show recording indicator
    elements.voiceInputBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
    elements.voiceInputBtn.classList.add('recording');
    addMessageToChat('ai', "Listening... Speak now.");
    
    recognition.start();
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        elements.chatInput.value = transcript;
    };
    
    recognition.onend = () => {
        // Remove recording indicator
        elements.voiceInputBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        elements.voiceInputBtn.classList.remove('recording');
        
        // Remove listening message
        elements.messagesContainer.removeChild(elements.messagesContainer.lastChild);
        
        // If text was recognized, send it
        if (elements.chatInput.value.trim()) {
            sendMessage();
        }
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        elements.voiceInputBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        elements.voiceInputBtn.classList.remove('recording');
        
        // Remove listening message
        elements.messagesContainer.removeChild(elements.messagesContainer.lastChild);
        
        // Show error message
        addMessageToChat('ai', "I couldn't hear you. Please try again or type your message.");
    };
}

// Connection Status
function updateConnectionStatus() {
    if (navigator.onLine) {
        elements.statusIndicator.classList.remove('offline');
        elements.statusIndicator.classList.add('online');
        elements.statusText.textContent = 'Bot is Online';
    } else {
        elements.statusIndicator.classList.remove('online');
        elements.statusIndicator.classList.add('offline');
        elements.statusText.textContent = 'Bot is Offline';
    }
}

function showOfflineMessage() {
    // Show a message when API requests fail due to being offline
    addMessageToChat('ai', "You appear to be offline. I'll use pre-loaded questions, but functionality will be limited until your connection is restored.");
}

// Helper Functions
function getCategoryIcon(category) {
    // If category is undefined or empty, return a default icon
    if (!category) {
        return 'trophy';
    }
    
    const icons = {
        football: 'football-ball',
        basketball: 'basketball-ball',
        soccer: 'futbol',
        tennis: 'table-tennis',
        golf: 'golf-ball',
        baseball: 'baseball-ball',
        hockey: 'hockey-puck',
        cricket: 'cricket',
        racing: 'flag-checkered',
        boxing: 'fist-raised',
        swimming: 'swimmer',
        olympics: 'ring'
    };
    
    return icons[category] || 'trophy';
}

// Event Listeners
function initEventListeners() {
    // Navigation
    elements.startPlayingBtn.addEventListener('click', () => {
        navigateTo(elements.gameCategoriesSection);
    });
    
    // Game card selection
    elements.gameCards.forEach(card => {
        card.addEventListener('click', () => {
            selectCategory(card.dataset.category);
        });
    });
    
    // Configuration
    elements.questionCountSlider.addEventListener('input', updateConfigDisplay);
    elements.questionTimeSlider.addEventListener('input', updateConfigDisplay);
    elements.pointsPerQuestionSlider.addEventListener('input', updateConfigDisplay);
    elements.negativeMarkingSlider.addEventListener('input', updateConfigDisplay);
    
    elements.difficultyBtns.forEach(btn => {
        btn.addEventListener('click', () => setDifficulty(btn.dataset.difficulty));
    });
    
    elements.startGameBtn.addEventListener('click', startGame);
    
    // Fix close button event handlers
    elements.closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            console.log('Close modal button clicked');
            hideConfigModal();
            hideEndGameConfirmation();
        });
    });
    
    // Add specific handler for end confirmation close button
    const closeEndConfirmBtn = document.getElementById('close-end-confirm');
    if (closeEndConfirmBtn) {
        closeEndConfirmBtn.addEventListener('click', hideEndGameConfirmation);
    }
    
    // End game
    elements.endGameBtn.addEventListener('click', showEndGameConfirmation);
    elements.confirmEndBtn.addEventListener('click', () => {
        hideEndGameConfirmation();
        endGame();
    });
    elements.continueGameBtn.addEventListener('click', hideEndGameConfirmation);
    
    // Results actions
    elements.tryAgainBtn.addEventListener('click', () => {
        // Restart with same questions
        gameState.currentQuestion = 0;
        gameState.score = 0;
        gameState.rawScore = 0;
        gameState.penaltyScore = 0;
        gameState.correctAnswers = 0;
        gameState.wrongAnswers = 0;
        gameState.skippedQuestions = 0;
        gameState.questionTimes = [];
        gameState.isGameActive = true;
        gameState.isGameOver = false;
        gameState.securityWarnings = 0;
        gameState.lastFocusTime = Date.now();
        gameState.forcedEnd = false;
        
        // Enable fullscreen mode
        requestFullscreen(document.documentElement);
        
        // Enable test security features
        enableTestSecurity();
        
        navigateTo(elements.gameSection);
        showQuestion();
    });
    
    elements.newGameBtn.addEventListener('click', () => {
        // Redirect to game categories section when "New Game" is clicked
        navigateTo(elements.gameCategoriesSection);
        // Reset game state
        gameState.currentCategory = '';
        gameState.isGameActive = false;
        gameState.isGameOver = false;
    });
    
    elements.backToHomeBtn.addEventListener('click', () => {
        navigateTo(elements.gameCategoriesSection);
    });
    
    // Theme toggle
    elements.themeToggle.addEventListener('change', toggleTheme);
    
    // AI Assistant - these are now handled in initAIAssistant()
    elements.sendMessageBtn.addEventListener('click', sendMessage);
    elements.chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    elements.voiceInputBtn.addEventListener('click', startVoiceInput);
    
    // Connection status
    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);
    
    // Skip question button
    elements.skipQuestionBtn.addEventListener('click', skipQuestion);
}

// Test Security - Window/Tab Focus Management
function handleFocusChange() {
    if (!gameState.isGameActive) return;
    
    console.log('Visibility change detected:', document.visibilityState);
    
    // Check if we're in a test and focus was lost
    if (document.hidden || document.visibilityState === 'hidden') {
        console.log('Document hidden - tab or window change detected');
        
        // Pause the timer immediately
        clearInterval(gameState.timerInterval);
        
        // This is most likely a tab change, so let's count it as TAB_ACCESS
        handleSecurityViolation('Tab switch detected', 'TAB_ACCESS');
        
        // When visibility returns, show a notification
        document.addEventListener('visibilitychange', function onVisibilityReturn() {
            if (!document.hidden && document.visibilityState === 'visible') {
                // Remove this one-time listener
                document.removeEventListener('visibilitychange', onVisibilityReturn);
                
                // Show warning message
                showNotification("Tab switching detected! This counts as a security violation.", "error", 3000);
            }
        });
    }
}

function handleWindowBlur() {
    if (!gameState.isGameActive) return;
    
    console.log('Window blur detected');
    
    if (gameState.testSecurity.preventTabSwitch) {
        const now = Date.now();
        
        // Prevent duplicate warnings (sometimes blur events fire rapidly)
        if (gameState.lastFocusTime && (now - gameState.lastFocusTime < 500)) {
            console.log('Ignoring duplicate blur event');
            return;
        }
        
        gameState.lastFocusTime = now;
        console.log('Window focus lost - handling security violation');
        
        // Pause the timer immediately
        clearInterval(gameState.timerInterval);
        
        // Check if the mouse position is near the window edges (likely taskbar click)
        const mouseY = gameState.lastMouseY || 0;
        const windowHeight = window.innerHeight;
        const isTaskbarClick = (mouseY >= windowHeight - 5);
        
        if (isTaskbarClick) {
            // This is likely a taskbar/window bar click
            handleSecurityViolation('Task bar access attempted', 'TASK_BAR_ACCESS');
            showNotification("Task bar access is not allowed during the test", "error", 3000);
        } else {
            // Generic focus loss
            handleSecurityViolation('Window focus lost', 'FOCUS_LOSS');
        }
    }
}

function handleKeyboardShortcuts(e) {
    if (!gameState.isGameActive) return;
    
    console.log('Key detected in active game:', e.key, 'Alt:', e.altKey, 'Ctrl:', e.ctrlKey);
    
    // Detect tab opening/switching attempts
    const tabAccessKeys = [
        (e.ctrlKey && e.key === 't'),           // Ctrl+T (new tab)
        (e.ctrlKey && e.key === 'n'),           // Ctrl+N (new window)
        (e.ctrlKey && e.key === 'w'),           // Ctrl+W (close tab)
        (e.ctrlKey && e.key === 'Tab'),         // Ctrl+Tab (next tab)
        (e.ctrlKey && e.shiftKey && e.key === 'Tab'),  // Ctrl+Shift+Tab (previous tab)
        (e.altKey && e.key === 'Tab'),           // Alt+Tab (window switching)
        (e.altKey && e.key === '1'),            // Alt+1-9 (switch tabs in some browsers)
        (e.altKey && e.key === '2'),
        (e.altKey && e.key === '3'),
        (e.altKey && e.key === '4'),
        (e.altKey && e.key === '5'),
        (e.altKey && e.key === '6'),
        (e.altKey && e.key === '7'),
        (e.altKey && e.key === '8'),
        (e.altKey && e.key === '9')
    ];
    
    if (tabAccessKeys.includes(true)) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Blocked tab access attempt:', e.key);
        handleSecurityViolation('Browser tab access attempt via keyboard: ' + e.key, 'TAB_ACCESS');
        showNotification("Opening or switching tabs is not allowed during the test", "error", 3000);
        return false;
    }
    
    // Detect taskbar access attempts
    const taskbarAccessKeys = [
        e.key === 'Meta',                        // Windows key
        e.key === 'OS',                          // Windows key (alternative)
        (e.ctrlKey && e.key === 'Escape'),       // Ctrl+Esc (Start menu)
        e.key === 'Apps',                        // Context menu key
        (e.ctrlKey && e.altKey && e.key === 'Delete') // Ctrl+Alt+Del
    ];
    
    if (taskbarAccessKeys.includes(true)) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Blocked taskbar access attempt:', e.key);
        handleSecurityViolation('Task bar access via keyboard: ' + e.key, 'TASK_BAR_ACCESS');
        showNotification("Task bar access is not allowed during the test", "error", 3000);
        return false;
    }
    
    // Block clipboard operations (Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z, Win+V)
    const clipboardShortcuts = ['c', 'v', 'x', 'z'];
    if ((e.ctrlKey && clipboardShortcuts.includes(e.key.toLowerCase())) || 
        (e.key === 'v' && (e.metaKey || e.key === 'Meta'))) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Blocked clipboard operation:', e.key);
        showNotification("Copy/paste operations are disabled during the test", "warning", 2000);
        return false;
    }
    
    // Allow only specified keys: ESC, Enter, Space, Shift, and Ctrl
    const allowedKeys = ['Escape', 'Enter', ' ', 'Shift', 'Control'];
    
    // If key is not in the allowed list, prevent it
    if (!allowedKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Blocked key:', e.key);
        showNotification(`Key "${e.key}" is disabled during the test`, "warning");
        return false;
    }
}

function preventCopyPaste(e) {
    if (gameState.isGameActive) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Blocked copy/paste action:', e.type);
        showNotification("Copy and paste functions are disabled during the test", "warning", 2000);
        return false;
    }
}

function handleFocusLost(reason) {
    handleSecurityViolation(reason, 'FOCUS_LOSS');
}

// Enable/Disable Test Security
function enableTestSecurity() {
    // Add event listeners for focus detection
    document.addEventListener('visibilitychange', handleFocusChange);
    window.addEventListener('blur', handleWindowBlur);
    
    // Track mouse position to detect taskbar clicks
    document.addEventListener('mousemove', function(e) {
        gameState.lastMouseX = e.clientX;
        gameState.lastMouseY = e.clientY;
    }, { passive: true });
    
    // Add storage event listener to detect cross-tab communication
    window.addEventListener('storage', function(e) {
        if (gameState.isGameActive) {
            console.log('Storage event detected - possible tab communication');
            handleSecurityViolation('Tab communication attempt', 'TAB_ACCESS');
            showNotification("Tab communication detected! This counts as a security violation.", "error", 3000);
        }
    });
    
    // Add unload event listener to detect tab closing attempts
    window.addEventListener('beforeunload', function(e) {
        if (gameState.isGameActive) {
            // Cancel the event and show confirmation dialog
            e.preventDefault();
            // Chrome requires returnValue to be set
            e.returnValue = '';
            
            // Log and count as warning
            handleSecurityViolation('Tab close attempt', 'TAB_ACCESS');
            showNotification("Tab closing attempt detected!", "error", 3000);
            
            return 'Are you sure you want to leave the test? This will be recorded as a violation.';
        }
    });
    
    // Add keydown listener with capture phase for highest priority
    document.addEventListener('keydown', handleKeyboardShortcuts, { capture: true, passive: false });
    document.addEventListener('keyup', handleKeyboardShortcuts, { capture: true, passive: false });
    document.addEventListener('keypress', handleKeyboardShortcuts, { capture: true, passive: false });
    
    // Prevent copy/paste via all possible methods
    document.addEventListener('copy', preventCopyPaste, { capture: true });
    document.addEventListener('paste', preventCopyPaste, { capture: true });
    document.addEventListener('cut', preventCopyPaste, { capture: true });
    document.addEventListener('beforecopy', preventCopyPaste, { capture: true });
    document.addEventListener('beforecut', preventCopyPaste, { capture: true });
    document.addEventListener('beforepaste', preventCopyPaste, { capture: true });
    document.addEventListener('contextmenu', preventCopyPaste, { capture: true });
    
    // Also prevent clipboard API usage
    document.addEventListener('clipboard', preventCopyPaste, { capture: true });
    
    // Add specific handler for paste event on windows
    window.addEventListener('paste', preventCopyPaste, { capture: true });
    
    // Disable text selection in the game section
    elements.gameSection.style.userSelect = 'none';
    elements.gameSection.style.webkitUserSelect = 'none';
    elements.gameSection.style.msUserSelect = 'none';
    elements.gameSection.style.mozUserSelect = 'none';
    
    console.log("Security features enabled - keyboard locked except for allowed keys");
}

function disableTestSecurity() {
    // Remove event listeners
    document.removeEventListener('visibilitychange', handleFocusChange);
    window.removeEventListener('blur', handleWindowBlur);
    
    // Store the mousemove handler for removal
    const mouseMoveHandler = function(e) {
        gameState.lastMouseX = e.clientX;
        gameState.lastMouseY = e.clientY;
    };
    document.removeEventListener('mousemove', mouseMoveHandler, { passive: true });
    
    // Remove tab-related event listeners
    window.removeEventListener('storage', function(e) {
        if (gameState.isGameActive) {
            console.log('Storage event detected - possible tab communication');
            handleSecurityViolation('Tab communication attempt', 'TAB_ACCESS');
        }
    });
    
    window.removeEventListener('beforeunload', function(e) {
        if (gameState.isGameActive) {
            e.preventDefault();
            e.returnValue = '';
            handleSecurityViolation('Tab close attempt', 'TAB_ACCESS');
            return 'Are you sure you want to leave the test? This will be recorded as a violation.';
        }
    });
    
    // Remove all keyboard event listeners
    document.removeEventListener('keydown', handleKeyboardShortcuts, { capture: true, passive: false });
    document.removeEventListener('keyup', handleKeyboardShortcuts, { capture: true, passive: false });
    document.removeEventListener('keypress', handleKeyboardShortcuts, { capture: true, passive: false });
    
    // Re-enable copy/paste
    document.removeEventListener('copy', preventCopyPaste, { capture: true });
    document.removeEventListener('paste', preventCopyPaste, { capture: true });
    document.removeEventListener('cut', preventCopyPaste, { capture: true });
    document.removeEventListener('beforecopy', preventCopyPaste, { capture: true });
    document.removeEventListener('beforecut', preventCopyPaste, { capture: true });
    document.removeEventListener('beforepaste', preventCopyPaste, { capture: true });
    document.removeEventListener('contextmenu', preventCopyPaste, { capture: true });
    document.removeEventListener('clipboard', preventCopyPaste, { capture: true });
    window.removeEventListener('paste', preventCopyPaste, { capture: true });
    
    // Re-enable text selection
    elements.gameSection.style.userSelect = '';
    elements.gameSection.style.webkitUserSelect = '';
    elements.gameSection.style.msUserSelect = '';
    elements.gameSection.style.mozUserSelect = '';
    
    console.log("Security features disabled - keyboard unlocked");
}

// Initialize the event listeners for security
function initSecurityDetection() {
    // The actual event listeners will be added when the test starts
    console.log("Security detection initialized and ready");
    
    // Initialize console protection - continuously clear the console
    initConsoleProtection();
}

// Console protection to prevent console usage
function initConsoleProtection() {
    // Clear console immediately
    console.clear();
    
    // Store the original console methods
    const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info,
        debug: console.debug,
        clear: console.clear
    };
    
    // Override console.clear to prevent users from clearing our warning
    console.clear = function() {
        originalConsole.clear();
        showConsoleWarning();
    };
    
    // Function to show warning in console
    function showConsoleWarning() {
        originalConsole.clear();
        originalConsole.error("%c⚠️ SECURITY ALERT: Console access detected and logged", "color: red; font-size: 20px; font-weight: bold; text-shadow: 1px 1px 2px black;");
        originalConsole.error("%c⛔ Console activity is not allowed and will be reported", "color: red; font-size: 16px;");
        originalConsole.error("%c🔒 This browser session is being monitored for security violations", "color: red; font-size: 16px;");
    }
    
    // Show warning message immediately
    showConsoleWarning();
    
    // Create a recurring timer to clear console continuously
    const clearConsoleInterval = setInterval(showConsoleWarning, 100);
    
    // Detect DevTools opening via various methods
    
    // 1. Detect via console.log timing difference
    let lastCheck = Date.now();
    const checkDevTools = function() {
        const now = Date.now();
        const threshold = 150; // Higher threshold indicates likely dev tools open
        
        // When dev tools are open, the elapsed time is typically much higher
        if (now - lastCheck > threshold) {
            showConsoleWarning();
            
            // Show notification to user
            if (typeof showNotification === 'function') {
                showNotification("Console access detected! This activity is logged.", "error", 3000);
            }
        }
        
        lastCheck = now;
        setTimeout(checkDevTools, 100);
    };
    checkDevTools();
    
    // 2. Detect DevTools via window sizing
    const originalWidth = window.outerWidth - window.innerWidth;
    const originalHeight = window.outerHeight - window.innerHeight;
    
    window.addEventListener('resize', function() {
        // When dev tools are open, the difference changes significantly
        const widthDiff = window.outerWidth - window.innerWidth;
        const heightDiff = window.outerHeight - window.innerHeight;
        
        if (widthDiff > originalWidth + 100 || heightDiff > originalHeight + 100) {
            showConsoleWarning();
            
            // Show notification to user
            if (typeof showNotification === 'function') {
                showNotification("Developer tools detected! This activity is logged.", "error", 3000);
            }
        }
    });
    
    // 3. Detect right-click and prevent context menu
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showConsoleWarning();
        
        // Show notification to user
        if (typeof showNotification === 'function') {
            showNotification("Right-click is disabled for security reasons", "warning", 2000);
        }
        
        return false;
    });
    
    // 4. Detect F12 key
    document.addEventListener('keydown', function(e) {
        // F12 key
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
            e.preventDefault();
            showConsoleWarning();
            
            // Show notification to user
            if (typeof showNotification === 'function') {
                showNotification("Developer tools access attempted! This activity is logged.", "error", 3000);
            }
            
            return false;
        }
    });
}

// Initialization
function init() {
    // Initialize default game state values
    gameState.difficulty = gameState.difficulty || 'easy';
    gameState.currentCategory = gameState.currentCategory || '';
    gameState.selectedCategory = gameState.selectedCategory || '';
    
    // Initialize the UI
    initTheme();
    updateConfigDisplay();
    updateConnectionStatus();
    initEventListeners();
    initAIAssistant();
    initFullscreenChangeDetection();
    initSecurityDetection(); // Initialize security detection
    addNotificationStyles();
    
    // Background animation
    initBackgroundAnimation();
    
    console.log("Application initialized with gameState:", {
        difficulty: gameState.difficulty,
        category: gameState.currentCategory
    });
}

// Background Animation
function initBackgroundAnimation() {
    const canvas = document.createElement('canvas');
    canvas.classList.add('background-canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '-1';
    canvas.style.opacity = '0.3';
    document.body.prepend(canvas);
    
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    // Create particles
    const particles = [];
    function createParticles() {
        particles.length = 0;
        const particleCount = Math.min(Math.floor(window.innerWidth / 10), 100);
        
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                color: getParticleColor()
            });
        }
    }
    
    function getParticleColor() {
        const isDark = document.body.classList.contains('dark-mode');
        if (isDark) {
            return `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.1})`;
        } else {
            return `rgba(0, 0, 100, ${Math.random() * 0.3 + 0.1})`;
        }
    }
    
    function updateParticleColors() {
        particles.forEach(p => {
            p.color = getParticleColor();
        });
    }
    
    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw particles
        particles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;
            
            // Wrap around edges
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
        });
        
        // Draw connections between nearby particles
        particles.forEach((p1, i) => {
            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const distance = Math.sqrt(
                    Math.pow(p1.x - p2.x, 2) + 
                    Math.pow(p1.y - p2.y, 2)
                );
                
                if (distance < 100) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(150, 150, 150, ${0.1 * (1 - distance / 100)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        });
        
        requestAnimationFrame(animate);
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
        resizeCanvas();
        createParticles();
    });
    
    // Update particles when theme changes
    elements.themeToggle.addEventListener('change', updateParticleColors);
    
    // Initialize and start animation
    resizeCanvas();
    createParticles();
    animate();
}

// Skip Question functionality
function skipQuestion() {
    // Prevent skipping if game is not active or already answered
    if (!gameState.isGameActive || gameState.selectedAnswer !== null) return;
    
    // Clear timer and mark as skipped
    clearInterval(gameState.timerInterval);
    gameState.skippedQuestions++;
    
    // Record time spent as full time (penalize for skipping)
    const timeSpent = gameState.questionTime;
    gameState.questionTimes.push(timeSpent);
    
    // Save skipped question data
    const currentQ = gameState.questions[gameState.currentQuestion];
    gameState.userAnswers[gameState.currentQuestion] = {
        question: currentQ.question,
        options: currentQ.options,
        correctAnswer: currentQ.correctAnswer,
        userAnswer: "Skipped",
        isCorrect: false,
        timeSpent: timeSpent,
        hasViolations: gameState.questionViolations[gameState.currentQuestion] ? true : false
    };
    
    // Show correct answer before moving on
    showCorrectAnswer();
    
    // Skipped questions get 0 marks (not negative)
    // Only track penalty if negative marking is enabled (for reporting purposes)
    if (gameState.negativeMarking > 0) {
        // Record the potential penalty but don't apply it to the score
        const potentialPenalty = gameState.pointsPerQuestion * (gameState.negativeMarking / 6);
        gameState.penaltyScore += potentialPenalty;
        
        // Display the current score (no change for skipping)
        elements.currentScoreElement.textContent = gameState.score.toFixed(1);
    }
    
    // Move to next question after a shorter delay
    setTimeout(() => {
        moveToNextQuestion();
    }, 1500);
}

// Add text animation for hero section - simplified to prevent overflow
function animateHeroText() {
    const heroText = document.getElementById('animated-hero-text');
    if (!heroText) return;
    
    // Reset any previous animations
    heroText.innerHTML = heroText.textContent;
    
    // Make sure text is visible and contained
    heroText.style.opacity = '1';
    heroText.style.width = 'auto';
    heroText.style.maxWidth = '100%';
    
    // Add the shine effect element
    const shineElement = document.createElement('div');
    shineElement.classList.add('shine-effect');
    heroText.appendChild(shineElement);
}

// Global resume test function accessible from anywhere
window.resumeTest = function() {
    console.log("Global resume test function called");
    
    // Remove any security overlays
    const securityOverlay = document.querySelector('.security-warning-overlay');
    if (securityOverlay) {
        securityOverlay.remove();
        console.log("Removed security warning overlay");
    }
    
    // Request fullscreen
    try {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
    } catch (err) {
        console.error("Fullscreen request failed:", err);
    }
    
    // Start the timer after a delay
    setTimeout(function() {
        if (typeof startTimer === 'function') {
            startTimer();
            console.log("Timer restarted");
        } else {
            console.error("startTimer function not found");
        }
    }, 500);
    
    return false; // Prevent default behavior
};

// Call the animation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if Font Awesome is loaded
    if (typeof FontAwesome === 'undefined') {
        // Add Font Awesome script if not present
        const fontAwesomeScript = document.createElement('script');
        fontAwesomeScript.src = 'https://kit.fontawesome.com/a076d05399.js';
        fontAwesomeScript.crossOrigin = 'anonymous';
        document.head.appendChild(fontAwesomeScript);
    }
    
    // Initialize the game
    init();
    
    // Handle responsive layout adjustments
    window.addEventListener('resize', handleResponsiveLayout);
    handleResponsiveLayout();
    
    // Animate hero text
    animateHeroText();
});

// Responsive layout handler
function handleResponsiveLayout() {
    const width = window.innerWidth;
    const chartsContainer = document.querySelector('.charts-container');
    
    if (!chartsContainer) return; // Guard against null
    
    if (width < 768) {
        chartsContainer.style.gridTemplateColumns = '1fr';
        if (window.answersChart) {
            window.answersChart.options.plugins.legend.position = 'top';
            window.answersChart.update();
        }
    } else {
        chartsContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
        if (window.answersChart) {
            window.answersChart.options.plugins.legend.position = 'bottom';
            window.answersChart.update();
        }
    }
    
    // Fix any unwanted scrolling
    document.body.style.height = '100%';
    document.documentElement.style.height = '100%';
}

// Fullscreen helper functions
function requestFullscreen(element) {
    try {
        if (element.requestFullscreen) {
            element.requestFullscreen().catch(err => {
                console.log('Error attempting to enable fullscreen:', err);
                // Try alternative approach 
                const button = document.createElement('button');
                button.textContent = "Return to Fullscreen";
                button.style.position = "fixed";
                button.style.top = "50%";
                button.style.left = "50%";
                button.style.transform = "translate(-50%, -50%)";
                button.style.zIndex = "10000";
                button.style.padding = "15px 30px";
                button.style.background = "#4CAF50";
                button.style.color = "white";
                button.style.border = "none";
                button.style.borderRadius = "8px";
                button.style.cursor = "pointer";
                button.style.fontSize = "16px";
                button.style.fontWeight = "bold";
                
                button.onclick = function() {
                    element.requestFullscreen().catch(console.error);
                    this.remove();
                };
                
                document.body.appendChild(button);
                setTimeout(() => {
                    button.remove();
                }, 3000);
            });
        } else if (element.mozRequestFullScreen) { /* Firefox */
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
            element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        } else if (element.msRequestFullscreen) { /* IE/Edge */
            element.msRequestFullscreen();
        }
    } catch (e) {
        console.error("Fullscreen request failed:", e);
    }
}

function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => {
            console.log('Error attempting to exit fullscreen:', err);
        });
    } else if (document.mozCancelFullScreen) { /* Firefox */
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) { /* Chrome, Safari & Opera */
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE/Edge */
        document.msExitFullscreen();
    }
}

// Create notification system for showing popups
function showNotification(message, type = 'info', duration = 3000) {
    // Create notification element if it doesn't exist
    let notificationContainer = document.querySelector('.notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<p>${message}</p>`;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto remove after duration
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, duration);
    
    return notification;
}

// Fullscreen management
function handleFullscreenChange() {
    console.log('Fullscreen change detected');
    
    // Check if we've exited fullscreen during an active game
    if (gameState.isGameActive && 
        !document.fullscreenElement && 
        !document.webkitFullscreenElement && 
        !document.mozFullScreenElement) {
        
        console.log('Exited fullscreen during active game - security violation');
        
        // Pause the timer immediately
        clearInterval(gameState.timerInterval);
        
        // Handle the security violation
        handleSecurityViolation('Exited fullscreen mode', 'FULLSCREEN_EXIT');
    }
}

function initFullscreenChangeDetection() {
    // Add event listeners for fullscreen changes
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    
    console.log('Fullscreen change detection initialized');
}

// Add notification container styles to document
function addNotificationStyles() {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        .notification-container {
            position: fixed;
            top: 70px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10000;
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            max-width: 500px;
            pointer-events: none;
        }
        
        .notification {
            padding: 12px 20px;
            margin-bottom: 10px;
            border-radius: 8px;
            background: #333;
            color: white;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            transform: translateY(-20px);
            opacity: 0;
            transition: transform 0.3s ease, opacity 0.3s ease;
            width: 100%;
            pointer-events: auto;
        }
        
        .notification.show {
            transform: translateY(0);
            opacity: 1;
        }
        
        .notification.info {
            background: #2196F3;
        }
        
        .notification.warning {
            background: #FF9800;
        }
        
        .notification.error {
            background: #F44336;
        }
        
        .notification.success {
            background: #4CAF50;
        }
        
        .notification p {
            margin: 0;
            font-weight: 500;
        }
    `;
    document.head.appendChild(styleEl);
}

// Create enhanced warning handler function
function handleSecurityViolation(reason, violationType) {
    // Pause the timer
    clearInterval(gameState.timerInterval);
    
    // Increment warning counter
    gameState.securityWarnings++;
    
    // Track which question had the violation
    const currentQuestionIndex = gameState.currentQuestion;
    
    // Save violation data
    const violation = {
        type: violationType,
        reason: reason,
        timestamp: new Date().toLocaleTimeString(),
        questionIndex: currentQuestionIndex,
        questionText: gameState.questions[currentQuestionIndex]?.question || "Unknown"
    };
    
    // Store in violations array
    if (!gameState.securityViolations) {
        gameState.securityViolations = [];
    }
    gameState.securityViolations.push(violation);
    
    // Mark this question as having a violation
    if (!gameState.questionViolations) {
        gameState.questionViolations = {};
    }
    if (!gameState.questionViolations[currentQuestionIndex]) {
        gameState.questionViolations[currentQuestionIndex] = [];
    }
    gameState.questionViolations[currentQuestionIndex].push(violation);
    
    // Log the violation for monitoring
    console.log(`Security violation: ${violationType} - ${reason} (${gameState.securityWarnings}/${gameState.MAX_WARNINGS})`);
    
    if (gameState.securityWarnings >= gameState.MAX_WARNINGS) {
        // Auto-submit after max warnings
        showNotification(`MAXIMUM SECURITY VIOLATIONS (${gameState.securityWarnings}/${gameState.MAX_WARNINGS})`, 'error', 5000);
        
        // Create violation overlay with dangerous animations
        const securityOverlay = document.createElement('div');
        securityOverlay.className = 'security-violation-overlay';
        securityOverlay.innerHTML = `
            <div class="violation-content">
                <div class="danger-alert">
                    <div class="alert-icon">
                        <i class="fas fa-exclamation-triangle pulse"></i>
                    </div>
                    <div class="alert-border"></div>
                </div>
                <div class="loader-message">
                    <h2 class="danger-text">YOUR TEST WILL BE FORCIBLY SUBMITTED</h2>
                    <p class="blink">SUSPICIOUS ACTIVITY DETECTED (${gameState.securityWarnings}/${gameState.MAX_WARNINGS})</p>
                    <p class="violation-type">Violation: ${violationType}</p>
                    <p class="violation-reason">Reason: ${reason}</p>
                </div>
            </div>
        `;
        document.body.appendChild(securityOverlay);
        
        // Add enhanced dangerous animation styles
        const dangerStyles = document.createElement('style');
        dangerStyles.textContent = `
            .security-violation-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.95);
                z-index: 10001;
                display: flex;
                justify-content: center;
                align-items: center;
                backdrop-filter: blur(8px);
                animation: dangerFlash 0.5s ease infinite alternate;
            }
            
            @keyframes dangerFlash {
                0% { background-color: rgba(0, 0, 0, 0.95); }
                100% { background-color: rgba(244, 67, 54, 0.3); }
            }
            
            .violation-content {
                text-align: center;
                color: white;
                padding: 2rem;
                border: 4px solid #f44336;
                border-radius: 10px;
                box-shadow: 0 0 30px #f44336, inset 0 0 30px rgba(244, 67, 54, 0.5);
                animation: borderPulse 2s ease infinite;
                position: relative;
                overflow: hidden;
                background: rgba(0, 0, 0, 0.8);
                max-width: 80%;
            }
            
            @keyframes borderPulse {
                0% { box-shadow: 0 0 30px #f44336, inset 0 0 30px rgba(244, 67, 54, 0.5); }
                50% { box-shadow: 0 0 50px #f44336, inset 0 0 50px rgba(244, 67, 54, 0.8); }
                100% { box-shadow: 0 0 30px #f44336, inset 0 0 30px rgba(244, 67, 54, 0.5); }
            }
            
            .danger-alert {
                margin-bottom: 30px;
                position: relative;
            }
            
            .alert-icon {
                font-size: 5rem;
                color: #f44336;
                margin-bottom: 1rem;
                animation: throb 1.5s ease infinite;
            }
            
            @keyframes throb {
                0% { transform: scale(1); }
                50% { transform: scale(1.3); }
                100% { transform: scale(1); }
            }
            
            .pulse {
                animation: pulse 1s infinite;
            }
            
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.3; }
                100% { opacity: 1; }
            }
            
            .alert-border {
                height: 4px;
                background: linear-gradient(to right, transparent, #f44336, transparent);
                width: 100%;
                margin: 20px 0;
            }
            
            .danger-text {
                font-size: 24px;
                font-weight: bold;
                color: #f44336;
                text-shadow: 0 0 10px rgba(244, 67, 54, 0.7);
                letter-spacing: 2px;
                margin-bottom: 20px;
            }
            
            .blink {
                font-size: 20px;
                font-weight: bold;
                animation: blink 1s linear infinite;
                padding: 5px 10px;
                background-color: rgba(244, 67, 54, 0.2);
                border-radius: 4px;
                display: inline-block;
                margin-bottom: 15px;
            }
            
            @keyframes blink {
                0% { opacity: 0; }
                49% { opacity: 0; }
                50% { opacity: 1; }
                100% { opacity: 1; }
            }
            
            .violation-type, .violation-reason {
                margin: 8px 0;
                font-size: 16px;
                opacity: 0.8;
            }
            
            .violation-type {
                color: #FF9800;
                font-weight: bold;
            }
        `;
        document.head.appendChild(dangerStyles);
        
        // Wait 5 seconds then end game with dramatic count
        let countDown = 5;
        const countElement = document.createElement('div');
        countElement.className = 'countdown';
        countElement.textContent = countDown;
        securityOverlay.querySelector('.violation-content').appendChild(countElement);
        
        // Add countdown style
        dangerStyles.textContent += `
            .countdown {
                position: absolute;
                bottom: 30px;
                right: 30px;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background-color: #f44336;
                color: white;
                font-size: 24px;
                font-weight: bold;
                display: flex;
                justify-content: center;
                align-items: center;
                animation: pulse 1s infinite;
            }
        `;
        
        // Force end the game after countdown
        const countInterval = setInterval(() => {
            countDown--;
            if (countDown <= 0) {
                clearInterval(countInterval);
                // Explicitly force the end game
                console.log("Maximum violations reached - submitting test forcibly");
                gameState.forcedEnd = true;
                endGame(true);
                // Remove overlay after small delay to ensure end game processing completes
                setTimeout(() => {
                    securityOverlay.remove();
                }, 500);
            } else {
                countElement.textContent = countDown;
            }
        }, 1000);
    } else {
        // Show warning based on violation type
        const warningsLeft = gameState.MAX_WARNINGS - gameState.securityWarnings;
        
        // Create warning overlay with different message per violation type
        const overlay = document.createElement('div');
        overlay.className = 'security-warning-overlay';
        
        let warningIcon, warningTitle, warningAction;
        
        // Customize warning based on violation type
        switch(violationType) {
            case 'FULLSCREEN_EXIT':
                warningIcon = 'expand';
                warningTitle = 'Fullscreen Required';
                warningAction = `
                    <button class="resume-test-btn" onclick="window.resumeTest()">RETURN TO FULLSCREEN</button>
                `;
                break;
            case 'FOCUS_LOSS':
                warningIcon = 'eye-slash';
                warningTitle = 'Test Focus Lost';
                warningAction = `
                    <button class="resume-test-btn" onclick="window.resumeTest()">RESUME TEST</button>
                `;
                break;
            case 'KEYBOARD_SHORTCUT':
                warningIcon = 'keyboard';
                warningTitle = 'Prohibited Shortcut Detected';
                warningAction = `
                    <button class="resume-test-btn" onclick="window.resumeTest()">RESUME TEST</button>
                `;
                break;
            default:
                warningIcon = 'exclamation-triangle';
                warningTitle = 'Security Violation';
                warningAction = `
                    <button class="resume-test-btn" onclick="window.resumeTest()">RESUME TEST</button>
                `;
        }
        
        overlay.innerHTML = `
            <div class="security-warning">
                <div class="warning-glow"></div>
                <div class="warning-icon"><i class="fas fa-${warningIcon}"></i></div>
                <h2>${warningTitle}</h2>
                <p>${reason}</p>
                <div class="warning-progress">
                    <div class="warning-bar" style="width:${(gameState.securityWarnings/gameState.MAX_WARNINGS)*100}%"></div>
                </div>
                <p class="warning-count">Warning ${gameState.securityWarnings}/${gameState.MAX_WARNINGS}</p>
                <p class="warning-note">Test will auto-submit after ${warningsLeft} more violations</p>
                <div class="warning-action-container">
                    ${warningAction}
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        
        // Add enhanced warning styles
        const warningStyles = document.createElement('style');
        warningStyles.textContent = `
            .security-warning-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.9);
                z-index: 10000;
                display: flex;
                justify-content: center;
                align-items: center;
                backdrop-filter: blur(5px);
            }
            
            .security-warning {
                background-color: #fff;
                color: #333;
                padding: 2.5rem;
                border-radius: 12px;
                text-align: center;
                max-width: 500px;
                box-shadow: 0 5px 30px rgba(0, 0, 0, 0.5);
                position: relative;
                overflow: hidden;
            }
            
            .warning-glow {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 5px;
                background: linear-gradient(to right, #FF9800, #F44336);
                animation: gradientShift 2s infinite;
            }
            
            @keyframes gradientShift {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
            
            .security-warning .warning-icon {
                font-size: 3.5rem;
                color: #FF9800;
                margin-bottom: 1.5rem;
                text-shadow: 0 0 15px rgba(255, 152, 0, 0.5);
            }
            
            .security-warning h2 {
                margin-bottom: 1rem;
                color: #F44336;
                font-size: 1.8rem;
            }
            
            .security-warning p {
                margin-bottom: 1rem;
                font-size: 1.1rem;
            }
            
            .warning-progress {
                height: 8px;
                background-color: rgba(0,0,0,0.1);
                border-radius: 4px;
                margin: 20px 0;
                overflow: hidden;
            }
            
            .warning-bar {
                height: 100%;
                background: linear-gradient(to right, #4CAF50, #FFC107, #F44336);
                background-size: 200% 100%;
                transition: width 0.5s ease;
            }
            
            .warning-count {
                font-weight: bold;
                color: #333;
            }
            
            .warning-note {
                color: #F44336;
                font-weight: bold;
                margin-bottom: 1.5rem;
            }
            
            .warning-action-container {
                margin: 20px 0 10px;
            }
            
            .resume-test-btn {
                padding: 15px 30px;
                font-size: 16px;
                font-weight: bold;
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s;
                position: relative;
                overflow: hidden;
                letter-spacing: 1px;
                box-shadow: 0 6px 15px rgba(0,0,0,0.2);
                display: inline-block;
                width: auto;
                min-width: 200px;
            }
            
            .resume-test-btn:hover {
                background: #45a049;
                transform: translateY(-3px);
                box-shadow: 0 8px 20px rgba(0,0,0,0.3);
            }
            
            .resume-test-btn:active {
                transform: translateY(1px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            }
            
            .resume-test-btn:before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                transition: 0.5s;
            }
            
            .resume-test-btn:hover:before {
                left: 100%;
            }
        `;
        document.head.appendChild(warningStyles);
        
        // No need for complex event listener setup since we now use direct onclick handlers
        console.log("Security warning initialized with resume button");
    }
}

// Update focus loss handler to use the central violation handler
function handleFocusLost(reason) {
    handleSecurityViolation(reason, 'FOCUS_LOSS');
}

// Update keyboard shortcuts handler to use the central violation handler
function handleKeyboardShortcuts(e) {
    if (!gameState.isGameActive) return;
    
    console.log('Key detected in active game:', e.key, 'Alt:', e.altKey, 'Ctrl:', e.ctrlKey);
    
    // Detect tab opening/switching attempts
    const tabAccessKeys = [
        (e.ctrlKey && e.key === 't'),           // Ctrl+T (new tab)
        (e.ctrlKey && e.key === 'n'),           // Ctrl+N (new window)
        (e.ctrlKey && e.key === 'w'),           // Ctrl+W (close tab)
        (e.ctrlKey && e.key === 'Tab'),         // Ctrl+Tab (next tab)
        (e.ctrlKey && e.shiftKey && e.key === 'Tab'),  // Ctrl+Shift+Tab (previous tab)
        (e.altKey && e.key === 'Tab'),           // Alt+Tab (window switching)
        (e.altKey && e.key === '1'),            // Alt+1-9 (switch tabs in some browsers)
        (e.altKey && e.key === '2'),
        (e.altKey && e.key === '3'),
        (e.altKey && e.key === '4'),
        (e.altKey && e.key === '5'),
        (e.altKey && e.key === '6'),
        (e.altKey && e.key === '7'),
        (e.altKey && e.key === '8'),
        (e.altKey && e.key === '9')
    ];
    
    if (tabAccessKeys.includes(true)) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Blocked tab access attempt:', e.key);
        handleSecurityViolation('Browser tab access attempt via keyboard: ' + e.key, 'TAB_ACCESS');
        showNotification("Opening or switching tabs is not allowed during the test", "error", 3000);
        return false;
    }
    
    // Detect taskbar access attempts
    const taskbarAccessKeys = [
        e.key === 'Meta',                        // Windows key
        e.key === 'OS',                          // Windows key (alternative)
        (e.ctrlKey && e.key === 'Escape'),       // Ctrl+Esc (Start menu)
        e.key === 'Apps',                        // Context menu key
        (e.ctrlKey && e.altKey && e.key === 'Delete') // Ctrl+Alt+Del
    ];
    
    if (taskbarAccessKeys.includes(true)) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Blocked taskbar access attempt:', e.key);
        handleSecurityViolation('Task bar access via keyboard: ' + e.key, 'TASK_BAR_ACCESS');
        showNotification("Task bar access is not allowed during the test", "error", 3000);
        return false;
    }
    
    // Block clipboard operations (Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z, Win+V)
    const clipboardShortcuts = ['c', 'v', 'x', 'z'];
    if ((e.ctrlKey && clipboardShortcuts.includes(e.key.toLowerCase())) || 
        (e.key === 'v' && (e.metaKey || e.key === 'Meta'))) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Blocked clipboard operation:', e.key);
        showNotification("Copy/paste operations are disabled during the test", "warning", 2000);
        return false;
    }
    
    // Allow only specified keys: ESC, Enter, Space, Shift, and Ctrl
    const allowedKeys = ['Escape', 'Enter', ' ', 'Shift', 'Control'];
    
    // If key is not in the allowed list, prevent it
    if (!allowedKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Blocked key:', e.key);
        showNotification(`Key "${e.key}" is disabled during the test`, "warning");
        return false;
    }
}

// Update fullscreen change handler to use the central violation handler

// PDF Generation Functions

// Function to generate PDF for suspicious activities
function generateSuspiciousActivityPDF() {
    // Initialize jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Set document properties
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const lineHeight = 7;
    let yPosition = 20;
    
    // Helper function to add centered text
    const addCenteredText = (text, y, fontSize = 16, isBold = false) => {
        doc.setFontSize(fontSize);
        if (isBold) {
            doc.setFont(undefined, 'bold');
        } else {
            doc.setFont(undefined, 'normal');
        }
        const textWidth = doc.getStringUnitWidth(text) * fontSize / doc.internal.scaleFactor;
        const x = (pageWidth - textWidth) / 2;
        doc.text(text, x, y);
        return y + lineHeight;
    };
    
    // Helper function to add text with wrapping
    const addWrappedText = (text, y, fontSize = 12) => {
        doc.setFontSize(fontSize);
        doc.setFont(undefined, 'normal');
        const textWidth = pageWidth - (2 * margin);
        const splitText = doc.splitTextToSize(text, textWidth);
        doc.text(splitText, margin, y);
        return y + (splitText.length * (fontSize / 3));
    };
    
    // Helper function to check page space and add new page if needed
    const checkPageSpace = (neededSpace) => {
        if (yPosition + neededSpace > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
            return true;
        }
        return false;
    };
    
    // Add report header
    doc.setFillColor(244, 67, 54); // Red color for suspicious
    doc.rect(0, 0, pageWidth, 15, 'F');
    doc.setTextColor(255, 255, 255); // White text
    yPosition = addCenteredText('SUSPICIOUS ACTIVITY REPORT', yPosition, 18, true);
    
    // Add current date
    const currentDate = new Date().toLocaleDateString();
    doc.setTextColor(100, 100, 100);
    yPosition = addCenteredText(`Generated on: ${currentDate}`, yPosition, 10);
    
    yPosition += 10;
    
    // Add user information section
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(14);
    doc.text('User Information', margin, yPosition);
    doc.line(margin, yPosition + 1, pageWidth - margin, yPosition + 1);
    yPosition += 10;
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Category: ${gameState.currentCategory || 'N/A'}`, margin, yPosition);
    yPosition += lineHeight;
    
    const totalSeconds = gameState.questionTimes.reduce((total, time) => total + time, 0);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    doc.text(`Test Duration: ${formattedTime}`, margin, yPosition);
    yPosition += lineHeight;
    doc.text(`Questions Attempted: ${gameState.currentQuestion} of ${gameState.questionCount}`, margin, yPosition);
    yPosition += lineHeight;
    doc.text(`Score: ${gameState.score.toFixed(1)} / ${gameState.questionCount * gameState.pointsPerQuestion}`, margin, yPosition);
    yPosition += lineHeight;
    doc.text(`Security Violations: ${gameState.securityWarnings}`, margin, yPosition);
    
    yPosition += 15;
    
    // Add suspicious activities section
    checkPageSpace(30);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Suspicious Activities Detected', margin, yPosition);
    doc.line(margin, yPosition + 1, pageWidth - margin, yPosition + 1);
    yPosition += 10;
    
    // Collect security violations from the game state
    const violations = gameState.securityViolations || [];
    
    if (violations.length === 0) {
        // Create some example violations if none exist
        const exampleViolations = [
            { type: 'TAB_ACCESS', reason: 'User attempted to switch tabs during the test', timestamp: new Date().toLocaleTimeString(), questionIndex: 0 },
            { type: 'FOCUS_LOSS', reason: 'Window focus was lost', timestamp: new Date().toLocaleTimeString(), questionIndex: 1 },
            { type: 'FULLSCREEN_EXIT', reason: 'User exited fullscreen mode', timestamp: new Date().toLocaleTimeString(), questionIndex: 2 }
        ];
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        
        exampleViolations.forEach((violation, index) => {
            checkPageSpace(20);
            doc.setFont(undefined, 'bold');
            doc.text(`Violation ${index + 1}: ${violation.type}`, margin, yPosition);
            yPosition += lineHeight;
            
            doc.setFont(undefined, 'normal');
            doc.text(`Time: ${violation.timestamp}`, margin + 5, yPosition);
            yPosition += lineHeight;
            
            doc.text(`Reason: ${violation.reason}`, margin + 5, yPosition);
            yPosition += lineHeight;
            
            doc.text(`Question: ${violation.questionIndex + 1}`, margin + 5, yPosition);
            yPosition += lineHeight + 3;
        });
    } else {
        // Use actual violations
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        
        violations.forEach((violation, index) => {
            checkPageSpace(20);
            doc.setFont(undefined, 'bold');
            doc.text(`Violation ${index + 1}: ${violation.type}`, margin, yPosition);
            yPosition += lineHeight;
            
            doc.setFont(undefined, 'normal');
            doc.text(`Time: ${violation.timestamp}`, margin + 5, yPosition);
            yPosition += lineHeight;
            
            doc.text(`Reason: ${violation.reason}`, margin + 5, yPosition);
            yPosition += lineHeight;
            
            doc.text(`Question: ${violation.questionIndex + 1}`, margin + 5, yPosition);
            yPosition += lineHeight + 3;
        });
    }
    
    yPosition += 5;
    
    // Add all questions with highlighting for suspicious ones
    checkPageSpace(30);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Question Details', margin, yPosition);
    doc.line(margin, yPosition + 1, pageWidth - margin, yPosition + 1);
    yPosition += 10;
    
    // Add each question and highlight those with violations
    if (gameState.userAnswers && gameState.userAnswers.length > 0) {
        gameState.userAnswers.forEach((answer, index) => {
            // Check if we need a new page
            checkPageSpace(60);
            
            // Check if this question had violations
            const hasViolations = gameState.questionViolations && gameState.questionViolations[index];
            
            // Question number and text
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            
            // Draw a background for the question - red if it had violations
            if (hasViolations) {
                doc.setFillColor(255, 235, 238); // Light red background
                doc.rect(margin - 3, yPosition - 3, pageWidth - 2 * (margin - 3), 18, 'F');
                
                // Add a red border
                doc.setDrawColor(244, 67, 54); // Red
                doc.setLineWidth(0.5);
                doc.rect(margin - 3, yPosition - 3, pageWidth - 2 * (margin - 3), 18);
                doc.setDrawColor(0, 0, 0); // Reset to black
                doc.setLineWidth(0.1);
            } else {
                doc.setFillColor(240, 240, 240); // Normal gray background
                doc.rect(margin - 3, yPosition - 3, pageWidth - 2 * (margin - 3), 18, 'F');
            }
            
            if (hasViolations) {
                doc.setTextColor(244, 67, 54); // Red text for suspicious questions
                doc.text(`Question ${index + 1}: ${answer.question} [SUSPICIOUS ACTIVITY DETECTED]`, margin, yPosition);
            } else {
                doc.setTextColor(0, 0, 0); // Black text for normal questions
                doc.text(`Question ${index + 1}: ${answer.question}`, margin, yPosition);
            }
            yPosition += lineHeight * 1.5;
            
            // Reset text color
            doc.setTextColor(0, 0, 0);
            
            // Show options
            doc.setFont(undefined, 'normal');
            doc.setFontSize(10);
            
            answer.options.forEach((option, optIndex) => {
                let optionText = `${String.fromCharCode(65 + optIndex)}. ${option}`;
                
                // Highlight correct answer in green
                if (option === answer.correctAnswer) {
                    doc.setTextColor(76, 175, 80); // Green
                    doc.setFont(undefined, 'bold');
                    optionText += ' ✓';
                } 
                // Highlight user's wrong answer in red
                else if (option === answer.userAnswer && !answer.isCorrect) {
                    doc.setTextColor(244, 67, 54); // Red
                    doc.setFont(undefined, 'bold');
                    optionText += ' ✗';
                } else {
                    doc.setTextColor(0, 0, 0); // Black
                    doc.setFont(undefined, 'normal');
                }
                
                doc.text(optionText, margin + 5, yPosition);
                yPosition += lineHeight;
            });
            
            // Reset text color
            doc.setTextColor(0, 0, 0);
            
            // Show user's response
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            
            if (answer.userAnswer === "Skipped") {
                doc.setTextColor(255, 152, 0); // Orange
                doc.text(`Your answer: Skipped`, margin, yPosition);
            } else if (answer.userAnswer === "Time Up - No Answer") {
                doc.setTextColor(255, 152, 0); // Orange
                doc.text(`Your answer: Time Up - No Answer`, margin, yPosition);
            } else {
                if (answer.isCorrect) {
                    doc.setTextColor(76, 175, 80); // Green
                    doc.text(`Your answer: ${answer.userAnswer} (Correct)`, margin, yPosition);
                } else {
                    doc.setTextColor(244, 67, 54); // Red
                    doc.text(`Your answer: ${answer.userAnswer} (Incorrect)`, margin, yPosition);
                }
            }
            yPosition += lineHeight;
            
            // Show time spent
            doc.setTextColor(100, 100, 100);
            doc.text(`Time spent: ${answer.timeSpent} seconds`, margin, yPosition);
            yPosition += lineHeight;
            
            // If the question had violations, list them
            if (hasViolations) {
                doc.setTextColor(244, 67, 54); // Red
                doc.setFont(undefined, 'bold');
                doc.text(`Suspicious activity on this question:`, margin, yPosition);
                yPosition += lineHeight;
                
                doc.setFont(undefined, 'normal');
                const questionViolations = gameState.questionViolations[index];
                questionViolations.forEach((violation, vIndex) => {
                    doc.text(`${vIndex + 1}. ${violation.type}: ${violation.reason}`, margin + 10, yPosition);
                    yPosition += lineHeight;
                });
            }
            
            // Add some space between questions
            yPosition += 5;
            
            // Add a separator line
            doc.setDrawColor(200, 200, 200);
            doc.line(margin, yPosition, pageWidth - margin, yPosition);
            yPosition += 8;
        });
    } else {
        doc.setFontSize(12);
        doc.setFont(undefined, 'italic');
        doc.text("No question details available.", margin, yPosition);
        yPosition += lineHeight * 2;
    }
    
    yPosition += 5;
    
    // Add explanation and recommendations
    checkPageSpace(30);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Recommendations', margin, yPosition);
    doc.line(margin, yPosition + 1, pageWidth - margin, yPosition + 1);
    yPosition += 10;
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(12);
    yPosition = addWrappedText('To ensure test integrity, please adhere to the following guidelines during future tests:', yPosition);
    yPosition += 5;
    
    const recommendations = [
        'Remain in full-screen mode for the entire duration of the test',
        'Do not switch tabs or windows during the test',
        'Disable notifications and other distractions',
        'Ensure a stable internet connection',
        'Complete the test in a single session without interruptions'
    ];
    
    recommendations.forEach(rec => {
        doc.text(`• ${rec}`, margin + 5, yPosition);
        yPosition += lineHeight;
    });
    
    // Add footer
    const footerPosition = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('This report is generated automatically and is strictly confidential.', margin, footerPosition);
    
    // Save the PDF
    doc.save('suspicious-activity-report.pdf');
}

// Function to generate PDF for fair activity
function generateFairActivityPDF() {
    // Initialize jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Set document properties
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const lineHeight = 7;
    let yPosition = 20;
    
    // Helper function to add centered text
    const addCenteredText = (text, y, fontSize = 16, isBold = false) => {
        doc.setFontSize(fontSize);
        if (isBold) {
            doc.setFont(undefined, 'bold');
        } else {
            doc.setFont(undefined, 'normal');
        }
        const textWidth = doc.getStringUnitWidth(text) * fontSize / doc.internal.scaleFactor;
        const x = (pageWidth - textWidth) / 2;
        doc.text(text, x, y);
        return y + lineHeight;
    };
    
    // Helper function to add text with wrapping
    const addWrappedText = (text, y, fontSize = 12) => {
        doc.setFontSize(fontSize);
        doc.setFont(undefined, 'normal');
        const textWidth = pageWidth - (2 * margin);
        const splitText = doc.splitTextToSize(text, textWidth);
        doc.text(splitText, margin, y);
        return y + (splitText.length * (fontSize / 3));
    };

    // Helper function to check page space and add new page if needed
    const checkPageSpace = (neededSpace) => {
        if (yPosition + neededSpace > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
            return true;
        }
        return false;
    };
    
    // Add report header
    doc.setFillColor(74, 108, 255); // Blue color for fair results
    doc.rect(0, 0, pageWidth, 15, 'F');
    doc.setTextColor(255, 255, 255); // White text
    yPosition = addCenteredText('ACTIVITY REPORT', yPosition, 18, true);
    
    // Add current date
    const currentDate = new Date().toLocaleDateString();
    doc.setTextColor(100, 100, 100);
    yPosition = addCenteredText(`Generated on: ${currentDate}`, yPosition, 10);
    
    yPosition += 10;
    
    // Add user information section
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(14);
    doc.text('Test Information', margin, yPosition);
    doc.line(margin, yPosition + 1, pageWidth - margin, yPosition + 1);
    yPosition += 10;
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Category: ${gameState.currentCategory || 'N/A'}`, margin, yPosition);
    yPosition += lineHeight;
    
    const totalSeconds = gameState.questionTimes.reduce((total, time) => total + time, 0);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    doc.text(`Test Duration: ${formattedTime}`, margin, yPosition);
    yPosition += lineHeight;
    doc.text(`Questions Attempted: ${gameState.currentQuestion} of ${gameState.questionCount}`, margin, yPosition);
    yPosition += lineHeight;
    doc.text(`Score: ${gameState.score.toFixed(1)} / ${gameState.questionCount * gameState.pointsPerQuestion}`, margin, yPosition);
    yPosition += lineHeight;
    
    // Calculate accuracy
    const attemptedQuestions = gameState.correctAnswers + gameState.wrongAnswers;
    const accuracy = attemptedQuestions > 0 
        ? Math.round((gameState.correctAnswers / attemptedQuestions) * 100) 
        : 0;
    
    doc.text(`Accuracy: ${accuracy}%`, margin, yPosition);
    yPosition += lineHeight;
    doc.text(`Correct Answers: ${gameState.correctAnswers}`, margin, yPosition);
    yPosition += lineHeight;
    doc.text(`Incorrect Answers: ${gameState.wrongAnswers}`, margin, yPosition);
    yPosition += lineHeight;
    doc.text(`Skipped Questions: ${gameState.skippedQuestions || 0}`, margin, yPosition);
    
    yPosition += 15;
    
    // Add chart - capture the chart canvas and add to PDF
    checkPageSpace(60);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Performance Summary', margin, yPosition);
    doc.line(margin, yPosition + 1, pageWidth - margin, yPosition + 1);
    yPosition += 10;
    
    // Create chart image from canvas and add to PDF
    if (document.getElementById('answers-chart')) {
        // Promise to handle async chart conversion
        new Promise((resolve) => {
            // Get the canvas element
            const canvas = document.getElementById('answers-chart');
            
            // Convert the canvas to an image
            const chartImage = canvas.toDataURL('image/png');
            
            // Calculate chart dimensions to fit on PDF
            const chartWidth = pageWidth - (2 * margin);
            const chartHeight = 60;
            
            // Add the chart image to the PDF
            doc.addImage(chartImage, 'PNG', margin, yPosition, chartWidth, chartHeight);
            yPosition += chartHeight + 10;
            
            resolve();
        }).then(() => {
            // Continue with the rest of the PDF generation
            addQuestionDetails();
        });
    } else {
        // No chart available, continue with question details
        addQuestionDetails();
    }
    
    // Function to add question details
    function addQuestionDetails() {
        checkPageSpace(30);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Question Details', margin, yPosition);
        doc.line(margin, yPosition + 1, pageWidth - margin, yPosition + 1);
        yPosition += 10;
        
        // Add each question, answer and result
        if (gameState.userAnswers && gameState.userAnswers.length > 0) {
            gameState.userAnswers.forEach((answer, index) => {
                // Check if we need a new page
                checkPageSpace(60);
                
                // Question number and text
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                
                // Draw a background for the question
                doc.setFillColor(240, 240, 240);
                doc.rect(margin - 3, yPosition - 3, pageWidth - 2 * (margin - 3), 18, 'F');
                
                doc.text(`Question ${index + 1}: ${answer.question}`, margin, yPosition);
                yPosition += lineHeight * 1.5;
                
                // Show options
                doc.setFont(undefined, 'normal');
                doc.setFontSize(10);
                
                answer.options.forEach((option, optIndex) => {
                    let optionText = `${String.fromCharCode(65 + optIndex)}. ${option}`;
                    
                    // Highlight correct answer in green
                    if (option === answer.correctAnswer) {
                        doc.setTextColor(76, 175, 80); // Green
                        doc.setFont(undefined, 'bold');
                        optionText += ' ✓';
                    } 
                    // Highlight user's wrong answer in red
                    else if (option === answer.userAnswer && !answer.isCorrect) {
                        doc.setTextColor(244, 67, 54); // Red
                        doc.setFont(undefined, 'bold');
                        optionText += ' ✗';
                    } else {
                        doc.setTextColor(0, 0, 0); // Black
                        doc.setFont(undefined, 'normal');
                    }
                    
                    doc.text(optionText, margin + 5, yPosition);
                    yPosition += lineHeight;
                });
                
                // Reset text color
                doc.setTextColor(0, 0, 0);
                
                // Show user's response
                doc.setFontSize(11);
                doc.setFont(undefined, 'normal');
                
                if (answer.userAnswer === "Skipped") {
                    doc.setTextColor(255, 152, 0); // Orange
                    doc.text(`Your answer: Skipped`, margin, yPosition);
                } else if (answer.userAnswer === "Time Up - No Answer") {
                    doc.setTextColor(255, 152, 0); // Orange
                    doc.text(`Your answer: Time Up - No Answer`, margin, yPosition);
                } else {
                    if (answer.isCorrect) {
                        doc.setTextColor(76, 175, 80); // Green
                        doc.text(`Your answer: ${answer.userAnswer} (Correct)`, margin, yPosition);
                    } else {
                        doc.setTextColor(244, 67, 54); // Red
                        doc.text(`Your answer: ${answer.userAnswer} (Incorrect)`, margin, yPosition);
                    }
                }
                yPosition += lineHeight;
                
                // Show time spent
                doc.setTextColor(100, 100, 100);
                doc.text(`Time spent: ${answer.timeSpent} seconds`, margin, yPosition);
                yPosition += lineHeight;
                
                // Add some space between questions
                yPosition += 5;
                
                // Add a separator line
                doc.setDrawColor(200, 200, 200);
                doc.line(margin, yPosition, pageWidth - margin, yPosition);
                yPosition += 8;
            });
        } else {
            doc.setFontSize(12);
            doc.setFont(undefined, 'italic');
            doc.text("No question details available.", margin, yPosition);
            yPosition += lineHeight * 2;
        }
        
        // Add improvement suggestions
        checkPageSpace(40);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Suggestions for Improvement', margin, yPosition);
        doc.line(margin, yPosition + 1, pageWidth - margin, yPosition + 1);
        yPosition += 10;
        
        // Generate suggestions based on performance
        const suggestions = [];
        
        if (accuracy < 70) {
            suggestions.push('Focus on improving your knowledge of the subject matter through additional study.');
        }
        
        if (gameState.questionTimes.length > 0) {
            const avgTime = totalSeconds / gameState.questionTimes.length;
            if (avgTime > (gameState.questionTime * 0.7)) {
                suggestions.push('Work on improving your response time. Consider practicing with timed quizzes.');
            }
        }
        
        if (gameState.skippedQuestions > 0) {
            suggestions.push('Try to answer all questions. Skipping questions may indicate knowledge gaps in certain areas.');
        }
        
        if (gameState.wrongAnswers > gameState.correctAnswers) {
            suggestions.push('Review the topics where you made mistakes and focus on those areas first.');
        }
        
        // Add default suggestion if none are generated
        if (suggestions.length === 0) {
            suggestions.push('Continue practicing to maintain your knowledge and skills in this area.');
            suggestions.push('Challenge yourself with more difficult questions to further enhance your expertise.');
        }
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        
        suggestions.forEach(sugg => {
            doc.text(`• ${sugg}`, margin + 5, yPosition);
            yPosition += lineHeight * 1.5;
        });
        
        // Add footer
        const footerPosition = doc.internal.pageSize.getHeight() - 20;
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('This report is generated automatically based on your test performance.', margin, footerPosition);
        
        // Save the PDF
        doc.save('activity-report.pdf');
    }
}
