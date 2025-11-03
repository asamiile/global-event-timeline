const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const rowLabel = document.getElementById('row-info');
const exportGifButton = document.getElementById('exportGif');

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
let isRecording = false;
let mediaRecorder = null;
let recordedChunks = [];

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
        // 録画中の場合、録画を停止
        if (isRecording && mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
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

// 動画録画ボタンのイベントリスナー
exportGifButton.addEventListener('click', () => {
    if (isRecording) {
        alert('Recording is already in progress.');
        return;
    }

    // キャンバスからストリームをキャプチャ
    const stream = canvas.captureStream(frameRate);
    
    // MediaRecorderを初期化（MP4のみ）
    const options = { mimeType: 'video/mp4' };
    
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        alert('このブラウザはMP4録画をサポートしていません。Chrome、Safari、またはEdgeをお試しください。');
        exportGifButton.disabled = false;
        exportGifButton.textContent = 'Export as Video';
        return;
    }
    
    console.log('Recording with format: video/mp4');
    mediaRecorder = new MediaRecorder(stream, options);
    recordedChunks = [];

    // データが利用可能になったときのハンドラー
    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    // 録画が停止したときのハンドラー
    mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunks, { type: 'video/mp4' });
        
        // ファイル名に日付を追加
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const filename = `event-timeline-${year}${month}${day}-${hours}${minutes}${seconds}.mp4`;
        
        // サーバーに動画を送信
        try {
            exportGifButton.textContent = 'Saving...';
            const response = await fetch('/api/save-video', {
                method: 'POST',
                headers: {
                    'Content-Type': 'video/mp4',
                    'X-Filename': filename
                },
                body: blob
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log(`Video saved to output/movie/${result.filename}`);
                alert(`Video saved successfully to output/movie/${result.filename}`);
            } else {
                console.error('Failed to save video:', result.error);
                alert('Failed to save video. Check console for details.');
            }
        } catch (error) {
            console.error('Error uploading video:', error);
            alert('Error uploading video. Check console for details.');
        }

        // リセット
        isRecording = false;
        mediaRecorder = null;
        recordedChunks = [];
        exportGifButton.textContent = 'Export as Video';
        exportGifButton.disabled = false;
    };

    mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        isRecording = false;
        mediaRecorder = null;
        exportGifButton.textContent = 'Export as Video';
        exportGifButton.disabled = false;
    };

    // 録画開始
    mediaRecorder.start();
    isRecording = true;
    animationStartTime = null;
    exportGifButton.textContent = 'Recording...';
    exportGifButton.disabled = true;
    
    console.log('Recording started...');
    
    // アニメーションを最初から開始
    requestAnimationFrame(draw);
});