import React, { useState, useEffect, useRef } from 'react';

const BackgroundElement = ({ x, isDarkMode, scale = 1, yOffset = 0, type }) => {
  const color = isDarkMode ? "#555" : "#666";
  
  if (type === 'tree') return (
    <g transform={`translate(${x}, ${yOffset}) scale(${scale})`}>
      <rect x="-15" y="75" width="30" height="5" fill={isDarkMode ? "#2d4" : "#3a5"} rx="2" />
      <rect x="-4" y="80" width="8" height="30" fill={color} />
      <path d="M -15 80 L 0 40 L 15 80 Z" fill={isDarkMode ? "#2d4" : "#3a5"} />
      <path d="M -12 60 L 0 25 L 12 60 Z" fill={isDarkMode ? "#2d4" : "#3a5"} />
    </g>
  );

  if (type === 'building') return (
    <g transform={`translate(${x}, ${yOffset}) scale(${scale})`}>
      {/* Adjusted building base to match street light base */}
      <rect x="-20" y="20" width="40" height="130" fill={isDarkMode ? "#444" : "#666"} />
      <rect x="-18" y="25" width="10" height="15" fill={isDarkMode ? "#666" : "#999"} />
      <rect x="5" y="25" width="10" height="15" fill={isDarkMode ? "#666" : "#999"} />
    </g>
  );

  return null;
};

const StreetLight = ({ x, isDarkMode }) => {
  const poleColor = isDarkMode ? "#666" : "#444";
  const lightColor = isDarkMode ? "#ffeb3b" : "#ffd700";
  
  return (
    <g transform={`translate(${x}, 0)`}>
      <rect x="-3" y="110" width="6" height="40" fill={poleColor} />
      <circle cx="0" cy="110" r="8" fill={lightColor} />
      <path d="M -8 110 Q 0 90 8 110" fill={lightColor} opacity="0.3" />
    </g>
  );
};

// ... (Vehicle component remains the same)

const StringStabilityDemo = () => {
  // ... (previous state and refs)

  const generateElements = () => {
    const newElements = [];
    let id = 1;

    // Buildings with consistent spacing
    let lastBuildingX = 800;
    while(lastBuildingX < 2400) {
      newElements.push({
        id: id++,
        x: lastBuildingX + Math.random() * 100,
        type: 3,
        scale: 1.2 + Math.random() * 0.3
      });
      lastBuildingX += 600 + Math.random() * 200;
    }

    // Street lights with fixed intervals
    const LIGHT_SPACING = 300;
    for (let x = 800; x < 2400; x += LIGHT_SPACING) {
      newElements.push({
        id: id++,
        x: x + 50, // Fixed offset from road edge
        type: 2
      });
    }

    // ... (rest of element generation)

    return newElements.sort((a, b) => {
      const layerDiff = elementTypes[a.type].layer - elementTypes[b.type].layer;
      return layerDiff !== 0 ? layerDiff : a.x - b.x;
    });
  };

  const updateScene = (timestamp) => {
    if (!running) return;

    const deltaTime = timestamp - lastTime.current;
    lastTime.current = timestamp;

    setElements(prev => prev.map(el => {
      const config = elementTypes[el.type];
      const speed = config.speed === 'foreground' ? foregroundSpeed : backgroundSpeed;
      let newX = el.x - baseSpeed * speed * deltaTime;
      
      // Fixed street light reset logic
      if (newX < -200) {
        newX = el.type === 2 ? 
          // Maintain exact light spacing when resetting
          Math.ceil((newX + 2400) / 300) * 300 + 50 : 
          800 + Math.random() * 400;
      }
      
      return { ...el, x: newX };
    }));

    // ... (rest of update logic)
  };

  // ... (rest of component)
};