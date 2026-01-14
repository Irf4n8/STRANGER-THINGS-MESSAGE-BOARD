const API_URL = 'http://localhost:3001/api/decode';
let audioCtx;

// Define the Wall Layout (A-Z)
const ROW_LAYOUT = [
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], // 8
    ['I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'], // 8
    ['Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'] // 10
];

document.addEventListener('DOMContentLoaded', () => {
    buildWall();

    // Check for ID in URL
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (id) {
        // Wait for user interaction to start (browsers block auto-audio, good practice for animations too)
        document.body.addEventListener('click', () => {
            document.getElementById('start-prompt').style.display = 'none';
            if (!audioCtx) initAudio(); // Initialize audio context on user gesture

            // Trigger Joyce Pop
            const joyce = document.querySelector('.joyce-wrapper');
            if (joyce) {
                joyce.classList.add('active');
                playPop();
            }

            fetchAndPlayMessage(id);
        }, { once: true });
    } else {
        document.getElementById('start-prompt').textContent = "NO SIGNAL FOUND";
    }
});

function buildWall() {
    const wall = document.getElementById('wall');

    ROW_LAYOUT.forEach((rowChars, rowIndex) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'row';

        const colors = ['red', 'green', 'blue', 'yellow', 'pink'];

        rowChars.forEach((char, charIndex) => {
            const unit = document.createElement('div');
            unit.className = 'letter-unit';

            const bulb = document.createElement('div');
            // Assign a random or sequential color
            const colorClass = colors[(rowIndex + charIndex) % colors.length];
            bulb.className = `bulb ${colorClass}`; // e.g., "bulb red"
            bulb.id = `light-${char}`;

            const letter = document.createElement('div');
            letter.className = 'paint';
            letter.textContent = char;

            unit.appendChild(bulb);
            unit.appendChild(letter);
            rowDiv.appendChild(unit);
        });

        wall.appendChild(rowDiv);
    });
}

async function fetchAndPlayMessage(id) {
    try {
        const res = await fetch(`${API_URL}/${id}`);
        if (!res.ok) throw new Error('Message not found');
        const data = await res.json();

        playSequence(data.encoded);

    } catch (err) {
        console.error(err);
        alert('THE CONNECTION IS WEAK... CANNOT RETRIEVE.');
    }
}

// THE ANIMATION ENGINE
async function playSequence(encodedArray) {
    // Initial pause to build tension
    await wait(1000);

    for (let symbol of encodedArray) {
        if (symbol === 'PAUSE') {
            await wait(1200); // Longer pause for spaces
        } else {
            // Light ON
            const bulb = document.getElementById(`light-${symbol}`);
            const letterEl = bulb ? bulb.nextElementSibling : null;

            if (bulb) {
                // 1. Position Hand and Animate "Writing"
                await animateHandWriting(bulb);

                // 2. Light ON & Sound
                bulb.classList.add('on');
                if (letterEl) letterEl.classList.add('active-letter');
                playBuzz();

                // Keep ON
                await wait(800);

                // Light FADE
                bulb.classList.remove('on');
                if (letterEl) letterEl.classList.remove('active-letter');

                // Gap
                await wait(400);
            }
        }
    }

    // Final Sequence: Glow Entire Message
    await wait(800);
    playFinalSequence(encodedArray);

    // REVEAL MESSAGE (Added feature)
    await wait(2000); // Wait for final flash to finish
    const finalMsgEl = document.getElementById('finalMessage');
    // Decode logic: Filter PAUSE and join
    const decodedText = encodedArray.filter(c => c !== 'PAUSE').join('');

    if (finalMsgEl) {
        finalMsgEl.textContent = decodedText;
        finalMsgEl.classList.remove('hidden');
        finalMsgEl.classList.add('visible');
        playBuzz(); // Impact sound
    }
}

// Hand Animation Logic
async function animateHandWriting(bulbElement) {
    const hand = document.getElementById('ghost-hand');
    if (!hand) return;

    // Get socket position
    const rect = bulbElement.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height + 20; // Below bulb (where letter is)

    // Reset Hand
    hand.style.opacity = '1';
    hand.style.left = `${startX}px`;
    hand.style.top = `${startY}px`;
    hand.style.transform = 'translate(-50%, -50%) scale(1)';

    // Scribble Animation
    hand.classList.add('scribbling');
    await wait(300); // Writing time
    hand.classList.remove('scribbling');

    // Fade out
    hand.style.opacity = '0';
}

async function playFinalSequence(encodedArray) {
    const uniqueChars = [...new Set(encodedArray.filter(c => c !== 'PAUSE'))];

    for (let i = 0; i < 3; i++) {
        // All ON
        uniqueChars.forEach(char => {
            const bulb = document.getElementById(`light-${char}`);
            if (bulb) {
                bulb.classList.add('on');
                bulb.nextElementSibling.classList.add('active-letter');
            }
        });

        playBuzz(); // Loud buzz
        await wait(600);

        // All OFF
        uniqueChars.forEach(char => {
            const bulb = document.getElementById(`light-${char}`);
            if (bulb) {
                bulb.classList.remove('on');
                bulb.nextElementSibling.classList.remove('active-letter');
            }
        });
        await wait(300);
    }
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function initAudio() {
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.warn('Audio API not supported');
    }
}

function playBuzz() {
    if (!audioCtx) return;

    // Main Hum (The "Buzz")
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'sawtooth'; // Harsh wave for electrical sound
    osc.frequency.setValueAtTime(60, audioCtx.currentTime); // 60Hz Mains Hum

    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.6);

    // Subtle "Crack" (The spark)
    const crackle = audioCtx.createOscillator();
    const crackleGain = audioCtx.createGain();

    crackle.type = 'square';
    crackle.frequency.setValueAtTime(100 + Math.random() * 50, audioCtx.currentTime);

    crackleGain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    crackleGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

    crackle.connect(crackleGain);
    crackleGain.connect(audioCtx.destination);

    crackle.start();
    crackle.stop(audioCtx.currentTime + 0.1);
}

function playPop() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}
