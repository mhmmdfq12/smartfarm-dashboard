// Koneksi ke broker EMQX (WebSocket)
const broker = "wss://broker.emqx.io:8084/mqtt";
const clientId = "webClient_" + Math.random().toString(16).substr(2, 8);
const client = mqtt.connect(broker, {
  clientId,
  keepalive: 60,
  clean: true,
  reconnectPeriod: 5000,
});

// Elemen UI
const statusEl = document.getElementById("status");
const tempEl = document.getElementById("temperature");
const humEl = document.getElementById("humidity");
const soilEl = document.getElementById("soil");
const pumpStatusEl = document.getElementById("pumpStatus");
const modeEl = document.getElementById("mode");

// Tombol kontrol
const manualBtn = document.getElementById("manualBtn");
const autoBtn = document.getElementById("autoBtn");
const pumpOnBtn = document.getElementById("pumpOnBtn");
const pumpOffBtn = document.getElementById("pumpOffBtn");

// Data untuk grafik
const timeLabels = [];
const tempData = [];
const humData = [];
const soilData = [];

// Membuat Chart.js
const tempChart = new Chart(document.getElementById("tempChart"), {
  type: "line",
  data: {
    labels: timeLabels,
    datasets: [{
      label: "Suhu (°C)",
      data: tempData,
      borderColor: "rgb(255, 99, 132)",
      tension: 0.3
    }]
  },
  options: { scales: { y: { beginAtZero: true } } }
});

const humChart = new Chart(document.getElementById("humChart"), {
  type: "line",
  data: {
    labels: timeLabels,
    datasets: [{
      label: "Kelembapan Udara (%)",
      data: humData,
      borderColor: "rgb(54, 162, 235)",
      tension: 0.3
    }]
  },
  options: { scales: { y: { beginAtZero: true, max: 100 } } }
});

const soilChart = new Chart(document.getElementById("soilChart"), {
  type: "line",
  data: {
    labels: timeLabels,
    datasets: [{
      label: "Kelembapan Tanah (%)",
      data: soilData,
      borderColor: "rgb(46, 139, 87)",
      tension: 0.3
    }]
  },
  options: { scales: { y: { beginAtZero: true, max: 100 } } }
});

// MQTT event handlers
client.on("connect", () => {
  statusEl.textContent = "🟢 Terhubung";
  client.subscribe("smartfarm/dht22/temperature");
  client.subscribe("smartfarm/dht22/humidity");
  client.subscribe("smartfarm/soil");
  client.subscribe("smartfarm/pump/status");
  console.log("Connected to EMQX broker");
});

client.on("message", (topic, message) => {
  const data = message.toString();
  const time = new Date().toLocaleTimeString();

  if (topic === "smartfarm/dht22/temperature") {
    tempEl.textContent = data;
    tempData.push(parseFloat(data));
  }

  if (topic === "smartfarm/dht22/humidity") {
    humEl.textContent = data;
    humData.push(parseFloat(data));
  }

  if (topic === "smartfarm/soil") {
    soilEl.textContent = data;
    soilData.push(parseFloat(data));
  }

  if (topic === "smartfarm/pump/status") {
    pumpStatusEl.textContent = data === "ON" ? "💧 ON" : "🛑 OFF";
    pumpStatusEl.style.color = data === "ON" ? "green" : "red";
  }

  // Update chart labels & batas data
  if (timeLabels.length >= 10) {
    timeLabels.shift();
    tempData.shift();
    humData.shift();
    soilData.shift();
  }
  timeLabels.push(time);

  tempChart.update();
  humChart.update();
  soilChart.update();
});

client.on("error", err => {
  console.error("Koneksi gagal:", err);
  statusEl.textContent = "🔴 Terputus";
});
client.on("reconnect", () => statusEl.textContent = "🟠 Menghubungkan kembali...");

// Kontrol Mode & Pompa
manualBtn.onclick = () => {
  modeEl.textContent = "Manual";
  manualBtn.classList.add("active");
  autoBtn.classList.remove("active");
  client.publish("smartfarm/mode", "manual");
};

autoBtn.onclick = () => {
  modeEl.textContent = "Otomatis";
  autoBtn.classList.add("active");
  manualBtn.classList.remove("active");
  client.publish("smartfarm/mode", "auto");
};

pumpOnBtn.onclick = () => client.publish("smartfarm/pump/control", "ON");
pumpOffBtn.onclick = () => client.publish("smartfarm/pump/control", "OFF");
