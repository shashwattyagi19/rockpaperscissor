let playerScore = 0;
let cpuScore = 0;
let gameActive = false;
let detectedGesture = null;
let gameInProgress = false;

const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const gestureIndicator = document.getElementById('gesture-indicator');
const startBtn = document.getElementById('start-btn');
const countdownDiv = document.getElementById('countdown');
const resultBadge = document.getElementById('result-badge');
const playerMoveDiv = document.getElementById('player-move');
const computerMoveDiv = document.getElementById('computer-move');
const playerScoreDiv = document.getElementById('player-score');
const cpuScoreDiv = document.getElementById('cpu-score');

const canvasCtx = canvasElement.getContext('2d');

// Initialize MediaPipe Hands
const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

hands.onResults(onResults);

// Setup camera
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480
});

camera.start();

// EXACT LOGIC FROM YOUR PYTHON NOTEBOOK
// Finger tip landmarks indices
const FINGER_TIPS = [4, 8, 12, 16, 20];

function detectGesture(landmarks) {
    if (!landmarks || landmarks.length === 0) return null;

    const hand = landmarks[0];
    const fingers = [];

    // Thumb - Check x-coordinate (left/right)
    if (hand[FINGER_TIPS[0]].x < hand[FINGER_TIPS[0]-1].x) {
        fingers.push(1);
    } else {
        fingers.push(0);
    }

    // Other fingers (Index, Middle, Ring, Pinky) - Check y-coordinate (up/down)
    for (let i = 1; i < 5; i++) {
        if (hand[FINGER_TIPS[i]].y < hand[FINGER_TIPS[i]-2].y) {
            fingers.push(1);
        } else {
            fingers.push(0);
        }
    }

    const total = fingers.reduce((a, b) => a + b, 0);

    // Your exact logic:
    // 0 fingers = Rock
    // 2 fingers = Scissors
    // 5 fingers = Paper
    if (total === 0) {
        return 'rock';
    } else if (total === 2) {
        return 'scissors';
    } else if (total === 5) {
        return 'paper';
    } else {
        return null;
    }
}

function onResults(results) {
    // Clear canvas
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Draw video frame
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        // Draw hand landmarks
        drawingUtils.drawConnectors(
            canvasCtx,
            results.multiHandLandmarks[0],
            Hands.HAND_CONNECTIONS,
            { color: '#00FF00', lineWidth: 5 }
        );
        drawingUtils.drawLandmarks(
            canvasCtx,
            results.multiHandLandmarks[0],
            { color: '#FF0000', lineWidth: 2 }
        );
        
        // Detect gesture using YOUR EXACT LOGIC
        const gesture = detectGesture(results.multiHandLandmarks);
        detectedGesture = gesture;
        
        if (gesture) {
            const gestureEmoji = {
                'rock': '✊ Rock',
                'paper': '✋ Paper',
                'scissors': '✌️ Scissors'
            };
            
            gestureIndicator.textContent = gestureEmoji[gesture];
            gestureIndicator.classList.remove('hidden');
        } else {
            gestureIndicator.classList.add('hidden');
        }
    } else {
        gestureIndicator.classList.add('hidden');
        detectedGesture = null;
    }
}

// Game logic
startBtn.addEventListener('click', startGame);

function startGame() {
    if (!detectedGesture) {
        alert('Please show a hand gesture first!');
        return;
    }
    
    if (gameInProgress) return;
    gameInProgress = true;
    
    gameActive = false;
    startBtn.disabled = true;
    
    // Show countdown (3 seconds like your Python code)
    countdownDiv.classList.remove('hidden');
    let countdown = 3;
    
    const countdownInterval = setInterval(() => {
        if (countdown === 0) {
            clearInterval(countdownInterval);
            countdownDiv.classList.add('hidden');
            playRound();
            startBtn.disabled = false;
            gameInProgress = false;
        } else {
            countdownDiv.textContent = countdown;
            countdown--;
        }
    }, 1000);
}

function playRound() {
    const playerMove = detectedGesture;
    const computerMoves = ['rock', 'paper', 'scissors'];
    const computerMove = computerMoves[Math.floor(Math.random() * 3)];
    
    // Update UI with moves
    updateMoveDisplay(playerMove, computerMove);
    
    // Determine winner using YOUR EXACT LOGIC
    const result = determineWinner(playerMove, computerMove);
    
    // Update scores
    if (result === 'win') {
        playerScore++;
        resultBadge.className = 'result-badge win';
        resultBadge.textContent = '🎉 You Win!';
    } else if (result === 'lose') {
        cpuScore++;
        resultBadge.className = 'result-badge lose';
        resultBadge.textContent = '😢 You Lose!';
    } else {
        resultBadge.className = 'result-badge tie';
        resultBadge.textContent = '🤝 Draw!';
    }
    
    resultBadge.classList.remove('hidden');
    playerScoreDiv.textContent = playerScore;
    cpuScoreDiv.textContent = cpuScore;
    
    // Hide result after 2 seconds
    setTimeout(() => {
        resultBadge.classList.add('hidden');
    }, 2000);
}

function updateMoveDisplay(playerMove, computerMove) {
    const moveEmojis = {
        'rock': '✊',
        'paper': '✋',
        'scissors': '✌️'
    };
    
    playerMoveDiv.textContent = moveEmojis[playerMove];
    computerMoveDiv.textContent = moveEmojis[computerMove];
}

// Your exact win logic from Python
function determineWinner(player, computer) {
    if (player === computer) return 'draw';
    
    if (
        (player === 'rock' && computer === 'scissors') ||
        (player === 'paper' && computer === 'rock') ||
        (player === 'scissors' && computer === 'paper')
    ) {
        return 'win';
    }
    
    return 'lose';
}