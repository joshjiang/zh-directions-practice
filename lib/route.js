/**
 * Deterministic route planning on the map grid.
 *
 * The grader is a language model, and left/right relative to a facing is the
 * one thing it keeps getting wrong: it will describe a walk south and then put
 * an eastern building on the walker's right. Rules in the prompt help but do
 * not fix it, because the model has to redo the arithmetic every time.
 *
 * So do the arithmetic here instead, in code that cannot be talked out of it,
 * and hand the model a route with every left/right already resolved. The model
 * keeps the job it is good at - writing natural Chinese or Korean - and loses
 * the job it is bad at.
 *
 * The whole map is one lattice. Doubling row/col puts buildings on even
 * coordinates and the streets between them on odd ones:
 *
 *   building(r,c)          -> (2c,   2r)     both even
 *   vertical-street(r,c)   -> (2c+1, 2r)     odd x: the north-south street east of col c
 *   horizontal-street(r,c) -> (2c,   2r+1)   odd y: the east-west street south of row r
 *   intersection(r,c)      -> (2c+1, 2r+1)   both odd
 *
 * A node is walkable exactly when either coordinate is odd, and one step of
 * ±1 moves half a block, which makes adjacency, turning and "what is beside
 * me" fall out of the coordinates instead of needing a special case each.
 */

export const GRID_SIZE = 5;

/** Largest lattice coordinate: buildings occupy 0..2*(GRID_SIZE-1) on the even slots. */
const MAX_COORD = (GRID_SIZE - 1) * 2;

const VECTORS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const LEFT_OF = { north: 'west', west: 'south', south: 'east', east: 'north' };
const RIGHT_OF = { north: 'east', east: 'south', south: 'west', west: 'north' };
const OPPOSITE = { north: 'south', south: 'north', east: 'west', west: 'east' };

// One block of walking costs far more than one turn, so the search returns the
// shortest route and breaks ties toward the one with the fewest turns - which
// is the one a person would actually give.
const STEP_COST = 100;
const TURN_COST = 1;

export const toLattice = ({ type, row, col }) => ({
  x: col * 2 + (type === 'vertical-street' || type === 'intersection' ? 1 : 0),
  y: row * 2 + (type === 'horizontal-street' || type === 'intersection' ? 1 : 0),
});

export const fromLattice = (x, y) => {
  const evenX = x % 2 === 0;
  const evenY = y % 2 === 0;
  const type = evenX && evenY
    ? 'building'
    : evenX
      ? 'horizontal-street'
      : evenY
        ? 'vertical-street'
        : 'intersection';
  return { type, row: Math.floor(y / 2), col: Math.floor(x / 2) };
};

const inBounds = (x, y) => x >= 0 && y >= 0 && x <= MAX_COORD && y <= MAX_COORD;

/** Walkable space: anything off the even/even building slots. */
const isStreet = (x, y) => inBounds(x, y) && (x % 2 === 1 || y % 2 === 1);

/** Where a compass bearing falls for someone facing a given way. */
export const relativeSide = (facing, target) => {
  if (target === facing) return 'ahead';
  if (target === OPPOSITE[facing]) return 'behind';
  return target === LEFT_OF[facing] ? 'left' : 'right';
};

/** The compass bearing from one lattice point to an adjacent one. */
const bearing = (from, to) => {
  if (to.x > from.x) return 'east';
  if (to.x < from.x) return 'west';
  return to.y > from.y ? 'south' : 'north';
};

/**
 * The buildings flanking a street node, keyed by the compass side they sit on.
 * Intersections touch four buildings diagonally rather than flanking, so they
 * contribute nothing here.
 */
const flanking = (x, y) => {
  if (x % 2 === 1 && y % 2 === 0) return { west: [x - 1, y], east: [x + 1, y] };
  if (x % 2 === 0 && y % 2 === 1) return { north: [x, y - 1], south: [x, y + 1] };
  return {};
};

/**
 * Shortest walk from a street position to a street position beside the
 * destination building, as a sequence of moves.
 *
 * Arriving means standing on a street the building fronts onto - the prompt
 * treats that as arrival, and it is what a person means by "the hospital is on
 * your left". Because those streets run alongside the building rather than
 * into it, the destination always ends up to the left or right, never ahead.
 *
 * @returns {{steps: Array, arrival: object, facing: string}|null} null when
 *   the input is not a street-to-building pair the lattice can express.
 */
export const planRoute = ({ start, end, facing }) => {
  if (!VECTORS[facing]) return null;
  const from = toLattice(start);
  const to = toLattice(end);
  if (!isStreet(from.x, from.y)) return null;
  if (to.x % 2 !== 0 || to.y % 2 !== 0 || !inBounds(to.x, to.y)) return null;

  const goals = new Set();
  for (const [dx, dy] of Object.values(VECTORS)) {
    if (isStreet(to.x + dx, to.y + dy)) goals.add(`${to.x + dx},${to.y + dy}`);
  }
  if (!goals.size) return null;

  const key = (x, y, f) => `${x},${y},${f}`;
  const startKey = key(from.x, from.y, facing);
  const dist = new Map([[startKey, 0]]);
  const prev = new Map();
  const seen = new Map([[startKey, { x: from.x, y: from.y, facing }]]);
  // 81 nodes x 4 facings, so scanning for the cheapest entry is cheaper than
  // maintaining a heap.
  const queue = [{ x: from.x, y: from.y, facing, cost: 0 }];
  let goal = null;

  while (queue.length) {
    let best = 0;
    for (let i = 1; i < queue.length; i++) if (queue[i].cost < queue[best].cost) best = i;
    const cur = queue.splice(best, 1)[0];
    const curKey = key(cur.x, cur.y, cur.facing);
    if (cur.cost > (dist.get(curKey) ?? Infinity)) continue;
    // Standing beside the destination is not yet arriving: face along the
    // street so it is genuinely to one side. Otherwise someone who starts
    // beside it facing the wrong way is told it is behind them, which is true
    // but useless as an example of giving directions.
    if (goals.has(`${cur.x},${cur.y}`) && ['left', 'right'].includes(relativeSide(cur.facing, bearing(cur, to)))) {
      goal = cur;
      break;
    }

    const [dx, dy] = VECTORS[cur.facing];
    const moves = [
      { x: cur.x, y: cur.y, facing: LEFT_OF[cur.facing], action: 'left', cost: TURN_COST },
      { x: cur.x, y: cur.y, facing: RIGHT_OF[cur.facing], action: 'right', cost: TURN_COST },
      { x: cur.x, y: cur.y, facing: OPPOSITE[cur.facing], action: 'around', cost: TURN_COST * 2 },
    ];
    if (isStreet(cur.x + dx, cur.y + dy)) {
      moves.push({ x: cur.x + dx, y: cur.y + dy, facing: cur.facing, action: 'forward', cost: STEP_COST });
    }

    for (const move of moves) {
      const moveKey = key(move.x, move.y, move.facing);
      const cost = cur.cost + move.cost;
      if (cost >= (dist.get(moveKey) ?? Infinity)) continue;
      dist.set(moveKey, cost);
      prev.set(moveKey, { from: curKey, action: move.action });
      seen.set(moveKey, { x: move.x, y: move.y, facing: move.facing });
      queue.push({ ...move, cost });
    }
  }

  if (!goal) return null;

  const moves = [];
  for (let k = key(goal.x, goal.y, goal.facing); k !== startKey; ) {
    const link = prev.get(k);
    moves.unshift({ action: link.action, ...seen.get(k) });
    k = link.from;
  }

  return { moves, start: { ...from, facing }, arrival: goal, destination: to };
};

/** Collapses the move list into turns and straight runs, so it reads as directions. */
const toInstructions = ({ moves, start }) => {
  const instructions = [];
  let position = start;

  for (const move of moves) {
    if (move.action === 'forward') {
      const last = instructions[instructions.length - 1];
      if (last?.kind === 'go') {
        last.halfBlocks += 1;
        last.through.push(move);
      } else {
        instructions.push({ kind: 'go', facing: move.facing, halfBlocks: 1, through: [move] });
      }
    } else {
      instructions.push({ kind: 'turn', turn: move.action, facing: move.facing });
    }
    position = move;
  }

  return { instructions, final: position };
};

/**
 * Half-block steps as distance a walker would recognise. Odd counts are real:
 * starting mid-block and stopping at the corner is half a block.
 */
const blockText = (halfBlocks) => {
  const whole = Math.floor(halfBlocks / 2);
  const half = halfBlocks % 2 === 1;
  if (!whole) return 'half a block';
  return `${whole}${half ? '.5' : ''} block${whole === 1 && !half ? '' : 's'}`;
};

/**
 * Renders a planned route as English the grader can translate, with every side
 * already decided.
 *
 * @param {object|null} route - from planRoute()
 * @param {string[][]} buildings - the round's grid, for naming what you pass
 * @returns {string|null} null when there is no route to describe
 */
export const describeRoute = (route, buildings) => {
  if (!route) return null;
  const name = (x, y) => buildings[y / 2]?.[x / 2] ?? '(edge of map)';
  const { instructions, final } = toInstructions(route);
  const lines = [];

  for (const step of instructions) {
    if (step.kind === 'turn') {
      lines.push(
        step.turn === 'around'
          ? 'Turn around; you now face ' + step.facing + '.'
          : `Turn ${step.turn}; you now face ${step.facing}.`
      );
      continue;
    }

    // Name what the walker passes, on the side it passes on, so landmark
    // phrases in the example are grounded rather than guessed.
    const passed = { left: [], right: [] };
    for (const node of step.through) {
      for (const [side, [bx, by]] of Object.entries(flanking(node.x, node.y))) {
        if (!inBounds(bx, by)) continue;
        // You do not "pass" the destination - you stop at it, and the closing
        // line says which side it is on.
        if (bx === route.destination.x && by === route.destination.y) continue;
        const hand = relativeSide(step.facing, side);
        if (hand !== 'left' && hand !== 'right') continue;
        const label = name(bx, by);
        if (!passed[hand].includes(label)) passed[hand].push(label);
      }
    }

    const flanks = ['left', 'right']
      .filter((hand) => passed[hand].length)
      .map((hand) => `${passed[hand].join(', ')} on your ${hand}`)
      .join('; ');
    const end = step.through[step.through.length - 1];
    const stop = end.x % 2 === 1 && end.y % 2 === 1 ? ' to the corner' : '';
    lines.push(
      `Go ${step.facing} ${blockText(step.halfBlocks)}${stop}${flanks ? ` - you pass ${flanks}` : ''}.`
    );
  }

  const { destination } = route;
  const side = relativeSide(final.facing, bearing(final, destination));
  const target = name(destination.x, destination.y);
  const opposite = Object.entries(flanking(final.x, final.y))
    .map(([, [bx, by]]) => [bx, by])
    .filter(([bx, by]) => !(bx === destination.x && by === destination.y) && inBounds(bx, by))
    .map(([bx, by]) => name(bx, by))[0];

  lines.push(
    `Stop there: ${target} is on your ${side.toUpperCase()}` +
      (opposite ? `, with ${opposite} across the street on your ${side === 'left' ? 'right' : 'left'}` : '') +
      '.'
  );

  return lines.map((line, i) => `${i + 1}. ${line}`).join('\n');
};
