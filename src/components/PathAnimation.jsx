import { useState, useEffect } from 'react';
import './PathAnimation.css';
import {
  GRID_SIZE,
  BUILDING_SIZE,
  STREET_SIZE,
  positionToPixels,
  routeAlongStreets,
} from '../data/gridLayout';

const STEP_DURATION_MS = 500;

const DIRECTION_ARROWS = {
  north: '⬆️',
  south: '⬇️',
  east: '➡️',
  west: '⬅️',
};

const PathAnimation = ({ path, gridSize = GRID_SIZE, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [renderedPath, setRenderedPath] = useState(path);

  // Restart the walk whenever a new path arrives - including mid-animation,
  // which previously left currentStep pointing past the end of a shorter path.
  if (path !== renderedPath) {
    setRenderedPath(path);
    setCurrentStep(0);
  }

  const steps = Array.isArray(path) ? path : [];
  const lastStep = steps.length - 1;

  useEffect(() => {
    if (steps.length === 0) return;

    if (currentStep < lastStep) {
      const timer = setTimeout(() => setCurrentStep((step) => step + 1), STEP_DURATION_MS);
      return () => clearTimeout(timer);
    }

    if (onComplete) {
      const timer = setTimeout(onComplete, 2 * STEP_DURATION_MS);
      return () => clearTimeout(timer);
    }
  }, [currentStep, lastStep, steps.length, onComplete]);

  if (steps.length === 0) return null;

  const svgSize = gridSize * BUILDING_SIZE + (gridSize - 1) * STREET_SIZE;

  const pathPoints = steps.slice(0, Math.min(currentStep, lastStep) + 1).map(positionToPixels);
  // Walkers follow streets, so the trail turns at right angles rather than
  // cutting diagonally across the blocks between two positions.
  const trail = pathPoints.length > 1
    ? `M ${routeAlongStreets(pathPoints).map((p) => `${p.x},${p.y}`).join(' L ')}`
    : '';
  const current = pathPoints[pathPoints.length - 1];
  const facing = steps[Math.min(currentStep, lastStep)].facing;

  return (
    <svg
      className="path-animation-overlay"
      width={svgSize}
      height={svgSize}
      aria-hidden="true"
      focusable="false"
    >
      {trail && (
        <path
          d={trail}
          stroke="red"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      <g transform={`translate(${current.x}, ${current.y})`}>
        <text x="0" y="-20" fontSize="20" textAnchor="middle" className="animated-direction-arrow">
          {DIRECTION_ARROWS[facing] || DIRECTION_ARROWS.north}
        </text>
        <text x="0" y="8" fontSize="32" textAnchor="middle" className="animated-person-icon">
          👤
        </text>
      </g>

      {currentStep > 0 && (
        <circle cx={pathPoints[0].x} cy={pathPoints[0].y} r="6" fill="green" opacity="0.6" />
      )}
    </svg>
  );
};

export default PathAnimation;
