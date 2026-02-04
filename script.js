


/*************************************************
 * HINTERLINK™ – REAL-TIME HINTERLAND TRAFFIC SYSTEM
 *************************************************/

document.addEventListener("DOMContentLoaded", () => {

    let arrowLayers = []; // tracks arrow layers so we can remove old ones
 let bestRoute = null;


    // ---- MODAL ELEMENTS ----
const modal = document.getElementById("routeModal");
const closeModal = document.getElementById("closeModal");

const optName = document.getElementById("optRouteName");
const optMode = document.getElementById("optRouteMode");
const optCongestion = document.getElementById("optRouteCongestion");
const optRisk = document.getElementById("optRouteRisk");

    // ---- MODAL CLOSE HANDLERS ----
    closeModal.addEventListener("click", () => {
    modal.classList.add("hidden");
    });

    modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.add("hidden");
    });

    // ---- ROUTE OPTIMIZATION ----
    function optimizeRoute() {
    let best = null;
    let bestScore = Infinity;

    corridors.forEach(c => {
        const congestion = trafficState[c.id];
        if (congestion === undefined) return;

        const efficiency =
        c.mode === "road" ? 1.2 :
        c.mode === "rail" ? 0.9 :
        0.85;

        const score = congestion * efficiency;

        if (score < bestScore) {
        bestScore = score;
        best = { ...c, congestion };
        }
    });

    if (!best) return;

    optName.textContent = best.name;
    optMode.textContent = best.mode;
    optCongestion.textContent = Math.round(best.congestion);
    optRisk.textContent =
        best.congestion > 70 ? "High" :
        best.congestion > 40 ? "Medium" :
        "Low";

    modal.classList.remove("hidden");
    }


  /*********************************
   * MAP INITIALIZATION (LEAFLET)
   *********************************/
  const map = L.map("map").setView([51.2194, 4.4025], 9);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  /*********************************
   * TRAFFIC CORRIDOR MODEL
   *********************************/
  const corridors = [
    {
      id: 1,
      name: "Port of Antwerp → Inland DC",
      mode: "road",
      coords: [
        [51.266, 4.400],
        [51.150, 4.500],
        [51.050, 4.600]
      ]
    },
    {
      id: 2,
      name: "Antwerp → Brussels Rail Hub",
      mode: "rail",
      coords: [
        [51.219, 4.402],
        [50.900, 4.350]
      ]
    },
     {
        id: 3,
        name: "Port → Rail Hub → Inland Terminal",
        mode: "barge",
        coords: [
        [51.266, 4.400],  // Port
        [51.200, 4.350],  // Rail Hub
        [51.150, 4.300]   // Inland Terminal
        ]
    }
  ];

  let corridorLayers = [];
  let trafficState = {};

  /*********************************
   * TRAFFIC SIMULATION
   *********************************/
  let lastCongestion = 50;

  function randomSmoothCongestion() {
    lastCongestion += Math.floor(Math.random() * 11) - 5;
    return Math.max(0, Math.min(100, lastCongestion));
  }

  function congestionColor(value) {
    if (value < 40) return "green";
    if (value < 70) return "orange";
    return "red";
  }

  function modeWeight(mode) {
    if (mode === "rail") return 7;
    if (mode === "barge") return 8;
    return 6;
  }

  /*********************************
   * KPI ELEMENTS
   *********************************/
  const roadUseEl = document.getElementById("roadUse");
  const riskEl = document.getElementById("risk");

  function updateKPIs(avg) {
    roadUseEl.innerText = Math.round(avg) + "%";
    riskEl.innerText =
      avg > 70 ? "High" :
      avg > 40 ? "Medium" :
      "Low";
  }

  /*********************************
   * DRAW REAL-TIME TRAFFIC
   *********************************/
  function drawTraffic() {
    // Remove old arrows
    arrowLayers.forEach(a => map.removeLayer(a));
    arrowLayers = [];

    corridorLayers.forEach(l => map.removeLayer(l));
    corridorLayers = [];
    trafficState = {};

    


    corridors.forEach(corridor => {
      const congestion = randomSmoothCongestion();
      trafficState[corridor.id] = congestion;

      const polyline = L.polyline(corridor.coords, {
        color: congestionColor(congestion),
        weight: modeWeight(corridor.mode),
        opacity: 0.85
      })
      .bindPopup(`
        <b>${corridor.name}</b><br/>
        Mode: ${corridor.mode}<br/>
        Congestion: ${Math.round(congestion)}%
      `)
      .addTo(map);

      corridorLayers.push(polyline);
    });

    const avg =
      Object.values(trafficState).reduce((a, b) => a + b, 0) /
      Object.values(trafficState).length;

    updateKPIs(avg);
    updateForecast(avg);
  }

     // ---- RISK LEVEL CALCULATION ----
    function getRiskLevel(congestion) {
        if (congestion > 70) return "High";
        if (congestion > 40) return "Medium";
        return "Low";
    }

 /*********************************
 * ROUTE OPTIMIZATION LOGIC
 *********************************/
function optimizeRoute() {
    let best = null;
    let bestScore = Infinity;

    // Find the best route based on congestion and mode efficiency
    corridors.forEach(c => {
        const congestion = trafficState[c.id];

        if (congestion === undefined) return;

        const penalty = 
            c.mode === "road" ? 1.2 : 
            c.mode === "rail" ? 0.9 : 
            0.85;

        const score = congestion * penalty;

        if (score < bestScore) {
            bestScore = score;
            best = { ...c, congestion };
        }
    });

    if (!best) return;  // If no best route is found, exit the function

    bestRoute = best;  // Store the best route globally

    

    // Update the UI with the best route details
    optName.textContent = best.name;
    optMode.textContent = best.mode;
    optCongestion.textContent = Math.round(best.congestion);
    optRisk.textContent = 
        best.congestion > 70 ? "High" :
        best.congestion > 40 ? "Medium" : 
        "Low";

    modal.classList.remove("hidden");  // Show the modal with route details
}

/*********************************
 * VIEW DETAILS BUTTON FUNCTIONALITY
 *********************************/
document.getElementById("routeDetailsBtn").addEventListener("click", () => {
    if (!bestRoute) {
        console.log("No best route available!");  
        return;  // Exit if no best route exists
    }

    // Ensure modalContent is present
    const modalContent = document.getElementById("routeModalContent");

    // Debugging log to check the best route's data
    console.log("Displaying route details:", bestRoute);

    // Populate the modal with detailed route information
    modalContent.innerHTML = `
        <h3>Route Details</h3>
        <p><strong>Route:</strong> ${bestRoute.name}</p>
        <p><strong>Mode:</strong> ${bestRoute.mode}</p>
        <p><strong>Congestion:</strong> ${Math.round(bestRoute.congestion)}%</p>
        <p><strong>Risk Level:</strong> ${getRiskLevel(bestRoute.congestion)}</p>
        <p><strong>ETA:</strong> ${bestRoute.eta || "Not available"}</p>
    `;

    // Open the modal
    modal.classList.remove("hidden");
});




  /*********************************
   * AI CONGESTION FORECAST
   *********************************/
  const forecastCanvas = document.getElementById("forecastChart");
  const fctx = forecastCanvas.getContext("2d");

  forecastCanvas.width = forecastCanvas.offsetWidth;
  forecastCanvas.height = 200;

  let congestionHistory = [];

  function updateCongestionHistory(value) {
    congestionHistory.push(value);
    if (congestionHistory.length > 12) congestionHistory.shift();
  }

  function forecastCongestion() {
    if (congestionHistory.length < 2) return [];
    const last = congestionHistory[congestionHistory.length - 1];
    return Array.from({ length: 5 }, (_, i) =>
      Math.max(0, Math.min(100, last + (Math.random() * 6 - 3) * (i + 1)))
    );
  }

  function drawForecastChart(actual, forecast) {
    fctx.clearRect(0, 0, forecastCanvas.width, forecastCanvas.height);

    const points = actual.length + forecast.length;
    const stepX = forecastCanvas.width / (points - 1);

    // Grid
    fctx.strokeStyle = "#ddd";
    fctx.setLineDash([5, 5]);
    for (let i = 0; i <= 5; i++) {
      const y = (forecastCanvas.height / 5) * i;
      fctx.beginPath();
      fctx.moveTo(0, y);
      fctx.lineTo(forecastCanvas.width, y);
      fctx.stroke();
    }
    fctx.setLineDash([]);

    function drawLine(data, color, offset = 0) {
      fctx.beginPath();
      fctx.strokeStyle = color;
      fctx.lineWidth = 2;

      data.forEach((v, i) => {
        const x = (i + offset) * stepX;
        const y = forecastCanvas.height - (v / 100) * forecastCanvas.height;
        i === 0 ? fctx.moveTo(x, y) : fctx.lineTo(x, y);
      });

      fctx.stroke();
    }

    drawLine(actual, "#3498db");
    drawLine(forecast, "#e74c3c", actual.length - 1);
  }

  function updateForecast(avg) {
    updateCongestionHistory(avg);
    drawForecastChart(congestionHistory, forecastCongestion());
  }


  /*********************************
   * LIVE UPDATE LOOP
   *********************************/
  drawTraffic();
  setInterval(drawTraffic, 4000);


  window.optimizeRoute = optimizeRoute;








  const hamburger = document.getElementById("hamburgerBtn");
  const sidebar = document.querySelector(".sidebar");

  
  const overlay = document.createElement("div");
  overlay.className = "sidebar-overlay";
  document.body.appendChild(overlay);

  hamburger.addEventListener("click", () => {
    sidebar.classList.add("open");
    overlay.classList.add("active");
  });

  overlay.addEventListener("click", () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("active");
  });
});
