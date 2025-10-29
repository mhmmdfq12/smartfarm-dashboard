// MQTT Connection
const broker = "wss://broker.emqx.io:8084/mqtt";
const clientId = "holoboard_" + Math.random().toString(16).substr(2, 8);
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

const labels = [];
const tempData = [], humData = [], soilData = [];

const holoChartOptions = {
  plugins: { legend: { labels: { color: "#67e8f9" } } },
  scales: { 
    x: { ticks: { color: "#67e8f9" } }, 
    y: { ticks: { color: "#67e8f9" } } 
  }
};

const tempChart = new Chart(document.getElementById("tempChart"), {
  type: "line",
  data: { labels, datasets: [{ label: "Suhu (°C)", data: tempData, borderColor: "#22d3ee", tension: 0.4 }] },
  options: holoChartOptions
});
const humChart = new Chart(document.getElementById("humChart"), {
  type: "line",
  data: { labels, datasets: [{ label: "Kelembapan Udara (%)", data: humData, borderColor: "#0ea5e9", tension: 0.4 }] },
  options: holoChartOptions
});
const soilChart = new Chart(document.getElementById("soilChart"), {
  type: "line",
  data: { labels, datasets: [{ label: "Kelembapan Tanah (%)", data: soilData, borderColor: "#06b6d4", tension: 0.4 }] },
  options: holoChartOptions
});

client.on("connect", () => {
  statusEl.textContent = "🟢 Terhubung ke broker.emqx.io";
  client.subscribe("smartfarm/#");
});

client.on("message", (topic, message) => {
  const value = message.toString();
  const time = new Date().toLocaleTimeString();

  if (labels.length > 15) { labels.shift(); tempData.shift(); humData.shift(); soilData.shift(); }
  if (!labels.includes(time)) labels.push(time);

  if (topic.includes("temperature")) { tempEl.textContent = value; tempData.push(parseFloat(value)); }
  else if (topic.includes("humidity")) { humEl.textContent = value; humData.push(parseFloat(value)); }
  else if (topic.includes("soil")) { soilEl.textContent = value; soilData.push(parseFloat(value)); }
  else if (topic.includes("pump/status")) {
    pumpEl.textContent = value === "ON" ? "ON 💧" : "OFF 🛑";
    pumpEl.classList.toggle("text-cyan-400", value === "ON");
    pumpEl.classList.toggle("text-red-400", value !== "ON");
  }

  aiAnalysis();
  tempChart.update(); humChart.update(); soilChart.update();
});

function aiAnalysis() {
  const soil = parseFloat(soilEl.textContent);
  if (isNaN(soil)) return;

  if (mode === "auto") {
    if (soil < 35) {
      aiMsg.textContent = "💡 AI mendeteksi kekeringan — pompa holografik aktif.";
      client.publish("smartfarm/pump/control", "ON");
    } else if (soil > 65) {
      aiMsg.textContent = "✅ Kelembapan optimal — pompa holografik berhenti.";
      client.publish("smartfarm/pump/control", "OFF");
    } else {
      aiMsg.textContent = "🌿 Kondisi stabil — sistem siap siaga.";
    }
  } else {
    aiMsg.textContent = "🧠 Mode manual — pengawasan oleh operator manusia.";
  }
}

manualBtn.onclick = () => {
  mode = "manual";
  manualBtn.classList.add("active");
  autoBtn.classList.remove("active");
  aiMsg.textContent = "🧠 Mode manual aktif.";
};
autoBtn.onclick = () => {
  mode = "auto";
  autoBtn.classList.add("active");
  manualBtn.classList.remove("active");
  aiMsg.textContent = "🤖 Mode AI holografik aktif.";
};
pumpOnBtn.onclick = () => client.publish("smartfarm/pump/control", "ON");
pumpOffBtn.onclick = () => client.publish("smartfarm/pump/control", "OFF");
