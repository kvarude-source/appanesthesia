// โหลดรายชื่อกล้อง
async function loadCameraList() {
  const select = document.getElementById("cameraSelect");
  select.innerHTML = "";

  try {
    // ขอสิทธิ์กล้องก่อน เพื่อให้ browser เปิดเผยชื่ออุปกรณ์
    await navigator.mediaDevices.getUserMedia({ video: true });
  } catch (err) {
    console.warn("⚠️ ยังไม่ได้อนุญาตกล้อง:", err);
    alert("กรุณาอนุญาตให้เว็บไซต์ใช้กล้อง จากนั้นรีเฟรชหน้าใหม่");
  }

  try {
    // ดึงรายการอุปกรณ์ทั้งหมด
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === "videoinput");

    if (videoDevices.length === 0) {
      alert("ไม่พบกล้องบนอุปกรณ์นี้");
      return;
    }

    videoDevices.forEach((device, index) => {
      const option = document.createElement("option");
      option.value = device.deviceId;
      const label = (device.label || "").toLowerCase();

      // วิเคราะห์ชื่ออุปกรณ์ เพื่อเดาว่ากล้องหน้า/หลัง
      if (label.includes("front") || label.includes("selfie")) {
        option.text = "📱 กล้องหน้า";
      } else if (label.includes("back") || label.includes("rear") || label.includes("environment")) {
        option.text = "🎥 กล้องหลัง";
      } else {
        // ถ้าไม่รู้แน่ ให้ตั้งชื่อกลาง ๆ
        option.text = `กล้อง ${index + 1}`;
      }

      select.appendChild(option);
    });

    // ตั้งค่าเริ่มต้นให้เลือกกล้องหลัง (ถ้ามี)
    const defaultIndex = Array.from(select.options).findIndex(
      opt => opt.text.includes("หลัง")
    );
    select.selectedIndex = defaultIndex >= 0 ? defaultIndex : 0;

    console.log("📷 พบกล้องทั้งหมด:", videoDevices.length);
  } catch (err) {
    console.error("❌ ไม่สามารถโหลดรายชื่อกล้อง:", err);
    alert("เกิดข้อผิดพลาดในการดึงรายชื่อกล้อง");
  }
}
