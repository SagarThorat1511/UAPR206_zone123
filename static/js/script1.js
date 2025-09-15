const startDate = document.getElementById('start-date');
const endDate = document.getElementById('end-date');
const dateTimeDisplay = document.getElementById('datetime');
const plcStatusDot = document.querySelector('.status-dot');
const title = document.getElementById('title')
// Initialize default dates
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);

startDate.value = today.toISOString().split('T')[0];
endDate.value = tomorrow.toISOString().split('T')[0];
let selectedstaion="none"

// function updateDateTime() {
//   const now = new Date();
//   // dateTimeDisplay.textContent = now.toLocaleString();
// }
// setInterval(updateDateTime, 1000);
// updateDateTime();
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
  const stationsByZone = {
    Zone1: [
      "Primer tightening gauging station",
      "Primer stabbing resistance check",
      "Primer stabbing gauging station"
    ],
    Zone2: [
      "Propellant automatic filling station",
      "Shell & cartridge case assembly 1",
      "Shell & cartridge case assembly 2",
      "Crimping assembly"
    ],
    Zone3: [
      "Total Height gauging",
      "Total Weighing station",
      "Final resistance check"
    ],
    Zone4: [
      "Press-1 Station First Pellet Press",
      "Press-1 Station Second Pellet Press",
      "Press-2 Station First Pellet Press",
      "Press-2 Station Second Pellet Press",
      "Press-3 Station First Pellet Press",
      "Depth gauging station",
      "OD1(Shell) gauging station",
      "OD2(Copper Band) gauging station"
    ]
  };


  function updateStations() {
    const zone = document.getElementById("zoneSelect").value;
    const stationSelect = document.getElementById("stationSelect");
    const stations = stationsByZone[zone];

    stationSelect.innerHTML = '<option value="" disabled selected>Select Station</option>';

    stations.forEach(station => {
      const option = document.createElement("option");
      option.value = station;
      option.textContent = station;
      stationSelect.appendChild(option);
    });
  }

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
 
    
    const limited = getLimitedData(data, chartLimit[chart]);
    
    let table = `<div class="value-table">
      <label>Values to show:</label>
      <input type="number" value="${limit}" onchange="updateChartLimit('${chartType}', this.value)">
      <h4>${chartType.toUpperCase()} Values</h4>
      <ul>`;
  
      limited.forEach((val, i) => {
        const floatVal = parseFloat(val) || 0; // fallback to 0 if NaN
        table += `<li>${i + 1}: ${floatVal.toFixed(3)}</li>`;
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
    if(chartType=="xchart"){
      tempchartype="x"
    }else if(chartType=="rchart"){
      tempchartype="r"
    }else if(chartType=="normalchart"){
      tempchartype="normal"
    }else if(chartType=="spc"){
      tempchartype="spc"
    }else if(chartType=="histogram"){
      tempchartype="histogram"
    }
    chartLimit[tempchartype] = limit;
    

    // Update chart
    const fullData = window.lastChartData[tempchartype] || [];

    
    const limitedData = getLimitedData(fullData, limit);

    
    updateChart(chartType, limit); // assumes you have this updateChart function
  
    // Update table
    const container = document.getElementById(`${chartType}-container`);
    const oldTable = container.querySelector('.value-table');
    if (oldTable) oldTable.remove();
  
    showValueTable(chartType,limit);
  }

  function getLimitedData(data, limit) {
    return data.slice(-limit);
  }
  
 
  // Fetch and update function
  function fetchAndUpdateCharts() {
    const zone = document.getElementById("zoneSelect").value?document.getElementById("zoneSelect").value:"-----";
    const stationSelect = document.getElementById("stationSelect").value?document.getElementById("stationSelect").value:"---------------------------";
    const stations = stationsByZone[zone];


    title.innerHTML=`Project Of ${zone} of ${stationSelect}`
//    console.log("Selected Zone:", zone);
//    console.log("Selected Station:", stationSelect);
    
    const url = `/api/data?zone=${zone}&station=${stationSelect}&start_date=${startDate.value}&end_date=${endDate.value}`;
  
    fetch(url)
      .then(res => res.json())
      .then(data => {    
//        console.log("Fetched Data:", data);
        if (data.error) {
          clearAllCharts(); // Clear charts if error in data
          return;
        }
        window.lastChartData = data; // Store raw data for later access
        const liveBtn = document.querySelector(".live-status");
        const startDateInput = document.getElementById("start-date");
        const endDateInput = document.getElementById("end-date");
      
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split("T")[0];
      
        const startDateVal = startDateInput.value;
        const endDateVal = endDateInput.value;
       
        
        if (startDateVal === todayStr && endDateVal === tomorrowStr) {
          // Already on today's data, toggle live view
            liveBtn.innerHTML = "🟢 Live";
        } else {
          // Not today's data, set to today and tomorrow
          liveBtn.innerHTML = "🔴 Go Live";
        }
        
        // Convert SPC data to numeric values if not already
        const spcValues = data.spc.map(Number);

        // Calculate mean
        const meanRaw = spcValues.reduce((a, b) => a + b, 0) / spcValues.length;

        // Calculate standard deviation
        const stdDevRaw = Math.sqrt(
          spcValues.reduce((sum, val) => sum + Math.pow(val - meanRaw, 2), 0) / spcValues.length
        );

        // Calculate UCL and LCL
        const uclRaw = meanRaw + 3 * stdDevRaw;
        const lclRaw = meanRaw - 3 * stdDevRaw;

        // Format for display
        const mean = meanRaw.toFixed(2);
        const stdDev = stdDevRaw.toFixed(2);
        const ucl = uclRaw.toFixed(2);
        const lcl = lclRaw.toFixed(2);

        // Display values
        document.getElementById('mean').textContent = mean;
        document.getElementById('std_dev').textContent = stdDev;
        document.getElementById('ucl').textContent = ucl;
        document.getElementById('lcl').textContent = lcl;

        // Generate labels (1, 2, 3, ...)
        const labels = Array.from({ length: spcValues.length }, (_, i) => i + 1);


        // Clear and Update SPC Chart
        spcChart.data.labels = [];
        spcChart.data.datasets.forEach(dataset => dataset.data = []);
        spcChart.data.labels = getLimitedData(labels, chartLimit.spc);
        spcChart.data.datasets[0].data = getLimitedData(data.spc, chartLimit.spc);
        spcChart.data.datasets[1].data = getLimitedData(data.spc_ucl, chartLimit.spc);
        spcChart.data.datasets[2].data = getLimitedData(data.spc_lcl, chartLimit.spc);
        spcChart.update();

        // Clear and Update R Chart
        rChart.data.labels = [];
        rChart.data.datasets.forEach(dataset => dataset.data = []);
        rChart.data.labels = getLimitedData(labels, chartLimit.r);
        rChart.data.datasets[0].data = getLimitedData(data.r, chartLimit.r);
        rChart.update();

        // Clear and Update X Chart
        xChart.data.labels = [];
        xChart.data.datasets.forEach(dataset => dataset.data = []);
        xChart.data.labels = getLimitedData(labels, chartLimit.x);
        xChart.data.datasets[0].data = getLimitedData(data.x, chartLimit.x);
        xChart.update();

        // Clear and Update Histogram
        histogramChart.data.labels = [];
        histogramChart.data.datasets.forEach(dataset => dataset.data = []);
        histogramChart.data.labels = getLimitedData(data.histogram_bins, chartLimit.histogram);
        histogramChart.data.datasets[0].data = getLimitedData(data.histogram, chartLimit.histogram);
        histogramChart.update();

        // Clear and Update Normal Distribution
        normalChart.data.labels = [];
        normalChart.data.datasets.forEach(dataset => dataset.data = []);
        normalChart.data.labels = getLimitedData(data.normal_x, chartLimit.normal);
        normalChart.data.datasets[0].data = getLimitedData(data.normal, chartLimit.normal);
        normalChart.update();
      });
      
  }
  function clearAllCharts() {
    // SPC Chart
    spcChart.data.labels = [];
    spcChart.data.datasets.forEach(dataset => dataset.data = []);
    spcChart.update();
  
    // R Chart
    rChart.data.labels = [];
    rChart.data.datasets.forEach(dataset => dataset.data = []);
    rChart.update();
  
    // X Chart
    xChart.data.labels = [];
    xChart.data.datasets.forEach(dataset => dataset.data = []);
    xChart.update();
  
    // Histogram
    histogramChart.data.labels = [];
    histogramChart.data.datasets.forEach(dataset => dataset.data = []);
    histogramChart.update();
  
    // Normal Distribution
    normalChart.data.labels = [];
    normalChart.data.datasets.forEach(dataset => dataset.data = []);
    normalChart.update();
  }
async function exportToPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Constants for positioning
  const headerY = 10;
  const logo1X = 15;
  const logo2X = 170;
  const logoY = 5;
  const lineY = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Load logos as base64 before creating the PDF
  window.logo1Base64 = await getImageBase64('/static/images/logo1.jpg');
  window.logo2Base64 = await getImageBase64('/static/images/logo2.png');

  // Load your logos (assuming you have logo URLs or base64 images)
  // Replace these with your actual logo base64 strings or URLs
  const logo1 = window.logo1Base64; // e.g. "data:image/png;base64,....."
  const logo2 = window.logo2Base64;

  // Format current date as e.g. 2025-08-04
  const today = new Date();
  const dateString = formatDateToDDMMYYYY(today.toISOString().split('T')[0]);

  const zone = document.getElementById("zoneSelect").value?document.getElementById("zoneSelect").value:"-----";
  const stationSelect = document.getElementById("stationSelect").value?document.getElementById("stationSelect").value:"---------------------------";
  const startDateInput = formatDateToDDMMYYYY(document.getElementById("start-date").value);
  const endDateInput = formatDateToDDMMYYYY(document.getElementById("end-date").value);

    function formatDateToDDMMYYYY(dateStr) {
      const d = new Date(dateStr);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    }

  // Function to add footer text on each page
  function addFooter(pageNum) {
    const footerText = "This is a computer generated report";
    doc.setFontSize(10);
    doc.setTextColor(100);
    // center footer at bottom, 10 units above bottom edge
    doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }
 function getImageBase64(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      // **Do NOT fill background white** so transparency stays intact
      // ctx.fillStyle = '#FFFFFF';
      // ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(img, 0, 0);

      // Use PNG to preserve transparency
      const dataURL = canvas.toDataURL('image/png');
      resolve(dataURL);
    };
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}
function avg(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  const sum = arr.reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
  return sum / arr.length;
}

  // Function to add header only on first page
  function addHeader() {
    const texttoput =
    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.text(`${zone} -- ${stationSelect}`, pageWidth / 2, headerY, { align: 'center' });

    doc.setFontSize(11);
    doc.text(`Print Date: ${dateString}`, pageWidth-10, headerY + 15, { align: 'right' });
    doc.text(`Report Date: ${startDateInput} To ${endDateInput}`, pageWidth-10, headerY + 20, { align: 'right' });

    // Add logos (assume logos are 40x20)
    if (logo1) {
      doc.addImage(logo1, 'PNG', logo1X, logoY+2, 45, 8);
    }
    if (logo2) {
      doc.addImage(logo2, 'PNG', logo2X, logoY, 25, 10);
    }

    // Draw horizontal line below header and logos
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(10, lineY, pageWidth - 10, lineY);
  }

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

    if (i !== 0) {
      doc.addPage();
    }

    // Add header only on first page
    if (i === 0) {
      addHeader();
    }

    // Add footer on every page
    addFooter();

    // Start Y position for content, after header and line on first page
    let startY = (i === 0) ? lineY + 10 : 15;

    doc.setFontSize(16);
    doc.text(name, 15, startY);
    doc.addImage(image, 'PNG', 15, startY + 10, 180, 90);
//
//    // Table/Data below the chart
//    const data1 = (window.lastChartData && window.lastChartData[dataKey]) || [];
//    const data_ucl = (window.lastChartData && window.lastChartData["spc_ucl"]) || [];
//    const data_lcl = (window.lastChartData && window.lastChartData["spc_lcl"]) || [];
//
//    const data = getLimitedData(data1, chartLimit[dataKey]);
//    let ucl = getLimitedData(data_ucl, chartLimit[dataKey]);
//    let lcl = getLimitedData(data_lcl, chartLimit[dataKey]);
//    ucl=ucl[chartLimit[dataKey]-1];
//    ucl = String(ucl);
//    lcl=lcl[chartLimit[dataKey]-1];
//    lcl = String(lcl);
//    console.log(ucl)
//    let y = startY + 110;
//    doc.setFontSize(12);
//    doc.text(`${name} Data:`, 15, y);
//        // Table Rows
//    if (dataKey == "spc"){
//
//         doc.text('SPC_UCL.', 50, y);
//         doc.text(ucl, 80, y);
//         doc.text('SPC_LCL.', 50, y+8);
//         doc.text(lcl, 80, y+8);
//         y+=8
//    }
//    y += 8;
//    // Table Header
//    doc.setFont(undefined, 'bold');
//    doc.text('Sr No.', 20, y);
//    doc.text('Actual Value', 50, y);
//    doc.setFont(undefined, 'normal');
//    y += 8;
//    data.forEach((val, index) => {
//      if (y > 280) { // Add new page if space is running out
//        doc.addPage();
//        addFooter();
//        y = 20;
//        // Reprint table headers on new page
//        doc.setFont(undefined, 'bold');
//        doc.text('Sr No.', 20, y);
//        doc.text('Actual Value', 50, y);
//        doc.setFont(undefined, 'normal');
//        y += 8;
//      }
//        if (!isNaN(val)) {
//          val = parseFloat(val).toFixed(3);
//        }
//      doc.text(`${index + 1}`, 20, y);
//      doc.text(`${val ?? ''}`, 50, y);
//      y += 7;
//    });

  });

  doc.save('charts_and_data.pdf');
}
 async function exportAllToPDF() {
   const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Constants for positioning
  const headerY = 10;
  const logo1X = 15;
  const logo2X = 170;
  const logoY = 5;
  const lineY = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Load logos as base64 before creating the PDF
  window.logo1Base64 = await getImageBase64('/static/images/logo1.jpg');
  window.logo2Base64 = await getImageBase64('/static/images/logo2.png');

  // Load your logos (assuming you have logo URLs or base64 images)
  // Replace these with your actual logo base64 strings or URLs
  const logo1 = window.logo1Base64; // e.g. "data:image/png;base64,....."
  const logo2 = window.logo2Base64;

  // Format current date as e.g. 2025-08-04
  const today = new Date();
  const dateString = formatDateToDDMMYYYY(today.toISOString().split('T')[0]);

  const zone = document.getElementById("zoneSelect").value?document.getElementById("zoneSelect").value:"-----";
  const stationSelect = document.getElementById("stationSelect").value?document.getElementById("stationSelect").value:"---------------------------";
  const startDateInput = formatDateToDDMMYYYY(document.getElementById("start-date").value);
  const endDateInput = formatDateToDDMMYYYY(document.getElementById("end-date").value);

    function formatDateToDDMMYYYY(dateStr) {
      const d = new Date(dateStr);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    }

  // Function to add footer text on each page
  function addFooter(pageNum) {
    const footerText = "This is a computer generated report";
    doc.setFontSize(10);
    doc.setTextColor(100);
    // center footer at bottom, 10 units above bottom edge
    doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }
 function getImageBase64(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      // **Do NOT fill background white** so transparency stays intact
      // ctx.fillStyle = '#FFFFFF';
      // ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(img, 0, 0);

      // Use PNG to preserve transparency
      const dataURL = canvas.toDataURL('image/png');
      resolve(dataURL);
    };
    img.onerror = (err) => reject(err);
    img.src = url;
  });
}
function avg(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  const sum = arr.reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
  return sum / arr.length;
}

  // Function to add header only on first page
  function addHeader() {
    const texttoput =
    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.text(`${zone} -- ${stationSelect}`, pageWidth / 2, headerY, { align: 'center' });

    doc.setFontSize(11);
    doc.text(`Print Date: ${dateString}`, pageWidth-10, headerY + 15, { align: 'right' });
    doc.text(`Report Date: ${startDateInput} To ${endDateInput}`, pageWidth-10, headerY + 20, { align: 'right' });

    // Add logos (assume logos are 40x20)
    if (logo1) {
      doc.addImage(logo1, 'PNG', logo1X, logoY+2, 45, 8);
    }
    if (logo2) {
      doc.addImage(logo2, 'PNG', logo2X, logoY, 25, 10);
    }

    // Draw horizontal line below header and logos
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(10, lineY, pageWidth - 10, lineY);
  }

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

    if (i !== 0) {
      doc.addPage();
    }

    // Add header only on first page
    if (i === 0) {
      addHeader();
    }

    // Add footer on every page
    addFooter();

    // Start Y position for content, after header and line on first page
    let startY = (i === 0) ? lineY + 10 : 15;

    doc.setFontSize(16);
    doc.text(name, 15, startY);
    doc.addImage(image, 'PNG', 15, startY + 10, 180, 90);

    // Table/Data below the chart
    const data1 = (window.lastChartData && window.lastChartData[dataKey]) || [];
    const data_ucl = (window.lastChartData && window.lastChartData["spc_ucl"]) || [];
    const data_lcl = (window.lastChartData && window.lastChartData["spc_lcl"]) || [];

    const data = getLimitedData(data1, chartLimit[dataKey]);
    let ucl = getLimitedData(data_ucl, chartLimit[dataKey]);
    let lcl = getLimitedData(data_lcl, chartLimit[dataKey]);
    ucl=ucl[chartLimit[dataKey]-1];
    ucl = String(ucl);
    lcl=lcl[chartLimit[dataKey]-1];
    lcl = String(lcl);
    console.log(ucl)
    let y = startY + 110;
    doc.setFontSize(12);
    doc.text(`${name} Data:`, 15, y);
        // Table Rows
    if (dataKey == "spc"){

         doc.text('SPC_UCL:', 50, y);
         doc.text(ucl, 80, y);
         doc.text('SPC_LCL:', 50, y+8);
         doc.text(lcl, 80, y+8);
         y+=8
    }
    y += 8;
    // Table Header
    doc.setFont(undefined, 'bold');
    doc.text('Sr No.', 20, y);
    doc.text('Actual Value', 50, y);
    doc.setFont(undefined, 'normal');
    y += 8;
    data.forEach((val, index) => {
      if (y > 280) { // Add new page if space is running out
        doc.addPage();
        addFooter();
        y = 20;
        // Reprint table headers on new page
        doc.setFont(undefined, 'bold');
        doc.text('Sr No.', 20, y);
        doc.text('Actual Value', 50, y);
        doc.setFont(undefined, 'normal');
        y += 8;
      }
        if (!isNaN(val)) {
          val = parseFloat(val).toFixed(3);
        }
      doc.text(`${index + 1}`, 20, y);
      doc.text(`${val ?? ''}`, 50, y);
      y += 7;
    });

  });

  doc.save('Detailed_charts_and_data.pdf');
}

//  async function exportAllToPDF() {
//    const { jsPDF } = window.jspdf;
//    const doc = new jsPDF();
//
//    // Mapping chart types to their actual Chart.js instances and data keys
//    const chartsMap = [
//      { name: 'SPC Chart', chart: spcChart, dataKey: 'spc' },
//      { name: 'R Chart', chart: rChart, dataKey: 'r' },
//      { name: 'X Chart', chart: xChart, dataKey: 'x' },
//      { name: 'Histogram', chart: histogramChart, dataKey: 'histogram' },
//      { name: 'Normal Distribution', chart: normalChart, dataKey: 'normal' },
//    ];
//
//    chartsMap.forEach((item, i) => {
//      const { name, chart, dataKey } = item;
//      const image = chart.toBase64Image();
//
//      if (i !== 0) doc.addPage();
//      doc.setFontSize(16);
//      doc.text(name, 15, 15);
//      doc.addImage(image, 'PNG', 15, 25, 180, 90);
//
//      // Table/Data below the chart
//      const data1 = (window.lastChartData && window.lastChartData[dataKey]) || [];
//
//
//
//      // const data1 = window.lastChartData[type] || [];
//      const data =getLimitedData(data1, chartLimit[dataKey]);
//
//      let y = 120;
//      doc.setFontSize(12);
//      doc.text(`${name} Data:`, 15, y);
//      y += 8;
//
//      data.forEach((val, index) => {
//        if (y > 280) { // Add new page if space is running out
//          doc.addPage();
//          y = 20;
//        }
//        doc.text(`${index + 1}. ${val}`, 20, y);
//        y += 7;
//      });
//    });
//
//    doc.save('charts_and_data.pdf');
//  }
  
  function exportAllToExcel() {
    const wb = XLSX.utils.book_new();
    const chartTypes = ['spc', 'r', 'x', 'histogram'];
  
    chartTypes.forEach(type => {
      const data1 = window.lastChartData[type] || [];
      const data =getLimitedData(data1, chartLimit[type]);
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

        data.forEach((plc, index) => {
          const statusDot = document.querySelector(`#plc-status${index + 1} .status-dot`);
          if (statusDot) {
            statusDot.classList.remove("connected");
            statusDot.classList.remove("disconnected");
            if (plc.status === "connected") {
              statusDot.classList.add("connected");
            }else{
              statusDot.classList.add("disconnected");
            }
          }
        });
      })
      .catch(err => console.error("PLC status fetch error:", err));
  }
  
  setInterval(checkPLCStatus, 500); // Poll every 500ms
  

// // Event listeners
// [zoneSelect, stationSelect, startDate, endDate].forEach(input => {
//   input.addEventListener('change', fetchAndUpdateCharts);
// });
function main(){
  // Initial load
  fetchAndUpdateCharts(selectedstaion);
}setInterval(main, 3000);
checkPLCStatus();
main();

// function selectStation(stationName) {
//   console.log("Selected:", stationName);
//   selectedstaion=stationName;
//   // You can update UI, load data, etc. here.
// }
// fetchAndUpdateCharts();
 function toggleZone(id) {
      const list = document.getElementById(id);
      const isVisible = list.style.display === 'block';
      list.style.display = isVisible ? 'none' : 'block';
    }

    function selectStation(radio) {
      const selectedValue = radio.value;
      selectedstaion=selectedValue;
      // Collapse all zones and remove active background
      for (let i = 1; i <= 4; i++) {
        const zoneId = `Zone${i}`;
        const container = document.getElementById(`${zoneId}-container`);
        const list = document.getElementById(zoneId);
        container.classList.remove('active-zone');
        list.style.display = 'none';
      }

      // Find the parent zone of the clicked station and highlight it
      let parentZone = radio.closest('.station-list');
      if (parentZone) {
        parentZone.style.display = 'block';
        parentZone.parentElement.classList.add('active-zone');
      }

      console.log("Selected station:", selectedValue);
      // fetchAndUpdateCharts();
    }

    function toggleSidebar() {
      const sidebar = document.getElementById("sidebar");
      const toggleIcon = document.querySelector(".main-container img");
    
      sidebar.classList.toggle("hidden");
    }
    function golive() {
      const liveBtn = document.querySelector(".live-status");

      const startDateInput = document.getElementById("start-date");
      const endDateInput = document.getElementById("end-date");
    
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];
    
      const startDateVal = startDateInput.value;
      const endDateVal = endDateInput.value;
    
        // Not today's data, set to today and tomorrow
        startDateInput.value = todayStr;
        endDateInput.value = tomorrowStr;
   
        liveBtn.innerHTML = "🟢 Live";
      
    }
    
    