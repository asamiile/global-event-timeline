const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const rowLabel = document.getElementById('row-info');

const imageWidth = 4096;
const imageHeight = 2048;
canvas.width = imageWidth;
canvas.height = imageHeight;

const backgroundImage = new Image();
backgroundImage.src = '/data/landmask4K.png';

let allEvents = []; // All event data
const startYear = 2023; // Start year for CSV data

// --- Animation settings ---
const animationDurationSeconds = 50; // Total animation time (seconds)
const frameRate = 30; // ★★★ Change this to 30 ★★★
const totalAnimationFrames = animationDurationSeconds * frameRate; // Total number of frames

let currentAnimationFrame = 0; // Current animation frame number
let animationStartTime = null; // Animation start time

// Fetch event data from the server
async function loadData() {
    const response = await fetch('/api/events');
    const data = await response.json();
    // Pre-calculate coordinates and sort by date for animation
    allEvents = data.map(event => ({
        ...event,
        x: ((event.lon + 180) / 360) * imageWidth,
        y: ((90 - event.lat) / 180) * imageHeight,
    })).sort((a, b) => {
        // Sort events by year and month
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
    });

    console.log(`Total events loaded: ${allEvents.length}`);
    draw(); // Initial drawing after data loading
}

// Drawing function
function draw(timestamp) {
    if (!animationStartTime) {
        animationStartTime = timestamp; // Record animation start time
    }

    // Elapsed time (seconds)
    const elapsedTimeSeconds = (timestamp - animationStartTime) / 1000;

    // Animation progress (0.0 to 1.0)
    let progress = elapsedTimeSeconds / animationDurationSeconds;
    if (progress > 1) progress = 1; // Clamp to not exceed 1.0

    // Calculate the index of the events to be displayed
    const eventsToShowCount = Math.floor(allEvents.length * progress);

    // Clear the canvas and draw the background image
    ctx.clearRect(0, 0, imageWidth, imageHeight);
    ctx.drawImage(backgroundImage, 0, 0, imageWidth, imageHeight);

    // Draw the events to be displayed
    for (let i = 0; i < eventsToShowCount; i++) {
        const event = allEvents[i];
        ctx.beginPath();
        ctx.arc(event.x, event.y, 15, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(238, 0, 17, 0.7)';
        ctx.fill();
    }

    updateRowLabel(eventsToShowCount, elapsedTimeSeconds); // Update row label

    // Request the next frame if the animation is not finished
    if (progress < 1) {
        requestAnimationFrame(draw);
    } else {
        console.log(`Animation finished. Total events: ${eventsToShowCount}`);
    }
}

// Update row label based on the number of events shown and elapsed time
function updateRowLabel(eventsShown, elapsedTime) {
    rowLabel.textContent = `Number of drawing events: ${eventsShown} / ${allEvents.length} | Elapsed time: ${elapsedTime.toFixed(2)} s`;
}

// Start animation after the background image is loaded
backgroundImage.onload = () => {
    loadData().then(() => {
        // Initial drawing (background image only)
        ctx.drawImage(backgroundImage, 0, 0, imageWidth, imageHeight);
        // Start animation
        requestAnimationFrame(draw);
    });
};