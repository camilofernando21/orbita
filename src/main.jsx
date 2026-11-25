import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { PostsProvider } from './contexts/PostsContext';
import { TemaProvider } from './contexts/TemaContext';
import { AvisoProvider } from './contexts/AvisoContext';
import './styles/global.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TemaProvider>
      <AvisoProvider>
        <PostsProvider>
          <App />
        </PostsProvider>
      </AvisoProvider>
    </TemaProvider>
  </StrictMode>,
);
