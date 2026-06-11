import { useCallback, useEffect, useMemo } from 'react';
import {
  Container as MapDiv,
  NaverMap,
  NavermapsProvider,
  useMap,
  useNavermaps,
} from 'react-naver-maps';
import { makeMarkerClustering } from './makeMarkerClustering';

const NAVER_MAP_KEY = 'lk228kw5ry';
const CLUSTER_SIZE = 40;
const CLUSTER_ANCHOR = CLUSTER_SIZE / 2;
/** 이 줌 이상이면 개별 마커에 장소명 라벨 표시 */
const LABEL_MIN_ZOOM = 10;
const MARKER_ICON_WIDTH = 180;
const MARKER_ICON_HEIGHT = 52;
const MARKER_PIN_ANCHOR_X = MARKER_ICON_WIDTH / 2;
const MARKER_PIN_ANCHOR_Y = 10;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildPlaceMarkerIcon(
  navermaps: typeof window.naver.maps,
  title: string | undefined,
  showLabel: boolean,
): naver.maps.HtmlIcon {
  const safeTitle = title ? escapeHtml(title) : '';
  const hasLabel = showLabel && Boolean(safeTitle);

  const content = hasLabel
    ? [
        '<div class="place-map-marker place-map-marker--labeled">',
        '<span class="place-map-marker__pin"></span>',
        `<span class="place-map-marker__label">${safeTitle}</span>`,
        '</div>',
      ].join('')
    : '<div class="place-map-marker"><span class="place-map-marker__pin"></span></div>';

  return {
    content,
    size: new navermaps.Size(
      hasLabel ? MARKER_ICON_WIDTH : 16,
      hasLabel ? MARKER_ICON_HEIGHT : 16,
    ),
    anchor: new navermaps.Point(
      hasLabel ? MARKER_PIN_ANCHOR_X : 8,
      hasLabel ? MARKER_PIN_ANCHOR_Y : 8,
    ),
  };
}

export interface MarkerPosition {
  id?: number;
  lat: number;
  lng: number;
  title?: string;
  location?: string;
  sort?: string;
  images?: string | string[] | null;
}

interface ClusterLayerProps {
  markerPositions: MarkerPosition[];
  onMarkerClick?: (id: number) => void;
}

interface MapBoundsListenerProps {
  markerPositions: MarkerPosition[];
  onVisibleMarkersChange?: (visible: MarkerPosition[]) => void;
  onMapInteract?: () => void;
}

interface MarkerClusteringInstance {
  setMap: (map: naver.maps.Map | null) => void;
}

/** map.getBounds() + bounds.hasLatLng()로 화면 내 마커만 추출 */
export function filterMarkersByBounds(
  map: naver.maps.Map,
  navermaps: typeof window.naver.maps,
  markerPositions: MarkerPosition[],
): MarkerPosition[] {
  const bounds = map.getBounds() as naver.maps.LatLngBounds | null;
  if (!bounds || typeof bounds.hasLatLng !== 'function') return [];

  return markerPositions.filter((marker) =>
    bounds.hasLatLng(new navermaps.LatLng(marker.lat, marker.lng)),
  );
}

/** dragend / zoom_changed 시 현재 화면 범위 내 마커 목록 갱신 */
function MapBoundsListener({
  markerPositions,
  onVisibleMarkersChange,
  onMapInteract,
}: MapBoundsListenerProps) {
  const navermaps = useNavermaps();
  const map = useMap();

  const updateVisibleMarkers = useCallback(() => {
    if (!map || !onVisibleMarkersChange) return;
    onVisibleMarkersChange(filterMarkersByBounds(map, navermaps, markerPositions));
  }, [map, navermaps, markerPositions, onVisibleMarkersChange]);

  const handleDragEnd = useCallback(() => {
    onMapInteract?.();
    updateVisibleMarkers();
  }, [onMapInteract, updateVisibleMarkers]);

  useEffect(() => {
    if (!map) return undefined;

    updateVisibleMarkers();

    const dragListener =
      onVisibleMarkersChange || onMapInteract
        ? navermaps.Event.addListener(map, 'dragend', handleDragEnd)
        : null;
    const zoomListener = onVisibleMarkersChange
      ? navermaps.Event.addListener(map, 'zoom_changed', updateVisibleMarkers)
      : null;

    return () => {
      if (dragListener) navermaps.Event.removeListener(dragListener);
      if (zoomListener) navermaps.Event.removeListener(zoomListener);
    };
  }, [map, navermaps, onVisibleMarkersChange, onMapInteract, updateVisibleMarkers, handleDragEnd]);

  return null;
}

/** 지도 인스턴스가 준비된 뒤 MarkerClustering을 생성·정리하는 내부 레이어 */
function ClusterLayer({ markerPositions, onMarkerClick }: ClusterLayerProps) {
  const navermaps = useNavermaps();
  const map = useMap();

  const positionsKey = useMemo(
    () => markerPositions.map((p) => `${p.id ?? ''}:${p.lat}:${p.lng}:${p.title ?? ''}`).join('|'),
    [markerPositions],
  );

  useEffect(() => {
    if (!map || !navermaps || !window.naver || markerPositions.length === 0) {
      return undefined;
    }

    const MarkerClustering = makeMarkerClustering(window.naver);

    const showLabelAtZoom = (zoom: number) => zoom >= LABEL_MIN_ZOOM;

    const markers = markerPositions.map((pos) => {
      const marker = new navermaps.Marker({
        position: new navermaps.LatLng(pos.lat, pos.lng),
        title: pos.title,
        icon: buildPlaceMarkerIcon(navermaps, pos.title, showLabelAtZoom(map.getZoom())),
      });

      if (onMarkerClick && pos.id != null) {
        navermaps.Event.addListener(marker, 'click', () => onMarkerClick(pos.id!));
      }

      return marker;
    });

    const updateMarkerLabels = () => {
      const showLabel = showLabelAtZoom(map.getZoom());
      markers.forEach((marker, index) => {
        marker.setIcon(buildPlaceMarkerIcon(navermaps, markerPositions[index]?.title, showLabel));
      });
    };

    const labelZoomListener = navermaps.Event.addListener(map, 'zoom_changed', updateMarkerLabels);

    const clusterIcon = {
      content: [
        '<div style="cursor:pointer;width:40px;height:40px;border-radius:50%;background:#22c55e;color:#fff;',
        'display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;',
        'border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.25);">',
        '<span>0</span>',
        '</div>',
      ].join(''),
      size: new navermaps.Size(CLUSTER_SIZE, CLUSTER_SIZE),
      anchor: new navermaps.Point(CLUSTER_ANCHOR, CLUSTER_ANCHOR),
    };

    const cluster = new MarkerClustering({
      minClusterSize: 2,
      maxZoom: 15,
      map,
      markers,
      disableClickZoom: false,
      gridSize: 120,
      icons: [clusterIcon],
      indexGenerator: [1000],
      stylingFunction: (clusterMarker: naver.maps.Marker, count: number) => {
        const countEl = clusterMarker.getElement()?.querySelector('span');
        if (countEl) {
          countEl.textContent = String(count);
        }
      },
    }) as unknown as MarkerClusteringInstance;

    return () => {
      navermaps.Event.removeListener(labelZoomListener);
      cluster.setMap(null);
      markers.forEach((marker) => marker.setMap(null));
    };
  }, [map, navermaps, markerPositions, positionsKey, onMarkerClick]);

  return null;
}

interface ClusterMapProps {
  markerPositions: MarkerPosition[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: number | string;
  onMarkerClick?: (id: number) => void;
  onVisibleMarkersChange?: (visible: MarkerPosition[]) => void;
  onMapInteract?: () => void;
}

export default function ClusterMap({
  markerPositions,
  center = { lat: 37.5665, lng: 126.978 },
  zoom = 11,
  height = 420,
  onMarkerClick,
  onVisibleMarkersChange,
  onMapInteract,
}: ClusterMapProps) {
  if (markerPositions.length === 0) {
    return (
      <div className="place-cluster-map place-cluster-map--empty" style={{ height }}>
        지도에 표시할 장소 좌표가 없습니다.
      </div>
    );
  }

  return (
    <NavermapsProvider ncpKeyId={NAVER_MAP_KEY}>
      <MapDiv className="place-cluster-map" style={{ width: '100%', height }}>
        <NaverMap defaultCenter={center} defaultZoom={zoom} zoomControl>
          <ClusterLayer markerPositions={markerPositions} onMarkerClick={onMarkerClick} />
          <MapBoundsListener
            markerPositions={markerPositions}
            onVisibleMarkersChange={onVisibleMarkersChange}
            onMapInteract={onMapInteract}
          />
        </NaverMap>
      </MapDiv>
    </NavermapsProvider>
  );
}
