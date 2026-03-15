import { geoEquirectangular, geoPath, type GeoPermissibleObjects } from "d3-geo";

// Bounds for East Africa (Kenya, Somalia, South Sudan)
const BOUNDS = {
  minLon: 23,
  maxLon: 52,
  minLat: -5,
  maxLat: 16,
};

export function createProjection(width: number, height: number) {
  const centerLon = (BOUNDS.minLon + BOUNDS.maxLon) / 2;
  const centerLat = (BOUNDS.minLat + BOUNDS.maxLat) / 2;

  const boundingPolygon: GeoPermissibleObjects = {
    type: "Polygon",
    coordinates: [
      [
        [BOUNDS.minLon, BOUNDS.minLat],
        [BOUNDS.maxLon, BOUNDS.minLat],
        [BOUNDS.maxLon, BOUNDS.maxLat],
        [BOUNDS.minLon, BOUNDS.maxLat],
        [BOUNDS.minLon, BOUNDS.minLat],
      ],
    ],
  };

  const projection = geoEquirectangular()
    .center([centerLon, centerLat])
    .fitExtent(
      [
        [10, 10],
        [width - 10, height - 10],
      ],
      boundingPolygon
    );

  const pathGenerator = geoPath(projection);

  return { projection, pathGenerator };
}
