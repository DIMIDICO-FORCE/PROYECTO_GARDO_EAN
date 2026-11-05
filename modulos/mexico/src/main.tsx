import {createRoot} from 'react-dom/client';
import App from './app/App';
import ErrorBoundary from './ErrorBoundary.jsx';
import './app/styles/index.css';
import './style.css';
import './app/styles/bipro.css';
import './app/styles/v16.css';

createRoot(document.getElementById('root')!).render(<ErrorBoundary><App/></ErrorBoundary>);
