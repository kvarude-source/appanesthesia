// โหลดรายชื่อกล้อง
async function loadCameraList() {
  try {
    // ขอสิทธิ์กล้องก่อน เพื่อให้ browser เปิดเผยชื่ออุปกรณ์
    await navigator.mediaDevices.getUserMedia({ video: true });

    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === "videoinput");

    const select = document.getElementById("cameraSelect");
    select.innerHTML = "";

    videoDevices.forEach((device, index) => {
      const label = device.label.toLowerCase();
      const option = document.createElement("option");
      option.value = device.deviceId;

      if (label.includes("front")) {
        option.text = "📱 กล้องหน้า";
      } else if (label.includes("back") || label.includes("rear") || label.includes("environment")) {
        option.text = "🎥 กล้องหลัง";
      } else {
        // ถ้าไม่รู้แน่ชัดให้ตั้งชื่อทั่วไป
        option.text = `กล้อง ${index + 1}`;
      }

      select.appendChild(option);
    });

    // ถ้ามีมากกว่า 1 กล้อง ให้เลือกกล้องหลังเป็นค่าเริ่มต้น
    if (videoDevices.length > 1) {
      select.selectedIndex = 1;
    }

  } catch (err) {
    console.error("ไม่สามารถเข้าถึงกล้องได้:", err);
    alert("กรุณาอนุญาตการใช้กล้องในเบราว์เซอร์");
  }
}
