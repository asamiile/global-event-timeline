const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const rowLabel = document.getElementById('row-info');

const imageWidth = 4096;
const imageHeight = 2048;
canvas.width = imageWidth;
canvas.height = imageHeight;

const backgroundImage = new Image();
backgroundImage.src = '/data/landmask4K.png';

let allEvents = [];
const animationDurationSeconds = 50;
const frameRate = 30;
const totalAnimationFrames = animationDurationSeconds * frameRate;

let animationStartTime = null;

async function loadData() {
    try {
        const response = await fetch('/api/events');
        const data = await response.json();
        allEvents = data.map(event => ({
            ...event,
            x: ((event.lon + 180) / 360) * imageWidth,
            y: ((90 - event.lat) / 180) * imageHeight,
        })).sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);

        console.log(`Total events loaded: ${allEvents.length}`);
        draw();
    } catch (error) {
        console.error('Error loading event data:', error);
    }
}

function draw(timestamp) {
    if (!animationStartTime) {
        animationStartTime = timestamp;
    }

    const elapsedTimeSeconds = (timestamp - animationStartTime) / 1000;
    const progress = Math.min(elapsedTimeSeconds / animationDurationSeconds, 1);
    const eventsToShowCount = Math.floor(allEvents.length * progress);

    ctx.clearRect(0, 0, imageWidth, imageHeight);
    ctx.drawImage(backgroundImage, 0, 0, imageWidth, imageHeight);

    for (let i = 0; i < eventsToShowCount; i++) {
        const event = allEvents[i];
        ctx.beginPath();
        ctx.arc(event.x, event.y, 15, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(238, 0, 17, 0.7)';
        ctx.fill();
    }

    updateRowLabel(eventsToShowCount, elapsedTimeSeconds);

    if (progress < 1) {
        requestAnimationFrame(draw);
    } else {
        console.log(`Animation finished. Total events: ${eventsToShowCount}`);
    }
}

function updateRowLabel(eventsShown, elapsedTime) {
    rowLabel.textContent = `Number of drawing events: ${eventsShown} / ${allEvents.length} | Elapsed time: ${elapsedTime.toFixed(2)} s`;
}

backgroundImage.onload = () => {
    loadData().then(() => {
        ctx.drawImage(backgroundImage, 0, 0, imageWidth, imageHeight);
        requestAnimationFrame(draw);
    });
};