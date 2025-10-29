// Koneksi MQTT ke broker.emqx.io
const broker = "wss://broker.emqx.io:8084/mqtt";
const clientId = "ecosense_" + Math.random().toString(16).substr(2, 8);
const client = mqtt.connect(broker, {
  clientId,
  keepalive: 60,
  reconnectPeriod: 4000,
});

const statusEl = document.getElementById("status");
const tempEl = document.getElementById("temperature");
const humEl = document.getElementById("humidity");
const soilEl = document.getElementById("soil");
const pumpEl = document.getElementById("pumpStatus");
const modeEl = document.getElementById("mode");

const manualBtn = document.getElementById("manualBtn");
const autoBtn = document.getElementById("autoBtn");
const pumpOnBtn = document.getElementById("pumpOnBtn");
const pumpOffBtn = document.getElementById("pumpOffBtn");

// Grafik data
const labels = [];
const tempData = [], humData = [], soilData = [];

const tempChart = new Chart(document.getElementById("tempChart"), {
  type: "line",
  data: {
    labels,
    datasets: [{
      label: "Suhu (°C)",
      data: tempData,
      borderColor: "#22c55e",
      borderWidth: 2,
      tension: 0.3,
      fill: false
    }]
  }
});
const humChart = new Chart(document.getElementById("humChart"), {
  type: "line",
  data: {
    labels,
    datasets: [{
      label: "Kelembapan Udara (%)",
      data: humData,
      borderColor: "#3b82f6",
      borderWidth: 2,
      tension: 0.3,
      fill: false
    }]
  }
});
const soilChart = new Chart(document.getElementById("soilChart"), {
  type: "line",
  data: {
    labels,
    datasets: [{
      label: "Kelembapan Tanah (%)",
      data: soilData,
      borderColor: "#65a30d",
      borderWidth: 2,
      tension: 0.3,
      fill: false
    }]
  }
});

// MQTT Event
client.on("connect", () => {
  statusEl.textContent = "🟢 Terhubung ke EMQX";
  client.subscribe("smartfarm/dht22/temperature");
  client.subscribe("smartfarm/dht22/humidity");
  client.subscribe("smartfarm/soil");
  client.subscribe("smartfarm/pump/status");
});

client.on("message", (topic, message) => {
  const value = message.toString();
  const time = new Date().toLocaleTimeString();

  if (labels.length > 15) {
    labels.shift(); tempData.shift(); humData.shift(); soilData.shift();
  }
  if (!labels.includes(time)) labels.push(time);

  if (topic === "smartfarm/dht22/temperature") {
    tempEl.textContent = value;
    tempData.push(parseFloat(value));
  }
  if (topic === "smartfarm/dht22/humidity") {
    humEl.textContent = value;
    humData.push(parseFloat(value));
  }
  if (topic === "smartfarm/soil") {
    soilEl.textContent = value;
    soilData.push(parseFloat(value));
  }
  if (topic === "smartfarm/pump/status") {
    pumpEl.textContent = value === "ON" ? "💧 ON" : "🛑 OFF";
    pumpEl.classList.toggle("text-green-600", value === "ON");
    pumpEl.classList.toggle("text-red-600", value !== "ON");
  }

  tempChart.update();
  humChart.update();
  soilChart.update();
});

// Tombol Kontrol
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
