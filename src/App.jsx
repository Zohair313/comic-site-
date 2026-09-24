import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Reader from './pages/Reader';
import Lore from './pages/Lore';
import Bio from './pages/Bio';
import Support from './pages/Support';
import ArtCollection from './pages/ArtCollection';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import AdminPanel from './pages/admin/AdminPanel';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/comicadmin" element={<AdminPanel />} />
        <Route path="/*" element={
          <>
            <Header />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<Navigate to="/#about" replace />} />
                <Route path="/reader" element={<Reader />} />
                <Route path="/lore" element={<Lore />} />
                <Route path="/bio" element={<Bio />} />
                <Route path="/support" element={<Support />} />
                <Route path="/art" element={<ArtCollection />} />
                <Route path="/privacy-policy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
              </Routes>
            </main>
            <Footer />
          </>
        } />
      </Routes>
    </>
  );
}

export default App;
