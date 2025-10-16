const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const slider = document.getElementById('month-slider');
const monthLabel = document.getElementById('month-label');

const imageWidth = 4096;
const imageHeight = 2048;
canvas.width = imageWidth;
canvas.height = imageHeight;

const backgroundImage = new Image();
backgroundImage.src = '/data/landmask4K.png'; // Load the background image via the server

let allEvents = [];
const startYear = 2023;

// Fetch event data from the server
async function loadData() {
    const response = await fetch('/api/events');
    const data = await response.json();
    // Pre-calculate coordinates
    allEvents = data.map(event => ({
        ...event,
        x: ((event.lon + 180) / 360) * imageWidth,
        y: ((90 - event.lat) / 180) * imageHeight,
    }));
    draw(); // First drawing after loading data
}

// Draw function
function draw() {
    const currentMonth = parseInt(slider.value);
    monthLabel.textContent = currentMonth;

    // Clear the canvas and draw the background image
    ctx.clearRect(0, 0, imageWidth, imageHeight);
    ctx.drawImage(backgroundImage, 0, 0, imageWidth, imageHeight);
    
    // Filter events to display
    const activeEvents = allEvents.filter(event => 
        event.year < startYear || (event.year === startYear && event.month <= currentMonth)
    );

    // Draw circles
    activeEvents.forEach(event => {
        ctx.beginPath();
        ctx.arc(event.x, event.y, 15, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 0, 80, 0.7)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
}

// Event listener
backgroundImage.onload = loadData; // Start loading data after the background image is loaded
slider.addEventListener('input', draw);