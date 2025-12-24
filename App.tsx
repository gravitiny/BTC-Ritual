import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { TradePage } from './pages/TradePage';
import { RunPage } from './pages/RunPage';
import { HistoryPage } from './pages/HistoryPage';
import { useAppStore } from './store';
import { parseRoute } from './utils';

const routeToPage = (route: string) => {
  switch (route) {
    case '/trade':
      return <TradePage />;
    case '/run':
      return <RunPage />;
    case '/history':
      return <HistoryPage />;
    default:
      return <HomePage />;
  }
};

const App: React.FC = () => {
  const route = useAppStore((state) => state.route);
  const setRoute = useAppStore((state) => state.setRoute);

  useEffect(() => {
    const updateFromHash = () => {
      const next = parseRoute(window.location.hash);
      setRoute(next);
    };
    updateFromHash();
    window.addEventListener('hashchange', updateFromHash);
    return () => window.removeEventListener('hashchange', updateFromHash);
  }, [setRoute]);

  useEffect(() => {
    const expected = route === '/' ? '#/' : `#${route}`;
    if (window.location.hash !== expected) {
      window.location.hash = expected;
    }
  }, [route]);

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <motion.div
          key={route}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35 }}
        >
          {routeToPage(route)}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
};

export default App;
