const tempMeterCtx = document.getElementById('tempMeter').getContext('2d');
const humMeterCtx = document.getElementById('humMeter').getContext('2d');

const tempValue = document.getElementById('tempValue');
const humValue = document.getElementById('humValue');

const dateInput = document.getElementById('dateInput');
const readingLimitInput = document.getElementById('readingLimit');

let tempMeter, humMeter, tempChart, humChart;
let allData = [];

// Draw Meters
function drawMeters(temp, hum) {
  if (tempMeter) tempMeter.destroy();
  if (humMeter) humMeter.destroy();

  tempValue.textContent = `${temp}°C`;
  humValue.textContent = `${hum}%`;

  tempMeter = new Chart(tempMeterCtx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [temp, 50 - temp],
        backgroundColor: ['#ffcd56', '#e0e0e0'],
        borderWidth: 0
      }]
    }
    ,
    options: {
      cutout: '75%',
      plugins: { tooltip: { enabled: false }, legend: { display: false } }
    }
  });

  humMeter = new Chart(humMeterCtx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [hum, 100 - hum],
        backgroundColor: ['#4bc0c0', '#e0e0e0'],
        borderWidth: 0
      }]
    },
    options: {
      cutout: '75%',
      plugins: { tooltip: { enabled: false }, legend: { display: false } }
    }
  });
}

// Draw Temp Chart
function drawTempChart(labels, tempData) {
  if (tempChart) tempChart.destroy();

  tempChart = new Chart(document.getElementById('tempChart').getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Temperature (°C)',
        data: tempData,
        borderColor: '#ffcd56',
        backgroundColor: 'rgba(255,165,0,0.2)',
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.2)' } },
        y: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.2)' } }
      }
    }
  });
}

// Draw Hum Chart
function drawHumChart(labels, humData) {
  if (humChart) humChart.destroy();

  humChart = new Chart(document.getElementById('humChart').getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Humidity (%)',
        data: humData,
        borderColor: '#4bc0c0',
        backgroundColor: 'rgba(75,192,192,0.2)',
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.2)' } },
        y: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.2)' } }
      }
    }
  });
}

// Fetch Sensor Data
function fetchSensorData() {
  let url = '/data';
  const selectedDate = dateInput.value;
  const limit = parseInt(readingLimitInput.value) || 50;

  if (selectedDate) {
    const formattedDate = new Date(selectedDate).toISOString().split('T')[0]; // Format as YYYY-MM-DD
    url += `?date=${formattedDate}`;
  }

  fetch(url)
    .then(res => res.json())
    .then(data => {
      allData = data;

      if (data.length === 0) {
        alert('No data found for selected date!');
        return;
      }

      const chartData = data.slice(0, limit);
      const labels = chartData.map(entry => new Date(entry.timestamp).toLocaleTimeString());
      const temps = chartData.map(entry => entry.temperature);
      const hums = chartData.map(entry => entry.humidity);

      drawMeters(temps[0], hums[0]);
      drawTempChart(labels, temps);
      drawHumChart(labels, hums);
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
}

const convertToLocalTime = (utcTimestamp) => {
  const localDate = new Date(utcTimestamp);
  return localDate.toLocaleString(); // Converts to local timezone
};

// Events
dateInput.addEventListener('change', () => {
  const selectedDate = dateInput.value;
  timeSelect.innerHTML = '<option value="">-- Select Time --</option>'; // Clear previous options

  if (!selectedDate) return;

  const formattedDate = new Date(selectedDate).toISOString().split('T')[0]; // Format as YYYY-MM-DD

  const matchingEntries = allData.filter(entry => {
    const entryDate = new Date(entry.timestamp).toLocaleDateString(); // Local date
    return entryDate === new Date(selectedDate).toLocaleDateString();
  });

  console.log('Entries for selected date:', matchingEntries); // Log all matching entries

  matchingEntries.forEach(entry => {
    const option = document.createElement('option');
    option.value = entry.timestamp;
    option.textContent = `${new Date(entry.timestamp).toLocaleTimeString()}`;
    timeSelect.appendChild(option);
  });

  if (matchingEntries.length === 0) {
    alert('No data found for the selected date!');
  }
});

readingLimitInput.addEventListener('change', fetchSensorData);

timeSelect.addEventListener('change', () => {
  const selectedTimestamp = timeSelect.value;

  if (!selectedTimestamp) {
    readingDisplay.style.display = 'none';
    return;
  }

  const selectedEntry = allData.find(entry => entry.timestamp === selectedTimestamp);

  if (selectedEntry) {
    readingDisplay.style.display = 'block';
    displayTime.textContent = `Time: ${convertToLocalTime(selectedEntry.timestamp)}`;
    displayTemp.textContent = `Temperature: ${selectedEntry.temperature}°C`;
    displayHum.textContent = `Humidity: ${selectedEntry.humidity}%`;
  } else {
    readingDisplay.style.display = 'none';
    alert('No matching data found for the selected time.');
  }
});

// Initial Load
fetchSensorData();

setInterval(fetchSensorData, 5000); // Update data every 10 seconds
