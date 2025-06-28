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

// عرض التاريخ والوقت
function updateDateTime() {
  const now = new Date();
  const options = {
    weekday: 'long', year: 'numeric', month: 'long',
    day: 'numeric', hour: '2-digit', minute: '2-digit'
  };
  datetimeElement.textContent = now.toLocaleDateString('ar-EG', options);

  const hours = now.getHours();
  const minutes = now.getMinutes();

  if (hours === 6 || (hours === 7 && minutes === 0)) {
    checkInBtn.style.display = "block";
  }

  if (hours === 15 && minutes >= 30) {
    checkOutBtn.textContent = "تسجيل خروج (عادي)";
    checkOutBtn.style.display = "block";
  }

  if (hours === 18 && minutes === 0) {
    checkOutBtn.textContent = "تسجيل خروج (إضافي)";
    checkOutBtn.style.display = "block";
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
function saveAttendanceEntry(type) {
  const now = new Date();
  const entry = {
    type,
    datetime: now.toLocaleString('ar-EG')
  };
  const log = getAttendanceData();
  log.push(entry);
  localStorage.setItem("attendanceLog", JSON.stringify(log));
}

// زر عرض السجل
showLogBtn.addEventListener("click", () => {
  const data = getAttendanceData();
  attendanceBody.innerHTML = "";

  if (data.length === 0) {
    showModal("لا يوجد سجلات حالياً.");
    return;
  }

  data.forEach(entry => {
    const row = document.createElement("tr");

    const typeCell = document.createElement("td");
    typeCell.textContent = entry.type;

    const timeCell = document.createElement("td");
    timeCell.textContent = entry.datetime;

    row.appendChild(typeCell);
    row.appendChild(timeCell);
    attendanceBody.appendChild(row);
  });

  attendanceTable.style.display = "table";
});

// الموقع الجغرافي للشركة
const companyLocation = {
  lat: 31.992754,
  lng: 36.008455
};

// دالة حساب المسافة
function calculateDistance(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371e3;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  const deltaLat = (lat2 - lat1) * Math.PI / 180;
  const deltaLon = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaLat / 2) ** 2 +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(deltaLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
}

// التحقق من الموقع ثم الحفظ
function checkLocationAndProceed(type) {
  if (!navigator.geolocation) {
    showModal("🌍 المتصفح لا يدعم تحديد الموقع الجغرافي.");
    return;
  }

  navigator.geolocation.getCurrentPosition(position => {
    const userLat = position.coords.latitude;
    const userLng = position.coords.longitude;

    const distance = calculateDistance(userLat, userLng, companyLocation.lat, companyLocation.lng);

    if (distance <= 100) {
      saveAttendanceEntry(type);
      showModal(`✅ تم ${type} بنجاح`);
    } else {
      showModal("❌ لا يمكنك تسجيل الحضور/الانصراف خارج موقع الشركة.");
    }
  }, () => {
    showModal("⚠️ لم يتمكن من الوصول للموقع. الرجاء السماح بالموقع.");
  });
}

// ربط الأزرار
checkInBtn.addEventListener("click", () => {
  checkLocationAndProceed("تسجيل دخول");
});
checkOutBtn.addEventListener("click", () => {
  checkLocationAndProceed("تسجيل خروج");
});
// تحديد نقطة الشركة
const companyCoords = [31.992754, 36.008455];

// رسم الخريطة
const map = L.map('map').setView(companyCoords, 16);

// الخلفية
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

// ماركر موقع الشركة
L.marker(companyCoords).addTo(map)
  .bindPopup("📍 موقع الشركة المعتمد")
  .openPopup();
