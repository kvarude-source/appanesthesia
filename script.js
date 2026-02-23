const URL = "./model/";

let model, webcam, labelContainer, maxPredictions;
let isPlaying = false;

// ตัวแปรสำหรับเก็บค่าประเมินล่าสุดเพื่อใช้ตอนกดปุ่มบันทึก
let currentHighestClass = "";
let currentHighestProb = 0;
let isCurrentRisk = false;

// 🛑 ตั้งค่าคำสำคัญสำหรับตรวจจับความเสี่ยง (แก้คำนี้ให้ตรงกับชื่อ Class ที่คุณเทรนในโมเดล)
// เช่น หากเทรนชื่อ "Class 4" หรือ "Difficult" ให้นำมาใส่ในอาร์เรย์นี้
const RISK_KEYWORDS = ["ยาก", "difficult", "class 4", "class 3"]; 

async function init() {
    const cameraFacing = document.getElementById('cameraFacing').value;
    const placeholder = document.getElementById('placeholder-text');

    if (isPlaying && webcam) {
        webcam.stop();
    }

    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    if (!model) {
        document.getElementById('startButton').innerText = "กำลังโหลด AI... ⏳";
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
    }

    // ถ้าเป็นกล้องหน้า (user) ให้กลับซ้ายขวา (flip=true) ถ้ากล้องหลังให้เป็น false
    const flip = (cameraFacing === "user"); 
    webcam = new tmImage.Webcam(400, 400, flip);

    try {
        // ใช้โหมด facingMode สำหรับเลือกกล้องหน้า/หลัง
        await webcam.setup({ facingMode: cameraFacing }); 
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
        document.getElementById('saveButton').disabled = false; // เปิดใช้งานปุ่มบันทึก
        
    } catch (error) {
        console.error("ไม่สามารถเปิดกล้องได้:", error);
        alert("ไม่สามารถเข้าถึงกล้องได้ กรุณาตรวจสอบการอนุญาตของเบราว์เซอร์");
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
    
    // รีเซ็ตค่าชั่วคราว
    currentHighestProb = 0;
    currentHighestClass = "";

    for (let i = 0; i < maxPredictions; i++) {
        const prob = predictions[i].probability;
        const className = predictions[i].className;
        
        // หาค่าเปอร์เซ็นต์ที่สูงที่สุด ณ วินาทีนั้น
        if (prob > currentHighestProb) {
            currentHighestProb = prob;
            currentHighestClass = className;
        }

        const classPrediction = `${className}: ${(prob * 100).toFixed(1)}%`;
        labelContainer.childNodes[i].innerHTML = classPrediction;
    }

    // ตรวจสอบเงื่อนไขแจ้งเตือนความเสี่ยง (Risk Alert)
    checkRiskAlert(currentHighestClass, currentHighestProb);
}

function checkRiskAlert(className, probability) {
    const alertBox = document.getElementById('risk-alert');
    const classNameLower = className.toLowerCase();
    
    // เช็คว่าชื่อคลาสตรงกับคำเตือนที่ตั้งไว้หรือไม่ และเปอร์เซ็นต์ต้องมากกว่า 60%
    const isMatchKeyword = RISK_KEYWORDS.some(keyword => classNameLower.includes(keyword.toLowerCase()));
    
    if (isMatchKeyword && probability > 0.6) {
        alertBox.style.display = "block";
        isCurrentRisk = true;
    } else {
        alertBox.style.display = "none";
        isCurrentRisk = false;
    }
}

// ฟังก์ชันบันทึกผล
function saveResult() {
    if (!isPlaying) return;

    const historyList = document.getElementById('history-list');
    
    // ลบข้อความ "ยังไม่มีข้อมูล" ออกเมื่อบันทึกครั้งแรก
    const emptyMsg = document.querySelector('.empty-history');
    if (emptyMsg) emptyMsg.remove();

    // สร้างเวลาปัจจุบัน
    const now = new Date();
    const timeString = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // สร้างกล่องเก็บประวัติ
    const li = document.createElement('li');
    let riskTag = "";

    if (isCurrentRisk) {
        li.className = "risk-item";
        riskTag = " ⚠️ [เสี่ยงสูง]";
    }

    li.innerHTML = `<strong>เวลา ${timeString}</strong><br>ผลประเมิน: ${currentHighestClass} (${(currentHighestProb * 100).toFixed(1)}%) ${riskTag}`;
    
    // นำผลลัพธ์ใหม่ดันขึ้นไปอยู่บนสุด
    historyList.prepend(li);
    
    // ทำปุ่มกระพริบเล็กน้อยให้รู้ว่ากดบันทึกแล้ว
    const btn = document.getElementById('saveButton');
    btn.innerText = "บันทึกแล้ว! ✅";
    setTimeout(() => {
        btn.innerText = "บันทึกผล 💾";
    }, 1500);
}

// อัปเดตกล้องเมื่อเปลี่ยนตัวเลือกใน Dropdown
document.getElementById('cameraFacing').addEventListener('change', () => {
    if (isPlaying) {
        init();
    }
});
