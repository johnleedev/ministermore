import axios from 'axios';
import MainURL from '../../MainURL';
import type { MarkerPosition } from './ClusterMap';

export interface GeocodablePlace {
  id: number;
  placeName: string;
  location?: string;
  address?: string;
  sort?: string;
  images?: string | string[] | null;
}

const queryCache = new Map<string, { lat: number; lng: number }>();
const placeCache = new Map<number, MarkerPosition>();

const buildGeocodeQuery = (place: GeocodablePlace, address?: string) => {
  const resolvedAddress = address?.trim() || place.address?.trim();
  if (resolvedAddress) return resolvedAddress;

  return [place.location, place.placeName].filter(Boolean).join(' ').trim();
};

async function fetchPlaceAddress(id: number): Promise<string | undefined> {
  try {
    const response = await axios.post(`${MainURL}/retreat/getdataplacepart`, { id });
    const detail = Array.isArray(response.data) ? response.data[0] : null;
    const address = detail?.address?.trim();
    return address || undefined;
  } catch (error) {
    console.error('장소 주소 조회 오류:', error);
    return undefined;
  }
}

async function geocodeQuery(query: string): Promise<{ lat: number; lng: number } | null> {
  if (!query) return null;

  const cached = queryCache.get(query);
  if (cached) return cached;

  try {
    const response = await axios.post(`${MainURL}/retreat/geocode`, { address: query });
    if (response.data.success && response.data.coordinates) {
      const coords = {
        lat: response.data.coordinates.latitude as number,
        lng: response.data.coordinates.longitude as number,
      };
      queryCache.set(query, coords);
      return coords;
    }
  } catch (error) {
    console.error('장소 지오코딩 오류:', error);
  }

  return null;
}

async function geocodePlace(place: GeocodablePlace): Promise<MarkerPosition | null> {
  const cached = placeCache.get(place.id);
  if (cached) return cached;

  let address = place.address?.trim();
  if (!address) {
    address = await fetchPlaceAddress(place.id);
  }

  const query = buildGeocodeQuery(place, address);
  const coords = await geocodeQuery(query);
  if (!coords) return null;

  const marker: MarkerPosition = {
    id: place.id,
    lat: coords.lat,
    lng: coords.lng,
    title: place.placeName,
    location: place.location,
    sort: place.sort,
    images: place.images,
  };
  placeCache.set(place.id, marker);
  return marker;
}

async function geocodePlacesClient(places: GeocodablePlace[]): Promise<MarkerPosition[]> {
  const uniquePlaces = Array.from(new Map(places.map((place) => [place.id, place])).values());
  const concurrency = 3;
  const results: MarkerPosition[] = [];

  for (let i = 0; i < uniquePlaces.length; i += concurrency) {
    const chunk = uniquePlaces.slice(i, i + concurrency);
    const chunkResults = await Promise.all(chunk.map((place) => geocodePlace(place)));
    chunkResults.forEach((marker) => {
      if (marker) results.push(marker);
    });
  }

  return results;
}

function cacheMarkers(markers: MarkerPosition[]) {
  markers.forEach((marker) => {
    if (marker.id != null) {
      placeCache.set(marker.id, marker);
    }
  });
}

const placeImagesCache = new Map<string, Map<number, GeocodablePlace['images']>>();

/** PlaceList와 동일한 getdataplace API로 장소별 images 조회 */
async function fetchPlaceImagesMap(region: string): Promise<Map<number, GeocodablePlace['images']>> {
  const cacheKey = region || 'all';
  const cached = placeImagesCache.get(cacheKey);
  if (cached) return cached;

  const imageMap = new Map<number, GeocodablePlace['images']>();
  let page = 1;
  let totalCount = Infinity;

  while (imageMap.size < totalCount) {
    try {
      const response = await axios.post(`${MainURL}/retreat/getdataplace`, {
        region,
        sort: 'all',
        page,
        pageSize: 50,
      });

      totalCount = response.data?.count ?? 0;
      const items = response.data?.data;

      if (!items || !Array.isArray(items) || items.length === 0) {
        break;
      }

      items.forEach((item: { id: number; images?: GeocodablePlace['images'] }) => {
        imageMap.set(item.id, item.images ?? null);
      });

      if (items.length < 50) {
        break;
      }

      page += 1;
    } catch (error) {
      console.error('장소 이미지 조회 오류:', error);
      break;
    }
  }

  placeImagesCache.set(cacheKey, imageMap);
  return imageMap;
}

function mergeImagesIntoMarkers(
  markers: MarkerPosition[],
  imageMap: Map<number, GeocodablePlace['images']>,
  fallbackPlaces: GeocodablePlace[] = [],
): MarkerPosition[] {
  const fallbackMap = new Map(fallbackPlaces.map((place) => [place.id, place.images]));

  return markers.map((marker) => {
    if (marker.id == null) return marker;

    const images =
      marker.images ??
      imageMap.get(marker.id) ??
      fallbackMap.get(marker.id) ??
      null;

    if (images === marker.images) return marker;

    return { ...marker, images };
  });
}

async function enrichMarkersWithImages(
  markers: MarkerPosition[],
  region: string,
  fallbackPlaces: GeocodablePlace[] = [],
): Promise<MarkerPosition[]> {
  const imageMap = await fetchPlaceImagesMap(region);
  return mergeImagesIntoMarkers(markers, imageMap, fallbackPlaces);
}

/** 리스트 장소를 좌표로 변환 — 서버 일괄 API 우선, 미배포 시 상세 주소 조회 후 지오코딩 */
export async function geocodePlaces(places: GeocodablePlace[]): Promise<MarkerPosition[]> {
  const uniquePlaces = Array.from(new Map(places.map((place) => [place.id, place])).values());
  if (uniquePlaces.length === 0) return [];

  const cachedMarkers = uniquePlaces
    .map((place) => placeCache.get(place.id))
    .filter((marker): marker is MarkerPosition => Boolean(marker));

  if (cachedMarkers.length === uniquePlaces.length) {
    if (!cachedMarkers.some((marker) => marker.images == null)) {
      return cachedMarkers;
    }

    const enriched = mergeImagesIntoMarkers(
      cachedMarkers,
      await fetchPlaceImagesMap('all'),
      uniquePlaces,
    );
    cacheMarkers(enriched);
    return enriched;
  }

  const missingIds = uniquePlaces
    .filter((place) => !placeCache.has(place.id))
    .map((place) => place.id);

  try {
    const response = await axios.post(`${MainURL}/retreat/getdataplacemarkers`, { ids: missingIds });
    if (response.data?.success && Array.isArray(response.data.markers)) {
      const markers = mergeImagesIntoMarkers(
        response.data.markers as MarkerPosition[],
        await fetchPlaceImagesMap('all'),
        uniquePlaces,
      );
      cacheMarkers(markers);

      return uniquePlaces
        .map((place) => placeCache.get(place.id))
        .filter((marker): marker is MarkerPosition => Boolean(marker));
    }
  } catch {
    // 서버 미배포 시 클라이언트 fallback
  }

  const clientMarkers = await geocodePlacesClient(
    uniquePlaces.filter((place) => !placeCache.has(place.id)),
  );
  const enrichedClientMarkers = mergeImagesIntoMarkers(clientMarkers, await fetchPlaceImagesMap('all'), uniquePlaces);
  cacheMarkers(enrichedClientMarkers);

  return uniquePlaces
    .map((place) => placeCache.get(place.id))
    .filter((marker): marker is MarkerPosition => Boolean(marker));
}

export function getMarkerCenter(positions: MarkerPosition[]) {
  if (positions.length === 0) {
    return { lat: 37.5665, lng: 126.978 };
  }

  const lat = positions.reduce((sum, pos) => sum + pos.lat, 0) / positions.length;
  const lng = positions.reduce((sum, pos) => sum + pos.lng, 0) / positions.length;
  return { lat, lng };
}

const regionMarkerCache = new Map<string, MarkerPosition[]>();

/** 선택 지역의 전체 장소 마커 조회 */
export async function fetchRegionPlaceMarkers(region: string): Promise<MarkerPosition[]> {
  const cacheKey = region || 'all';
  const cached = regionMarkerCache.get(cacheKey);
  if (cached?.length && cached.every((marker) => Object.prototype.hasOwnProperty.call(marker, 'images'))) {
    return cached;
  }

  try {
    const response = await axios.post(`${MainURL}/retreat/getdataplacemarkers`, { region });
    if (response.data?.success && Array.isArray(response.data.markers)) {
      const markers = await enrichMarkersWithImages(response.data.markers as MarkerPosition[], region);
      cacheMarkers(markers);
      regionMarkerCache.set(cacheKey, markers);
      return markers;
    }
  } catch {
    // 서버 미배포·오류 시 빈 배열
  }

  return [];
}
