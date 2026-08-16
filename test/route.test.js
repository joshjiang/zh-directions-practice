import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GRID_SIZE,
  toLattice,
  fromLattice,
  relativeSide,
  planRoute,
  describeRoute,
} from '../lib/route.js';

const BUILDINGS = [
  ['超市', '邮局', '学校', '餐厅', '市场'],
  ['公园', '公司', '医院', '车站', '药店'],
  ['饭馆', '酒店', '火车站', '书店', '咖啡馆'],
  ['商店', '教堂', '图书馆', '商业银行', '旅馆'],
  ['银行', '办公楼', '剧院', '电影院', '警察局'],
];

const everyPosition = () => {
  const all = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      all.push({ type: 'building', row, col });
      if (col < GRID_SIZE - 1) all.push({ type: 'vertical-street', row, col });
      if (row < GRID_SIZE - 1) all.push({ type: 'horizontal-street', row, col });
      if (row < GRID_SIZE - 1 && col < GRID_SIZE - 1) all.push({ type: 'intersection', row, col });
    }
  }
  return all;
};

const streets = () => everyPosition().filter((p) => p.type !== 'building');
const buildings = () => everyPosition().filter((p) => p.type === 'building');
const FACINGS = ['north', 'south', 'east', 'west'];

test('lattice coordinates round-trip for every position type', () => {
  for (const pos of everyPosition()) {
    const { x, y } = toLattice(pos);
    assert.deepEqual(fromLattice(x, y), pos, JSON.stringify(pos));
  }
});

test('buildings land on even coordinates, walkable space does not', () => {
  for (const pos of everyPosition()) {
    const { x, y } = toLattice(pos);
    const isBuilding = x % 2 === 0 && y % 2 === 0;
    assert.equal(isBuilding, pos.type === 'building', JSON.stringify(pos));
  }
});

test('relativeSide matches the bearing table in the prompt', () => {
  // The case that started this: heading south, an eastern building is on your
  // LEFT. The grader kept calling it right.
  assert.equal(relativeSide('south', 'east'), 'left');
  assert.equal(relativeSide('north', 'east'), 'right');
  assert.equal(relativeSide('south', 'west'), 'right');
  assert.equal(relativeSide('north', 'west'), 'left');
  assert.equal(relativeSide('east', 'north'), 'left');
  assert.equal(relativeSide('west', 'north'), 'right');
  assert.equal(relativeSide('east', 'south'), 'right');
  assert.equal(relativeSide('west', 'south'), 'left');
  for (const facing of FACINGS) {
    assert.equal(relativeSide(facing, facing), 'ahead');
  }
});

test('a route exists from every street position to every building, in any facing', () => {
  for (const start of streets()) {
    for (const end of buildings()) {
      for (const facing of FACINGS) {
        assert.ok(planRoute({ start, end, facing }), `${JSON.stringify({ start, end, facing })}`);
      }
    }
  }
});

test('routes stay on the street: every step is one half-block onto walkable space', () => {
  const max = (GRID_SIZE - 1) * 2;
  for (const start of streets()) {
    for (const end of buildings()) {
      const facing = FACINGS[(start.row + start.col + end.col) % 4];
      const route = planRoute({ start, end, facing });
      let cur = route.start;
      for (const move of route.moves) {
        const stepped = Math.abs(move.x - cur.x) + Math.abs(move.y - cur.y);
        assert.equal(stepped, move.action === 'forward' ? 1 : 0, 'moves one half-block at a time');
        assert.ok(move.x >= 0 && move.y >= 0 && move.x <= max && move.y <= max, 'stays on the map');
        assert.ok(move.x % 2 === 1 || move.y % 2 === 1, 'never walks through a building');
        cur = move;
      }
    }
  }
});

/**
 * Shortest walking distance in half-blocks, by plain BFS with no notion of
 * facing. Straight-line distance is the wrong yardstick here: you cannot step
 * sideways off a north-south street, so reaching the street one block east
 * costs four half-steps, not two.
 */
const bfsDistance = (from, to) => {
  const max = (GRID_SIZE - 1) * 2;
  const walkable = (x, y) => x >= 0 && y >= 0 && x <= max && y <= max && (x % 2 === 1 || y % 2 === 1);
  const seen = new Set([`${from.x},${from.y}`]);
  let frontier = [from];
  let steps = 0;
  while (frontier.length) {
    if (frontier.some((n) => n.x === to.x && n.y === to.y)) return steps;
    const next = [];
    for (const node of frontier) {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const x = node.x + dx;
        const y = node.y + dy;
        if (!walkable(x, y) || seen.has(`${x},${y}`)) continue;
        seen.add(`${x},${y}`);
        next.push({ x, y });
      }
    }
    frontier = next;
    steps += 1;
  }
  return Infinity;
};

test('routes are as short as the grid allows, and arrive beside the destination', () => {
  for (const start of streets()) {
    for (const end of buildings()) {
      for (const facing of FACINGS) {
        const route = planRoute({ start, end, facing });
        const dest = toLattice(end);
        assert.equal(
          Math.abs(route.arrival.x - dest.x) + Math.abs(route.arrival.y - dest.y),
          1,
          'ends on a street the building fronts onto'
        );

        // No reachable arrival point is closer than the one chosen.
        const walked = route.moves.filter((m) => m.action === 'forward').length;
        const best = Math.min(
          ...[[1, 0], [-1, 0], [0, 1], [0, -1]]
            .map(([dx, dy]) => ({ x: dest.x + dx, y: dest.y + dy }))
            .map((goal) => bfsDistance(route.start, goal))
        );
        assert.equal(walked, best, `${JSON.stringify({ start, end, facing })}`);
      }
    }
  }
});

test('the destination always ends up to one side, never ahead or behind', () => {
  for (const start of streets()) {
    for (const end of buildings()) {
      for (const facing of FACINGS) {
        const text = describeRoute(planRoute({ start, end, facing }), BUILDINGS);
        const stop = text.split('\n').at(-1);
        assert.match(stop, /is on your (LEFT|RIGHT)/, `${JSON.stringify({ start, end, facing })}`);
        assert.ok(stop.includes(BUILDINGS[end.row][end.col]), 'names the destination');
      }
    }
  }
});

test('the stated side is the one an independent bearing calculation gives', () => {
  for (const start of streets()) {
    for (const end of buildings()) {
      for (const facing of FACINGS) {
        const route = planRoute({ start, end, facing });
        const text = describeRoute(route, BUILDINGS);
        const dest = toLattice(end);
        const last = route.moves.at(-1) ?? { ...route.start, facing };
        const compass =
          dest.x > last.x ? 'east' : dest.x < last.x ? 'west' : dest.y > last.y ? 'south' : 'north';
        const expected = relativeSide(last.facing, compass).toUpperCase();
        assert.ok(
          text.split('\n').at(-1).includes(`on your ${expected}`),
          `${JSON.stringify({ start, end, facing })} expected ${expected}`
        );
      }
    }
  }
});

test('the worked example reads as directions a person could follow', () => {
  // Standing between 公园 and 公司 facing north, walking to 医院.
  const text = describeRoute(
    planRoute({
      start: { type: 'vertical-street', row: 1, col: 0 },
      end: { type: 'building', row: 1, col: 2 },
      facing: 'north',
    }),
    BUILDINGS
  );
  // You cannot step east straight off a north-south street, so the walk starts
  // with the half block to the corner rather than a turn.
  assert.match(text, /^1\. Go north half a block to the corner\./m);
  assert.match(text, /^2\. Turn right; you now face east\./m);
  assert.match(text, /^3\. Go east 1\.5 blocks - you pass .*on your left/m);
  assert.match(text, /医院 is on your RIGHT/);
  assert.ok(!/pass[^\n]*医院/.test(text), 'you stop at the destination, you do not pass it');
  assert.ok(!text.includes('undefined'), text);
});

test('turning around is preferred to walking the long way when the destination is behind', () => {
  const route = planRoute({
    start: { type: 'vertical-street', row: 0, col: 0 },
    end: { type: 'building', row: 4, col: 0 },
    facing: 'north',
  });
  assert.equal(route.moves[0].action, 'around');
});

test('nonsense input is refused rather than routed', () => {
  const end = { type: 'building', row: 2, col: 2 };
  assert.equal(planRoute({ start: end, end, facing: 'north' }), null, 'start must be a street');
  assert.equal(
    planRoute({ start: { type: 'intersection', row: 0, col: 0 }, end, facing: 'sideways' }),
    null,
    'facing must be a compass direction'
  );
  assert.equal(describeRoute(null, BUILDINGS), null);
});
