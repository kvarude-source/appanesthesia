const URL = "./model/";
let model, webcam, labelContainer, maxPredictions;
let videoDevices = []; // เก็บรายชื่อกล้องทั้งหมด

async function init() {
  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

  // โหลดโมเดล
  if (!model) {
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();
  }

  // ปิดกล้องเดิม (ถ้ามี)
  if (webcam && webcam.stop) {
    webcam.stop();
  }

  // อ่านค่าที่เลือกจาก dropdown
  const cameraSelect = document.getElementById("cameraSelect");
  const selectedDeviceId = cameraSelect.value;

  // flip ถ้าเป็นกล้องหน้า
  const flip = (cameraSelect.options[cameraSelect.selectedIndex].text.includes("หน้า"));

  const constraints = {
    video: {
      deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
      width: 400,
      height: 300
    },
    audio: false
  };

  // เริ่มต้น webcam ใหม่
  webcam = new tmImage.Webcam(400, 300, flip);
  await webcam.setup(constraints);
  await webcam.play();
  window.requestAnimationFrame(loop);

  // แสดงภาพบนหน้าเว็บ
  const webcamContainer = document.getElementById("webcam-container");
  webcamContainer.innerHTML = "";
  webcamContainer.appendChild(webcam.canvas);

  // แสดง label
  labelContainer = document.getElementById("label-container");
  labelContainer.innerHTML = "";
  for (let i = 0; i < maxPredictions; i++) {
    labelContainer.appendChild(document.createElement("div"));
  }
}

// โหลดรายชื่อกล้อง
async function loadCameraList() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  videoDevices = devices.filter(device => device.kind === "videoinput");

  const select = document.getElementById("cameraSelect");
  select.innerHTML = "";

  videoDevices.forEach((device, index) => {
    const option = document.createElement("option");
    option.value = device.deviceId;
    option.text =
      device.label || `กล้อง ${index + 1}`;
    select.appendChild(option);
  });
}

// ทำนายผล
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

// โหลดรายการกล้องทันทีเมื่อหน้าเว็บพร้อม
window.addEventListener("load", loadCameraList);
