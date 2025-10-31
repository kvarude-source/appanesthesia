async function loadCameraList() {
  const select = document.getElementById("cameraSelect");
  select.innerHTML = "";

  try {
    // ขอสิทธิ์ใช้กล้องเพื่อให้เห็นชื่อจริง
    await navigator.mediaDevices.getUserMedia({ video: true });
  } catch (err) {
    console.warn("ยังไม่ได้อนุญาตกล้อง:", err);
    alert("กรุณาอนุญาตให้เว็บไซต์ใช้กล้อง แล้วรีเฟรชหน้าใหม่");
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === "videoinput");

    if (videoDevices.length === 0) {
      alert("ไม่พบกล้องบนอุปกรณ์นี้");
      return;
    }

    videoDevices.forEach((device, index) => {
      const label = (device.label || "").toLowerCase();
      const option = document.createElement("option");
      option.value = device.deviceId;

      if (label.includes("front") || label.includes("selfie")) {
        option.text = "📱 กล้องหน้า";
      } else if (label.includes("back") || label.includes("rear") || label.includes("environment")) {
        option.text = "🎥 กล้องหลัง";
      } else {
        option.text = `กล้อง ${index + 1}`;
      }

      select.appendChild(option);
    });

    // เลือกกล้องหลังถ้ามีมากกว่า 1 ตัว
    const defaultIndex = Array.from(select.options).findIndex(opt => opt.text.includes("หลัง"));
    select.selectedIndex = defaultIndex >= 0 ? defaultIndex : 0;
  } catch (err) {
    console.error("โหลดกล้องล้มเหลว:", err);
  }
}

async function init() {
  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

  try {
    if (!model) {
      model = await tmImage.load(modelURL, metadataURL);
      maxPredictions = model.getTotalClasses();
    }
  } catch (e) {
    alert("ไม่สามารถโหลดโมเดลได้ ตรวจสอบไฟล์ใน /model/");
    console.error(e);
    return;
  }

  if (webcam && webcam.stop) webcam.stop();

  const select = document.getElementById("cameraSelect");
  const selectedDeviceId = select.value;
  const selectedLabel = select.options[select.selectedIndex]?.text.toLowerCase() || "";
  const flip = selectedLabel.includes("หน้า") || selectedLabel.includes("front");

  // ใช้ fallback เผื่อ deviceId ใช้ไม่ได้
  let constraints = { video: { facingMode: "environment", width: 400, height: 300 }, audio: false };
  if (selectedDeviceId) {
    constraints = { video: { deviceId: { exact: selectedDeviceId }, width: 400, height: 300 }, audio: false };
  }

  webcam = new tmImage.Webcam(400, 300, flip);
  try {
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
  startButton.innerText = "⏳ กำลังทำงาน...";
  setTimeout(() => {
    startButton.disabled = false;
    startButton.innerHTML = "🎬";
  }, 1500);
}
