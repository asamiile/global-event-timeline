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

// Dynamically set slider range based on CSV data
let minYear = 2023; // Default values, will be updated dynamically
let maxYear = 2025;

// Map slider to specific year and month from CSV
let availableDates = [];

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

// Initialize slider and load data
async function initializeSlider() {
    const response = await fetch('/api/events');
    const data = await response.json();

    // Extract unique year-month combinations from the data
    const uniqueDates = new Set(data.map(event => `${event.year},${event.month}`));
    availableDates = Array.from(uniqueDates).sort((a, b) => {
        const [yearA, monthA] = a.split(',').map(Number);
        const [yearB, monthB] = b.split(',').map(Number);
        return yearA === yearB ? monthA - monthB : yearA - yearB;
    });

    // Update slider range
    slider.min = 0;
    slider.max = availableDates.length - 1;
    slider.value = 0;

    updateSliderLabel();
}

function updateSliderLabel() {
    const index = parseInt(slider.value);
    const [year, month] = availableDates[index].split(',');
    monthLabel.textContent = `${year}-${month}`;
}

// Draw function
function draw() {
    const index = parseInt(slider.value);
    const [year, month] = availableDates[index].split(',').map(Number);

    // Filter events by selected year and month
    const activeEvents = allEvents.filter(event => 
        event.year < year || (event.year === year && event.month <= month)
    );

    // Clear the canvas and draw the background image
    ctx.clearRect(0, 0, imageWidth, imageHeight);
    ctx.drawImage(backgroundImage, 0, 0, imageWidth, imageHeight);

    // Draw circles for active events
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
slider.addEventListener('input', () => {
    updateSliderLabel();
    draw();
});

// Update draw function to filter by selected year and month
function draw() {
    const index = parseInt(slider.value);
    const [year, month] = availableDates[index].split(',').map(Number);

    // Filter events by selected year and month
    const activeEvents = allEvents.filter(event => 
        event.year < year || (event.year === year && event.month <= month)
    );

    // Clear the canvas and draw the background image
    ctx.clearRect(0, 0, imageWidth, imageHeight);
    ctx.drawImage(backgroundImage, 0, 0, imageWidth, imageHeight);

    // Draw circles for active events
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

// Initialize slider and load data
initializeSlider();