// MQTT broker EMQX (WebSocket)
const broker = "wss://broker.emqx.io:8084/mqtt";
const clientId = "webClient_" + Math.random().toString(16).substr(2, 8);
const options = {
  clientId: clientId,
  keepalive: 60,
  clean: true,
  reconnectPeriod: 5000,
};

// Hubungkan ke broker
const client = mqtt.connect(broker, options);
const statusEl = document.getElementById("status");

// Variabel tampilan
const tempEl = document.getElementById("temperature");
const humEl = document.getElementById("humidity");

// Data untuk grafik
const tempData = [];
const humData = [];
const timeLabels = [];

// Inisialisasi Chart.js
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
      label: "Kelembapan (%)",
      data: humData,
      borderColor: "rgb(54, 162, 235)",
      tension: 0.3
    }]
  },
  options: { scales: { y: { beginAtZero: true } } }
});

// Ketika koneksi berhasil
client.on("connect", () => {
  console.log("✅ Terhubung ke broker EMQX");
  statusEl.textContent = "🟢 Terhubung";
  client.subscribe("smartfarm/dht22/temperature");
  client.subscribe("smartfarm/dht22/humidity");
});

// Saat terputus
client.on("error", (err) => {
  console.error("Koneksi gagal:", err);
  statusEl.textContent = "🔴 Koneksi gagal";
});

client.on("reconnect", () => {
  statusEl.textContent = "🟠 Menghubungkan kembali...";
});

// Saat menerima data MQTT
client.on("message", (topic, message) => {
  const value = parseFloat(message.toString());
  const time = new Date().toLocaleTimeString();

  if (topic === "smartfarm/dht22/temperature") {
    tempEl.textContent = value.toFixed(1);
    tempData.push(value);
  }

  if (topic === "smartfarm/dht22/humidity") {
    humEl.textContent = value.toFixed(1);
    humData.push(value);
  }

  // Update waktu dan refresh chart
  timeLabels.push(time);
  if (timeLabels.length > 10) {
    timeLabels.shift();
    tempData.shift();
    humData.shift();
  }

  tempChart.update();
  humChart.update();
});