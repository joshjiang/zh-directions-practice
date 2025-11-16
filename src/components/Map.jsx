import React from 'react';
import './Map.css';

const Map = ({ buildings, startPos, endPos, direction }) => {
  const gridSize = 5;

  const getBuilding = (row, col) => {
    return buildings[row][col];
  };

  const isStartPosition = (cellType, row, col) => {
    return startPos.type === cellType && startPos.row === row && startPos.col === col;
  };

  const isEndPosition = (cellType, row, col) => {
    return endPos.type === cellType && endPos.row === row && endPos.col === col;
  };

  const getDirectionArrow = () => {
    const arrows = {
      north: '⬆️',
      south: '⬇️',
      east: '➡️',
      west: '⬅️'
    };
    return arrows[direction] || '⬆️';
  };

  const getDirectionChinese = () => {
    const chinese = {
      north: '北',
      south: '南',
      east: '东',
      west: '西'
    };
    return chinese[direction] || '北';
  };

  return (
    <div className="map-container">
      <h2>地图 (Map)</h2>
      <div className="city-grid">
        {Array.from({ length: gridSize }).map((_, buildingRow) => (
          <React.Fragment key={buildingRow}>
            {/* Row of buildings */}
            <div className="building-street-row">
              {Array.from({ length: gridSize }).map((_, buildingCol) => (
                <React.Fragment key={buildingCol}>
                  {/* Building block */}
                  <div className="building-cell">
                    <div className="building-label">
                      {getBuilding(buildingRow, buildingCol)}
                    </div>
                    {isStartPosition('building', buildingRow, buildingCol) && (
                      <div className="icon start-icon with-direction" title="Start">
                        <div className="direction-arrow">{getDirectionArrow()}</div>
                        <div>👤</div>
                      </div>
                    )}
                    {isEndPosition('building', buildingRow, buildingCol) && (
                      <div className="icon end-icon" title="End">📍</div>
                    )}
                  </div>

                  {/* Vertical street (between buildings) */}
                  {buildingCol < gridSize - 1 && (
                    <div className="vertical-street">
                      {isStartPosition('vertical-street', buildingRow, buildingCol) && (
                        <div className="icon start-icon with-direction" title="Start">
                          <div className="direction-arrow">{getDirectionArrow()}</div>
                          <div>👤</div>
                        </div>
                      )}
                      {isEndPosition('vertical-street', buildingRow, buildingCol) && (
                        <div className="icon end-icon" title="End">📍</div>
                      )}
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Horizontal street row (between building rows) */}
            {buildingRow < gridSize - 1 && (
              <div className="horizontal-street-row">
                {Array.from({ length: gridSize }).map((_, buildingCol) => (
                  <React.Fragment key={buildingCol}>
                    {/* Horizontal street segment */}
                    <div className="horizontal-street">
                      {isStartPosition('horizontal-street', buildingRow, buildingCol) && (
                        <div className="icon start-icon with-direction" title="Start">
                          <div className="direction-arrow">{getDirectionArrow()}</div>
                          <div>👤</div>
                        </div>
                      )}
                      {isEndPosition('horizontal-street', buildingRow, buildingCol) && (
                        <div className="icon end-icon" title="End">📍</div>
                      )}
                    </div>

                    {/* Intersection */}
                    {buildingCol < gridSize - 1 && (
                      <div className="intersection">
                        {isStartPosition('intersection', buildingRow, buildingCol) && (
                          <div className="icon start-icon with-direction" title="Start">
                            <div className="direction-arrow">{getDirectionArrow()}</div>
                            <div>👤</div>
                          </div>
                        )}
                        {isEndPosition('intersection', buildingRow, buildingCol) && (
                          <div className="icon end-icon" title="End">📍</div>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="legend">
        <div className="legend-item">
          <span className="icon with-direction">
            <div className="direction-arrow">{getDirectionArrow()}</div>
            <div>👤</div>
          </span>
          你的位置 (Your Location) - 朝{getDirectionChinese()}
        </div>
        <div className="legend-item">
          <span className="icon">📍</span> 目的地 (Destination)
        </div>
      </div>
    </div>
  );
};

export default Map;
