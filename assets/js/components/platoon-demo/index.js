import React from 'react';
import ReactDOM from 'react-dom/client';
import StringStabilityDemo from './StringStabilityDemo';

const container = document.getElementById('string-stability-component');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<StringStabilityDemo />);
}