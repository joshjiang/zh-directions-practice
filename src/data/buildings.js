// HSK3 level location vocabulary
export const HSK3_LOCATIONS = [
  '图书馆', // library
  '超市', // supermarket
  '餐厅', // restaurant
  '医院', // hospital
  '银行', // bank
  '学校', // school
  '公园', // park
  '书店', // bookstore
  '电影院', // cinema
  '咖啡馆', // café
  '邮局', // post office
  '火车站', // train station
  '公司', // company
  '酒店', // hotel
  '商店', // shop
  '药店', // pharmacy
  '教室', // classroom
  '办公室', // office
  '饭店', // restaurant/hotel
  '宿舍', // dormitory
  '机场', // airport
  '车站', // station
  '市场', // market
  '体育馆', // gymnasium
  '游泳池', // swimming pool
];

/**
 * Generates a random 5x5 grid of buildings from HSK3 locations
 * Ensures no duplicate buildings in the grid
 */
export const generateRandomBuildings = () => {
  const grid = [];
  const usedBuildings = new Set();

  // Shuffle the locations array
  const shuffled = [...HSK3_LOCATIONS].sort(() => Math.random() - 0.5);

  let index = 0;
  for (let row = 0; row < 5; row++) {
    grid[row] = [];
    for (let col = 0; col < 5; col++) {
      // Use shuffled locations, wrapping around if needed
      grid[row][col] = shuffled[index % shuffled.length];
      index++;
    }
  }

  return grid;
};

/**
 * Generates a random starting direction
 * @returns {string} One of: 'north', 'south', 'east', 'west'
 */
export const generateRandomDirection = () => {
  const directions = ['north', 'south', 'east', 'west'];
  return directions[Math.floor(Math.random() * directions.length)];
};

/**
 * Generates random start and end positions, plus starting direction
 * Start: on a street (vertical-street, horizontal-street, or intersection)
 * End: in a building
 * Ensures they are not the same position
 */
export const generateRandomPositions = () => {
  const streetTypes = ['vertical-street', 'horizontal-street', 'intersection'];

  const generateStreetPosition = () => {
    const type = streetTypes[Math.floor(Math.random() * streetTypes.length)];
    let row, col;

    if (type === 'vertical-street') {
      // Vertical streets are between columns 0-3 (4 vertical streets)
      row = Math.floor(Math.random() * 5); // 0-4
      col = Math.floor(Math.random() * 4); // 0-3
    } else if (type === 'horizontal-street') {
      // Horizontal streets are between rows 0-3 (4 horizontal streets)
      row = Math.floor(Math.random() * 4); // 0-3
      col = Math.floor(Math.random() * 5); // 0-4
    } else {
      // Intersections are at row 0-3, col 0-3
      row = Math.floor(Math.random() * 4); // 0-3
      col = Math.floor(Math.random() * 4); // 0-3
    }

    return { type, row, col };
  };

  const generateBuildingPosition = () => {
    return {
      type: 'building',
      row: Math.floor(Math.random() * 5), // 0-4
      col: Math.floor(Math.random() * 5)  // 0-4
    };
  };

  const start = generateStreetPosition();
  const end = generateBuildingPosition();
  const direction = generateRandomDirection();

  return { start, end, direction };
};
