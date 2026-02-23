// อ้างอิงที่อยู่ของโมเดลไปยังโฟลเดอร์ model ในโปรเจกต์ (Local)
const URL = "./model/";

let model, webcam, labelContainer, maxPredictions;
let isPlaying = false;

// 1. โหลดรายชื่อกล้องตอนเปิดเว็บ
window.addEventListener('load', async () => {
    const cameraSelect = document.getElementById('cameraSelect');
    try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        cameraSelect.innerHTML = '';
        videoDevices.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            // ถ้าไม่มีชื่อกล้อง ให้ตั้งชื่อตามลำดับ
            option.text = device.label || `กล้องตัวที่ ${index + 1}`;
            cameraSelect.appendChild(option);
        });
    } catch (error) {
        console.error("Error accessing media devices.", error);
        alert("กรุณาอนุญาตให้เบราว์เซอร์เข้าถึงกล้องถ่ายรูป");
    }
});

// 2. ฟังก์ชันเริ่มการทำงาน
async function init() {
    const cameraSelect = document.getElementById('cameraSelect');
    const selectedDeviceId = cameraSelect.value;
    const placeholder = document.getElementById('placeholder-text');

    if (isPlaying && webcam) {
        webcam.stop();
    }

    // กำหนด URL ของไฟล์โมเดลในเครื่อง
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    if (!model) {
        // เปลี่ยนข้อความปุ่มระหว่างรอโหลด
        document.getElementById('startButton').innerText = "กำลังโหลด AI... ⏳";
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
    }

    // flip = false เพื่อไม่ให้ภาพกลับซ้ายขวาเหมือนกระจก (เหมาะกับการใช้กล้องส่องคนไข้)
    const flip = false; 
    webcam = new tmImage.Webcam(400, 400, flip);

    try {
        await webcam.setup({ deviceId: selectedDeviceId }); 
        await webcam.play();
        window.requestAnimationFrame(loop);

        if (placeholder) placeholder.style.display = 'none';
        document.getElementById("webcam-container").innerHTML = '';
        document.getElementById("webcam-container").appendChild(webcam.canvas);

        labelContainer = document.getElementById("label-container");
        labelContainer.innerHTML = '';
        for (let i = 0; i < maxPredictions; i++) {
            labelContainer.appendChild(document.createElement("div"));
        }
        
        isPlaying = true;
        document.getElementById('startButton').innerText = "กำลังประเมิน... 🟢";
    } catch (error) {
        console.error("ไม่สามารถเปิดกล้องได้:", error);
        alert("เกิดข้อผิดพลาดในการเปิดกล้อง ลองตรวจสอบการเชื่อมต่อกล้องดูนะครับ");
        document.getElementById('startButton').innerText = "เริ่มประเมิน 🎬";
    }
}

async function loop() {
    if (isPlaying) {
        webcam.update();
        await predict();
        window.requestAnimationFrame(loop);
    }
}

async function predict() {
    const predictions = await model.predict(webcam.canvas);
    for (let i = 0; i < maxPredictions; i++) {
        // จัดรูปแบบเปอร์เซ็นต์ให้ดูง่ายขึ้น
        const probability = (predictions[i].probability * 100).toFixed(1);
        const classPrediction = `${predictions[i].className}: ${probability}%`;
        labelContainer.childNodes[i].innerHTML = classPrediction;
    }
}

// อัปเดตกล้องทันทีถ้ามีการเปลี่ยนตัวเลือกใน Dropdown ขณะกล้องเปิดอยู่
document.getElementById('cameraSelect').addEventListener('change', () => {
    if (isPlaying) {
        init();
    }
});
