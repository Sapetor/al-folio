import { Truck } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

// Helper Constants
const VEHICLE_COUNT = 5;
const BASE_SPACING = 100;
const LEADER_BASE_POSITION = 800;
const BASE_SPEED = 800 / 3000;
const MAX_SPEED = 5;

// Vehicle Dynamics Constants
const MIN_SPACING = 50; // Minimum spacing in pixels
const DEFAULT_TIME_HEADWAY = 1.0; // Default time headway in seconds
const MAX_ACCELERATION = 0.001; // Maximum acceleration (reduced for slower response)
const MAX_DECELERATION = 0.2; // Maximum deceleration (braking)
const DRAG_COEFFICIENT = 0.002; // Aerodynamic drag coefficient
const SPEED_TO_PIXEL_RATIO = 50; // Conversion factor for speed to pixels

// Element type definitions
const elementTypes = [
  { type: 'tree', scale: 1.0, yOffset: 0, speed: 'foreground', layer: 1 },
  { type: 'smallTree', scale: 0.6, yOffset: 10, speed: 'background', layer: 0 },
  { type: 'streetlight', speed: 'foreground', layer: 3 },
  { type: 'building', scale: 1.2, yOffset: 0, speed: 'background', layer: 2 }
];

// Generate background elements
const generateElements = () => {
  const newElements = [];
  let id = 1;

  // Buildings
  let lastBuildingX = 800;
  while (lastBuildingX < 2400) {
    newElements.push({
      id: id++,
      x: lastBuildingX + Math.random() * 100,
      type: 3,
      scale: 1.2
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

  // Front trees
  for (let x = 800; x < 2400; x += 200 + Math.random() * 200) {
    newElements.push({
      id: id++,
      x: x + Math.random() * 100,
      type: 0,
      scale: 1.0 + Math.random() * 0.2
    });
  }

  // Street lights with fixed intervals
  const LIGHT_SPACING = 300;
  for (let x = 800; x < 2400; x += LIGHT_SPACING) {
    newElements.push({
      id: id++,
      x: x + 50,
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
  return Array(VEHICLE_COUNT).fill(0).map((_, i) => ({
    id: i,
    x: 0, // Initial position will be set in handleStartAnimation
    velocity: 0,
    acceleration: 0,
    desiredSpacing: BASE_SPACING,
    timeHeadway: DEFAULT_TIME_HEADWAY, // Time headway in seconds
    color: `hsl(${(i * 360 / VEHICLE_COUNT)}, 70%, 50%)`,
    braking: false
  }));
};

// Background Element Component
const BackgroundElement = ({ x, isDarkMode, scale = 1, yOffset = 0, type }) => {
  const color = isDarkMode ? "#555" : "#666";
  
  if (type === 'tree') return (
    <g transform={`translate(${x}, ${yOffset}) scale(${scale})`}>
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
    <g transform={`translate(${x}, ${yOffset}) scale(${scale})`}>
      <rect x="-20" y="120" width="40" height="5" fill={isDarkMode ? "#685" : "#685"} rx="2" />
      <rect x="-4" y="90" width="8" height="30" fill={"#331d15"} />
      <path d="M -15 90 L 0 50 L 15 90 Z" fill={isDarkMode ? "#685" : "#685"} />
      <path d="M -12 70 L 0 35 L 12 70 Z" fill={isDarkMode ? "#685" : "#685"} />
    </g>
  );

  return null;
};

// Street Light Component
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

// Vehicle Component
const Vehicle = ({ x, color, isLeader, isDarkMode, velocity, acceleration, braking, desiredSpacing, actualSpacing }) => {
  // Determine if accelerating or decelerating
  const isAccelerating = acceleration > 0.05;
  const isDecelerating = acceleration < -0.05 || braking;
  
  // Calculate spacing error to visualize
  const spacingError = actualSpacing !== undefined ? (actualSpacing - desiredSpacing) : 0;
  const spacingStatus = Math.abs(spacingError) < 5 ? "optimal" : 
                        spacingError > 0 ? "too-far" : "too-close";
  
  return (
    <g transform={`translate(${x}, 150)`}>
      {/* Vehicle body */}
      <rect x="-20" y="-10" width="40" height="20" fill={color} rx="5" />
      
      {/* Wheels */}
      <circle cx="-12" cy="12" r="5" fill={isDarkMode ? "#ddd" : "#333"} />
      <circle cx="12" cy="12" r="5" fill={isDarkMode ? "#ddd" : "#333"} />
      
      {/* Brake lights */}
      {isDecelerating && (
        <rect x="-18" y="-8" width="6" height="3" fill="#f00" />
      )}
      
      {/* Acceleration indicator (headlights) */}
      {isAccelerating && (
        <rect x="12" y="-8" width="6" height="3" fill="#ff0" />
      )}
      
      {/* Leader label */}
      {isLeader && (
        <>
          <rect x="-20" y="-30" width="40" height="15" fill={color} rx="3" />
          <text x="0" y="-19" textAnchor="middle" fill="#fff" fontSize="12">Leader</text>
        </>
      )}
      
      {/* Speed indicator - shows the vehicle's current velocity */}
      <text x="0" y="0" textAnchor="middle" fill="#fff" fontSize="8">
        Speed: {Math.abs(velocity).toFixed(1)}
      </text>
      
      {/* Display spacing status indicator for followers */}
      {!isLeader && actualSpacing !== undefined && (
        <circle 
          cx="0" 
          cy="-15" 
          r="4" 
          fill={spacingStatus === "optimal" ? "#0f0" : 
                spacingStatus === "too-far" ? "#00f" : "#f00"} 
        />
      )}
    </g>
  );
};

// Main Component
const EnhancedStringStabilityDemo = () => {
  // State
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [running, setRunning] = useState(false);
  const [elements, setElements] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [targetSpeed, setTargetSpeed] = useState(2.0);
  const [controllerGain, setControllerGain] = useState(0.3);
  const [dampingGain, setDampingGain] = useState(0.1);
  const [timeHeadway, setTimeHeadway] = useState(DEFAULT_TIME_HEADWAY);
  const [useAdaptiveCruise, setUseAdaptiveCruise] = useState(true);
  const [leadVehicleSpeed, setLeadVehicleSpeed] = useState(0);
  const [applyingBrake, setApplyingBrake] = useState(false);
  const [stabilityScore, setStabilityScore] = useState(100);
  
  // Animation refs
  const animationRef = useRef(null);
  const lastTimeRef = useRef(0);
  
  // Calculate stability score
  const calculateStabilityScore = (vehicles) => {
    if (vehicles.length < 2) return 100;
    
    // Get leader's velocity for reference
    const leaderVelocity = vehicles[vehicles.length - 1].velocity;
    
    // Calculate velocity differences relative to leader
    const velocityDiffs = vehicles.map(v => 
      Math.abs(v.velocity - leaderVelocity));
    
    // Calculate desired spacing based on leader's velocity
    const desiredSpacing = useAdaptiveCruise ? 
      (MIN_SPACING + leaderVelocity * timeHeadway * SPEED_TO_PIXEL_RATIO) : 
      BASE_SPACING;
    
    // For adaptive cruise control, calculate spacing errors relative to desired spacing
    const spacingErrors = vehicles.slice(0, -1).map((v, i) => {
      const leadVehicle = vehicles[i + 1];
      const actualSpacing = leadVehicle.x - v.x;
      return Math.abs(actualSpacing - desiredSpacing) / Math.max(1, desiredSpacing);
    });
    
    // Maximum values for normalization
    const maxAcceptableVelocityDiff = 1.0;
    const maxAcceptableSpacingError = 0.2;
    
    // Calculate scores
    const velocityScore = 100 - Math.min(100, 
      Math.max(...velocityDiffs) / maxAcceptableVelocityDiff * 100);
    
    const spacingScore = spacingErrors.length > 0 ? 
      (100 - Math.min(100, Math.max(...spacingErrors) / maxAcceptableSpacingError * 100)) : 
      100;
    
    // Combined score
    return velocityScore * 0.6 + spacingScore * 0.4;
  };
  
  // Apply realistic vehicular dynamics
  const applyVehicleDynamics = (vehicle, targetVelocity, deltaTime) => {
    // Calculate drag force (proportional to velocity squared, but simplified)
    const dragForce = DRAG_COEFFICIENT * vehicle.velocity * vehicle.velocity * Math.sign(vehicle.velocity);
    
    // Calculate desired acceleration
    let desiredAcceleration = targetVelocity - vehicle.velocity;
    
    // Limit acceleration and deceleration
    desiredAcceleration = Math.min(MAX_ACCELERATION, Math.max(-MAX_DECELERATION, desiredAcceleration));
    
    // Apply drag
    vehicle.acceleration = desiredAcceleration - dragForce;
    
    // Update velocity with acceleration
    vehicle.velocity += vehicle.acceleration;
    
    // Ensure velocity doesn't go negative (no reverse)
    vehicle.velocity = Math.max(0, vehicle.velocity);
    
    // Update position
    vehicle.x += vehicle.velocity;
    
    return vehicle;
  };
  
  // Animation update function
  const updateScene = (timestamp) => {
    if (!running) return;
    
    // Calculate time delta
    const deltaTime = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0.016;
    lastTimeRef.current = timestamp;
    
    // Update vehicles
    setVehicles(prev => {
      const newVehicles = [...prev];
      const leaderIndex = newVehicles.length - 1;
      const leader = newVehicles[leaderIndex];
      
      // Make the leader respond more slowly to target speed changes
      let leaderTargetSpeed = applyingBrake ? 0 : targetSpeed;
      
      // Apply stronger deceleration when braking
      if (applyingBrake) {
        leader.acceleration = -MAX_DECELERATION;
        leader.velocity = Math.max(0, leader.velocity + leader.acceleration);
        leader.braking = true;
      } else {
        // Make leader respond more gradually to target speed changes
        const speedDiff = leaderTargetSpeed - leader.velocity;
        // Use a smaller factor (0.05) for much slower acceleration
        leader.acceleration = Math.sign(speedDiff) * Math.min(Math.abs(speedDiff) * 0.05, MAX_ACCELERATION);
        leader.velocity += leader.acceleration;
        leader.velocity = Math.max(0, leader.velocity);
      }
      
      // Keep leader position fixed
      leader.x = 600; // Fixed leader position
      
      // Update lead vehicle speed state for UI display
      setLeadVehicleSpeed(leader.velocity);
      
      // Calculate the desired spacing for ALL vehicles based on the LEADER'S velocity
      // This ensures consistent spacing throughout the platoon
      const baseDesiredSpacing = useAdaptiveCruise ? 
        (MIN_SPACING + leader.velocity * timeHeadway * SPEED_TO_PIXEL_RATIO) : 
        BASE_SPACING;
      
      // Update follower vehicles - calculating relative positions based on desired spacing
      for (let i = leaderIndex - 1; i >= 0; i--) {
        const vehicle = newVehicles[i];
        const leadVehicle = newVehicles[i + 1];
        
        // All vehicles use the same desired spacing based on leader's velocity
        vehicle.desiredSpacing = baseDesiredSpacing;
        
        // Calculate actual spacing
        const actualSpacing = leadVehicle.x - vehicle.x;
        vehicle.actualSpacing = actualSpacing;
        
        // Calculate spacing error
        const spacingError = actualSpacing - baseDesiredSpacing;
        
        // Calculate target speed based on leader's speed and spacing error
        const targetSpeed = leadVehicle.velocity + (controllerGain * spacingError);
        
        // Update velocity based on target speed
        const dragForce = DRAG_COEFFICIENT * vehicle.velocity * vehicle.velocity * Math.sign(vehicle.velocity);
        let desiredAcceleration = targetSpeed - vehicle.velocity;
        desiredAcceleration = Math.min(MAX_ACCELERATION, Math.max(-MAX_DECELERATION, desiredAcceleration));
        vehicle.acceleration = desiredAcceleration - dragForce;
        vehicle.acceleration += -dampingGain * (vehicle.velocity - leadVehicle.velocity); // Add dampening
        
        // Update velocity
        vehicle.velocity += vehicle.acceleration;
        vehicle.velocity = Math.max(0, vehicle.velocity);
        
        // Set position based ONLY on desired spacing from predecessor
        vehicle.x = leadVehicle.x - baseDesiredSpacing;
        
        // Add a small correction based on spacing error for responsive visualization
        if (Math.abs(spacingError) > 5) {
          vehicle.x += spacingError * 0.1 * -1; // Small correction to gradually adjust to desired spacing
        }
        
        // Detect braking for visualization
        vehicle.braking = vehicle.acceleration < -0.05;
        
        // Update time headway from global setting
        vehicle.timeHeadway = timeHeadway;
      }
      
      // Calculate new stability score
      const newScore = calculateStabilityScore(newVehicles);
      setStabilityScore(newScore);
      
      return newVehicles;
    });
    
    // Get the leader's speed for background movement
    const leaderSpeed = vehicles.length > 0 ? vehicles[vehicles.length - 1].velocity : 0;
    
    // Use a more direct background movement for better visual feedback
    const foregroundMovement = leaderSpeed * 0.8;
    const backgroundMovement = leaderSpeed * 0.5;
    
    // Update background elements
    setElements(prev => {
      return prev.map(el => {
        // Get element type configuration
        const config = elementTypes[el.type];
        
        // Apply appropriate movement speed based on layer
        const movement = config.speed === 'foreground' ? 
          foregroundMovement : backgroundMovement;
        
        let newX = el.x - movement;
        
        // Recycle elements when off-screen
        if (el.type === 2 && newX < -200) { // Street lights
          const overflow = -newX - 200;
          const intervals = Math.ceil(overflow / 300);
          newX = 800 + (intervals * 300) + 50;
        } else if (newX < -200) { // Other elements
          newX = 800 + Math.random() * 400;
        }
        
        return { ...el, x: newX };
      });
    });
    
    // Continue animation loop
    animationRef.current = requestAnimationFrame(updateScene);
  };
  
  // Start animation
  const handleStartAnimation = () => {
    // Initialize vehicles with the leader at a fixed position
    // The leader (the last vehicle) is always at position 600
    const newVehicles = initializeVehicles();
    const leaderPosition = 600;
    const leaderIndex = VEHICLE_COUNT - 1;
    
    // Position the leader
    newVehicles[leaderIndex].x = leaderPosition;
    
    // Position followers based on fixed spacing
    for (let i = leaderIndex - 1; i >= 0; i--) {
      newVehicles[i].x = newVehicles[i + 1].x - BASE_SPACING;
    }
    
    setElements(generateElements());
    setVehicles(newVehicles);
    setLeadVehicleSpeed(0);
    lastTimeRef.current = 0;
    setRunning(true);
  };
  
  // Stop animation
  const handleStopAnimation = () => {
    setRunning(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };
  
  // Animation effect
  useEffect(() => {
    if (running) {
      // Start animation loop
      animationRef.current = requestAnimationFrame(updateScene);
    }
    
    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [running, timeHeadway, useAdaptiveCruise, controllerGain, dampingGain]);
  
  // Dark mode effect
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeMediaQuery.matches);
    
    const handleChange = (e) => setIsDarkMode(e.matches);
    darkModeMediaQuery.addEventListener('change', handleChange);
    return () => darkModeMediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  // Metrics Display Component
  const MetricsDisplay = () => {
    // Calculate average actual spacing
    const avgSpacing = vehicles.length > 1 ? 
      ((vehicles[vehicles.length-1].x - vehicles[0].x) / (vehicles.length-1)).toFixed(0) : 
      BASE_SPACING;
    
    // Calculate average desired spacing based on ACC
    const avgDesiredSpacing = vehicles.length > 1 ?
      (vehicles.slice(0, -1).reduce((sum, v) => sum + v.desiredSpacing, 0) / (vehicles.length - 1)).toFixed(0) :
      BASE_SPACING;
      
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
          <div className="text-xs text-blue-800 dark:text-blue-200">Target Speed</div>
          <div className="text-lg font-bold">{targetSpeed.toFixed(1)}</div>
        </div>
        <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
          <div className="text-xs text-green-800 dark:text-green-200">Leader Speed</div>
          <div className="text-lg font-bold">{leadVehicleSpeed.toFixed(1)}</div>
        </div>
        <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
          <div className="text-xs text-purple-800 dark:text-purple-200">Spacing</div>
          <div className="text-lg font-bold">
            {avgSpacing}px
            {useAdaptiveCruise && <div className="text-xs">Target: {avgDesiredSpacing}px</div>}
          </div>
        </div>
        <div className="bg-amber-100 dark:bg-amber-900 p-3 rounded-lg">
          <div className="text-xs text-amber-800 dark:text-amber-200">Stability Score</div>
          <div className="text-lg font-bold">{stabilityScore.toFixed(0)}%</div>
        </div>
      </div>
    );
  };
  
  return (
    <div className={`p-4 max-w-4xl mx-auto ${isDarkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-white text-gray-900'} transition-colors duration-300`}>
      <h2 className="text-2xl font-bold mb-4 text-center">
        Enhanced Vehicle Platoon with Adaptive Cruise Control
      </h2>
      
      {/* Metrics display */}
      {running && <MetricsDisplay />}
      
      {/* Controls */}
      <div className="mb-6 flex flex-wrap gap-4 justify-center items-center">
        <button
          onClick={running ? handleStopAnimation : handleStartAnimation}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {running ? 'Stop' : 'Start'} Animation
        </button>
        
        {running && (
          <button
            onMouseDown={() => setApplyingBrake(true)}
            onMouseUp={() => setApplyingBrake(false)}
            onMouseLeave={() => setApplyingBrake(false)}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Hold to Brake Leader
          </button>
        )}
        
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Toggle Dark Mode
        </button>
        
        <button
          onClick={() => setUseAdaptiveCruise(!useAdaptiveCruise)}
          className={`px-4 py-2 ${useAdaptiveCruise ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500 hover:bg-gray-600'} text-white rounded`}
        >
          {useAdaptiveCruise ? 'ACC ON' : 'ACC OFF'}
        </button>
      </div>
      
      {/* Configuration sliders */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="w-32">Target Speed:</label>
          <input
            type="range"
            min="0.1"
            max={MAX_SPEED}
            step="0.1"
            value={targetSpeed}
            onChange={(e) => {
              const newSpeed = parseFloat(e.target.value);
              setTargetSpeed(newSpeed);
              
              // Don't update leader velocity directly anymore - let it accelerate naturally
              // This allows for a more gradual acceleration
            }}
            className="flex-1"
          />
          <span className="w-12">{targetSpeed.toFixed(1)}</span>
        </div>
        
        {useAdaptiveCruise && (
          <div className="flex items-center gap-4">
            <label className="w-32">Time Headway:</label>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.1"
              value={timeHeadway}
              onChange={(e) => setTimeHeadway(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="w-12">{timeHeadway.toFixed(1)}s</span>
          </div>
        )}
        
        <div className="flex items-center gap-4">
          <label className="w-32">Position Gain:</label>
          <input
            type="range"
            min="0.05"
            max="0.6"
            step="0.05"
            value={controllerGain}
            onChange={(e) => setControllerGain(parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="w-12">{controllerGain.toFixed(2)}</span>
        </div>
        
        <div className="flex items-center gap-4">
          <label className="w-32">Velocity Gain:</label>
          <input
            type="range"
            min="0.05"
            max="0.3"
            step="0.05"
            value={dampingGain}
            onChange={(e) => setDampingGain(parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="w-12">{dampingGain.toFixed(2)}</span>
        </div>
      </div>
      
      {/* Simulation canvas */}
      <div className={`border rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <svg width="100%" height="200" viewBox="0 0 800 200">
          {/* Road line */}
          <line x1="-1000" y1="150" x2="2000" y2="150" 
                stroke={isDarkMode ? "#666" : "gray"} strokeWidth="4" />
          
          {/* Background elements */}
          {elements.map(el => {
            const config = elementTypes[el.type];
            return config.type === 'streetlight' ? (
              <StreetLight key={el.id} x={el.x} isDarkMode={isDarkMode} />
            ) : (
              <BackgroundElement 
                key={el.id} 
                x={el.x} 
                isDarkMode={isDarkMode}
                scale={el.scale || config.scale} 
                yOffset={config.yOffset} 
                type={config.type} 
              />
            );
          })}
          
          {/* Vehicles */}
          {vehicles.map((vehicle, index) => (
            <Vehicle 
              key={vehicle.id} 
              x={vehicle.x} 
              color={vehicle.color}
              velocity={vehicle.velocity}
              acceleration={vehicle.acceleration}
              braking={vehicle.braking}
              desiredSpacing={vehicle.desiredSpacing}
              actualSpacing={vehicle.actualSpacing}
              isLeader={index === VEHICLE_COUNT - 1} 
              isDarkMode={isDarkMode} 
            />
          ))}
        </svg>
      </div>
      
      {/* Description and controls legend */}
      <div className="mt-6 text-sm">
        <h3 className="font-bold mb-2">How to use this demo:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Target Speed:</strong> Controls the overall target speed of the platoon</li>
          <li><strong>Time Headway:</strong> Time gap between vehicles (in seconds) - higher values increase spacing as speed increases</li>
          <li><strong>Position Gain:</strong> How strongly vehicles respond to spacing errors</li>
          <li><strong>Velocity Gain:</strong> How strongly vehicles respond to speed differences</li>
          <li><strong>ACC ON/OFF:</strong> Toggle between fixed spacing and adaptive cruise control</li>
          <li><strong>Hold to Brake:</strong> Press and hold to simulate braking by the lead vehicle</li>
        </ul>
        <p className="mt-3">
          <strong>About Adaptive Cruise Control:</strong> With ACC enabled, vehicles dynamically adjust their spacing based on their speed. 
          The formula is: <code>desired_spacing = min_spacing + (time_headway * velocity)</code>. This creates a more realistic and stable 
          following behavior, especially at higher speeds where more braking distance is needed.
        </p>
        <p className="mt-2">
          <strong>Vehicle Status Indicators:</strong> Each follower vehicle has a colored dot above it showing spacing status:
          <span className="ml-2 inline-block w-3 h-3 rounded-full bg-red-500"></span> Too close 
          <span className="ml-2 inline-block w-3 h-3 rounded-full bg-green-500"></span> Optimal spacing
          <span className="ml-2 inline-block w-3 h-3 rounded-full bg-blue-500"></span> Too far
        </p>
      </div>
    </div>
  );
};

export default EnhancedStringStabilityDemo;