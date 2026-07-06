import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = window.document.querySelector('#root');

if (rootElement instanceof HTMLElement) {
  createRoot(rootElement).render(React.createElement(App));
}
