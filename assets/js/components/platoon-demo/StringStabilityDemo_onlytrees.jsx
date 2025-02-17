import React, { useState, useEffect, useRef } from 'react';

const BackgroundElement = ({ x, type, isDarkMode, scale = 1 }) => {
  const color = isDarkMode ? "#555" : "#666";

  switch (type) {
    case 'tree':
      return (
        <g transform={`translate(${x}, 0) scale(${scale})`}>
          <rect x="-4" y="80" width="8" height="30" fill={color} />
          <path
            d="M -15 80 L 0 40 L 15 80 Z"
            fill={isDarkMode ? "#2d4" : "#3a5"}
          />
          <path
            d="M -12 60 L 0 25 L 12 60 Z"
            fill={isDarkMode ? "#2d4" : "#3a5"}
          />
        </g>
      );
    default:
      return null;
  }
};

const Vehicle = ({ x, color, isLeader, isDarkMode }) => (
  <g transform={`translate(${x}, 0)`}>
    <rect x="-20" y="-10" width="40" height="20" fill={color} rx="5" />
    <circle cx="-12" cy="12" r="5" fill={isDarkMode ? "#ddd" : "#333"} />
    <circle cx="12" cy="12" r="5" fill={isDarkMode ? "#ddd" : "#333"} />
    {isLeader && (
      <>
        <rect x="-20" y="-30" width="40" height="15" fill={color} rx="3" />
        <text x="0" y="-19" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">
          Leader
        </text>
      </>
    )}
  </g>
);

const StringStabilityDemo = () => {
  const [vehicles, setVehicles] = useState([]);
  const [running, setRunning] = useState(false);
  const [stringStable, setStringStable] = useState(true);
  const [headway, setHeadway] = useState(2.0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sceneryOffset, setSceneryOffset] = useState(0);
  const [targetSpeed, setTargetSpeed] = useState(0);
  const animationRef = useRef();

  const numVehicles = 5;
  const baseSpacing = 100;
  const desiredSpeed = 0.8; // Reduced target platoon speed
  const accelerationRate = 0.01; // Gentler acceleration
  const roadLength = 1200; // Increased road length to fit all vehicles
  const leaderBasePosition = 800; // Adjusted leader position

  // Generate background elements (trees only)
  const generateElements = () => {
    const elements = [];
    let id = 0;
    const totalWidth = 2400; // 3x view width

    // Add trees randomly on the rightmost edge
    const treeSpacing = 200; // Minimum spacing between trees
    for (let x = 0; x < totalWidth; x += treeSpacing) {
      if (Math.random() < 0.5) { // 50% chance of a tree
        const treeOffset = Math.random() * 100; // Randomize position slightly
        elements.push({
          id: id++,
          x: x + treeOffset,
          type: 'tree',
          scale: 0.8 + Math.random() * 0.4, // Random tree sizes
        });
      }
    }

    return elements.sort((a, b) => a.x - b.x); // Sort by x position
  };

  const bgElements = generateElements();

  const initializeVehicles = () => {
    return Array(numVehicles).fill(0).map((_, i) => ({
      id: i,
      x: leaderBasePosition - (numVehicles - 1 - i) * baseSpacing,
      velocity: 0,
      acceleration: 0,
      targetSpacing: baseSpacing * (stringStable ? 1 + headway * 0.2 : 1),
      color: `hsl(${(i * 360 / numVehicles)}, 70%, 50%)`,
    }));
  };

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeMediaQuery.matches);
    const handleChange = (e) => setIsDarkMode(e.matches);
    darkModeMediaQuery.addEventListener('change', handleChange);
    return () => darkModeMediaQuery.removeEventListener('change', handleChange);
  }, []);

  const startAnimation = () => {
    setVehicles(initializeVehicles());
    setTargetSpeed(0);
    setSceneryOffset(0);
    setRunning(true);
  };

  const stopAnimation = () => {
    setRunning(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const updateVehicles = (timestamp) => {
    // Smoothly accelerate to desired speed
    setTargetSpeed((prev) => Math.min(prev + accelerationRate, desiredSpeed));

    // Move background based on current speed
    setSceneryOffset((prev) => {
      const newOffset = prev - targetSpeed;
      return newOffset < -2400 ? newOffset + 2400 : newOffset; // Loop the background
    });

    // Update vehicle positions
    setVehicles((prevVehicles) => {
      const newVehicles = [...prevVehicles];

      // Leader maintains fixed screen position but affects following dynamics
      const leader = newVehicles[numVehicles - 1];
      leader.velocity = targetSpeed;

      // Update followers
      for (let i = numVehicles - 2; i >= 0; i--) {
        const vehicle = newVehicles[i];
        const leader = newVehicles[i + 1];
        const desiredSpacing = baseSpacing * (stringStable ? 1 + headway * 0.2 : 1);
        const spacing = leader.x - vehicle.x;
        const error = spacing - desiredSpacing;

        // Control parameters
        const kp = stringStable ? 0.3 : 1.0;
        const kd = stringStable ? headway : 0.2;
        const damping = stringStable ? 0.95 : 0.98;

        // Update dynamics
        vehicle.acceleration = kp * error - kd * (vehicle.velocity - leader.velocity);
        vehicle.acceleration = Math.max(-2, Math.min(2, vehicle.acceleration));
        vehicle.velocity += vehicle.acceleration;
        vehicle.velocity *= damping;
        vehicle.x += vehicle.velocity;
      }

      return newVehicles;
    });

    animationRef.current = requestAnimationFrame(updateVehicles);
  };

  useEffect(() => {
    if (running) {
      animationRef.current = requestAnimationFrame(updateVehicles);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [running]);

  return (
    <div className={`p-6 max-w-4xl mx-auto ${isDarkMode ? 'dark' : ''}`}>
      <h2 className="text-2xl font-bold mb-4 text-center">
        Vehicle Platoon String Stability Demo
      </h2>

      <div className="mb-6 flex gap-4 justify-center items-center">
        <button
          onClick={running ? stopAnimation : startAnimation}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {running ? 'Stop' : 'Start'} Animation
        </button>

        <div className="flex items-center gap-4 text-current">
          <label className="flex items-center gap-2 font-medium">
            <input
              type="checkbox"
              checked={stringStable}
              onChange={(e) => setStringStable(e.target.checked)}
            />
            <span>String Stable</span>
          </label>

          <div className="flex items-center gap-2">
            <span>Headway:</span>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.1"
              value={headway}
              onChange={(e) => setHeadway(parseFloat(e.target.value))}
              className="w-32"
            />
            <span>{headway.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div className={`border rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <svg
          width="100%"
          height="200"
          viewBox="0 0 800 200"
          preserveAspectRatio="xMidYMid"
        >
          {/* Background elements (trees only) */}
          {bgElements.map((elem) => (
            <BackgroundElement
              key={elem.id}
              x={(elem.x + sceneryOffset) % 2400 - 800} // Ensure trees loop smoothly
              type={elem.type}
              isDarkMode={isDarkMode}
            />
          ))}

          {/* Road */}
          <line
            x1="0"
            y1="150"
            x2={roadLength}
            y2="150"
            stroke={isDarkMode ? "#666" : "gray"}
            strokeWidth="4"
          />

          {/* Current speed indicator */}
          <text
            x="20"
            y="30"
            className="text-sm"
            fill={isDarkMode ? "#fff" : "#000"}
          >
            Speed: {targetSpeed.toFixed(2)}
          </text>

          {/* Vehicles */}
          <g transform="translate(0, 150)">
            {vehicles.map((vehicle, index) => (
              <Vehicle
                key={vehicle.id}
                x={vehicle.x}
                color={vehicle.color}
                isLeader={index === numVehicles - 1}
                isDarkMode={isDarkMode}
              />
            ))}
          </g>
        </svg>
      </div>

      <div className="mt-4 text-sm">
        <p>The leader accelerates smoothly to a constant speed.
           The background motion reflects the platoon's velocity while vehicles maintain their relative positions.</p>
        <p>In string stable mode, higher headway values result in larger inter-vehicle spacing but better stability.
           In unstable mode, the spacing oscillations may grow as they propagate through the string.</p>
      </div>
    </div>
  );
};

export default StringStabilityDemo;