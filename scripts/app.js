// // دالة عرض المودال
// function showModal(message) {
//   document.getElementById("modal-message").innerText = message;
//   document.getElementById("modal").classList.remove("hidden");
// }
// function closeModal() {
//   document.getElementById("modal").classList.add("hidden");
// }

// // نحضر العناصر من الصفحة
// const datetimeElement = document.getElementById("datetime");
// const locationStatus = document.getElementById("location-status");
// const checkInBtn = document.getElementById("check-in-btn");
// const checkOutBtn = document.getElementById("check-out-btn");
// const showLogBtn = document.getElementById("show-log-btn");
// const attendanceTable = document.getElementById("attendance-table");
// const attendanceBody = attendanceTable.querySelector("tbody");

// // نخفي الأزرار مبدئيًا
// checkInBtn.style.display = "none";
// checkOutBtn.style.display = "none";

// const dailyWage = 10; // يمكنك تغييره حسب الراتب اليومي
  
// // عرض التاريخ والوقت
// function updateDateTime() {
//   const now = new Date();
//   const options = {
//     weekday: "long",
//     year: "numeric",
//     month: "long",
//     day: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//   };
//   datetimeElement.textContent = now.toLocaleDateString("ar-EG", options);

//   const hours = now.getHours();
//   const minutes = now.getMinutes();

//   // إظهار زر تسجيل الدخول فقط في الساعة 6 أو 7:00
//   if (hours === 6 || (hours === 7 && minutes === 0)) {
//     checkInBtn.style.display = "block";
//   } else {
//     checkInBtn.style.display = "none";
//   }

//   // إظهار زر تسجيل الخروج العادي بعد 15:30
//   if (hours === 15 && minutes >= 30) {
//     checkOutBtn.textContent = "تسجيل خروج (عادي)";
//     checkOutBtn.style.display = "block";
//   }

//   // إظهار زر تسجيل الخروج الإضافي عند 18:00
//   if (hours === 18 && minutes === 0) {
//     checkOutBtn.textContent = "تسجيل خروج (إضافي)";
//     checkOutBtn.style.display = "block";
//   }

//   // إخفاء زر تسجيل الخروج إذا الوقت غير مناسب
//   if (!((hours === 15 && minutes >= 30) || (hours === 18 && minutes === 0))) {
//     checkOutBtn.style.display = "none";
//   }
// }
// function getNextActionTime() {
//   const now = new Date();
//   const today = now.toDateString();

//   const windows = [
//     { label: "تسجيل دخول", hour: 6, minute: 0 },
//     { label: "تسجيل دخول", hour: 7, minute: 0 },
//     { label: "تسجيل خروج (عادي)", hour: 15, minute: 30 },
//     { label: "تسجيل خروج (إضافي)", hour: 18, minute: 0 },
//   ];

//   for (const w of windows) {
//     const target = new Date();
//     target.setHours(w.hour, w.minute, 0, 0);
//     if (target > now) return { label: w.label, time: target };
//   }

//   return null;
// }

// function updateCountdown() {
//   const countdownEl = document.getElementById("countdown");
//   const next = getNextActionTime();

//   if (!next) {
//     countdownEl.textContent = "✅ لا توجد عمليات متاحة حالياً.";
//     return;
//   }

//   const now = new Date();
//   const diff = next.time - now;

//   if (diff <= 0) {
//     countdownEl.textContent = `✅ حان وقت ${next.label}`;
//     return;
//   }

//   const mins = Math.floor(diff / 60000);
//   const secs = Math.floor((diff % 60000) / 1000);
//   countdownEl.textContent = `⏳ الوقت المتبقي حتى ${next.label}: ${mins} دقيقة و ${secs} ثانية`;
// }

// setInterval(updateCountdown, 1000);
// updateCountdown();
// updateDateTime();
// setInterval(updateDateTime, 60000);

// // تحديد الموقع
// if ("geolocation" in navigator) {
//   navigator.geolocation.getCurrentPosition(
//     (position) => {
//       const lat = position.coords.latitude.toFixed(6);
//       const lng = position.coords.longitude.toFixed(6);
//       fetch(
//         `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`
//       )
//         .then((res) => res.json())
//         .then((data) => {
//           const locationName =
//             data.address.city ||
//             data.address.town ||
//             data.address.village ||
//             data.address.suburb ||
//             "موقع غير معروف";
//           locationStatus.textContent = `📍 الموقع الحالي: ${locationName}`;
//         })
//         .catch(() => {
//           locationStatus.textContent = "📍 تعذر تحديد اسم الموقع";
//         });
//       F;
//     },
//     (error) => {
//       locationStatus.textContent = "❌ فشل في تحديد الموقع";
//       locationStatus.classList.remove("text-green-300");
//       locationStatus.classList.add("text-red-500");
//     }
//   );
// } else {
//   locationStatus.textContent = "❌ الموقع غير مدعوم في هذا الجهاز";
//   locationStatus.classList.remove("text-green-300");
//   locationStatus.classList.add("text-yellow-400");
// }

// // التعامل مع LocalStorage
// function getAttendanceData() {
//   const data = localStorage.getItem("attendanceLog");
//   return data ? JSON.parse(data) : [];
// }

// function saveAttendanceEntry(type, wage = null) {
//   const now = new Date();
//   const entry = {
//     type,
//     datetime: now.toLocaleString("ar-EG"),
//     wage,
//   };
//   const log = getAttendanceData();
//   log.push(entry);
//   localStorage.setItem("attendanceLog", JSON.stringify(log));

//   // إرسال إلى Google Sheet
//   sendToGoogleSheet({
//     date: now.toLocaleDateString("ar-EG"),
//     type: type,
//     time: now.toLocaleTimeString("ar-EG"),
//     wage: wage ?? "",
//   });
// }

// function sendToGoogleSheet(data) {
//   const webhookURL =
//     "https://script.google.com/macros/s/AKfycbzVOlaXDnrWSOPrQC36DQljYV_2KtS0UsBwHVqvO7fIHe3SAAiEGVYPQQf4CDwAGnY5yg/exec";
//   fetch(webhookURL, {
//     method: "POST",
//     body: JSON.stringify(data),
//     headers: { "Content-Type": "application/json" },
//   })
//     .then((res) => res.text())
//     .then((response) => console.log("Google Sheet Response:", response))
//     .catch((err) => console.error("Error:", err));
// }

// // زر عرض السجل
// showLogBtn.addEventListener("click", () => {
//   const data = getAttendanceData();
//   attendanceBody.innerHTML = "";

//   if (data.length === 0) {
//     showModal("لا يوجد سجلات حالياً.");
//     return;
//   }

//   // تجميع السجلات حسب التاريخ
//   const grouped = {};

//   data.forEach((entry) => {
//     const dateKey = new Date(entry.datetime).toLocaleDateString("ar-EG");
//     const time = new Date(entry.datetime).toLocaleTimeString("ar-EG", {
//       hour: "2-digit",
//       minute: "2-digit",
//     });

//     if (!grouped[dateKey]) {
//       grouped[dateKey] = { in: "-", out: "-", wage: 0 };
//     }

//     if (entry.type === "تسجيل دخول") {
//       grouped[dateKey].in = time;
//     } else if (entry.type.includes("خروج")) {
//       grouped[dateKey].out = `${time} (${
//         entry.type.includes("إضافي") ? "إضافي" : "عادي"
//       })`;
//       grouped[dateKey].wage += entry.wage || 0;
//     }
//   });

//   // عرض الصفوف
//   Object.entries(grouped).forEach(([date, info]) => {
//     const row = document.createElement("tr");
//     row.innerHTML = `
//       <td>${date}</td>
//       <td>${info.in}</td>
//       <td>${info.out}</td>
//       <td>${info.wage ? info.wage + " د.أ" : "-"}</td>
//     `;
//     attendanceBody.appendChild(row);
//   });

//   attendanceTable.style.display = "table";
// });

// // الموقع الجغرافي للشركة
// const companyLocation = {
//   lat: 31.992754,
//   lng: 36.008455,
// };

// // دالة حساب المسافة
// function calculateDistance(lat1, lon1, lat2, lon2) {
//   const earthRadius = 6371e3; // بالمتر
//   const lat1Rad = (lat1 * Math.PI) / 180;
//   const lat2Rad = (lat2 * Math.PI) / 180;
//   const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
//   const deltaLon = ((lon2 - lon1) * Math.PI) / 180;

//   const a =
//     Math.sin(deltaLat / 2) ** 2 +
//     Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLon / 2) ** 2;

//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return earthRadius * c;
// }

// function getCheckoutType() {
//   const now = new Date();
//   const hour = now.getHours();
//   const minute = now.getMinutes();
//   const totalMinutes = hour * 60 + minute;

//   const normalOutStart = 15 * 60 + 25; // 15:25
//   const normalOutEnd = 15 * 60 + 40; // 15:40
//   const extraOutStart = 17 * 60 + 50; // 17:50
//   const extraOutEnd = 18 * 60 + 10; // 18:10

//   if (totalMinutes >= normalOutStart && totalMinutes <= normalOutEnd) {
//     return "تسجيل خروج (عادي)";
//   } else if (totalMinutes >= extraOutStart && totalMinutes <= extraOutEnd) {
//     return "تسجيل خروج (إضافي)";
//   } else {
//     return null;
//   }
// }

// // التحقق من الموقع ثم الحفظ
// function checkLocationAndProceed(type) {
//   if (!navigator.geolocation) {
//     showModal("🌍 المتصفح لا يدعم تحديد الموقع الجغرافي.");
//     return;
//   }

//   navigator.geolocation.getCurrentPosition(
//     (position) => {
//       const userLat = position.coords.latitude;
//       const userLng = position.coords.longitude;

//       const distance = calculateDistance(
//         userLat,
//         userLng,
//         companyLocation.lat,
//         companyLocation.lng
//       );

//       if (distance <= 100) {
//         let wage = null;

//         if (type.includes("خروج")) {
//           if (type.includes("عادي")) {
//             wage = 10;
//           } else if (type.includes("إضافي")) {
//             wage = 15;
//           }
//         }

//         saveAttendanceEntry(type, wage);
//         showModal(`✅ تم ${type} بنجاح`);
//       } else {
//         showModal("❌ لا يمكنك تسجيل الحضور/الانصراف خارج موقع الشركة.");
//       }
//     },
//     () => {
//       showModal("⚠️ لم يتمكن من الوصول للموقع. الرجاء السماح بالموقع.");
//     }
//   );
// }

// // ربط الأزرار
// checkInBtn.addEventListener("click", () => {
//   if (hasCheckedInToday()) {
//     showModal("⚠️ لقد قمت بتسجيل الدخول بالفعل اليوم.");
//   } else {
//     checkLocationAndProceed("تسجيل دخول");
//   }
// });

// checkOutBtn.addEventListener("click", () => {
//   const checkoutType = getCheckoutType();
//   if (!checkoutType) {
//     showModal("❌ لا يمكنك تسجيل الخروج الآن. الوقت غير مسموح.");
//   } else if (hasCheckedOutToday(checkoutType)) {
//     showModal(`⚠️ لقد قمت بـ${checkoutType} بالفعل اليوم.`);
//   } else {
//     checkLocationAndProceed(checkoutType);
//   }
// });

// // تحديد نقطة الشركة
// const companyCoords = [31.992754, 36.008455];

// // رسم الخريطة باستخدام Leaflet
// const map = L.map("map").setView(companyCoords, 16);
// L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//   attribution: "&copy; OpenStreetMap",
// }).addTo(map);
// L.marker(companyCoords)
//   .addTo(map)
//   .bindPopup("📍 موقع الشركة المعتمد")
//   .openPopup();

// // حساب الراتب الشهري
// function calculateMonthlyWage() {
//   const log = getAttendanceData();
//   const currentDate = new Date();
//   let total = 0;

//   log.forEach((entry) => {
//     const entryDate = new Date(entry.datetime);
//     const sameMonth =
//       entryDate.getMonth() === currentDate.getMonth() &&
//       entryDate.getFullYear() === currentDate.getFullYear();

//     if (sameMonth && entry.wage !== null) {
//       total += entry.wage;
//     }
//   });

//   return total;
// }

// // التحقق من نهاية الشهر وحساب الراتب
// function checkEndOfMonthAndCalculate() {
//   const now = new Date();
//   const isLastDay =
//     new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() ===
//     now.getDate();
//   const calculatedDay = localStorage.getItem("lastMonthlyCalculationDate");

//   if (isLastDay && calculatedDay !== now.toDateString()) {
//     const total = calculateMonthlyWage();
//     showModal(`📊 الراتب الشهري لهذا الشهر هو: ${total} د.أ`);
//     localStorage.setItem("lastMonthlyCalculationDate", now.toDateString());
//     const backup = getAttendanceData();
//     localStorage.setItem(
//       "attendanceLog_backup_" + now.getMonth(),
//       JSON.stringify(backup)
//     );
//     localStorage.removeItem("attendanceLog");
//   }
// }
// checkEndOfMonthAndCalculate();

// // حساب الراتب بناءً على أيام الحضور
// function calculateMonthlySalary() {
//   const log = getAttendanceData();
//   const currentMonth = new Date().getMonth();
//   let workingDays = 0;

//   log.forEach((entry) => {
//     const entryDate = new Date(entry.datetime);
//     if (entry.type === "تسجيل دخول" && entryDate.getMonth() === currentMonth) {
//       workingDays++;
//     }
//   });

//   const totalSalary = workingDays * dailyWage;
//   return { workingDays, totalSalary };
// }

// // زر عرض الراتب الشهري
// document.getElementById("show-salary-btn").addEventListener("click", () => {
//   const result = calculateMonthlySalary();
//   const currentMonth = new Date().toLocaleString("ar-EG", { month: "long" });
//   showModal(
//     `شهر ${currentMonth}:\n` +
//       `أيام العمل: ${result.workingDays}\n` +
//       `الراتب الإجمالي: ${result.totalSalary} د.أ`
//   );
// });

// // ميزة التشغيل التلقائي عند فتح الصفحة
// window.addEventListener("load", () => {
//   const now = new Date();
//   const hours = now.getHours();
//   const minutes = now.getMinutes();

//   if (hours === 6 || (hours === 7 && minutes === 0)) {
//     checkLocationAndProceed("تسجيل دخول");
//   }
//   if (hours === 15 && minutes >= 25 && minutes <= 40) {
//     checkLocationAndProceed("تسجيل خروج (عادي)");
//   }
//   if ((hours === 17 && minutes >= 50) || (hours === 18 && minutes <= 10)) {
//     checkLocationAndProceed("تسجيل خروج (إضافي)");
//   }
// });

// function hasCheckedInToday() {
//   const log = getAttendanceData();
//   const today = new Date().toDateString();
//   return log.some((entry) => {
//     const entryDate = new Date(entry.datetime).toDateString();
//     return entry.type === "تسجيل دخول" && entryDate === today;
//   });
// }
// function hasCheckedOutToday(type) {
//   const log = getAttendanceData();
//   const today = new Date().toDateString();
//   return log.some((entry) => {
//     const entryDate = new Date(entry.datetime).toDateString();
//     return entry.type === type && entryDate === today;
//   });
// }

// window.addEventListener("load", () => {
//   const now = new Date();
//   const hours = now.getHours();
//   const minutes = now.getMinutes();

//   if ((hours === 6 || (hours === 7 && minutes === 0)) && !hasCheckedInToday()) {
//     checkLocationAndProceed("تسجيل دخول");
//   }
//   if (
//     hours === 15 &&
//     minutes >= 25 &&
//     minutes <= 40 &&
//     !hasCheckedOutToday("تسجيل خروج (عادي)")
//   ) {
//     checkLocationAndProceed("تسجيل خروج (عادي)");
//   }
//   if (
//     ((hours === 17 && minutes >= 50) || (hours === 18 && minutes <= 10)) &&
//     !hasCheckedOutToday("تسجيل خروج (إضافي)")
//   ) {
//     checkLocationAndProceed("تسجيل خروج (إضافي)");
//   }
// });

// navigator.geolocation.getCurrentPosition((position) => {
//   const userCoords = [position.coords.latitude, position.coords.longitude];
//   L.marker(userCoords).addTo(map).bindPopup("📍 موقعك الحالي").openPopup();
// });


// ==================== المتغيرات الأساسية ====================
let testMode = false;
const checkInBtn = document.getElementById("check-in-btn");
const checkOutBtn = document.getElementById("check-out-btn");
const showLogBtn = document.getElementById("show-log-btn");
const showSalaryBtn = document.getElementById("show-salary-btn");
const toggleTestBtn = document.getElementById("toggle-test-mode");
const attendanceTable = document.getElementById("attendance-table");
const attendanceBody = attendanceTable.querySelector("tbody");
const locationStatus = document.getElementById("location-status");
const datetimeElement = document.getElementById("datetime");

// ==================== عرض التاريخ والوقت ====================
function updateDateTime() {
  const now = new Date();
  datetimeElement.textContent = now.toLocaleDateString("ar-EG", {
    weekday: "long", year: "numeric", month: "long",
    day: "numeric", hour: "2-digit", minute: "2-digit"
  });

  const h = now.getHours();
  const m = now.getMinutes();

  // عرض زر الدخول
  if (testMode || (h === 1 && m >= 0 && m <= 5)) {
    checkInBtn.style.display = "block";
  } else {
    checkInBtn.style.display = "none";
  }

  // عرض زر الخروج
  if (testMode) {
    checkOutBtn.style.display = "block";
    checkOutBtn.textContent = "تسجيل خروج (عادي) / (إضافي)";
  } else if (h === 1 && m >= 6 && m <= 7) {
    checkOutBtn.style.display = "block";
    checkOutBtn.textContent = "تسجيل خروج (عادي)";
  } else if (h === 1 && m >= 8 && m <= 10) {
    checkOutBtn.style.display = "block";
    checkOutBtn.textContent = "تسجيل خروج (إضافي)";
  } else {
    checkOutBtn.style.display = "none";
  }
}
updateDateTime();
setInterval(updateDateTime, 60000);

// ==================== الموقع الجغرافي ====================
if ("geolocation" in navigator) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude.toFixed(6);
      const lng = position.coords.longitude.toFixed(6);
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`)
        .then(res => res.json())
        .then(data => {
          const name = data.address.city || data.address.town || data.address.village || data.address.suburb || "موقع غير معروف";
          locationStatus.textContent = `📍 الموقع الحالي: ${name}`;
        })
        .catch(() => locationStatus.textContent = "📍 تعذر تحديد اسم الموقع");
    },
    () => locationStatus.textContent = "❌ فشل في تحديد الموقع",
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
} else {
  locationStatus.textContent = "❌ الموقع غير مدعوم";
}

// ==================== زر تفعيل وضع التجربة ====================
toggleTestBtn.addEventListener("click", () => {
  testMode = !testMode;
  showModal(testMode ? "🧪 تم تفعيل وضع التجربة" : "✅ تم إيقاف وضع التجربة");
  updateDateTime();
});


// ==================== التخزين ====================
function getAttendanceData() {
  return JSON.parse(localStorage.getItem("attendanceLog") || "[]");
}

function saveAttendanceEntry(type, wage = null) {
  const now = new Date();
  const entry = {
    type,
    datetime: now.toISOString(), // ✅ صيغة موحدة لتجنب "Invalid Date"
    wage
  };
  const log = getAttendanceData();
  log.push(entry);
  localStorage.setItem("attendanceLog", JSON.stringify(log));

  sendToGoogleSheet({
    date: now.toLocaleDateString("ar-EG"),
    type: type,
    time: now.toLocaleTimeString("ar-EG"),
    wage: wage ?? ""
  });
}

// ==================== الإرسال إلى Google Sheets ====================
function sendToGoogleSheet(data) {
  const url = "https://script.google.com/macros/s/AKfycbzVOlaXDnrWSOPrQC36DQljYV_2KtS0UsBwHVqvO7fIHe3SAAiEGVYPQQf4CDwAGnY5yg/exec";
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
    .then(res => res.text())
    .then(response => console.log("✅ Google Sheet:", response))
    .catch(err => console.error("❌ Error:", err));
}

// ==================== التحقق من التكرار ====================
function hasCheckedInToday() {
  const today = new Date().toDateString();
  return getAttendanceData().some(e => new Date(e.datetime).toDateString() === today && e.type === "تسجيل دخول");
}

function hasCheckedOutToday(type) {
  const today = new Date().toDateString();
  return getAttendanceData().some(e => new Date(e.datetime).toDateString() === today && e.type === type);
}

// ==================== التحقق من الموقع ====================
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function checkLocationAndProceed(type) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;
      const companyLat = 31.992754;
      const companyLng = 36.008455;
      const distance = calculateDistance(userLat, userLng, companyLat, companyLng);

      if (distance <= 100 || testMode) {
        let wage = null;
        if (type.includes("خروج")) {
          wage = type.includes("إضافي") ? 15 : 10;
        }
        saveAttendanceEntry(type, wage);
        showModal(`✅ تم ${type} بنجاح`);
      } else {
        showModal("❌ لا يمكنك التسجيل خارج موقع الشركة.");
      }
    },
    () => showModal("⚠️ لم يتمكن من تحديد الموقع"),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

// ==================== الأزرار ====================
checkInBtn.addEventListener("click", () => {
  if (hasCheckedInToday()) {
    showModal("⚠️ لقد قمت بتسجيل الدخول بالفعل اليوم.");
  } else {
    checkLocationAndProceed("تسجيل دخول");
  }
});

checkOutBtn.addEventListener("click", () => {
  const now = new Date();
  const m = now.getMinutes();
  let type = "تسجيل خروج (عادي)";
  if (m >= 8 && m <= 10) type = "تسجيل خروج (إضافي)";
  if (hasCheckedOutToday(type)) {
    showModal(`⚠️ لقد قمت بـ${type} بالفعل اليوم.`);
  } else {
    checkLocationAndProceed(type);
  }
});

// ==================== عرض السجل ====================
showLogBtn.addEventListener("click", () => {
  const data = getAttendanceData();
  attendanceBody.innerHTML = "";

  if (data.length === 0) {
    showModal("لا يوجد سجلات حالياً.");
    return;
  }

  const grouped = {};
  data.forEach(entry => {
    const dateKey = new Date(entry.datetime).toLocaleDateString("ar-EG");
    const time = new Date(entry.datetime).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });

    if (!grouped[dateKey]) grouped[dateKey] = { in: "-", out: "-", wage: 0 };

    if (entry.type === "تسجيل دخول") {
      grouped[dateKey].in = time;
    } else if (entry.type.includes("خروج")) {
      grouped[dateKey].out = `${time} (${entry.type.includes("إضافي") ? "إضافي" : "عادي"})`;
      grouped[dateKey].wage += entry.wage || 0;
    }
  });

  Object.entries(grouped).forEach(([date, info]) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${date}</td>
      <td>${info.in}</td>
      <td>${info.out}</td>
      <td>${info.wage ? info.wage + " د.أ" : "-"}</td>
    `;
    attendanceBody.appendChild(row);
  });

  attendanceTable.style.display = "table";
});

// ==================== المودال ====================
function showModal(message) {
  const modal = document.getElementById("modal");
  const messageEl = document.getElementById("modal-message");
  messageEl.textContent = message;
  modal.classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}