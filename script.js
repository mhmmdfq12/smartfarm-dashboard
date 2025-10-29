// Broker EMQX WebSocket
const broker = "wss://broker.emqx.io:8084/mqtt";
const clientId = "webClient_" + Math.random().toString(16).substr(2, 8);
const options = {
  clientId,
  keepalive: 60,
  clean: true,
  reconnectPeriod: 4000,
};

const client = mqtt.connect(broker, options);

// Elemen UI
const statusEl = document.getElementById("status");
const tempEl = document.getElementById("temperature");
const humEl = document.getElementById("humidity");
const soilEl = document.getElementById("soil");
const modeEl = document.getElementById("mode");

const manualBtn = document.getElementById("manualBtn");
const autoBtn = document.getElementById("autoBtn");
const pumpOnBtn = document.getElementById("pumpOnBtn");
const pumpOffBtn = document.getElementById("pumpOffBtn");

// Data chart
const soilData = [];
const timeLabels = [];

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

// MQTT Connection
client.on("connect", () => {
  console.log("✅ Terhubung ke broker EMQX");
  statusEl.textContent = "🟢 Terhubung";

  client.subscribe("smartfarm/soil");
  client.subscribe("smartfarm/dht22/temperature");
  client.subscribe("smartfarm/dht22/humidity");
  client.subscribe("smartfarm/pump/status");
});

client.on("message", (topic, message) => {
  const data = message.toString();

  if (topic === "smartfarm/soil") {
    const soil = parseFloat(data);
    soilEl.textContent = soil.toFixed(1);
    const time = new Date().toLocaleTimeString();
    timeLabels.push(time);
    soilData.push(soil);
    if (soilData.length > 15) {
      soilData.shift();
      timeLabels.shift();
    }
    soilChart.update();
  }

  if (topic === "smartfarm/dht22/temperature") tempEl.textContent = data;
  if (topic === "smartfarm/dht22/humidity") humEl.textContent = data;
  if (topic === "smartfarm/pump/status") console.log("Pompa:", data);
});

client.on("error", err => {
  console.error("Koneksi gagal:", err);
  statusEl.textContent = "🔴 Terputus";
});

client.on("reconnect", () => {
  statusEl.textContent = "🟠 Menghubungkan kembali...";
});

// Fungsi kontrol
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
