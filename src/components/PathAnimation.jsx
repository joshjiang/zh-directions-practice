import React, { useState, useEffect } from 'react';
import './PathAnimation.css';

const PathAnimation = ({ path, gridSize = 5, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Cell dimensions (must match Map.css)
  const BUILDING_SIZE = 110;
  const STREET_SIZE = 40;

  useEffect(() => {
    if (path && path.length > 0 && !isAnimating) {
      setIsAnimating(true);
      setCurrentStep(0);
    }
  }, [path]);

  useEffect(() => {
    if (!isAnimating || !path || path.length === 0) return;

    if (currentStep < path.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 500); // 500ms per step

      return () => clearTimeout(timer);
    } else {
      // Animation complete
      const completeTimer = setTimeout(() => {
        setIsAnimating(false);
        if (onComplete) onComplete();
      }, 1000); // Wait 1s before calling onComplete

      return () => clearTimeout(completeTimer);
    }
  }, [currentStep, isAnimating, path, onComplete]);

  if (!path || path.length === 0) return null;

  // Convert grid position to pixel coordinates
  const getPixelCoordinates = (pos) => {
    const { type, row, col } = pos;

    let x, y;

    if (type === 'building') {
      // Center of building cell
      x = col * (BUILDING_SIZE + STREET_SIZE) + BUILDING_SIZE / 2;
      y = row * (BUILDING_SIZE + STREET_SIZE) + BUILDING_SIZE / 2;
    } else if (type === 'vertical-street') {
      // Center of vertical street (between col and col+1)
      x = col * (BUILDING_SIZE + STREET_SIZE) + BUILDING_SIZE + STREET_SIZE / 2;
      y = row * (BUILDING_SIZE + STREET_SIZE) + BUILDING_SIZE / 2;
    } else if (type === 'horizontal-street') {
      // Center of horizontal street (between row and row+1)
      x = col * (BUILDING_SIZE + STREET_SIZE) + BUILDING_SIZE / 2;
      y = row * (BUILDING_SIZE + STREET_SIZE) + BUILDING_SIZE + STREET_SIZE / 2;
    } else if (type === 'intersection') {
      // Center of intersection
      x = col * (BUILDING_SIZE + STREET_SIZE) + BUILDING_SIZE + STREET_SIZE / 2;
      y = row * (BUILDING_SIZE + STREET_SIZE) + BUILDING_SIZE + STREET_SIZE / 2;
    }

    return { x, y };
  };

  // Calculate SVG dimensions based on grid size
  const svgWidth = gridSize * BUILDING_SIZE + (gridSize - 1) * STREET_SIZE;
  const svgHeight = gridSize * BUILDING_SIZE + (gridSize - 1) * STREET_SIZE;

  // Get direction arrow
  const getDirectionArrow = (direction) => {
    const arrows = {
      north: '⬆️',
      south: '⬇️',
      east: '➡️',
      west: '⬅️'
    };
    return arrows[direction] || '⬆️';
  };

  // Build the path line segments
  const visiblePath = path.slice(0, currentStep + 1);
  const pathPoints = visiblePath.map(getPixelCoordinates);

  // Create SVG path string
  const pathString = pathPoints.length > 1
    ? `M ${pathPoints.map(p => `${p.x},${p.y}`).join(' L ')}`
    : '';

  // Current position for the animated icon
  const currentPos = path[currentStep];
  const currentCoords = getPixelCoordinates(currentPos);

  return (
    <svg className="path-animation-overlay" width={svgWidth} height={svgHeight}>
      {/* Red trail line */}
      {pathString && (
        <path
          d={pathString}
          stroke="red"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Animated person icon */}
      <g transform={`translate(${currentCoords.x}, ${currentCoords.y})`}>
        {/* Direction arrow */}
        <text
          x="0"
          y="-20"
          fontSize="20"
          textAnchor="middle"
          className="animated-direction-arrow"
        >
          {getDirectionArrow(currentPos.facing)}
        </text>

        {/* Person emoji */}
        <text
          x="0"
          y="8"
          fontSize="32"
          textAnchor="middle"
          className="animated-person-icon"
        >
          👤
        </text>
      </g>

      {/* Starting point marker */}
      {currentStep > 0 && (
        <circle
          cx={pathPoints[0].x}
          cy={pathPoints[0].y}
          r="6"
          fill="green"
          opacity="0.6"
        />
      )}
    </svg>
  );
};

export default PathAnimation;
