// MQTT ke broker.emqx.io
const broker = "wss://broker.emqx.io:8084/mqtt";
const clientId = "neopanel_" + Math.random().toString(16).substr(2, 8);
const client = mqtt.connect(broker, { clientId, keepalive: 60 });

const statusEl = document.getElementById("status");
const aiMsg = document.getElementById("aiMessage");
const tempEl = document.getElementById("temperature");
const humEl = document.getElementById("humidity");
const soilEl = document.getElementById("soil");
const pumpEl = document.getElementById("pumpStatus");

const manualBtn = document.getElementById("manualBtn");
const autoBtn = document.getElementById("autoBtn");
const pumpOnBtn = document.getElementById("pumpOnBtn");
const pumpOffBtn = document.getElementById("pumpOffBtn");

let mode = "manual";

// Grafik
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
      tension: 0.4,
    }]
  },
  options: { plugins: { legend: { labels: { color: "#a5b4fc" } } }, scales: { x: { ticks: { color: "#94a3b8" } }, y: { ticks: { color: "#94a3b8" } } } }
});
const humChart = new Chart(document.getElementById("humChart"), {
  type: "line",
  data: {
    labels,
    datasets: [{
      label: "Kelembapan Udara (%)",
      data: humData,
      borderColor: "#6366f1",
      borderWidth: 2,
      tension: 0.4,
    }]
  },
  options: tempChart.options
});
const soilChart = new Chart(document.getElementById("soilChart"), {
  type: "line",
  data: {
    labels,
    datasets: [{
      label: "Kelembapan Tanah (%)",
      data: soilData,
      borderColor: "#a3e635",
      borderWidth: 2,
      tension: 0.4,
    }]
  },
  options: tempChart.options
});

// MQTT Event
client.on("connect", () => {
  statusEl.textContent = "🟢 Terhubung ke EMQX Broker";
  client.subscribe("smartfarm/#");
});

client.on("message", (topic, message) => {
  const value = message.toString();
  const time = new Date().toLocaleTimeString();

  if (labels.length > 15) { labels.shift(); tempData.shift(); humData.shift(); soilData.shift(); }
  if (!labels.includes(time)) labels.push(time);

  if (topic.includes("temperature")) {
    tempEl.textContent = value;
    tempData.push(parseFloat(value));
  } else if (topic.includes("humidity")) {
    humEl.textContent = value;
    humData.push(parseFloat(value));
  } else if (topic.includes("soil")) {
    soilEl.textContent = value;
    soilData.push(parseFloat(value));
  } else if (topic.includes("pump/status")) {
    pumpEl.textContent = value === "ON" ? "ON 💧" : "OFF 🛑";
    pumpEl.classList.toggle("text-green-400", value === "ON");
    pumpEl.classList.toggle("text-red-500", value !== "ON");
  }

  // AI Analisis Sederhana
  analyzeAI();

  tempChart.update(); humChart.update(); soilChart.update();
});

function analyzeAI() {
  const temp = parseFloat(tempEl.textContent);
  const soil = parseFloat(soilEl.textContent);

  if (isNaN(temp) || isNaN(soil)) return;

  if (soil < 40 && mode === "auto") {
    aiMsg.textContent = "💡 AI mendeteksi tanah kering — mengaktifkan pompa otomatis.";
    client.publish("smartfarm/pump/control", "ON");
  } else if (soil > 65 && mode === "auto") {
    aiMsg.textContent = "✅ Kelembapan tanah optimal — pompa dinonaktifkan.";
    client.publish("smartfarm/pump/control", "OFF");
  } else
