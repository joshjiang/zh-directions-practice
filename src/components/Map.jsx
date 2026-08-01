import { Fragment } from 'react';
import './Map.css';
import PathAnimation from './PathAnimation';
import { useLanguage } from '../context/useLanguage';
import { translations } from '../data/translations';
import { GRID_SIZE, gridCssVars } from '../data/gridLayout';

const DIRECTION_ARROWS = {
  north: '⬆️',
  south: '⬇️',
  east: '➡️',
  west: '⬅️',
};

const StartMarker = ({ direction, label }) => (
  <div className="icon start-icon with-direction" title={label}>
    <div className="direction-arrow">{DIRECTION_ARROWS[direction] || DIRECTION_ARROWS.north}</div>
    <div>👤</div>
  </div>
);

const EndMarker = ({ label }) => (
  <div className="icon end-icon" title={label}>📍</div>
);

/** Renders whichever markers belong in a single cell of the map. */
const CellMarkers = ({ cellType, row, col, startPos, endPos, direction, labels }) => (
  <>
    {startPos.type === cellType && startPos.row === row && startPos.col === col && (
      <StartMarker direction={direction} label={labels.start} />
    )}
    {endPos.type === cellType && endPos.row === row && endPos.col === col && (
      <EndMarker label={labels.end} />
    )}
  </>
);

const Map = ({ buildings, startPos, endPos, direction, tracedPath = [] }) => {
  const { language } = useLanguage();
  const t = translations[language];
  const gridSize = buildings.length || GRID_SIZE;
  const htmlLang = language === 'korean' ? 'ko' : 'zh';

  const markerProps = {
    startPos,
    endPos,
    direction,
    labels: { start: t.yourLocationEn, end: t.destinationEn },
  };

  const directionText = { north: t.north, south: t.south, east: t.east, west: t.west }[direction] || t.north;
  const directionArrow = DIRECTION_ARROWS[direction] || DIRECTION_ARROWS.north;

  return (
    <div className="map-container">
      <h2><span lang={htmlLang}>{t.map}</span> ({t.mapEn})</h2>
      <div className="city-grid-wrapper" style={gridCssVars}>
        <div className="city-grid">
          {Array.from({ length: gridSize }).map((_, row) => (
            <Fragment key={row}>
              <div className="building-street-row">
                {Array.from({ length: gridSize }).map((_, col) => (
                  <Fragment key={col}>
                    <div className="building-cell">
                      <div className="building-label" lang={htmlLang}>
                        {buildings[row]?.[col] ?? ''}
                      </div>
                      <CellMarkers cellType="building" row={row} col={col} {...markerProps} />
                    </div>

                    {col < gridSize - 1 && (
                      <div className="vertical-street">
                        <CellMarkers cellType="vertical-street" row={row} col={col} {...markerProps} />
                      </div>
                    )}
                  </Fragment>
                ))}
              </div>

              {row < gridSize - 1 && (
                <div className="horizontal-street-row">
                  {Array.from({ length: gridSize }).map((_, col) => (
                    <Fragment key={col}>
                      <div className="horizontal-street">
                        <CellMarkers cellType="horizontal-street" row={row} col={col} {...markerProps} />
                      </div>

                      {col < gridSize - 1 && (
                        <div className="intersection">
                          <CellMarkers cellType="intersection" row={row} col={col} {...markerProps} />
                        </div>
                      )}
                    </Fragment>
                  ))}
                </div>
              )}
            </Fragment>
          ))}
        </div>
        <PathAnimation path={tracedPath} gridSize={gridSize} />
      </div>
      <div className="legend">
        <div className="legend-item">
          <span className="icon with-direction" aria-hidden="true">
            <div className="direction-arrow">{directionArrow}</div>
            <div>👤</div>
          </span>
          <span lang={htmlLang}>{t.yourLocation}</span> ({t.yourLocationEn}) - {t.facing}{' '}
          <span lang={htmlLang}>{directionText}</span>
        </div>
        <div className="legend-item">
          <span className="icon" aria-hidden="true">📍</span>{' '}
          <span lang={htmlLang}>{t.destination}</span> ({t.destinationEn})
        </div>
      </div>
    </div>
  );
};

export default Map;
