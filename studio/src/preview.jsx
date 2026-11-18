import React, {lazy, Suspense, useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import CharacterCatalog from './studio/CharacterCatalog.jsx';

const ScenePreview = lazy(() => import('./ScenePreview.jsx'));

function App() {
  const [route, setRoute] = useState(window.location.hash);
  useEffect(() => {
    const navigate = () => {
      setRoute(window.location.hash);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);
  if (route === '#adegan')
    return (
      <Suspense fallback="Memuat adegan…">
        <ScenePreview />
      </Suspense>
    );
  return <CharacterCatalog id={route.startsWith('#karakter/') ? route.slice(10) : null} />;
}
createRoot(document.getElementById('root')).render(<App />);
