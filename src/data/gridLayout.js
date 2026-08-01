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
