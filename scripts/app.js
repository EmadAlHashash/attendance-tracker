// دالة عرض المودال
function showModal(message) {
  document.getElementById("modal-message").innerText = message;
  document.getElementById("modal").classList.remove("hidden");
}
function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}

// نحضر العناصر من الصفحة
const datetimeElement = document.getElementById("datetime");
const locationStatus = document.getElementById("location-status");
const checkInBtn = document.getElementById("check-in-btn");
const checkOutBtn = document.getElementById("check-out-btn");
const showLogBtn = document.getElementById("show-log-btn");
const attendanceTable = document.getElementById("attendance-table");
const attendanceBody = attendanceTable.querySelector("tbody");

// نخفي الأزرار مبدئيًا
checkInBtn.style.display = "none";
checkOutBtn.style.display = "none";

const dailyWage = 10; // يمكنك تغييره حسب الراتب اليومي

// عرض التاريخ والوقت
function updateDateTime() {
  const now = new Date();
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  datetimeElement.textContent = now.toLocaleDateString("ar-EG", options);

  const hours = now.getHours();
  const minutes = now.getMinutes();

  // إظهار زر تسجيل الدخول فقط في الساعة 6 أو 7:00
  if (hours === 6 || (hours === 7 && minutes === 0)) {
    checkInBtn.style.display = "block";
  } else {
    checkInBtn.style.display = "none";
  }

  // إظهار زر تسجيل الخروج العادي بعد 15:30
  if (hours === 15 && minutes >= 30) {
    checkOutBtn.textContent = "تسجيل خروج (عادي)";
    checkOutBtn.style.display = "block";
  }

  // إظهار زر تسجيل الخروج الإضافي عند 18:00
  if (hours === 18 && minutes === 0) {
    checkOutBtn.textContent = "تسجيل خروج (إضافي)";
    checkOutBtn.style.display = "block";
  }

  // إخفاء زر تسجيل الخروج إذا الوقت غير مناسب
  if (
    !(
      (hours === 15 && minutes >= 30) ||
      (hours === 18 && minutes === 0)
    )
  ) {
    checkOutBtn.style.display = "none";
  }
}
updateDateTime();
setInterval(updateDateTime, 60000);

// تحديد الموقع
if ("geolocation" in navigator) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      locationStatus.textContent = "✅ الموقع تم تحديده بنجاح";
      locationStatus.classList.remove("text-green-300");
      locationStatus.classList.add("text-green-500");
    },
    (error) => {
      locationStatus.textContent = "❌ فشل في تحديد الموقع";
      locationStatus.classList.remove("text-green-300");
      locationStatus.classList.add("text-red-500");
    }
  );
} else {
  locationStatus.textContent = "❌ الموقع غير مدعوم في هذا الجهاز";
  locationStatus.classList.remove("text-green-300");
  locationStatus.classList.add("text-yellow-400");
}

// التعامل مع LocalStorage
function getAttendanceData() {
  const data = localStorage.getItem("attendanceLog");
  return data ? JSON.parse(data) : [];
}

function saveAttendanceEntry(type, wage = null) {
  const now = new Date();
  const entry = {
    type,
    datetime: now.toLocaleString('ar-EG'),
    wage
  };
  const log = getAttendanceData();
  log.push(entry);
  localStorage.setItem("attendanceLog", JSON.stringify(log));

  // إرسال إلى Google Sheet
  sendToGoogleSheet({
    type: "attendance",
    date: now.toLocaleDateString('ar-EG'),
    entryType: type,
    time: now.toLocaleTimeString('ar-EG'),
    dailyWage: wage
  });
}

function sendToGoogleSheet(data) {
  const webhookURL = "https://script.google.com/macros/s/AKfycbzVOlaXDnrWSOPrQC36DQljYV_2KtS0UsBwHVqvO7fIHe3SAAiEGVYPQQf4CDwAGnY5yg/exec";

  fetch(webhookURL, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json"
    }
  }).then(res => res.text())
    .then(response => console.log("Google Sheet Response:", response))
    .catch(err => console.error("Error:", err));
}

// زر عرض السجل
showLogBtn.addEventListener("click", () => {
  const data = getAttendanceData();
  attendanceBody.innerHTML = "";

  if (data.length === 0) {
    showModal("لا يوجد سجلات حالياً.");
    return;
  }

  data.forEach((entry) => {
    const row = document.createElement("tr");

    const typeCell = document.createElement("td");
    typeCell.textContent = entry.type;

    const timeCell = document.createElement("td");
    timeCell.textContent = entry.datetime;

    const wageCell = document.createElement("td");
    wageCell.textContent = entry.wage !== null ? `${entry.wage} د.أ` : "-";

    row.appendChild(typeCell);
    row.appendChild(timeCell);
    row.appendChild(wageCell);
    attendanceBody.appendChild(row);
  });

  attendanceTable.style.display = "table";
});

// الموقع الجغرافي للشركة
const companyLocation = {
  lat: 31.992754,
  lng: 36.008455,
};

// دالة حساب المسافة
function calculateDistance(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371e3; // بالمتر
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

function getCheckoutType() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const totalMinutes = hour * 60 + minute;

  const normalOutStart = 15 * 60 + 25; // 15:25
  const normalOutEnd = 15 * 60 + 40; // 15:40

  const extraOutStart = 17 * 60 + 50; // 17:50
  const extraOutEnd = 18 * 60 + 10; // 18:10

  if (totalMinutes >= normalOutStart && totalMinutes <= normalOutEnd) {
    return "تسجيل خروج (عادي)";
  } else if (totalMinutes >= extraOutStart && totalMinutes <= extraOutEnd) {
    return "تسجيل خروج (إضافي)";
  } else {
    return null;
  }
}

// التحقق من الموقع ثم الحفظ
function checkLocationAndProceed(type) {
  if (!navigator.geolocation) {
    showModal("🌍 المتصفح لا يدعم تحديد الموقع الجغرافي.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;

      const distance = calculateDistance(
        userLat,
        userLng,
        companyLocation.lat,
        companyLocation.lng
      );

      if (distance <= 100) {
        let wage = null;

        if (type.includes("خروج")) {
          if (type.includes("عادي")) {
            wage = 10;
          } else if (type.includes("إضافي")) {
            wage = 15;
          }
        }

        saveAttendanceEntry(type, wage);
        showModal(`✅ تم ${type} بنجاح`);
      } else {
        showModal("❌ لا يمكنك تسجيل الحضور/الانصراف خارج موقع الشركة.");
      }
    },
    () => {
      showModal("⚠️ لم يتمكن من الوصول للموقع. الرجاء السماح بالموقع.");
    }
  );
}

// ربط الأزرار
checkInBtn.addEventListener("click", () => {
  checkLocationAndProceed("تسجيل دخول");
});
checkOutBtn.addEventListener("click", () => {
  const checkoutType = getCheckoutType();
  if (checkoutType) {
    checkLocationAndProceed(checkoutType);
  } else {
    showModal("❌ لا يمكنك تسجيل الخروج الآن. الوقت غير مسموح.");
  }
});

// تحديد نقطة الشركة
const companyCoords = [31.992754, 36.008455];

// رسم الخريطة باستخدام Leaflet
const map = L.map("map").setView(companyCoords, 16);

// الخلفية
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap",
}).addTo(map);

// ماركر موقع الشركة
L.marker(companyCoords)
  .addTo(map)
  .bindPopup("📍 موقع الشركة المعتمد")
  .openPopup();

// حساب الراتب الشهري
function calculateMonthlyWage() {
  const log = getAttendanceData();
  const currentDate = new Date();

  let total = 0;

  log.forEach((entry) => {
    const entryDate = new Date(entry.datetime);
    const sameMonth =
      entryDate.getMonth() === currentDate.getMonth() &&
      entryDate.getFullYear() === currentDate.getFullYear();

    if (sameMonth && entry.wage !== null) {
      total += entry.wage;
    }
  });

  return total;
}

// التحقق من نهاية الشهر وحساب الراتب
function checkEndOfMonthAndCalculate() {
  const now = new Date();
  const isLastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() === now.getDate();

  const calculatedToday = localStorage.getItem("lastMonthlyCalculationDate");

  if (isLastDay && calculatedToday !== now.toDateString()) {
    const total = calculateMonthlyWage();

    showModal(`📊 الراتب الشهري لهذا الشهر هو: ${total} د.أ`);

    // حفظ تاريخ العملية حتى لا تتكرر بنفس اليوم
    localStorage.setItem("lastMonthlyCalculationDate", now.toDateString());

    // (اختياري) حفظ نسخة احتياطية قبل الحذف
    const backup = getAttendanceData();
    localStorage.setItem("attendanceLog_backup_" + now.getMonth(), JSON.stringify(backup));

    // (اختياري) إعادة تعيين السجلات
    localStorage.removeItem("attendanceLog");
  }
}
checkEndOfMonthAndCalculate();

// حساب الراتب بناءً على أيام الحضور
function calculateMonthlySalary() {
  const log = getAttendanceData();
  const currentMonth = new Date().getMonth();
  let workingDays = 0;

  log.forEach(entry => {
    const entryDate = new Date(entry.datetime);
    if (entry.type === "تسجيل دخول" && entryDate.getMonth() === currentMonth) {
      workingDays++;
    }
  });

  const totalSalary = workingDays * dailyWage;
  return {
    workingDays,
    totalSalary
  };
}

// زر عرض الراتب الشهري
document.getElementById("show-salary-btn").addEventListener("click", () => {
  const result = calculateMonthlySalary();
  const currentMonth = new Date().toLocaleString("ar-EG", { month: "long" });

  showModal(
    `شهر ${currentMonth}:\n` +
    `أيام العمل: ${result.workingDays}\n` +
    `الراتب الإجمالي: ${result.totalSalary} د.أ`
  );
});

// -- ميزة التشغيل التلقائي عند فتح الصفحة --

window.addEventListener("load", () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  // محاولة تسجيل الدخول تلقائياً إذا الوقت 6:00 أو 7:00
  if (hours === 6 || (hours === 7 && minutes === 0)) {
    checkLocationAndProceed("تسجيل دخول");
  }

  // محاولة تسجيل الخروج العادي تلقائياً إذا الوقت بين 15:25 و 15:40
  if (hours === 15 && minutes >= 25 && minutes <= 40) {
    checkLocationAndProceed("تسجيل خروج (عادي)");
  }

  // محاولة تسجيل الخروج الإضافي تلقائياً إذا الوقت بين 17:50 و 18:10
  if (hours === 17 && minutes >= 50 || (hours === 18 && minutes <= 10)) {
    checkLocationAndProceed("تسجيل خروج (إضافي)");
  }
});
