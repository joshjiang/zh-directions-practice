import { GRID_SIZE } from './gridLayout';

// HSK3 level location vocabulary (Chinese)
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

// TOPIK 3 level location vocabulary (Korean)
export const TOPIK3_LOCATIONS = [
  '도서관', // library
  '슈퍼마켓', // supermarket
  '식당', // restaurant
  '병원', // hospital
  '은행', // bank
  '학교', // school
  '공원', // park
  '서점', // bookstore
  '영화관', // cinema
  '카페', // café
  '우체국', // post office
  '기차역', // train station
  '회사', // company
  '호텔', // hotel
  '가게', // shop
  '약국', // pharmacy
  '교실', // classroom
  '사무실', // office
  '음식점', // restaurant
  '기숙사', // dormitory
  '공항', // airport
  '역', // station
  '시장', // market
  '체육관', // gymnasium
  '수영장', // swimming pool
];

export const DIRECTIONS = ['north', 'south', 'east', 'west'];

const randomInt = (max) => Math.floor(Math.random() * max);

const pickRandom = (items) => items[randomInt(items.length)];

/** Fisher-Yates: `sort(() => Math.random() - 0.5)` is measurably biased. */
const shuffle = (items) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/**
 * Generates a random grid of buildings.
 * @param {string} language - 'chinese' or 'korean'
 * @returns {string[][]} GRID_SIZE x GRID_SIZE grid of location names
 */
export const generateRandomBuildings = (language = 'chinese') => {
  const locations = language === 'korean' ? TOPIK3_LOCATIONS : HSK3_LOCATIONS;
  const shuffled = shuffle(locations);

  return Array.from({ length: GRID_SIZE }, (_, row) =>
    Array.from({ length: GRID_SIZE }, (_, col) => shuffled[(row * GRID_SIZE + col) % shuffled.length])
  );
};

/**
 * Generates a random starting direction
 * @returns {string} One of: 'north', 'south', 'east', 'west'
 */
export const generateRandomDirection = () => pickRandom(DIRECTIONS);

const generateStreetPosition = () => {
  const type = pickRandom(['vertical-street', 'horizontal-street', 'intersection']);

  // Streets sit *between* buildings, so the axis they run along has one fewer slot.
  switch (type) {
    case 'vertical-street':
      return { type, row: randomInt(GRID_SIZE), col: randomInt(GRID_SIZE - 1) };
    case 'horizontal-street':
      return { type, row: randomInt(GRID_SIZE - 1), col: randomInt(GRID_SIZE) };
    default:
      return { type, row: randomInt(GRID_SIZE - 1), col: randomInt(GRID_SIZE - 1) };
  }
};

const generateBuildingPosition = () => ({
  type: 'building',
  row: randomInt(GRID_SIZE),
  col: randomInt(GRID_SIZE),
});

/** Blocks away, ignoring the street/building distinction. */
const gridDistance = (a, b) => Math.abs(a.row - b.row) + Math.abs(a.col - b.col);

/**
 * Generates random start and end positions, plus a starting direction.
 * Start: on a street (vertical-street, horizontal-street, or intersection)
 * End: in a building, at least MIN_DISTANCE blocks away so the exercise
 *      requires an actual route rather than "it's right there".
 */
export const generateRandomPositions = () => {
  const MIN_DISTANCE = 2;
  const MAX_ATTEMPTS = 50;

  const start = generateStreetPosition();

  let end = generateBuildingPosition();
  for (let i = 0; i < MAX_ATTEMPTS && gridDistance(start, end) < MIN_DISTANCE; i++) {
    end = generateBuildingPosition();
  }

  return { start, end, direction: generateRandomDirection() };
};
