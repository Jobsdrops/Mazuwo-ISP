// coverage-map.js

if (!window.L) {
  const mapEl = document.getElementById("map");
  if (mapEl) {
    mapEl.innerHTML = '<div class="map-fallback">The interactive map needs the Leaflet map library. You can still request coverage with the form on this page.</div>';
  }
} else {

// ✅ Toggle this ON/OFF
const ENABLE_DRAW_MODE = false;

// 1) Create map
const map = L.map("map", { scrollWheelZoom: true }).setView([-23.0, 30.5], 11);

// 2) Basemap tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

// 3) ACTIVE coverage polygon (BLUE)
const coverageFeature = {
  type: "Feature",
  properties: { name: "Active Coverage" },
  geometry: {
    type: "Polygon",
    coordinates: [[
      [30.384402, -22.72117],
      [29.895008, -22.642214],
      [29.757633, -22.748639],
      [29.631247, -22.60165],
      [29.368529, -22.508117],
      [29.137738, -22.731224],
      [28.917938, -23.297487],
      [29.137738, -23.499144],
      [29.456449, -23.740726],
      [29.434469, -23.961784],
      [29.65427, -24.022007],
      [29.77516, -23.901533],
      [30.335652, -24.062139],
      [30.489513, -23.921619],
      [30.531603, -23.952528],
      [30.655241, -23.982645],
      [30.627766, -23.904828],
      [30.710191, -23.879716],
      [30.770636, -23.799324],
      [30.861304, -23.66355],
      [31.116205, -23.327755],
      [31.181015, -22.839794],
      [31.04364, -22.657423],
      [30.845819, -22.723307],
      [30.669978, -22.657423],
      [30.384402, -22.72117]
    ]]
  }
};

// 4) PLANNED expansion polygon (LIME - dashed) - TEMP shape
const plannedFeature = {
  "type": "Feature",
  "properties": {
    "name": "extension"
  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [28.940615, -22.832516],
        [28.654874, -23.044985],
        [28.610914, -23.287396],
        [28.457053, -23.579721],
        [28.588934, -23.831204],
        [28.599924, -24.202506],
        [28.874675, -24.462776],
        [29.138436, -24.642648],
        [29.103419, -24.698338],
        [29.086933, -24.78315],
        [29.174854, -24.805591],
        [29.152874, -24.880363],
        [29.251784, -24.905277],
        [29.303987, -24.94762],
        [29.372674, -25.047192],
        [29.400902, -25.153054],
        [29.362437, -25.232585],
        [29.587732, -25.237553],
        [29.829513, -25.16797],
        [29.867978, -25.058544],
        [29.916596, -24.960071],
        [29.955061, -24.865412],
        [30.023749, -24.880363],
        [30.100679, -24.74574],
        [30.089689, -24.695843],
        [30.161124, -24.660902],
        [30.237928, -24.573509],
        [30.317605, -24.531039],
        [30.375303, -24.561019],
        [30.342333, -24.42105],
        [30.372501, -24.378528],
        [30.476906, -24.378528],
        [30.496139, -24.298449],
        [30.685717, -24.285932],
        [30.680222, -24.175729],
        [30.699454, -24.07797],
        [30.78188, -23.917383],
        [30.897275, -23.854599],
        [30.91376, -23.766651],
        [30.971458, -23.731455],
        [30.986065, -23.6968],
        [31.027278, -23.667874],
        [31.064369, -23.647748],
        [31.097339, -23.630135],
        [31.09047, -23.602453],
        [31.127562, -23.584834],
        [31.168774, -23.563436],
        [31.183886, -23.544553],
        [31.153663, -23.529445],
        [31.160532, -23.50552],
        [31.182512, -23.476552],
        [31.201745, -23.341704],
        [31.234715, -23.27486],
        [31.21823, -23.245841],
        [31.212735, -23.133493],
        [31.216675, -23.012203],
        [31.22217, -22.923694],
        [31.207059, -22.881948],
        [31.202937, -22.849048],
        [31.179584, -22.794619],
        [31.135623, -22.760432],
        [31.095785, -22.705968],
        [31.058693, -22.656552],
        [30.97352, -22.662888],
        [30.880105, -22.67556],
        [30.840266, -22.679361],
        [30.772952, -22.621062],
        [30.724871, -22.586832],
        [30.656183, -22.604582],
        [30.514686, -22.679361],
        [30.470726, -22.67556],
        [30.410281, -22.6971],
        [30.289391, -22.676827],
        [30.246804, -22.676827],
        [30.149268, -22.641343],
        [30.064095, -22.65275],
        [29.974801, -22.623598],
        [29.914356, -22.56147],
        [29.873143, -22.544983],
        [29.808577, -22.537373],
        [29.756374, -22.550056],
        [29.73302, -22.585564],
        [29.704171, -22.589368],
        [29.616789, -22.550056],
        [29.582445, -22.479013],
        [29.553596, -22.43967],
        [29.493151, -22.414282],
        [29.457433, -22.391428],
        [29.443696, -22.34952],
        [29.409401, -22.297435],
        [29.340714, -22.273291],
        [29.296753, -22.311411],
        [29.225318, -22.372381],
        [29.141519, -22.31014],
        [29.063215, -22.277104],
        [29.009854, -22.303232],
        [28.993369, -22.369285],
        [28.985126, -22.430229],
        [28.930176, -22.519059],
        [28.836761, -22.539354],
        [28.834013, -22.628113],
        [28.773568, -22.732015],
        [28.812033, -22.749747],
        [28.888964, -22.764943],
        [28.940615, -22.832516]
      ]
    ]
  }
};

// 5) Render PLANNED first (behind)
const plannedLayer = L.geoJSON(plannedFeature, {
  style: {
    color: "#31ff2a",
    weight: 2,
    opacity: 0.95,
    dashArray: "4.2 8",   // ✅ cleaner dash
    fillOpacity: 0.10
  }
}).addTo(map);

plannedLayer.eachLayer((layer) => {
  const name = layer.feature?.properties?.name || "Planned";
  layer.bindPopup(`<strong>${name}</strong><br/>Planned coverage area (not active yet).`);
});

// 6) Render ACTIVE on top
const coverageLayer = L.geoJSON(coverageFeature, {
  style: {
    color: "#005eff",
    weight: 1,
    opacity: 0.25,
    fillOpacity: 0.30
  }
}).addTo(map);

coverageLayer.eachLayer((layer) => {
  const name = layer.feature?.properties?.name || "Coverage";
  layer.bindPopup(`<strong>${name}</strong><br/>Areas highlighted in blue are covered.`);
});

// 7) Fit map to both layers
const bounds = plannedLayer.getBounds().extend(coverageLayer.getBounds());
map.fitBounds(bounds, { padding: [18, 18] });

// 8) Hover polish
plannedLayer.on("mouseover", (e) => e.layer.setStyle({ weight: 3, fillOpacity: 0.14 }));
plannedLayer.on("mouseout", (e) => plannedLayer.resetStyle(e.layer));

coverageLayer.on("mouseover", (e) => e.layer.setStyle({ weight: 3, fillOpacity: 0.24 }));
coverageLayer.on("mouseout", (e) => coverageLayer.resetStyle(e.layer));

/* =========================================================
   DRAW MODE
   - Requires leaflet-draw CSS + JS loaded in coverage.html
   - When enabled: shows tools, lets you draw, copies GeoJSON.
========================================================= */

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    alert("GeoJSON copied to clipboard.");
  } catch (e) {
    console.log("COPY THIS GEOJSON:", text);
    alert("Could not auto-copy. Open Console (F12) and copy the GeoJSON.");
  }
}

if (ENABLE_DRAW_MODE) { // ✅ FIXED (no 's')
  const drawnItems = new L.FeatureGroup();
  map.addLayer(drawnItems);

  const drawControl = new L.Control.Draw({
    draw: {
      polygon: { allowIntersection: false, showArea: true },
      rectangle: true,
      circle: false,
      circlemarker: false,
      marker: false,
      polyline: false
    },
    edit: { featureGroup: drawnItems, remove: true }
  });

  map.addControl(drawControl);

  map.on(L.Draw.Event.CREATED, async function (e) {
    const layer = e.layer;
    drawnItems.addLayer(layer);

    const name = prompt("Name this area (Active Coverage / Planned Expansion / etc):") || "New Area";
    const feature = layer.toGeoJSON();
    feature.properties = { name };

    const pretty = JSON.stringify(feature, null, 2);
    console.log("NEW AREA GEOJSON:", pretty);
    await copyToClipboard(pretty);
  });
}
}
