export type PlaceListViewMode = 'list' | 'map';

export interface PlaceReturnState {
  viewMode: PlaceListViewMode;
  region: string;
  searchWord?: string;
  isSearching?: boolean;
}

export interface PlaceListLocationState {
  placeReturn?: PlaceReturnState;
}

export interface PlaceDetailLocationState {
  placeReturn?: PlaceReturnState;
}

export const PLACE_LIST_PATH = '/retreat/place';
