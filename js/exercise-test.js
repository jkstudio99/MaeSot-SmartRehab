let model, webcam, ctx, labelContainer, maxPredictions;
let counter = 0;
let timer = 30;
let isActive = false;
let exerciseType = '';

// ปรับปรุงลิงก์ในหน้าหลัก
document.querySelectorAll('.service-content-inner a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const exerciseName = e.target.closest('.service-content-inner').querySelector('h5').textContent;
        window.location.href = `exercise-test.html?exercise=${encodeURIComponent(exerciseName)}`;
    });
});

async function init() {
    try {
        const startButton = document.querySelector('button[onclick="init()"]');
        startButton.disabled = true;
        startButton.textContent = 'กำลังโหลด...';

        // รับค่าประเภทท่าออกกำลังกายจาก URL
        const urlParams = new URLSearchParams(window.location.search);
        exerciseType = urlParams.get('exercise') || 'Walking';
        document.getElementById('exercise-name').textContent = exerciseType;

        // URL ของโมเดลจาก Teachable Machine
        // ตัวอย่าง URL จะได้จากการ Export โมเดลใน Teachable Machine
        const modelURL = "https://teachablemachine.withgoogle.com/models/[YOUR_MODEL_ID]/";
        // หรือถ้าใช้ไฟล์ในเครื่อง
        // const modelURL = `./models/${exerciseType.toLowerCase()}/`;
        
        model = await tmPose.load(
            modelURL + "model.json", 
            modelURL + "metadata.json"
        );

        maxPredictions = model.getTotalClasses();

        // ตั้งค่ากล้อง
        const width = 500;
        const height = 400;
        const flip = true;
        webcam = new tmPose.Webcam(width, height, flip);
        
        await webcam.setup();
        await webcam.play();

        const canvas = document.getElementById('canvas');
        canvas.width = width;
        canvas.height = height;
        ctx = canvas.getContext('2d');

        startExercise();
        window.requestAnimationFrame(loop);

        startButton.disabled = false;
        startButton.textContent = 'เริ่มใหม่';

    } catch (error) {
        console.error('เกิดข้อผิดพลาด:', error);
        alert(`ไม่สามารถเริ่มการทดสอบได้: ${error.message}`);
        
        const startButton = document.querySelector('button[onclick="init()"]');
        startButton.disabled = false;
        startButton.textContent = 'ลองอีกครั้ง';
    }
}

function startExercise() {
    isActive = true;
    timer = 30;
    counter = 0;
    updateDisplay();
    
    const timerInterval = setInterval(() => {
        if (timer > 0 && isActive) {
            timer--;
            updateDisplay();
        } else {
            clearInterval(timerInterval);
            finishExercise();
        }
    }, 1000);
}

function updateDisplay() {
    document.getElementById('timer').textContent = `เหลือเวลา: ${timer} วินาที`;
    document.getElementById('counter').textContent = `จำนวนครั้ง: ${counter}`;
}

function finishExercise() {
    isActive = false;
    webcam.stop();
    
    // แสดงผลลัพธ์
    const resultHtml = `
        <div class="result-container">
            <h3>ผลการทดสอบ</h3>
            <p>ท่า: ${exerciseType}</p>
            <p>จำนวนครั้งที่ทำได้: ${counter}</p>
            <button onclick="window.location.href='index.html'" class="btn btn-primary">กลับหน้าลัก</button>
        </div>
    `;
    document.querySelector('.card-body').innerHTML = resultHtml;
}

async function loop() {
    if (!isActive) return;
    
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    const prediction = await model.predict(posenetOutput);

    // ตรวจจับท่าทางและนับจำนวนครั้ง
    if (prediction[0].probability > 0.8) {
        if (!isCountingRep) {
            counter++;
            updateDisplay();
            isCountingRep = true;
        }
    } else {
        isCountingRep = false;
    }

    // วาดโครงกระดูก
    drawPose(pose);
}

function drawPose(pose) {
    if (webcam.canvas) {
        ctx.drawImage(webcam.canvas, 0, 0);
        if (pose) {
            const minPartConfidence = 0.5;
            tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
            tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
        }
    }
} 