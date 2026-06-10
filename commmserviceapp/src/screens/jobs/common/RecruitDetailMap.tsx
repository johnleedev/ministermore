import {
  Component,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import axios from 'axios';
import { MAIN_API_BASE } from '../../../config/api';
import { jobColors } from './jobsTheme';

const API_BASE = MAIN_API_BASE.replace(/\/$/, '');

type Props = {
  address?: string;
  location?: string;
  locationDetail?: string;
  geocodePath?: string;
  caption?: string;
};

type Coordinates = { latitude: number; longitude: number };

type MapFailureReason = 'no_address' | 'geocode' | 'module' | 'render';

type NaverMapModule = {
  NaverMapView: React.ComponentType<any>;
  NaverMapMarkerOverlay: React.ComponentType<any>;
};

function loadNaverMapModule(): NaverMapModule | null {
  try {
    return require('@mj-studio/react-native-naver-map') as NaverMapModule;
  } catch {
    return null;
  }
}

function isUsableAddress(value?: string): value is string {
  const trimmed = value?.trim();
  return !!trimmed && trimmed !== '-';
}

function buildGeocodeQueries(
  address?: string,
  location?: string,
  locationDetail?: string,
): string[] {
  const queries: string[] = [];
  const push = (value?: string) => {
    if (!isUsableAddress(value)) return;
    const trimmed = value.trim();
    if (queries.indexOf(trimmed) === -1) queries.push(trimmed);
  };

  push(address);
  push([location, locationDetail].filter(Boolean).join(' '));
  push(location);

  return queries;
}

async function geocodeAddress(
  geocodePath: string,
  query: string,
): Promise<Coordinates | null> {
  const res = await axios.post(`${API_BASE}${geocodePath}`, { address: query });
  const coordinates = res.data?.coordinates;
  if (!res.data?.success || !coordinates) return null;

  const latitude = Number(coordinates.latitude);
  const longitude = Number(coordinates.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return { latitude, longitude };
}

async function resolveCoordinates(
  geocodePath: string,
  address?: string,
  location?: string,
  locationDetail?: string,
): Promise<Coordinates | null> {
  const queries = buildGeocodeQueries(address, location, locationDetail);
  for (const query of queries) {
    try {
      const coords = await geocodeAddress(geocodePath, query);
      if (coords) return coords;
    } catch {
      // try next query
    }
  }
  return null;
}

function MapFallback({
  message,
  actionLabel,
  onAction,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.fallback}>
      <Text style={styles.fallbackText}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable style={styles.actionBtn} onPress={onAction}>
          <Text style={styles.actionBtnText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function failureMessage(reason: MapFailureReason): string {
  switch (reason) {
    case 'no_address':
      return '표시할 주소 정보가 없습니다.';
    case 'geocode':
      return '주소를 좌표로 변환하지 못했습니다. 주소를 확인해 주세요.';
    case 'module':
      return '지도 모듈을 불러올 수 없습니다. 앱을 재빌드한 후 다시 시도해 주세요.';
    case 'render':
      return '지도 인증에 실패했습니다. 네이버 클라우드 Maps 앱 설정(com.mmserviceapp)을 확인한 뒤 앱을 재빌드해 주세요.';
    default:
      return '지도를 표시할 수 없습니다.';
  }
}

class MapErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function NaverMapContent({
  coords,
  caption,
  mapModule,
}: {
  coords: Coordinates;
  caption?: string;
  mapModule: NaverMapModule;
}) {
  const { NaverMapView, NaverMapMarkerOverlay } = mapModule;

  return (
    <View style={styles.wrap}>
      <NaverMapView
        style={styles.map}
        camera={{
          latitude: coords.latitude,
          longitude: coords.longitude,
          zoom: 14,
        }}
        isShowZoomControls
        isScrollGesturesEnabled={false}>
        <NaverMapMarkerOverlay
          latitude={coords.latitude}
          longitude={coords.longitude}
          image={{ symbol: 'red' }}
          caption={caption ? { text: caption } : undefined}
          anchor={{ x: 0.5, y: 1 }}
          width={24}
          height={36}
        />
      </NaverMapView>
    </View>
  );
}

export function RecruitDetailMap({
  address,
  location,
  locationDetail,
  geocodePath = '/recruitminister/geocode',
  caption,
}: Props) {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [failureReason, setFailureReason] = useState<MapFailureReason | null>(null);
  const mapModule = useMemo(() => loadNaverMapModule(), []);

  const geocodeQueries = useMemo(
    () => buildGeocodeQueries(address, location, locationDetail),
    [address, location, locationDetail],
  );

  useEffect(() => {
    if (!geocodeQueries.length) {
      setCoords(null);
      setFailureReason('no_address');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setFailureReason(null);

    (async () => {
      try {
        const resolved = await resolveCoordinates(
          geocodePath,
          address,
          location,
          locationDetail,
        );
        if (cancelled) return;
        if (resolved) {
          setCoords(resolved);
          setFailureReason(null);
        } else {
          setCoords(null);
          setFailureReason('geocode');
        }
      } catch {
        if (!cancelled) {
          setCoords(null);
          setFailureReason('geocode');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [address, location, locationDetail, geocodePath, geocodeQueries]);

  if (loading) {
    return (
      <View style={styles.fallback}>
        <ActivityIndicator color={jobColors.primary} />
      </View>
    );
  }

  if (failureReason || !coords) {
    return (
      <MapFallback
        message={failureMessage(failureReason || 'geocode')}
        actionLabel={
          failureReason === 'geocode' && isUsableAddress(address)
            ? '네이버 지도에서 검색'
            : undefined
        }
        onAction={
          failureReason === 'geocode' && isUsableAddress(address)
            ? () => {
                const query = encodeURIComponent(address.trim());
                Linking.openURL(`https://map.naver.com/v5/search/${query}`);
              }
            : undefined
        }
      />
    );
  }

  if (!mapModule) {
    return <MapFallback message={failureMessage('module')} />;
  }

  return (
    <MapErrorBoundary
      fallback={<MapFallback message={failureMessage('render')} />}>
      <NaverMapContent coords={coords} caption={caption} mapModule={mapModule} />
    </MapErrorBoundary>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: jobColors.border,
    backgroundColor: '#f5f5f5',
  },
  map: {
    width: '100%',
    height: 280,
  },
  fallback: {
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: jobColors.border,
    gap: 12,
  },
  fallbackText: {
    fontSize: 15,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 22,
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: jobColors.primary,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
