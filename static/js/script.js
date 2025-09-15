const zoneSelect = document.getElementById('zone-select');
const stationSelect = document.getElementById('station-select');
const startDate = document.getElementById('start-date');
const endDate = document.getElementById('end-date');
const dateTimeDisplay = document.getElementById('datetime');
const plcStatusDot = document.querySelector('.status-dot');
const title = document.getElementById('title')
// Initialize default dates
const today = new Date().toISOString().split('T')[0];
startDate.value = today;
endDate.value = today;

// Dummy zone/station data
zoneSelect.innerHTML = `<option value="Zone A">Zone A</option><option value="Zone B">Zone B</option>`;
stationSelect.innerHTML = `<option value="Station 1">Station 1</option><option value="Station 2">Station 2</option>`;

function updateDateTime() {
  const now = new Date();
  dateTimeDisplay.textContent = now.toLocaleString();
}
setInterval(updateDateTime, 1000);
updateDateTime();
// Chart configuration per type
const spcChart = new Chart(document.getElementById('spc-chart'), {
    type: 'line',
    data: { labels: [], datasets: [
      { label: 'SPC Values', data: [], borderColor: '#00fff2', borderWidth: 2 },
      { label: 'UCL', data: [], borderColor: '#ff4b4b', borderDash: [5, 5], fill: false },
      { label: 'LCL', data: [], borderColor: '#4b7bff', borderDash: [5, 5], fill: false }
    ]},
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });
  
  const rChart = new Chart(document.getElementById('r-chart'), {
    type: 'line',
    data: { labels: [], datasets: [
      { label: 'R Chart', data: [], borderColor: '#f39c12', borderWidth: 2 }
    ]},
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });
  
  const xChart = new Chart(document.getElementById('x-chart'), {
    type: 'line',
    data: { labels: [], datasets: [
      { label: 'X Chart', data: [], borderColor: '#9b59b6', borderWidth: 2 }
    ]},
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });
  
  const histogramChart = new Chart(document.getElementById('histogram-chart'), {
    type: 'bar',
    data: { labels: [], datasets: [
      { label: 'Histogram', data: [], backgroundColor: '#1abc9c' }
    ]},
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });
  
  const normalChart = new Chart(document.getElementById('normal-chart'), {
    type: 'line',
    data: { labels: [], datasets: [
      { label: 'Normal Distribution', data: [], borderColor: '#2ecc71', borderWidth: 2, fill: true, tension: 0.4 }
    ]},
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });
  let chartLimit = {
    spc: 10,
    r: 10,
    x: 10,
    histogram: 10,
    normal: 10,
  };
  function maximizeChart(chartType) {
    const container = document.getElementById(`${chartType}-container`);
    const isMaximized = container.classList.contains('maximized');
    const maximizebtn = container.querySelector('.maximize-btn'); // ✅ only this container's button

    // If already maximized, minimize it
    if (isMaximized) {
      
      maximizebtn.innerHTML='🔍 Maximize';
        document.querySelector(".datavalues").style="display:block;"
      container.classList.remove('maximized');
      const existingTable = container.querySelector('.value-table');
      if (existingTable) existingTable.remove();
    } else {
      maximizebtn.innerHTML='🔍 Minimize';
      document.querySelector(".datavalues").style="display:none;"
      // Remove maximized from others
      document.querySelectorAll('.chart-container').forEach(c => c.classList.remove('maximized'));
      document.querySelectorAll('.value-table').forEach(el => el.remove());
  
      // Maximize selected
      container.classList.add('maximized');
      showValueTable(chartType);
    }
  }

  
  function showValueTable(chartType,limit=10) {

    let chart=""
    switch (chartType) {
      case "spc":
        chart="spc"
        break; 
      case "rchart":
        chart="r"
        break; 
      case "xchart":
        chart="x"
        break; 
      case "histogram":
        chart="histogram"
        break;
      case "normalchart":
          chart="normal_x"
          break;
      default:
        break;
    }
    const data = window.lastChartData[chart] || [];

    const limited = getLimitedData(data, chartLimit[chartType]);
    
    let table = `<div class="value-table">
      <label>Values to show:</label>
      <input type="number" value="${limit}" onchange="updateChartLimit('${chartType}', this.value)">
      <h4>${chartType.toUpperCase()} Values</h4>
      <ul>`;
  
    limited.forEach((val, i) => {
      table += `<li>${i + 1}: ${val.toFixed(2)}</li>`;
    });
  
    table += `</ul></div>`;
  
    const container = document.getElementById(`${chartType}-container`);
    container.insertAdjacentHTML('afterbegin', table);
  }
  function updateChart(chartType, newLimit) {
    const data = window.lastChartData;
    const labels = Array.from({ length: data.spc.length }, (_, i) => i + 1);
  
     // Update SPC Chart
     
     spcChart.data.labels = getLimitedData(labels,newLimit);
     spcChart.data.datasets[0].data = getLimitedData(data.spc,newLimit);
     spcChart.data.datasets[1].data = getLimitedData(data.spc_ucl,newLimit)
     spcChart.data.datasets[2].data = getLimitedData(data.spc_lcl,newLimit)
     spcChart.update();
      // Update R Chart
      rChart.data.labels = getLimitedData(labels,newLimit)
      rChart.data.datasets[0].data = getLimitedData(data.r,newLimit)
      rChart.update();

      // Update X Chart
      xChart.data.labels = getLimitedData(labels,newLimit)
      xChart.data.datasets[0].data = getLimitedData(data.x,newLimit)
      xChart.update();

      // Update Histogram
      histogramChart.data.labels = getLimitedData(data.histogram_bins,newLimit) // Provide bins from backend
      histogramChart.data.datasets[0].data = getLimitedData(data.histogram,newLimit)
      histogramChart.update();

      // Update Normal Distribution
      normalChart.data.labels = getLimitedData(data.normal_x,newLimit)  // x-axis points (e.g., -3σ to +3σ)
      normalChart.data.datasets[0].data = getLimitedData(data.normal,newLimit)
      normalChart.update();
  }
  
  function updateChartLimit(chartType, newLimit) {

    
    const limit = parseInt(newLimit);
    if (isNaN(limit) || limit <= 0) return;
  
    chartLimit[chartType] = limit;
  
    // Update chart
    const fullData = window.lastChartData[chartType] || [];
    const limitedData = getLimitedData(fullData, limit);
    updateChart(chartType, limit); // assumes you have this updateChart function
  
    // Update table
    const container = document.getElementById(`${chartType}-container`);
    const oldTable = container.querySelector('.value-table');
    if (oldTable) oldTable.remove();
  
    showValueTable(chartType,limit);
  }

  function getLimitedData(data, limit) {
    return data.slice(0, limit);
  }
  
  
 
  // Fetch and update function
  function fetchAndUpdateCharts() {
    
    title.innerHTML=`Project Of ${zoneSelect.value} and Station ${stationSelect.value}`
    const url = `/api/data?zone=${zoneSelect.value}&station=${stationSelect.value}&start_date=${startDate.value}&end_date=${endDate.value}`;
  
    fetch(url)
      .then(res => res.json())
      .then(data => {
        console.log(data);
        
        window.lastChartData = data; // Store raw data for later access
        const labels = Array.from({ length: data.spc.length }, (_, i) => i + 1);
  
        // Update SPC Chart
        spcChart.data.labels = getLimitedData(labels,chartLimit.spc);
        spcChart.data.datasets[0].data = getLimitedData(data.spc,chartLimit.spc);
        spcChart.data.datasets[1].data = getLimitedData(data.spc_ucl,chartLimit.spc)
        spcChart.data.datasets[2].data = getLimitedData(data.spc_lcl,chartLimit.spc)
        spcChart.update();
  
        // Update R Chart
        rChart.data.labels = getLimitedData(labels,chartLimit.r)
        rChart.data.datasets[0].data = getLimitedData(data.r,chartLimit.r)
        rChart.update();
  
        // Update X Chart
        xChart.data.labels = getLimitedData(labels,chartLimit.x)
        xChart.data.datasets[0].data = getLimitedData(data.x,chartLimit.x)
        xChart.update();
  
        // Update Histogram
        histogramChart.data.labels = getLimitedData(data.histogram_bins,chartLimit.histogram) // Provide bins from backend
        histogramChart.data.datasets[0].data = getLimitedData(data.histogram,chartLimit.histogram)
        histogramChart.update();
  
        // Update Normal Distribution
        normalChart.data.labels = getLimitedData(data.normal_x,chartLimit.normal)  // x-axis points (e.g., -3σ to +3σ)
        normalChart.data.datasets[0].data = getLimitedData(data.normal,chartLimit.normal)
        normalChart.update();
      });
  }
  async function exportAllToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
  
    // Mapping chart types to their actual Chart.js instances and data keys
    const chartsMap = [
      { name: 'SPC Chart', chart: spcChart, dataKey: 'spc' },
      { name: 'R Chart', chart: rChart, dataKey: 'r' },
      { name: 'X Chart', chart: xChart, dataKey: 'x' },
      { name: 'Histogram', chart: histogramChart, dataKey: 'histogram' },
      { name: 'Normal Distribution', chart: normalChart, dataKey: 'normal' },
    ];
  
    chartsMap.forEach((item, i) => {
      const { name, chart, dataKey } = item;
      const image = chart.toBase64Image();
  
      if (i !== 0) doc.addPage();
      doc.setFontSize(16);
      doc.text(name, 15, 15);
      doc.addImage(image, 'PNG', 15, 25, 180, 90);
  
      // Table/Data below the chart
      const data = (window.lastChartData && window.lastChartData[dataKey]) || [];
      let y = 120;
      doc.setFontSize(12);
      doc.text(`${name} Data:`, 15, y);
      y += 8;
  
      data.forEach((val, index) => {
        if (y > 280) { // Add new page if space is running out
          doc.addPage();
          y = 20;
        }
        doc.text(`${index + 1}. ${val}`, 20, y);
        y += 7;
      });
    });
  
    doc.save('charts_and_data.pdf');
  }
  
  function exportAllToExcel() {
    const wb = XLSX.utils.book_new();
    const chartTypes = ['spc', 'rchart', 'xchart', 'histogram'];
  
    chartTypes.forEach(type => {
      const data = window.lastChartData[type] || [];
  
      // Create a 2D array for sheet: [["Index", "Value"], [1, val1], ...]
      const rows = [["Index", "Value"]];
      data.forEach((val, index) => {
        rows.push([index + 1, val]);
      });
  
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, type.toUpperCase());
    });
  
    XLSX.writeFile(wb, "charts_data.xlsx");
  }
  
function checkPLCStatus() {
  fetch('/api/plc-status')
    .then(res => res.json())
    .then(data => {
      plcStatusDot.className = 'status-dot ' + (data.status === 'connected' ? 'connected' : 'disconnected');
    });
}
setInterval(checkPLCStatus, 500);

// Event listeners
[zoneSelect, stationSelect, startDate, endDate].forEach(input => {
  input.addEventListener('change', fetchAndUpdateCharts);
});
function main(){
  // Initial load
  fetchAndUpdateCharts();
}setInterval(main, 1000);
checkPLCStatus();
main();
// fetchAndUpdateCharts();
