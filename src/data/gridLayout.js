/**
 * Single source of truth for map geometry.
 *
 * Map.jsx publishes these as CSS custom properties on the grid, so Map.css and
 * the SVG overlay in PathAnimation.jsx can no longer drift apart.
 */
export const GRID_SIZE = 5;

/** Side length of a building cell, in px. */
export const BUILDING_SIZE = 110;

/** Width of a street between buildings, in px. */
export const STREET_SIZE = 40;

/** Inner padding of the grid container, in px. */
export const GRID_PADDING = 15;

/** Border width of the grid container, in px. */
export const GRID_BORDER = 3;

/** Distance from one building's top-left to the next building's top-left. */
export const CELL_PITCH = BUILDING_SIZE + STREET_SIZE;

export const gridCssVars = {
  '--building-size': `${BUILDING_SIZE}px`,
  '--street-size': `${STREET_SIZE}px`,
  '--grid-padding': `${GRID_PADDING}px`,
  '--grid-border': `${GRID_BORDER}px`,
};

/** True when this x sits inside a vertical street band rather than a building. */
const onVerticalStreet = (x) => ((x % CELL_PITCH) + CELL_PITCH) % CELL_PITCH >= BUILDING_SIZE;

/** True when this y sits inside a horizontal street band rather than a building. */
const onHorizontalStreet = (y) => ((y % CELL_PITCH) + CELL_PITCH) % CELL_PITCH >= BUILDING_SIZE;

/**
 * Expands a list of points into a polyline that turns at right angles and
 * follows the street grid, instead of cutting diagonally through buildings.
 *
 * A straight line between two points is only safe when they share an axis.
 * Otherwise we insert a corner, choosing the leg that runs along whichever
 * street the walker is already standing on, so only the final short stub
 * crosses a building frontage - which is how you would actually walk in.
 *
 * @param {Array<{x: number, y: number}>} points
 * @returns {Array<{x: number, y: number}>}
 */
export const routeAlongStreets = (points) => {
  if (points.length < 2) return points;

  const routed = [points[0]];

  for (let i = 1; i < points.length; i++) {
    const from = routed[routed.length - 1];
    const to = points[i];

    if (from.x !== to.x && from.y !== to.y) {
      // Travel along the street we are on first, then turn.
      const horizontalFirst = onHorizontalStreet(from.y)
        ? true
        : onVerticalStreet(from.x)
          ? false
          : !onHorizontalStreet(to.y);

      routed.push(horizontalFirst ? { x: to.x, y: from.y } : { x: from.x, y: to.y });
    }

    routed.push(to);
  }

  return routed;
};

/**
 * Converts a map position to pixel coordinates within the grid's padding box.
 * @param {{type: string, row: number, col: number}} pos
 * @returns {{x: number, y: number}}
 */
export const positionToPixels = ({ type, row, col }) => {
  // A vertical street sits after the building in the same column; a horizontal
  // street sits after the building in the same row. Intersections are both.
  const offsetAfterBuilding = BUILDING_SIZE + STREET_SIZE / 2;
  const centerOfBuilding = BUILDING_SIZE / 2;

  const xOffset = type === 'vertical-street' || type === 'intersection'
    ? offsetAfterBuilding
    : centerOfBuilding;
  const yOffset = type === 'horizontal-street' || type === 'intersection'
    ? offsetAfterBuilding
    : centerOfBuilding;

  return {
    x: col * CELL_PITCH + xOffset,
    y: row * CELL_PITCH + yOffset,
  };
};
