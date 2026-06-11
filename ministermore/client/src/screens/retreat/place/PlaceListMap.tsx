import { useCallback, useEffect, useMemo, useState } from 'react';
import MainURL from '../../../MainURL';
import ClusterMap, { MarkerPosition } from '../../utils/ClusterMap';
import Loading from '../../../components/Loading';
import { fetchRegionPlaceMarkers, geocodePlaces, getMarkerCenter } from '../../utils/geocodePlaces';
import { getFirstImage } from './placeImage';

export interface PlaceMapItem {
  id: number;
  placeName: string;
  location: string;
  address?: string;
  sort?: string;
  images?: string | string[] | null;
}

interface PlaceListMapProps {
  region: string;
  places: PlaceMapItem[];
  isSearching: boolean;
  onMarkerClick: (id: number) => void;
}

export default function PlaceListMap({ region, places, isSearching, onMarkerClick }: PlaceListMapProps) {
  const [markerPositions, setMarkerPositions] = useState<MarkerPosition[]>([]);
  const [visiblePlaces, setVisiblePlaces] = useState<MarkerPosition[]>([]);
  const [isMapGeocoding, setIsMapGeocoding] = useState(false);
  const [showMapGuide, setShowMapGuide] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsMapGeocoding(true);
    setVisiblePlaces([]);

    (async () => {
      try {
        const positions = isSearching
          ? await geocodePlaces(places)
          : await fetchRegionPlaceMarkers(region);

        if (!cancelled) {
          setMarkerPositions(positions);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setMarkerPositions([]);
        }
      } finally {
        if (!cancelled) {
          setIsMapGeocoding(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [region, places, isSearching]);

  const mapCenter = useMemo(() => getMarkerCenter(markerPositions), [markerPositions]);

  const handleVisibleMarkersChange = useCallback((visible: MarkerPosition[]) => {
    setVisiblePlaces(visible);
  }, []);

  const handleMapInteract = useCallback(() => {
    setShowMapGuide(false);
  }, []);

  if (isMapGeocoding) {
    return (
      <div className="place__map-section">
        <div className="place__map-loading">
          <Loading />
          <p className="place__map-loading__text">수련회 목록과 지도를 불러오는 중입니다. 잠시만 기다려주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="place__map-section">
      <div className="place__map-layout">
        <aside className="place__map-visible-list">
          <h4 className="place__map-visible-list__title">
            장소 목록 (총 {visiblePlaces.length}개)
          </h4>
          {visiblePlaces.length > 0 ? (
            <ul className="place__map-visible-list__items">
              {visiblePlaces.map((place) => {
                const firstImage = getFirstImage(place.images);

                return (
                <li key={place.id}>
                  <button type="button" onClick={() => place.id != null && onMarkerClick(place.id)}>
                    <div className="place__map-visible-list__thumb">
                      {firstImage ? (
                        <img
                          src={`${MainURL}/images/retreat/placeimage/${firstImage}`}
                          alt={place.title || '수련회 장소'}
                        />
                      ) : (
                        <p className="place__map-visible-list__thumb--empty">등록된 사진이 없습니다.</p>
                      )}
                    </div>
                    <div className="place__map-visible-list__content">
                      <span className="place__map-visible-list__name">{place.title || '장소명 없음'}</span>
                      {place.location ? (
                        <span className="place__map-visible-list__meta">{place.location}</span>
                      ) : null}
                      {place.sort ? (
                        <span className="place__map-visible-list__meta">{place.sort}</span>
                      ) : null}
                    </div>
                  </button>
                </li>
                );
              })}
            </ul>
          ) : (
            <p className="place__map-visible-list__empty">현재 지도 화면에 표시된 장소가 없습니다.</p>
          )}
        </aside>

        <div className="place__map-panel">
          {showMapGuide && (
            <button
              type="button"
              className="place__map-guide"
              onClick={() => setShowMapGuide(false)}
            >
              지도를 움직이면서 수련회 장소를 확인해보세요
            </button>
          )}
          <ClusterMap
            markerPositions={markerPositions}
            center={mapCenter}
            height="100%"
            onMarkerClick={onMarkerClick}
            onVisibleMarkersChange={handleVisibleMarkersChange}
            onMapInteract={handleMapInteract}
          />
        </div>
      </div>
    </div>
  );
}
