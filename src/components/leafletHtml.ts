import { Leitura } from "@/services/leituras";
import { CAT_SVG_STRING, DOG_SVG_STRING } from "@/components/PetIcons";

export interface GenerateLeafletHtmlParams {
  leituras: Leitura[];
  activeId: string;
  mostrarTrajeto?: boolean;
}

export function generateLeafletHtml({
  leituras,
  activeId,
  mostrarTrajeto = true,
}: GenerateLeafletHtmlParams): string {
  const defaultCenter =
    leituras.length > 0
      ? [leituras[0].latitude, leituras[0].longitude]
      : [-10.1843, -48.3336];

  const jsonLeituras = JSON.stringify(leituras);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>PetSafe Mapa Interativo</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    html, body, #map {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      background-color: #F3F4F6;
      font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    /* Marcador Customizado com Pegada de Cachorro */
    .pin-container {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
    }
    .pin-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #1D1E64;
      border: 3px solid #FFFFFF;
      box-shadow: 0 4px 10px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFFFFF;
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s;
    }
    .pin-point {
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 8px solid #1D1E64;
      margin-top: -1px;
    }

    /* Estilo do Marcador Mais Recente */
    .pin-container.is-latest .pin-circle {
      background: #FFB101;
      border-color: #1D1E64;
      color: #1D1E64;
      width: 42px;
      height: 42px;
    }
    .pin-container.is-latest .pin-point {
      border-top-color: #FFB101;
      border-top-width: 10px;
    }

    /* Radar de pulso no último escaneamento */
    .radar-pulse {
      position: absolute;
      top: -10px;
      left: -10px;
      width: 62px;
      height: 62px;
      border-radius: 50%;
      background: rgba(255, 177, 1, 0.45);
      animation: radar 1.8s infinite ease-out;
      pointer-events: none;
      z-index: -1;
    }
    @keyframes radar {
      0% { transform: scale(0.6); opacity: 1; }
      100% { transform: scale(1.6); opacity: 0; }
    }

    .badge-ordem {
      position: absolute;
      top: -12px;
      background: #1D1E64;
      color: #FFFFFF;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 10px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      white-space: nowrap;
      border: 1px solid #FFFFFF;
    }
    .pin-container.is-latest .badge-ordem {
      background: #FFB101;
      color: #1D1E64;
      border-color: #1D1E64;
      font-weight: 800;
    }

    .pin-container.is-active .pin-circle {
      transform: scale(1.25);
      border-color: #FFB101;
      box-shadow: 0 0 0 5px rgba(255, 177, 1, 0.4);
    }

    /* Estilo de Popup do Leaflet */
    .leaflet-popup-content-wrapper {
      border-radius: 14px;
      padding: 4px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.22);
    }
    .popup-box {
      font-size: 13px;
      line-height: 1.4;
      color: #1F2937;
      min-width: 190px;
    }
    .popup-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 6px;
      background: #EEF2FF;
      color: #1D1E64;
    }
    .popup-badge.latest {
      background: #FEF3C7;
      color: #92400E;
    }
    .popup-pet {
      font-size: 15px;
      font-weight: 700;
      color: #1D1E64;
      margin: 0 0 2px 0;
    }
    .popup-time {
      font-size: 11px;
      color: #6B7280;
      margin-bottom: 6px;
    }
    .popup-addr {
      font-size: 12px;
      color: #374151;
      margin-bottom: 6px;
    }
    .popup-device {
      font-size: 10px;
      color: #9CA3AF;
      border-top: 1px solid #F3F4F6;
      padding-top: 4px;
    }
    .popup-btn-rota {
      display: block;
      text-align: center;
      background: #1D1E64;
      color: #FFFFFF !important;
      text-decoration: none;
      font-weight: 600;
      padding: 6px 10px;
      border-radius: 8px;
      margin-top: 8px;
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const leituras = ${jsonLeituras};
    let activeId = "${activeId}";
    const mostrarTrajeto = ${mostrarTrajeto ? "true" : "false"};

    function notificarApp(data) {
      try {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(data));
        }
      } catch (err) {}
      try {
        if (window.parent && window.parent.postMessage) {
          window.parent.postMessage(data, '*');
        }
      } catch (err) {}
    }

    // Camadas de mapa
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    });

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18,
      attribution: '© Esri'
    });

    const map = L.map('map', {
      center: [${defaultCenter[0]}, ${defaultCenter[1]}],
      zoom: 14,
      layers: [streetLayer],
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const markersMap = {};
    const latlngs = [];

    // Ícones SVG para os marcadores do mapa
    const dogSvg = \`${DOG_SVG_STRING}\`;
    const catSvg = \`${CAT_SVG_STRING}\`;
    const pawSvg = \`<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2M6 6C4.9 6 4 6.9 4 8C4 9.1 4.9 10 6 10C7.1 10 8 9.1 8 8C8 6.9 7.1 6 6 6M18 6C16.9 6 16 6.9 16 8C16 9.1 16.9 10 18 10C19.1 10 20 9.1 20 8C20 6.9 19.1 6 18 6M8.5 13C7.1 13 6 14.1 6 15.5C6 17.5 8 20 12 22C16 20 18 17.5 18 15.5C18 14.1 16.9 13 15.5 13C14.3 13 13.2 13.8 12.8 14.9C12.5 14.8 12.2 14.8 12 14.8C11.8 14.8 11.5 14.8 11.2 14.9C10.8 13.8 9.7 13 8.5 13Z" />
    </svg>\`;

    function getPetPinIcon(especie) {
      const e = (especie || '').toLowerCase();
      if (e.includes('cachorro') || e.includes('cão') || e.includes('cao') || e.includes('dog')) {
        return dogSvg;
      }
      if (e.includes('gato') || e.includes('cat') || e.includes('felin')) {
        return catSvg;
      }
      return pawSvg;
    }

    leituras.forEach((l, index) => {
      const isLatest = index === 0;
      const isActive = l.id === activeId;
      const numOrdem = leituras.length - index;
      const coord = [l.latitude, l.longitude];
      latlngs.push(coord);

      const html = \`
        <div class="pin-container \${isLatest ? 'is-latest' : ''} \${isActive ? 'is-active' : ''}" id="pin-\${l.id}">
          \${isLatest ? '<div class="radar-pulse"></div>' : ''}
          <div class="badge-ordem">\${isLatest ? '★ #1 Mais Recente' : '#' + numOrdem}</div>
          <div class="pin-circle">
            \${getPetPinIcon(l.pet?.especie)}
          </div>
          <div class="pin-point"></div>
        </div>
      \`;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-icon',
        html: html,
        iconSize: [44, 52],
        iconAnchor: [22, 52],
        popupAnchor: [0, -50]
      });

      const dateStr = new Date(l.criado_em).toLocaleString('pt-BR');
      const googleMapsUrl = \`https://www.google.com/maps/dir/?api=1&destination=\${l.latitude},\${l.longitude}\`;

      const popupContent = \`
        <div class="popup-box">
          <div class="popup-badge \${isLatest ? 'latest' : ''}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: -1px; margin-right: 4px;"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            \${isLatest ? 'ÚLTIMO ESCANEAMENTO' : 'Escaneamento #' + numOrdem}
          </div>
          <h4 class="popup-pet">\${l.pet?.nome || 'Medalha PetSafe'}</h4>
          <div class="popup-time">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 4px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            \${dateStr}
          </div>
          <div class="popup-addr">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 4px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            \${l.endereco_aproximado || (l.bairro ? l.bairro + ', Palmas' : 'Coordenadas')}
          </div>
          \${l.lido_por_dispositivo ? \`
            <div class="popup-device">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 4px;"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
              \${l.lido_por_dispositivo}
            </div>\` : ''}
          <a class="popup-btn-rota" href="\${googleMapsUrl}" target="_blank" rel="noopener noreferrer">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 6px;"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
            Traçar Rota no Google Maps
          </a>
        </div>
      \`;

      const marker = L.marker(coord, { icon: customIcon }).addTo(map);
      marker.bindPopup(popupContent);

      marker.on('click', () => {
        highlightPin(l.id);
        notificarApp({ type: 'MARKER_CLICKED', id: l.id });
      });

      markersMap[l.id] = { marker, coord, isLatest, numOrdem };
    });

    // Traçado de rota conectando os escaneamentos em ordem cronológica
    let polyline = null;
    if (mostrarTrajeto && latlngs.length > 1) {
      polyline = L.polyline(latlngs, {
        color: '#1D1E64',
        weight: 3.5,
        opacity: 0.75,
        dashArray: '8, 8',
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
    }

    // Ajusta o zoom inicial para englobar todos os pontos com margem
    if (latlngs.length > 1) {
      map.fitBounds(L.latLngBounds(latlngs), { padding: [60, 60] });
    } else if (latlngs.length === 1) {
      map.setView(latlngs[0], 16);
    }

    function highlightPin(id) {
      activeId = id;
      document.querySelectorAll('.pin-container').forEach(el => {
        el.classList.remove('is-active');
      });
      const current = document.getElementById('pin-' + id);
      if (current) current.classList.add('is-active');
    }

    function processarComando(data) {
      if (!data || !data.type) return;

      if (data.type === 'SELECT_SCAN') {
        const id = data.id;
        if (markersMap[id]) {
          highlightPin(id);
          map.flyTo(markersMap[id].coord, 16, { duration: 0.8 });
          markersMap[id].marker.openPopup();
        }
      } else if (data.type === 'FIT_ALL') {
        if (latlngs.length > 0) {
          map.fitBounds(L.latLngBounds(latlngs), { padding: [60, 60] });
        }
      } else if (data.type === 'CENTER_LATEST') {
        if (leituras.length > 0) {
          const first = leituras[0];
          map.flyTo([first.latitude, first.longitude], 16, { duration: 0.8 });
          if (markersMap[first.id]) {
            markersMap[first.id].marker.openPopup();
            highlightPin(first.id);
          }
        }
      } else if (data.type === 'SET_LAYER') {
        if (data.layer === 'satelite') {
          map.removeLayer(streetLayer);
          satelliteLayer.addTo(map);
        } else {
          map.removeLayer(satelliteLayer);
          streetLayer.addTo(map);
        }
      } else if (data.type === 'USER_LOCATION') {
        const userCoord = [data.lat, data.lng];
        L.circleMarker(userCoord, {
          radius: 8,
          fillColor: '#3B82F6',
          color: '#FFFFFF',
          weight: 3,
          fillOpacity: 1
        }).addTo(map).bindPopup("Você está aqui").openPopup();
        map.flyTo(userCoord, 15);
      }
    }

    window.processarComando = processarComando;

    window.addEventListener('message', function(e) {
      var d = e.data;
      if (typeof d === 'string') {
        try { d = JSON.parse(d); } catch(_) {}
      }
      processarComando(d);
    });

    document.addEventListener('message', function(e) {
      var d = e.data;
      if (typeof d === 'string') {
        try { d = JSON.parse(d); } catch(_) {}
      }
      processarComando(d);
    });

    // Notifica que o mapa está pronto
    notificarApp({ type: 'MAP_READY' });
  </script>
</body>
</html>`;
}
