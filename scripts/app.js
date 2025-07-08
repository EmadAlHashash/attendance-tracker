if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("service-worker.js")
      .then((reg) => console.log("✅ تم تسجيل Service Worker", reg))
      .catch((err) => console.error("❌ فشل في التسجيل", err));
  });
}

// ==================== 1. قاعدة البيانات والمودال ====================
let db;

function initDB() {
  const request = indexedDB.open("attendanceDB", 1);
  request.onerror = () => showModal("⚠️ تعذر فتح قاعدة البيانات");
  request.onsuccess = (event) => (db = event.target.result);
  request.onupgradeneeded = (event) => {
    db = event.target.result;
    const store = db.createObjectStore("entries", {
      keyPath: "id",
      autoIncrement: true,
    });
    store.createIndex("date", "date");
    store.createIndex("type", "type");
    store.createIndex("datetime", "datetime");
    store.createIndex("wage", "wage");
  };
}

function showModal(message) {
  document.getElementById("modal-message").innerText = message;
  document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}

function saveAttendanceToDB(entry) {
  const tx = db.transaction("entries", "readwrite");
  tx.objectStore("entries").add(entry);
}

initDB();

// ==================== 2. عناصر الصفحة ====================
const datetimeElement = document.getElementById("datetime");
const locationStatus = document.getElementById("location-status");
const checkInBtn = document.getElementById("check-in-btn");
const checkOutBtn = document.getElementById("check-out-btn");
const showLogBtn = document.getElementById("show-log-btn");
const showSalaryBtn = document.getElementById("show-salary-btn");
const attendanceTable = document.getElementById("attendance-table");
const attendanceBody = attendanceTable.querySelector("tbody");
const dailyWage = 10;

// ==================== 3. الوقت والعد التنازلي ====================
function updateDateTime() {
  const now = new Date();
  datetimeElement.textContent = now.toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const h = now.getHours(),
    m = now.getMinutes();
  checkInBtn.style.display = h === 6 || (h === 7 && m === 0) ? "block" : "none";

  if (h === 15 && m >= 30) {
    checkOutBtn.textContent = "تسجيل خروج (عادي)";
    checkOutBtn.style.display = "block";
  } else if (h === 18 && m === 0) {
    checkOutBtn.textContent = "تسجيل خروج (إضافي)";
    checkOutBtn.style.display = "block";
  } else {
    checkOutBtn.style.display = "none";
  }
}

function getNextActionTime() {
  const now = new Date();
  const windows = [
    { label: "تسجيل دخول", hour: 6, minute: 0 },
    { label: "تسجيل دخول", hour: 7, minute: 0 },
    { label: "تسجيل خروج (عادي)", hour: 15, minute: 30 },
    { label: "تسجيل خروج (إضافي)", hour: 18, minute: 0 },
  ];
  for (const w of windows) {
    const target = new Date();
    target.setHours(w.hour, w.minute, 0, 0);
    if (target > now) return { label: w.label, time: target };
  }
  return null;
}
function updateCountdown() {
  const countdownEl = document.getElementById("countdown");
  const next = getNextActionTime();
  if (!next)
    return (countdownEl.textContent = "✅ لا توجد عمليات متاحة حالياً.");

  const diff = next.time - new Date();
  if (diff <= 0) return (countdownEl.textContent = `✅ حان وقت ${next.label}`);

  const totalMins = Math.floor(diff / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const secs = Math.floor((diff % 60000) / 1000);
  countdownEl.textContent = `⏳ الوقت المتبقي حتى ${next.label}: ${hours} ساعة و ${mins} دقيقة و ${secs} ثانية`;
}


setInterval(updateCountdown, 1000);
updateCountdown();
updateDateTime();
setInterval(updateDateTime, 60000);

// ==================== 4. الموقع الجغرافي ====================
navigator.geolocation.getCurrentPosition(
  (position) => {
    const lat = position.coords.latitude.toFixed(6);
    const lng = position.coords.longitude.toFixed(6);
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`
    )
      .then((res) => res.json())
      .then((data) => {
        const name =
          data.address.city ||
          data.address.town ||
          data.address.village ||
          data.address.suburb ||
          "موقع غير معروف";
        locationStatus.textContent = `📍 الموقع الحالي: ${name}`;
        L.marker([lat, lng]).addTo(map).bindPopup(`📍 ${name}`).openPopup();
      })
      .catch(() => (locationStatus.textContent = "📍 تعذر تحديد اسم الموقع"));
  },
  () => (locationStatus.textContent = "❌ فشل في تحديد الموقع"),
  { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
);

// ==================== 5. التحقق من التكرار ====================
async function hasCheckedToday(type) {
  return new Promise((resolve) => {
    const tx = db.transaction("entries", "readonly");
    const store = tx.objectStore("entries");
    const request = store.getAll();
    request.onsuccess = () => {
      const today = new Date().toDateString();
      const found = request.result.some(
        (entry) =>
          entry.type === type &&
          new Date(entry.datetime).toDateString() === today
      );
      resolve(found);
    };
    request.onerror = () => resolve(false);
  });
}

// ==================== 6. تسجيل الدخول والخروج ====================
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180,
    φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180,
    Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getCheckoutType() {
  const now = new Date();
  const totalMinutes = now.getHours() * 60 + now.getMinutes();
  if (totalMinutes >= 925 && totalMinutes <= 940) return "تسجيل خروج (عادي)";
  if (totalMinutes >= 1070 && totalMinutes <= 1090) return "تسجيل خروج (إضافي)";
  return null;
}

async function checkLocationAndProceed(type) {
  if (await hasCheckedToday(type)) {
    showModal(`⚠️ لقد قمت بـ ${type} بالفعل اليوم.`);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const distance = calculateDistance(
        position.coords.latitude,
        position.coords.longitude,
        31.992754,
        36.008455
      );
      if (distance <= 100) {
        const wage = type.includes("إضافي")
          ? 13.44
          : type.includes("عادي")
          ? 9.16
          : null;
        const now = new Date();
        const entry = {
          type,
          datetime: now.toISOString(),
          date: now.toDateString(),
          wage,
        };
        saveAttendanceToDB(entry);
        showModal(`✅ تم ${type} بنجاح`);
      } else {
        showModal("❌ لا يمكنك تسجيل الحضور/الانصراف خارج موقع الشركة.");
      }
    },
    () => showModal("⚠️ لم يتمكن من الوصول للموقع."),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

checkInBtn.addEventListener("click", () =>
  checkLocationAndProceed("تسجيل دخول")
);
checkOutBtn.addEventListener("click", () => {
  const type = getCheckoutType();
  if (!type) return showModal("❌ لا يمكنك تسجيل الخروج الآن.");
  checkLocationAndProceed(type);
});

// ==================== 7. عرض السجل والراتب والخريطة ====================
function loadAttendanceLog() {
  const tx = db.transaction("entries", "readonly");
  const store = tx.objectStore("entries");
  const request = store.getAll();

  request.onsuccess = () => {
    const data = request.result;
    attendanceBody.innerHTML = "";
    if (data.length === 0) {
      showModal("لا يوجد سجلات حالياً.");
      return;
    }

    const grouped = {};

    data.forEach((entry) => {
      const dateKey = new Date(entry.datetime).toLocaleDateString("ar-EG");
      const time = new Date(entry.datetime).toLocaleTimeString("ar-EG", {
        hour: "2-digit",
        minute: "2-digit",
      });

      if (!grouped[dateKey]) grouped[dateKey] = { in: "-", out: "-", wage: 0 };

      if (entry.type === "تسجيل دخول") {
        grouped[dateKey].in = time;
      } else if (entry.type.includes("خروج")) {
        grouped[dateKey].out = `${time} (${
          entry.type.includes("إضافي") ? "إضافي" : "عادي"
        })`;
        grouped[dateKey].wage += entry.wage || 0;
      }
    });

    Object.entries(grouped).forEach(([date, info]) => {
      const row = document.createElement("tr");
      if (info.out.includes("عادي")) {
        row.style.backgroundColor = "rgba(59, 130, 246, 0.15)";
      }
      row.innerHTML = `
        <td>${date}</td>
        <td>${info.in}</td>
        <td>${info.out}</td>
        <td>${info.wage ? info.wage + " د.أ" : "-"}</td>
      `;
      attendanceBody.appendChild(row);
    });

    attendanceTable.style.display = "table";
    showLogBtn.textContent = "🔽 إخفاء السجل";
  };

  request.onerror = () => {
    showModal("❌ حدث خطأ أثناء تحميل السجل.");
  };
}

showLogBtn.addEventListener("click", () => {
  const isVisible = attendanceTable.style.display === "table";
  if (isVisible) {
    attendanceTable.style.display = "none";
    showLogBtn.textContent = "📋 عرض السجل";
  } else {
    loadAttendanceLog();
  }
});

// ==================== حساب الراتب الشهري ====================
function calculateMonthlySalary(callback) {
  const tx = db.transaction("entries", "readonly");
  const store = tx.objectStore("entries");
  const request = store.getAll();

  request.onsuccess = () => {
    const data = request.result;
    const currentMonth = new Date().getMonth();
    let workingDays = 0;

    data.forEach((entry) => {
      const entryDate = new Date(entry.datetime);
      if (
        entry.type === "تسجيل دخول" &&
        entryDate.getMonth() === currentMonth
      ) {
        workingDays++;
      }
    });

    const totalSalary = workingDays * dailyWage;
    callback({ workingDays, totalSalary });
  };
}

showSalaryBtn.addEventListener("click", () => {
  calculateMonthlySalary((result) => {
    const today = new Date();
    const monthName = today.toLocaleString("ar-EG", { month: "long" });
    const year = today.getFullYear();

    const lastDay = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    ).getDate();

    let message =
      `📊 راتب شهر ${monthName} ${year}:\n` +
      `📅 أيام العمل: ${result.workingDays}`;

    if (today.getDate() === lastDay) {
      message += `\n💰 الراتب الإجمالي: ${result.totalSalary} د.أ`;
    } else {
      message += `\n💡 سيتم عرض الراتب الكامل في نهاية الشهر.`;
    }

    showModal(message);
  });
});

// ==================== التشغيل التلقائي ====================
window.addEventListener("load", async () => {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();

  if (
    (h === 6 || (h === 7 && m === 0)) &&
    !(await hasCheckedToday("تسجيل دخول"))
  ) {
    checkLocationAndProceed("تسجيل دخول");
  }

  if (
    h === 15 &&
    m >= 25 &&
    m <= 40 &&
    !(await hasCheckedToday("تسجيل خروج (عادي)"))
  ) {
    checkLocationAndProceed("تسجيل خروج (عادي)");
  }

  if (
    ((h === 17 && m >= 50) || (h === 18 && m <= 10)) &&
    !(await hasCheckedToday("تسجيل خروج (إضافي)"))
  ) {
    checkLocationAndProceed("تسجيل خروج (إضافي)");
  }
});

// ==================== إعداد الخريطة ====================
const map = L.map("map").setView([31.992754, 36.008455], 16);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);
L.marker([31.992754, 36.008455])
  .addTo(map)
  .bindPopup("📍 موقع الشركة")
  .openPopup();
