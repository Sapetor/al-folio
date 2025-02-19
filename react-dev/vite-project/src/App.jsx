import { LeafyGreen } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

const BackgroundElement = ({ x, isDarkMode, scale = 1, yOffset = 0, type }) => {
  const color = isDarkMode ? "#555" : "#666";
  
  if (type === 'tree') return (
    <g transform={`translate(${x}, ${yOffset}) scale(${scale})`}>
      {/* Grass patch */}
      <rect x="-20" y="110" width="40" height="3.5" fill={isDarkMode ? "#2d4" : "#3a5"} rx="2" />
      <rect x="-4" y="80" width="8" height="30" fill={"#381d11"} />
      <path d="M -15 80 L 0 40 L 15 80 Z" fill={isDarkMode ? "#2d4" : "#3a5"} />
      <path d="M -12 60 L 0 25 L 12 60 Z" fill={isDarkMode ? "#2d4" : "#3a5"} />
    </g>
  );

  if (type === 'building') return (
    <g transform={`translate(${x}, ${yOffset}) scale(${scale})`}>
      <rect x="-20" y="20" width="40" height="105" fill={isDarkMode ? "#444" : "#666"} />
      <rect x="-15" y="25" width="10" height="15" fill={isDarkMode ? "#666" : "#999"} />
      <rect x="5" y="25" width="10" height="15" fill={isDarkMode ? "#666" : "#999"} />
    </g>
  );

  if (type === 'smallTree') return (
    <g transform={`translate(${x},    ${yOffset}) scale(${scale})`}>
      {/* Grass patch */}
      <rect x="-20" y="120" width="40" height="5" fill={isDarkMode ? "#685" : "#685"} rx="2" />
      <rect x="-4" y="90" width="8" height="30" fill={"#331d15"} />
      <path d="M -15 90 L 0 50 L 15 90 Z" fill={isDarkMode ? "#685" : "#685"} />
      <path d="M -12 70 L 0 35 L 12 70 Z" fill={isDarkMode ? "#685" : "#685"} />
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

const Vehicle = ({ x, color, isLeader, isDarkMode }) => (
  <g transform={`translate(${x}, 150)`}>
    <rect x="-20" y="-10" width="40" height="20" fill={color} rx="5" />
    <circle cx="-12" cy="12" r="5" fill={isDarkMode ? "#ddd" : "#333"} />
    <circle cx="12" cy="12" r="5" fill={isDarkMode ? "#ddd" : "#333"} />
    {isLeader && (
      <>
        <rect x="-20" y="-30" width="40" height="15" fill={color} rx="3" />
        <text x="0" y="-19" textAnchor="middle" fill="#fff" fontSize="12">Leader</text>
      </>
    )}
  </g>
);

const StringStabilityDemo = () => {
  const [running, setRunning] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [elements, setElements] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [foregroundSpeed, setForegroundSpeed] = useState(1.0);
  const [backgroundSpeed, setBackgroundSpeed] = useState(0.6);
  const animationRef = useRef();
  const lastTime = useRef(performance.now());

  const baseSpeed = 800 / 3000;
  const numVehicles = 5;
  const baseSpacing = 100;
  const leaderBasePosition = 800;

  const elementTypes = [
    { type: 'tree', scale: 1.0, yOffset: 0, speed: 'foreground', layer: 1 },    // Front trees
    { type: 'smallTree', scale: 0.6, yOffset: 10, speed: 'background', layer: 0 }, // Background trees
    { type: 'streetlight', speed: 'foreground', layer: 3 },                      // Street lights
    { type: 'building', scale: 1.2, yOffset: 0, speed: 'background', layer: 2 }  // Buildings
  ];

  const generateElements = () => {
    const newElements = [];
    let id = 1;
  
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
  
    // Background trees with grass
    for (let x = 800; x < 2400; x += 250 + Math.random() * 150) {
        newElements.push({
          id: id++,
          x: x + Math.random() * 100,
          type: 1,
          scale: 0.6 + Math.random() * 0.2
        });
    }
  
    // Front trees (corrected)
    for (let x = 800; x < 2400; x += 200 + Math.random() * 200) {
      newElements.push({
        id: id++,
        x: x + Math.random() * 100,
        type: 0, // Corrected this line
        scale: 1.0 + Math.random() * 0.2
      });
    }
  
    // Street lights
    // Street lights with fixed intervals
    const LIGHT_SPACING = 300;
    for (let x = 800; x < 2400; x += LIGHT_SPACING) {
      newElements.push({
        id: id++,
        x: x + 50, // Fixed offset from road edge
        type: 2
      });
    }
  
    // Sort elements by layer then position
    return newElements.sort((a, b) => {
      const layerDiff = elementTypes[a.type].layer - elementTypes[b.type].layer;
      return layerDiff !== 0 ? layerDiff : a.x - b.x;
    });
  };

  const initializeVehicles = () => {
    return Array(numVehicles).fill(0).map((_, i) => ({
      id: i,
      x: leaderBasePosition - (numVehicles - 1 - i) * baseSpacing,
      velocity: 0,
      acceleration: 0,
      color: `hsl(${(i * 360 / numVehicles)}, 70%, 50%)`,
    }));
  };

  const updateScene = (timestamp) => {
    if (!running) return;

    const deltaTime = timestamp - lastTime.current;
    lastTime.current = timestamp;
  
    setElements(prev => prev.map(el => {
      const config = elementTypes[el.type];
      const speed = config.speed === 'foreground' ? foregroundSpeed : backgroundSpeed;
      let newX = el.x - baseSpeed * speed * deltaTime;
      
      // Special handling for street lights
      if (el.type === 2 && newX < -200) {
        const overflow = -newX - 200;
        const intervals = Math.ceil(overflow / 300);
        newX = 800 + (intervals * 300) + 50;
      } 
      // Reset other elements normally
      else if (newX < -200) {
        newX = 800 + Math.random() * 400;
      }
      
      return { ...el, x: newX };
    }));

    setVehicles(prev => prev.map((v, i, arr) => {
      if (i === arr.length - 1) return v;
      
      const leader = arr[i + 1];
      const desiredSpacing = baseSpacing;
      const spacing = leader.x - v.x;
      const error = spacing - desiredSpacing;
      
      v.acceleration = 0.3 * error - 0.1 * (v.velocity - leader.velocity);
      v.velocity += v.acceleration;
      v.velocity *= 0.95;
      v.x += v.velocity;
      
      return { ...v };
    }));

    animationRef.current = requestAnimationFrame(updateScene);
  };

  const startAnimation = () => {
    setElements(generateElements());
    setVehicles(initializeVehicles());
    setRunning(true);
  };

  useEffect(() => {
    if (running) {
      lastTime.current = performance.now();
      animationRef.current = requestAnimationFrame(updateScene);
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [running]);

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeMediaQuery.matches);
    const handleChange = (e) => setIsDarkMode(e.matches);
    darkModeMediaQuery.addEventListener('change', handleChange);
    return () => darkModeMediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <div className={`p-6 max-w-4xl mx-auto ${isDarkMode ? 'dark' : ''}`}>
      <h2 className="text-2xl font-bold mb-4 text-center">
        Vehicle Platoon String Stability Demo
      </h2>

      <div className="mb-6 flex gap-4 justify-center items-center">
        <button
          onClick={running ? () => setRunning(false) : startAnimation}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {running ? 'Stop' : 'Start'} Animation
        </button>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="w-32">Foreground Speed:</label>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={foregroundSpeed}
            onChange={(e) => setForegroundSpeed(parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="w-12">{foregroundSpeed.toFixed(1)}</span>
        </div>

        <div className="flex items-center gap-4">
          <label className="w-32">Background Speed:</label>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={backgroundSpeed}
            onChange={(e) => setBackgroundSpeed(parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="w-12">{backgroundSpeed.toFixed(1)}</span>
        </div>
      </div>

      <div className={`border rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <svg width="100%" height="200" viewBox="0 0 800 200">
          <line x1="0" y1="150" x2="800" y2="150" 
                stroke={isDarkMode ? "#666" : "gray"} strokeWidth="4" />

          {elements.map(el => {
            const config = elementTypes[el.type];
            return config.type === 'streetlight' ? (
              <StreetLight key={el.id} x={el.x} isDarkMode={isDarkMode} />
            ) : (
              <BackgroundElement key={el.id} x={el.x} isDarkMode={isDarkMode}
                scale={config.scale} yOffset={config.yOffset} type={config.type} />
            );
          })}

          {vehicles.map((vehicle, index) => (
            <Vehicle key={vehicle.id} x={vehicle.x} color={vehicle.color}
                     isLeader={index === numVehicles - 1} isDarkMode={isDarkMode} />
          ))}
        </svg>
      </div>
    </div>
  );
};

export default StringStabilityDemo;