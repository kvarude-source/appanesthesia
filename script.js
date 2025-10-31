const URL = "./model/";
let model, webcam, labelContainer, maxPredictions;

// โหลดรายชื่อกล้อง
async function loadCameraList() {
  const select = document.getElementById("cameraSelect");
  select.innerHTML = "";

  try {
    await navigator.mediaDevices.getUserMedia({ video: true });
  } catch (err) {
    console.warn("ยังไม่ได้อนุญาตกล้อง:", err);
    alert("กรุณาอนุญาตให้เว็บไซต์ใช้กล้อง แล้วรีเฟรชหน้าใหม่");
    return;
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === "videoinput");

    if (videoDevices.length === 0) {
      alert("❌ ไม่พบกล้องในอุปกรณ์นี้");
      return;
    }

    videoDevices.forEach((device, index) => {
      const option = document.createElement("option");
      option.value = device.deviceId;
      const label = (device.label || "").toLowerCase();

      if (label.includes("front") || label.includes("selfie")) {
        option.text = "📱 กล้องหน้า";
      } else if (label.includes("back") || label.includes("rear") || label.includes("environment")) {
        option.text = "🎥 กล้องหลัง";
      } else {
        option.text = `กล้อง ${index + 1}`;
      }
      select.appendChild(option);
    });

    const defaultIndex = Array.from(select.options).findIndex(opt => opt.text.includes("หลัง"));
    select.selectedIndex = defaultIndex >= 0 ? defaultIndex : 0;
  } catch (err) {
    console.error("โหลดรายชื่อกล้องล้มเหลว:", err);
  }
}

// เริ่มระบบกล้อง + โมเดล
async function init() {
  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

  try {
    if (!model) {
      model = await tmImage.load(modelURL, metadataURL);
      maxPredictions = model.getTotalClasses();
    }
  } catch (err) {
    alert("ไม่สามารถโหลดโมเดลได้ กรุณาตรวจสอบไฟล์ใน /model/");
    console.error("Model load error:", err);
    return;
  }

  if (webcam && webcam.stop) webcam.stop();

  const select = document.getElementById("cameraSelect");
  const selectedDeviceId = select.value;
  const selectedLabel = select.options[select.selectedIndex]?.text.toLowerCase() || "";

  // ✅ flip เฉพาะกล้องหน้า เพื่อให้ตรงกับตอนเทรน
  const flip = !(selectedLabel.includes("หลัง") || selectedLabel.includes("back") || selectedLabel.includes("environment"));

  // ✅ เพิ่ม fallback สำหรับเบราว์เซอร์ที่ไม่รองรับ deviceId
  let constraints;
  if (selectedDeviceId) {
    constraints = { video: { deviceId: { exact: selectedDeviceId } }, audio: false };
  } else {
    constraints = { video: { facingMode: "environment" }, audio: false };
  }

  try {
    webcam = new tmImage.Webcam(400, 300, flip);
    await webcam.setup(constraints);
    await webcam.play();
    window.requestAnimationFrame(loop);
  } catch (err) {
    console.error("webcam.setup/play failed:", err);
    alert("เปิดกล้องไม่สำเร็จ อาจเลือกกล้องที่ไม่รองรับ ลองเลือกตัวอื่นดูครับ");
    return;
  }

  const webcamContainer = document.getElementById("webcam-container");
  webcamContainer.innerHTML = "";
  webcamContainer.appendChild(webcam.canvas);

  labelContainer = document.getElementById("label-container");
  labelContainer.innerHTML = "";
  for (let i = 0; i < maxPredictions; i++) {
    labelContainer.appendChild(document.createElement("div"));
  }

  const startButton = document.getElementById("startButton");
  startButton.disabled = true;
  startButton.innerText = "⏳";
  setTimeout(() => {
    startButton.disabled = false;
    startButton.innerHTML = "🎬";
  }, 1000);
}

async function loop() {
  if (!webcam) return;
  webcam.update();
  await predict();
  window.requestAnimationFrame(loop);
}

async function predict() {
  if (!model || !webcam) return;
  const prediction = await model.predict(webcam.canvas);
  for (let i = 0; i < maxPredictions; i++) {
    const classPrediction = prediction[i].className + ": " + (prediction[i].probability * 100).toFixed(2) + "%";
    labelContainer.childNodes[i].innerHTML = classPrediction;
  }
}

window.addEventListener("load", loadCameraList);
