const URL = "./model/";
let model, webcam, labelContainer, maxPredictions;
let currentFacing = "environment"; // เริ่มจากกล้องหลัง

async function init() {
  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

  // โหลดโมเดล
  model = await tmImage.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();

  // อ่านค่าจาก dropdown
  const cameraSelect = document.getElementById("cameraSelect");
  currentFacing = cameraSelect.value;

  // ถ้ามี webcam เดิมอยู่ให้ปิดก่อน
  if (webcam && webcam.stop) {
    webcam.stop();
  }

  // flip เฉพาะตอนกล้องหน้า
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

  // ตั้งค่ากล้อง
  webcam = new tmImage.Webcam(400, 300, flip);
  await webcam.setup(constraints);
  await webcam.play();
  window.requestAnimationFrame(loop);

  // แสดงผลบนหน้าเว็บ
  const webcamContainer = document.getElementById("webcam-container");
  webcamContainer.innerHTML = "";
  webcamContainer.appendChild(webcam.canvas);

  // แสดงผล label
  labelContainer = document.getElementById("label-container");
  labelContainer.innerHTML = "";
  for (let i = 0; i < maxPredictions; i++) {
    labelContainer.appendChild(document.createElement("div"));
  }

  // ปิดปุ่มขณะเริ่ม
  const startButton = document.getElementById("startButton");
  startButton.disabled = true;
  startButton.innerHTML = "⏳";

  setTimeout(() => {
    startButton.disabled = false;
    startButton.innerHTML = "🎬";
  }, 1500);
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
