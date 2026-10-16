import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { COLORS } from "@/global/themes";
import { Leitura } from "@/services/leituras";

export type PetMapProps = {
  leituras: Leitura[];
  leituraSelecionada?: Leitura | null;
  onSelecionarLeitura?: (leitura: Leitura) => void;
  mostrarTrajeto?: boolean;
  style?: object;
  mostrarControles?: boolean;
  mostrarCarousel?: boolean;
};

export default function PetMapWeb({
  leituras,
  leituraSelecionada,
  onSelecionarLeitura,
  mostrarTrajeto = true,
  style,
  mostrarControles = true,
  mostrarCarousel = true,
}: PetMapProps) {
  const iframeRef = useRef<any>(null);
  const listRef = useRef<FlatList>(null);
  const [itemAtivoManual, setItemAtivoManual] = useState<Leitura | null>(null);
  const itemAtivo =
    leituraSelecionada ??
    itemAtivoManual ??
    (leituras.length > 0 ? leituras[0] : null);

  const [tipoVisualizacao, setTipoVisualizacao] = useState<"padrao" | "satelite">(
    "padrao"
  );
  const [obtendoLocal, setObtendoLocal] = useState(false);
  const [recolhido, setRecolhido] = useState(false);

  // Sincroniza quando leituraSelecionada mudar externamente
  useEffect(() => {
    if (leituraSelecionada) {
      enviarComandoParaMapa("SELECT_SCAN", {
        id: leituraSelecionada.id,
        lat: leituraSelecionada.latitude,
        lng: leituraSelecionada.longitude,
      });
      // Rola a lista horizontal para o item ativo
      const idx = leituras.findIndex((l) => l.id === leituraSelecionada.id);
      if (idx >= 0 && listRef.current) {
        try {
          listRef.current.scrollToIndex({ index: idx, animated: true });
        } catch {
          // ignora caso lista não esteja pronta
        }
      }
    }
  }, [leituraSelecionada, leituras]);

  // Escuta mensagens vindas do mapa (Leaflet dentro do iframe)
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!event.data || typeof event.data !== "object") return;

      if (event.data.type === "MARKER_CLICKED") {
        const id = event.data.id;
        const encontrada = leituras.find((l) => l.id === id);
        if (encontrada) {
          setItemAtivoManual(encontrada);
          if (onSelecionarLeitura) onSelecionarLeitura(encontrada);
          const idx = leituras.findIndex((l) => l.id === id);
          if (idx >= 0 && listRef.current) {
            try {
              listRef.current.scrollToIndex({ index: idx, animated: true });
            } catch {
              // ignora
            }
          }
        }
      }
    }

    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.addEventListener("message", handleMessage);
      return () => {
        window.removeEventListener("message", handleMessage);
      };
    }
  }, [leituras, onSelecionarLeitura]);

  function enviarComandoParaMapa(type: string, payload?: any) {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type, ...payload },
        "*"
      );
    }
  }

  // Gera o HTML autônomo com Leaflet, OpenStreetMap, marcadores customizados e linha de trajeto
  const leafletHtml = useMemo(() => {
    const defaultCenter =
      leituras.length > 0
        ? [leituras[0].latitude, leituras[0].longitude]
        : [-10.1843, -48.3336];

    const jsonLeituras = JSON.stringify(leituras);
    const activeId = itemAtivo?.id || (leituras[0]?.id ?? "");

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>PetSafe Mapa Interativo</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; }
    html, body, #map {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      background-color: #F3F4F6;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
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

    // Ícone SVG de pata de pet
    const pawSvg = \`<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2M6 6C4.9 6 4 6.9 4 8C4 9.1 4.9 10 6 10C7.1 10 8 9.1 8 8C8 6.9 7.1 6 6 6M18 6C16.9 6 16 6.9 16 8C16 9.1 16.9 10 18 10C19.1 10 20 9.1 20 8C20 6.9 19.1 6 18 6M8.5 13C7.1 13 6 14.1 6 15.5C6 17.5 8 20 12 22C16 20 18 17.5 18 15.5C18 14.1 16.9 13 15.5 13C14.3 13 13.2 13.8 12.8 14.9C12.5 14.8 12.2 14.8 12 14.8C11.8 14.8 11.5 14.8 11.2 14.9C10.8 13.8 9.7 13 8.5 13Z" />
    </svg>\`;

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
            \${pawSvg}
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
            \${isLatest ? '📍 ÚLTIMO ESCANEAMENTO' : '📍 Escaneamento #' + numOrdem}
          </div>
          <h4 class="popup-pet">\${l.pet?.nome || 'Medalha PetSafe'}</h4>
          <div class="popup-time">🕒 \${dateStr}</div>
          <div class="popup-addr">📍 \${l.endereco_aproximado || (l.bairro ? l.bairro + ', Palmas' : 'Coordenadas')}</div>
          \${l.lido_por_dispositivo ? \`<div class="popup-device">📱 \${l.lido_por_dispositivo}</div>\` : ''}
          <a class="popup-btn-rota" href="\${googleMapsUrl}" target="_blank" rel="noopener noreferrer">
            🧭 Traçar Rota no Google Maps
          </a>
        </div>
      \`;

      const marker = L.marker(coord, { icon: customIcon }).addTo(map);
      marker.bindPopup(popupContent);

      marker.on('click', () => {
        highlightPin(l.id);
        window.parent.postMessage({ type: 'MARKER_CLICKED', id: l.id }, '*');
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

    // Escuta comandos enviados pelo React Native Web
    window.addEventListener('message', function(e) {
      if (!e.data || !e.data.type) return;

      if (e.data.type === 'SELECT_SCAN') {
        const id = e.data.id;
        if (markersMap[id]) {
          highlightPin(id);
          map.flyTo(markersMap[id].coord, 16, { duration: 0.8 });
          markersMap[id].marker.openPopup();
        }
      } else if (e.data.type === 'FIT_ALL') {
        if (latlngs.length > 0) {
          map.fitBounds(L.latLngBounds(latlngs), { padding: [60, 60] });
        }
      } else if (e.data.type === 'CENTER_LATEST') {
        if (leituras.length > 0) {
          const first = leituras[0];
          map.flyTo([first.latitude, first.longitude], 16, { duration: 0.8 });
          if (markersMap[first.id]) {
            markersMap[first.id].marker.openPopup();
            highlightPin(first.id);
          }
        }
      } else if (e.data.type === 'SET_LAYER') {
        if (e.data.layer === 'satelite') {
          map.removeLayer(streetLayer);
          satelliteLayer.addTo(map);
        } else {
          map.removeLayer(satelliteLayer);
          streetLayer.addTo(map);
        }
      } else if (e.data.type === 'USER_LOCATION') {
        const userCoord = [e.data.lat, e.data.lng];
        L.circleMarker(userCoord, {
          radius: 8,
          fillColor: '#3B82F6',
          color: '#FFFFFF',
          weight: 3,
          fillOpacity: 1
        }).addTo(map).bindPopup("Você está aqui").openPopup();
        map.flyTo(userCoord, 15);
      }
    });

    // Notifica que o mapa está pronto
    window.parent.postMessage({ type: 'MAP_READY' }, '*');
  </script>
</body>
</html>`;
  }, [leituras, itemAtivo?.id, mostrarTrajeto]);

  function selecionarLeitura(leitura: Leitura) {
    setItemAtivoManual(leitura);
    if (onSelecionarLeitura) onSelecionarLeitura(leitura);
    enviarComandoParaMapa("SELECT_SCAN", {
      id: leitura.id,
      lat: leitura.latitude,
      lng: leitura.longitude,
    });
  }

  function centralizarNoMaisRecente() {
    if (leituras.length > 0) {
      selecionarLeitura(leituras[0]);
      enviarComandoParaMapa("CENTER_LATEST");
    }
  }

  function ajustarParaTodosOsPontos() {
    enviarComandoParaMapa("FIT_ALL");
  }

  function alternarCamada() {
    const nova = tipoVisualizacao === "padrao" ? "satelite" : "padrao";
    setTipoVisualizacao(nova);
    enviarComandoParaMapa("SET_LAYER", { layer: nova });
  }

  function obterMinhaLocalizacao() {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      setObtendoLocal(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setObtendoLocal(false);
          enviarComandoParaMapa("USER_LOCATION", {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          setObtendoLocal(false);
          console.warn("Erro ao obter geolocalização web:", err);
          alert("Não foi possível acessar a localização do navegador.");
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      alert("Geolocalização não disponível no navegador.");
    }
  }

  function abrirRota(leitura: Leitura) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${leitura.latitude},${leitura.longitude}`;
    Linking.openURL(url);
  }

  async function compartilharLeitura(leitura: Leitura) {
    try {
      const petNome = leitura.pet?.nome || "Cachorro PetSafe";
      const texto = `📍 Localização de ${petNome}: ${leitura.endereco_aproximado || "Medalha escaneada"}. Veja no mapa: https://www.google.com/maps/search/?api=1&query=${leitura.latitude},${leitura.longitude}`;
      await Share.share({ message: texto });
    } catch {
      // Ignora erro de compartilhamento cancelado
    }
  }

  function formatarHora(isoString: string) {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  }

  return (
    <View style={[styles.container, style]}>
      {/* MAPA INTERATIVO (IFRAME LEAFLET) */}
      <View style={styles.iframeWrapper}>
        {React.createElement("iframe", {
          ref: iframeRef,
          srcDoc: leafletHtml,
          style: {
            width: "100%",
            height: "100%",
            border: "none",
            backgroundColor: "#E5E7EB",
          },
          title: "Mapa Interativo de Leituras do Pet",
        })}

        {/* CONTROLES FLUTUANTES SOBRE O MAPA */}
        {mostrarControles && (
          <View style={styles.controlesFlutuantes}>
            <TouchableOpacity
              style={styles.botaoControle}
              onPress={centralizarNoMaisRecente}
              accessibilityLabel="Focar no mais recente"
            >
              <MaterialCommunityIcons
                name="crosshairs-gps"
                size={20}
                color={COLORS.yellow}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoControle}
              onPress={ajustarParaTodosOsPontos}
              accessibilityLabel="Ver todos os pontos"
            >
              <MaterialCommunityIcons
                name="image-filter-center-focus"
                size={20}
                color={COLORS.blue}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoControle}
              onPress={obterMinhaLocalizacao}
              disabled={obtendoLocal}
              accessibilityLabel="Minha localização"
            >
              {obtendoLocal ? (
                <ActivityIndicator size="small" color={COLORS.blue} />
              ) : (
                <Ionicons name="navigate" size={18} color={COLORS.blue} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.botaoControle,
                tipoVisualizacao === "satelite" && styles.botaoControleAtivo,
              ]}
              onPress={alternarCamada}
              accessibilityLabel="Alternar satélite / rua"
            >
              <Ionicons
                name="layers-outline"
                size={18}
                color={
                  tipoVisualizacao === "satelite" ? COLORS.white : COLORS.blue
                }
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* CAROUSEL HORIZONTAL DOS ÚLTIMOS ESCANEAMENTOS */}
      {mostrarCarousel && (
        <View style={styles.carouselContainer}>
          <TouchableOpacity
            style={styles.carouselHeader}
            onPress={() => setRecolhido(!recolhido)}
            activeOpacity={0.7}
            accessibilityLabel={recolhido ? "Expandir lista de escaneamentos" : "Minimizar lista de escaneamentos"}
          >
            <View style={styles.carouselHeaderLeft}>
              <MaterialCommunityIcons name="history" size={18} color={COLORS.blue} />
              <Text style={styles.carouselTitulo}>Últimos Escaneamentos</Text>
              <Text style={styles.carouselContador}>
                • {leituras.length} {leituras.length === 1 ? "registro" : "registros"}
              </Text>
            </View>
            <View style={styles.botaoToggleRecolhido}>
              <Text style={styles.textoToggleRecolhido}>
                {recolhido ? "Ver Lista" : "Minimizar"}
              </Text>
              <Ionicons
                name={recolhido ? "chevron-up" : "chevron-down"}
                size={16}
                color={COLORS.blue}
              />
            </View>
          </TouchableOpacity>

          {!recolhido && (
            <FlatList
              ref={listRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              data={leituras}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.carouselLista}
          renderItem={({ item, index }) => {
            const isAtivo = itemAtivo?.id === item.id;
            const isLatest = index === 0;
            const numOrdem = leituras.length - index;

            return (
              <TouchableOpacity
                style={[styles.cardScan, isAtivo && styles.cardScanAtivo]}
                onPress={() => selecionarLeitura(item)}
                activeOpacity={0.85}
              >
                <View style={styles.cardScanTop}>
                  <View
                    style={[
                      styles.badgeOrdem,
                      isLatest && styles.badgeOrdemLatest,
                      isAtivo && styles.badgeOrdemAtivo,
                    ]}
                  >
                    <Ionicons
                      name={isLatest ? "star" : "location"}
                      size={12}
                      color={isLatest ? COLORS.blue : COLORS.white}
                    />
                    <Text
                      style={[
                        styles.badgeOrdemTexto,
                        isLatest && styles.badgeOrdemTextoLatest,
                      ]}
                    >
                      {isLatest ? "#1 Mais Recente" : `#${numOrdem}`}
                    </Text>
                  </View>

                  <Text style={styles.tempoRelativo}>
                    {formatarHora(item.criado_em)}
                  </Text>
                </View>

                <View style={styles.cardScanMeio}>
                  <Text style={styles.petNomeCard}>
                    {item.pet?.nome || "Cachorro PetSafe"}
                  </Text>
                  <Text style={styles.enderecoCard} numberOfLines={2}>
                    {item.endereco_aproximado ||
                      `${item.bairro || ""} Palmas`.trim()}
                  </Text>
                  <Text style={styles.dataExataCard}>
                    🕒 {new Date(item.criado_em).toLocaleString("pt-BR")}
                  </Text>
                </View>

                {item.lido_por_dispositivo && (
                  <View style={styles.dispositivoWrapper}>
                    <Ionicons
                      name="phone-portrait-outline"
                      size={12}
                      color={COLORS.roxoclaro}
                    />
                    <Text style={styles.dispositivoTexto} numberOfLines={1}>
                      {item.lido_por_dispositivo}
                    </Text>
                  </View>
                )}

                <View style={styles.botoesAcao}>
                  <TouchableOpacity
                    style={styles.botaoRota}
                    onPress={() => abrirRota(item)}
                  >
                    <Ionicons name="navigate" size={14} color={COLORS.blue} />
                    <Text style={styles.textoBotaoRota}>Traçar Rota</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.botaoCompartilhar}
                    onPress={() => compartilharLeitura(item)}
                  >
                    <Ionicons
                      name="share-social-outline"
                      size={14}
                      color={COLORS.blue}
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
        />
          )}
      </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  iframeWrapper: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  controlesFlutuantes: {
    position: "absolute",
    right: 14,
    top: 14,
    gap: 8,
    zIndex: 10,
  },
  botaoControle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  botaoControleAtivo: {
    backgroundColor: COLORS.blue,
  },

  // Carousel Inferior
  carouselContainer: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 10,
    paddingBottom: 14,
  },
  carouselHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  carouselHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  carouselTitulo: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: COLORS.blue,
  },
  carouselContador: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: COLORS.roxoclaro,
  },
  botaoToggleRecolhido: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0F2FA",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  textoToggleRecolhido: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
    color: COLORS.blue,
  },
  carouselLista: {
    paddingHorizontal: 14,
    gap: 10,
  },
  cardScan: {
    width: 250,
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  cardScanAtivo: {
    backgroundColor: "#FFFFFF",
    borderColor: COLORS.yellow,
    shadowColor: COLORS.yellow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  cardScanTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badgeOrdem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.blue,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeOrdemLatest: {
    backgroundColor: COLORS.yellow,
  },
  badgeOrdemAtivo: {
    transform: [{ scale: 1.05 }],
  },
  badgeOrdemTexto: {
    fontSize: 10,
    fontFamily: "Poppins_700Bold",
    color: COLORS.white,
  },
  badgeOrdemTextoLatest: {
    color: COLORS.blue,
  },
  tempoRelativo: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
    color: COLORS.yellow,
  },
  cardScanMeio: {
    gap: 2,
  },
  petNomeCard: {
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
    color: COLORS.blue,
  },
  enderecoCard: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#374151",
    lineHeight: 16,
  },
  dataExataCard: {
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    color: COLORS.roxoclaro,
    marginTop: 2,
  },
  dispositivoWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dispositivoTexto: {
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    color: COLORS.roxoclaro,
    flex: 1,
  },
  botoesAcao: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  botaoRota: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#EEF2FF",
    paddingVertical: 6,
    borderRadius: 8,
  },
  textoBotaoRota: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
    color: COLORS.blue,
  },
  botaoCompartilhar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
});
