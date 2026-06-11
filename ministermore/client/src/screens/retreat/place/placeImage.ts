export type PlaceImages = string | string[] | null | undefined;

export const getFirstImage = (images: PlaceImages) => {
  if (!images) return '';
  if (Array.isArray(images)) return images[0] || '';

  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed[0] || '' : '';
  } catch {
    return images;
  }
};
