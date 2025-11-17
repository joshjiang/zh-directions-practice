import { useState, useEffect } from 'react'
import './App.css'
import Map from './components/Map'
import DirectionsForm from './components/DirectionsForm'
import Results from './components/Results'
import { generateRandomBuildings, generateRandomPositions } from './data/buildings'
import { gradeDirections } from './services/llmService'

function App() {
  const [buildings, setBuildings] = useState([]);
  const [startPos, setStartPos] = useState({ row: 0, col: 0 });
  const [endPos, setEndPos] = useState({ row: 0, col: 0 });
  const [direction, setDirection] = useState('north');
  const [pathScore, setPathScore] = useState(null);
  const [languageScore, setLanguageScore] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [translation, setTranslation] = useState(null);
  const [nativeExample, setNativeExample] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tracedPath, setTracedPath] = useState([]);

  // Initialize the first round
  useEffect(() => {
    initializeNewRound();
  }, []);

  const initializeNewRound = () => {
    const newBuildings = generateRandomBuildings();
    const positions = generateRandomPositions();

    setBuildings(newBuildings);
    setStartPos(positions.start);
    setEndPos(positions.end);
    setDirection(positions.direction);
    setPathScore(null);
    setLanguageScore(null);
    setFeedback(null);
    setTranslation(null);
    setNativeExample(null);
    setTracedPath([]);
  };

  const handleSubmitDirections = async (directions) => {
    setIsLoading(true);

    try {
      const result = await gradeDirections(directions, {
        buildings,
        startPos,
        endPos,
        direction
      });

      setPathScore(result.pathScore || 0);
      setLanguageScore(result.languageScore || 0);
      setFeedback(result.feedback);
      setTranslation(result.translation || '');
      setNativeExample(result.nativeExample || '');
      setTracedPath(result.path || []);
    } catch (error) {
      console.error('Error submitting directions:', error);
      setPathScore(0);
      setLanguageScore(0);
      setFeedback(`<p>Error: ${error.message}</p>`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextRound = () => {
    initializeNewRound();
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>中文方向练习 (Chinese Directions Practice)</h1>
        <p>Practice giving directions in Chinese from your location to the destination</p>
      </header>

      <main className="app-main">
        {buildings.length > 0 && (
          <>
            <div className="map-form-container">
              <Map
                buildings={buildings}
                startPos={startPos}
                endPos={endPos}
                direction={direction}
                tracedPath={tracedPath}
              />

              <DirectionsForm
                onSubmit={handleSubmitDirections}
                isLoading={isLoading}
              />
            </div>

            <Results
              pathScore={pathScore}
              languageScore={languageScore}
              feedback={feedback}
              translation={translation}
              nativeExample={nativeExample}
              onNextRound={handleNextRound}
            />
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>Tip: Use HSK3 level vocabulary and common direction phrases like 往前走, 向右拐, 一直走, etc.</p>
      </footer>
    </div>
  )
}

export default App
