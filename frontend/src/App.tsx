import React from 'react';
import { AppAuthProvider } from './auth/AuthProvider';
import { Home } from './pages/Home';

function App(): React.ReactElement {
  return (
    <AppAuthProvider>
      <Home />
    </AppAuthProvider>
  );
}

export default App;
