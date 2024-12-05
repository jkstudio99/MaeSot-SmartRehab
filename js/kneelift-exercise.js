let model, webcam, ctx, maxPredictions;
let counter = 0;
let timer = 60;
let isActive = false;
let counting = false;
let timerStarted = false;
let timerInterval;

async function init() {
    try {
        document.getElementById('loading-message').classList.remove('d-none');
        
        const modelURL = "models/kneelift/model.json";
        const metadataURL = "models/kneelift/metadata.json";
        
        model = await tmPose.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

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

        document.getElementById('loading-message').classList.add('d-none');

        isActive = true;
        window.requestAnimationFrame(loop);

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('loading-message').classList.add('d-none');
        document.getElementById('error-message').classList.remove('d-none');
    }
}

async function loop() {
    if (isActive) {
        webcam.update();
        await predict();
        window.requestAnimationFrame(loop);
    }
}

async function predict() {
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    const prediction = await model.predict(posenetOutput);

    let highestProbability = 0;
    let mostLikelyClass = "";
    
    for (let i = 0; i < maxPredictions; i++) {
        if (prediction[i].probability > highestProbability) {
            highestProbability = prediction[i].probability;
            mostLikelyClass = prediction[i].className;
        }
    }

    if (highestProbability > 0.9 && mostLikelyClass === "KneeLift") {
        if (!timerStarted) {
            startTimer();
            timerStarted = true;
        }
        if (!counting) {
            counter++;
            document.getElementById('counter').textContent = `จำนวนครั้ง: ${counter}`;
            counting = true;
        }
    } else {
        counting = false;
    }

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

function startTimer() {
    const timerDisplay = document.getElementById('timer');
    timerDisplay.textContent = `${timer} วินาที`;
    
    timerInterval = setInterval(() => {
        timer--;
        timerDisplay.textContent = `${timer} วินาที`;
        
        if (timer <= 0) {
            clearInterval(timerInterval);
            isActive = false;
            finishExercise();
        }
    }, 1000);
}

function finishExercise() {
    webcam.stop();
    document.querySelector('button[onclick="init()"]').textContent = 'เริ่มใหม่';
    alert(`การทดสอบเสร็จสิ้น\nคุณทำได้: ${counter} ครั้ง\nเยี่ยมมาก! การยกเข่าสูงช่วยเพิ่มความยืดหยุ่นของกล้ามเนื้อขาและปรับสมดุลร่างกาย`);
}

function resetExercise() {
    counter = 0;
    timer = 60;
    isActive = false;
    counting = false;
    timerStarted = false;
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    document.getElementById('timer').textContent = `${timer} วินาที`;
    document.getElementById('counter').textContent = 'จำนวนครั้ง: 0';
} 