import { useCallback, useEffect, useState } from 'react'
import './App.css'
import Map from './components/Map'
import DirectionsForm from './components/DirectionsForm'
import Results from './components/Results'
import LanguageSwitcher from './components/LanguageSwitcher'
import { generateRandomBuildings, generateRandomPositions } from './data/buildings'
import { gradeDirections } from './services/llmService'
import { useLanguage } from './context/useLanguage'
import { translations } from './data/translations'

const emptyResult = {
  pathScore: null,
  languageScore: null,
  feedback: null,
  translation: null,
  nativeExample: null,
  path: [],
};

function App() {
  const { language } = useLanguage();
  const t = translations[language];
  const [round, setRound] = useState(null);
  const [result, setResult] = useState(emptyResult);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // One effect owns round setup. It also re-runs on language change, which
  // matters: the grid is relabelled in the new language, so any feedback about
  // the old labels would be stale.
  const startNewRound = useCallback(() => {
    const { start, end, direction } = generateRandomPositions();
    setRound({ buildings: generateRandomBuildings(language), startPos: start, endPos: end, direction });
    setResult(emptyResult);
    setError(null);
  }, [language]);

  useEffect(() => {
    startNewRound();
  }, [startNewRound]);

  const handleSubmitDirections = async (directions) => {
    setIsLoading(true);
    setError(null);

    try {
      const graded = await gradeDirections(directions, {
        buildings: round.buildings,
        startPos: round.startPos,
        endPos: round.endPos,
        direction: round.direction,
        language,
      });

      setResult({
        pathScore: graded.pathScore ?? 0,
        languageScore: graded.languageScore ?? 0,
        feedback: graded.feedback ?? '',
        translation: graded.translation ?? '',
        nativeExample: graded.nativeExample ?? '',
        path: graded.path ?? [],
      });
    } catch (err) {
      console.error('Error submitting directions:', err);
      setResult(emptyResult);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <h1>{t.appTitle} ({t.appTitleEn})</h1>
            <p>{t.appSubtitle}</p>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="app-main">
        {round && (
          <>
            <div className="map-form-container">
              <Map
                buildings={round.buildings}
                startPos={round.startPos}
                endPos={round.endPos}
                direction={round.direction}
                tracedPath={result.path}
              />

              <DirectionsForm
                onSubmit={handleSubmitDirections}
                isLoading={isLoading}
              />
            </div>

            {error && (
              <div className="app-error" role="alert">
                <strong>{t.errorHeading}</strong> {error}
              </div>
            )}

            <Results
              pathScore={result.pathScore}
              languageScore={result.languageScore}
              feedback={result.feedback}
              translation={result.translation}
              nativeExample={result.nativeExample}
              onNextRound={startNewRound}
            />
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>{t.tip}</p>
      </footer>
    </div>
  )
}

export default App
