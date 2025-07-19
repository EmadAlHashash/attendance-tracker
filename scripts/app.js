if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("service-worker.js")
      .then((reg) => console.log("✅ تم تسجيل Service Worker", reg))
      .catch((err) => console.error("❌ فشل في التسجيل", err));
  });
}
if ("serviceWorker" in navigator && "SyncManager" in window) {
  navigator.serviceWorker.ready.then((reg) => {
    reg.sync.register("auto-check");
  });
}
navigator.serviceWorker.addEventListener("message", (event) => {
  if (event.data.action === "run-auto-check") {
    autoCheck(); // دالة الحضور التلقائي اللي عندك
  }
});

// ========== قاعدة البيانات والمودال ==========
let db;

function initDB() {
  const request = indexedDB.open("attendanceDB", 1);

  request.onerror = () => showModal("⚠️ تعذر فتح قاعدة البيانات");

  request.onsuccess = (event) => {
    db = event.target.result;
    console.log("✅ قاعدة البيانات جاهزة");

    // ✅ الآن بعد فتح قاعدة البيانات، يمكن تشغيل التحقق التلقائي
    autoCheck();
    setInterval(autoCheck, 30 * 1000); // كل 30 ثانية
  };

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

// ========== عناصر الصفحة ==========
const datetimeElement = document.getElementById("datetime");
const locationStatus = document.getElementById("location-status");
const checkInBtn = document.getElementById("check-in-btn");
const checkOutBtn = document.getElementById("check-out-btn");
const showLogBtn = document.getElementById("show-log-btn");
const showSalaryBtn = document.getElementById("show-salary-btn");
const attendanceTable = document.getElementById("attendance-table");
const attendanceBody = attendanceTable.querySelector("tbody");
const dailyWage = 10;

// ========== الوقت والعد التنازلي ==========
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

  const h = now.getHours(), m = now.getMinutes();
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

// document.addEventListener("DOMContentLoaded", async () => {
//   await autoCheck();
//   await markAbsenceIfNeeded();
// });

// ========== التحقق من التكرار ==========
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

// ========== تسجيل الدخول والخروج ==========
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
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
      const now = new Date();
      const isFriday = now.getDay() === 5;
      const distance = calculateDistance(
        position.coords.latitude,
        position.coords.longitude,
        31.992754,
        36.008455
      );

      if (distance <= 100) {
        let wage = null;
        if (type.includes("إضافي")) wage = 13.44;
        else if (type.includes("عادي")) wage = 9.16;
        else if (type === "تسجيل دخول") wage = isFriday ? dailyWage * 2 : dailyWage;

        const entry = {
          type,
          datetime: now.toISOString(),
          date: now.toDateString(),
          wage,
        };
        saveAttendanceToDB(entry);

        let msg = `✅ تم ${type} بنجاح`;
        if (type === "تسجيل دخول" && isFriday) {
          msg += "\n📌 حضور يوم الجمعة - تم احتساب يومين.";
        }
        showModal(msg);
      } else {
        showModal("❌ لا يمكنك تسجيل الحضور/الانصراف خارج موقع الشركة.");
      }
    },
    () => showModal("⚠️ لم يتمكن من الوصول للموقع."),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

checkInBtn.addEventListener("click", () => checkLocationAndProceed("تسجيل دخول"));
checkOutBtn.addEventListener("click", () => {
  const type = getCheckoutType();
  if (!type) return showModal("❌ لا يمكنك تسجيل الخروج الآن.");
  checkLocationAndProceed(type);
});

// ========== تحديد الغياب إذا لم يتم الحضور ==========
async function markAbsenceIfNeeded() {
  const today = new Date();
  const day = today.getDay(); // 5 = الجمعة

  if (day === 5) return; // يوم الجمعة عطلة

  const checkedIn = await hasCheckedToday("تسجيل دخول");
  const absentMarked = await hasCheckedToday("غياب");

  if (!checkedIn && !absentMarked) {
    const entry = {
      type: "غياب",
      datetime: today.toISOString(),
      date: today.toDateString(),
      wage: 0,
    };
    saveAttendanceToDB(entry);
    console.log("🚫 تم تسجيل غياب لليوم");
  }
}

// ========== التشغيل التلقائي ==========
async function autoCheck() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();

  // تسجيل دخول (بين 6:00 و 7:00 فقط)
  if ((h === 6 || (h === 7 && m === 0)) && !(await hasCheckedToday("تسجيل دخول"))) {
    console.log("📌 تم تفعيل تسجيل دخول تلقائي");
    checkLocationAndProceed("تسجيل دخول");
  }

  // تسجيل خروج عادي (بين 15:25 و 15:40)
  if (h === 15 && m >= 25 && m <= 40 && !(await hasCheckedToday("تسجيل خروج (عادي)"))) {
    console.log("📌 تم تفعيل تسجيل خروج (عادي) تلقائي");
    checkLocationAndProceed("تسجيل خروج (عادي)");
  }

  // تسجيل خروج إضافي (بين 17:50 و 18:10)
  if (((h === 17 && m >= 50) || (h === 18 && m <= 10)) && !(await hasCheckedToday("تسجيل خروج (إضافي)"))) {
    console.log("📌 تم تفعيل تسجيل خروج (إضافي) تلقائي");
    checkLocationAndProceed("تسجيل خروج (إضافي)");
  }

  // إذا مر وقت تسجيل الدخول وما تم تسجيله → نسجل غياب تلقائيًا
  if (h >= 8 && !(await hasCheckedToday("تسجيل دخول")) && !(await hasCheckedToday("غياب"))) {
    const entry = {
      type: "غياب",
      datetime: now.toISOString(),
      date: now.toDateString(),
      wage: 0,
    };
    saveAttendanceToDB(entry);
    console.log("🚫 تم تسجيل غياب تلقائيًا");
  }
}

// ========== تنزيل السجل PDF ==========
document.getElementById("export-pdf-btn").addEventListener("click", () => {
  const tx = db.transaction("entries", "readonly");
  const store = tx.objectStore("entries");
  const request = store.getAll();

  request.onsuccess = () => {
    const data = request.result;
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
        grouped[dateKey].out = `${time} (${entry.type.includes("إضافي") ? "إضافي" : "عادي"})`;
        grouped[dateKey].wage += entry.wage || 0;
      } else if (entry.type === "غياب") {
        grouped[dateKey].in = "🚫 غياب";
      }
    });

    const rows = Object.entries(grouped).map(([date, info]) => [
      date,
      info.in,
      info.out,
      info.wage ? info.wage.toFixed(2) + " د.أ" : "-",
    ]);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFont("Helvetica");
    doc.setFontSize(18);
    doc.text("سجل الحضور الشهري", doc.internal.pageSize.getWidth() / 2, 20, { align: "center" });

    doc.autoTable({
      startY: 30,
      head: [["📅 التاريخ", "🕓 وقت الدخول", "🕘 وقت الخروج", "💰 الأجر"]],
      body: rows,
      styles: { halign: "center" },
      headStyles: { fillColor: "#eeeeee", fontStyle: "bold" },
      alternateRowStyles: { fillColor: "#f9f9f9" },
      columnStyles: { 0: { halign: "right" } },
    });

    doc.save("سجل_الحضور.pdf");
  };
});




// ========== عرض السجل ==========
function loadAttendanceLog() {
  const tx = db.transaction("entries", "readonly");
  const store = tx.objectStore("entries");
  const request = store.getAll();

  request.onerror = () => {
    showModal("❌ حدث خطأ أثناء تحميل السجل.");
  };

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
        grouped[dateKey].out = `${time} (${entry.type.includes("إضافي") ? "إضافي" : "عادي"})`;
        grouped[dateKey].wage += entry.wage || 0;
      } else if (entry.type === "غياب") {
        grouped[dateKey].in = "🚫 غياب";
      }
    });

    Object.entries(grouped).forEach(([date, info]) => {
      const row = document.createElement("tr");
      if (info.in === "🚫 غياب") {
        row.style.backgroundColor = "rgba(255, 0, 0, 0.1)";
      } else if (info.out.includes("عادي")) {
        row.style.backgroundColor = "rgba(59, 130, 246, 0.15)";
      }
      row.innerHTML = `
        <td>${date}</td>
        <td>${info.in}</td>
        <td>${info.out}</td>
        <td>${info.wage ? info.wage.toFixed(2) + " د.أ" : "-"}</td>
      `;
      attendanceBody.appendChild(row);
    });

    attendanceTable.style.display = "table";
    showLogBtn.textContent = "🔽 إخفاء السجل";
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

// ========== حساب الراتب ==========
function calculateMonthlySalary(callback) {
  const tx = db.transaction("entries", "readonly");
  const store = tx.objectStore("entries");
  const request = store.getAll();

  request.onsuccess = () => {
    const data = request.result;
    const currentMonth = new Date().getMonth();
    let totalSalary = 0;
    let workingDays = 0;

    const seenDates = new Set();

    data.forEach((entry) => {
      const entryDate = new Date(entry.datetime);
      const monthMatches = entryDate.getMonth() === currentMonth;
      const entryDay = entryDate.toDateString();

      if (monthMatches && entry.wage) {
        totalSalary += entry.wage;

        // نعد يوم العمل مرة وحدة فقط (بغض النظر عن عدد الإدخالات فيه)
        if (!seenDates.has(entryDay)) {
          seenDates.add(entryDay);
          workingDays++;
        }
      }
    });

    callback({ totalSalary, workingDays });
  };
}

showSalaryBtn.addEventListener("click", () => {
  calculateMonthlySalary((result) => {
    const today = new Date();
    const monthName = today.toLocaleString("ar-EG", { month: "long" });
    const year = today.getFullYear();
    const lastDay = new Date(year, today.getMonth() + 1, 0).getDate();

    let message =
      `📊 راتب شهر ${monthName} ${year}:\n` +
      `💰 الراتب الحالي: ${result.totalSalary.toFixed(2)} د.أ`;

        if (today.getDate() !== lastDay) {
      message += `\n💡 سيتم عرض الراتب الكامل في نهاية الشهر.`;
    }

    showModal(message);
  });
});
// ========== إعداد الخريطة ==========
const map = L.map("map").setView([31.992754, 36.008455], 16);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

L.marker([31.992754, 36.008455])
  .addTo(map)
  .bindPopup("📍 موقع الشركة")
  .openPopup();

// ========== الموقع الجغرافي ==========
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