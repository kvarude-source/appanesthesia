const URL = "./model/";
let model, webcam, labelContainer, maxPredictions;
let currentFacing = "environment"; // ค่าเริ่มต้น = กล้องหลัง

async function init() {
  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

  // โหลดโมเดล
  model = await tmImage.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();

  // อ่านค่าที่เลือกจาก dropdown
  const cameraSelect = document.getElementById("cameraSelect");
  currentFacing = cameraSelect.value;

  // ถ้ามี webcam เดิมอยู่ ให้ปิดก่อนเริ่มใหม่
  if (webcam && webcam.stop) {
    webcam.stop();
  }

  // flip เฉพาะตอนใช้กล้องหน้า
  const flip = currentFacing === "user";

  // สร้าง constraints สำหรับกล้องที่เลือก
  const constraints = {
    video: {
      facingMode: { ideal: currentFacing },
      width: 400,
      height: 300,
    },
    audio: false,
  };

  // เริ่มกล้อง
  webcam = new tmImage.Webcam(400, 300, flip);
  await webcam.setup(constraints);
  await webcam.play();
  window.requestAnimationFrame(loop);

  // แสดงภาพกล้อง
  const webcamContainer = document.getElementById("webcam-container");
  webcamContainer.innerHTML = "";
  webcamContainer.appendChild(webcam.canvas);

  // สร้างพื้นที่ label
  labelContainer = document.getElementById("label-container");
  labelContainer.innerHTML = "";
  for (let i = 0; i < maxPredictions; i++) {
    labelContainer.appendChild(document.createElement("div"));
  }

  // ปุ่มเปลี่ยนสถานะ
  const startButton = document.getElementById("startButton");
  startButton.innerText = "กำลังทำงาน...";
  startButton.disabled = true;

  // เมื่อกล้องพร้อมแล้วให้เปิดปุ่มกลับ
  setTimeout(() => {
    startButton.innerText = "เริ่มทำงานใหม่";
    startButton.disabled = false;
  }, 2000);
}

async function loop() {
  webcam.update();
  await predict();
  window.requestAnimationFrame(loop);
}

async function predict() {
  const prediction = await model.predict(webcam.canvas);
  for (let i = 0; i < maxPredictions; i++) {
    const classPrediction =
      prediction[i].className + ": " + (prediction[i].probability * 100).toFixed(2) + "%";
    labelContainer.childNodes[i].innerHTML = classPrediction;
  }
}
