import * as THREE from 'three';
import { TextureLoader } from 'three';

/**
 * Creates meshes for MPs
 * @param {Array} mpData - Array of MP data from JSON
 * @returns {Array} Array of MP objects with meshes
 */
function createMPMeshes(mpData) {
  return mpData.map(mp => {
    // Create a group to hold the MP's body parts
    const group = new THREE.Group();

    // Create body (cylinder)
    const bodyGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.4, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: getMPColor(mp.party),
      roughness: 0.7,
      metalness: 0.3
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.7; // Half height to stand on ground
    group.add(body);

    // Create head (sphere)
    const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFE0BD, // Neutral skin tone
      roughness: 0.8,
      metalness: 0.1
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.65; // Position on top of body
    head.userData.isHead = true; // Mark for portrait texture
    group.add(head);

    // Load portrait texture if available
    if (mp.portrait_URL) {
      const textureLoader = new THREE.TextureLoader();
      loadTexture(textureLoader, mp.portrait_URL)
        .then(texture => {
          applyPortraitTexture(group, texture);
        })
        .catch(() => {
          // Fallback to default texture with name
          applyDefaultTexture(group, mp.name, mp.party);
        });
    } else {
      applyDefaultTexture(group, mp.name, mp.party);
    }

    // Create name label
    const label = createTextLabel(`${mp.name}\n${mp.position || ''}`);
    label.position.y = 2.2;
    group.add(label);

    group.castShadow = true;
    group.receiveShadow = true;

    return {
      data: mp,
      mesh: group
    };
  });
}

/**
 * Gets color for MP based on party
 * @param {string} party - MP's party
 * @returns {number} Color as hex number
 */
function getMPColor(party) {
  switch (party) {
    case 'Labour':
      return 0xE4003B;
    case 'Conservative':
      return 0x0087DC;
    case 'Liberal Democrats':
      return 0xFAA61A;
    case 'Non-partisan':
      return 0x777777;
    default:
      return 0xCCCCCC;
  }
}

/**
 * Loads and creates MP objects
 * @returns {Promise<Array>} Promise resolving to array of MP objects
 */
export function loadMPs() {
  // Get the base URL for the current environment
  const baseUrl = import.meta.env?.BASE_URL || '/';
  
  // Construct the full path to mps.json
  const dataPath = new URL('data/mps.json', baseUrl).pathname;
  
  return fetch(dataPath)
    .then(response => {
      if (!response.ok) {
        // Try fallback path if first attempt fails
        const fallbackPath = '/data/mps.json';
        return fetch(fallbackPath).then(fallbackResponse => {
          if (!fallbackResponse.ok) {
            throw new Error('Failed to load MP data');
          }
          return fallbackResponse.json();
        });
      }
      return response.json();
    })
    .then(mpData => {
      const mps = createMPMeshes(mpData);
      updateMPPositions(mps);
      return mps;
    })
    .catch(error => {
      console.error('Error loading MP data:', error);
      return [];
    });
}

/**
 * Loads a texture from a URL
 * @param {THREE.TextureLoader} loader - The texture loader
 * @param {string} url - The URL of the texture
 * @returns {Promise<THREE.Texture>} A promise that resolves to the loaded texture
 */
function loadTexture(loader, url) {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      texture => resolve(texture),
      undefined,
      error => reject(error)
    );
  });
}

/**
 * Applies a portrait texture to the MP's head
 * @param {THREE.Group} figure - The MP figure
 * @param {THREE.Texture} texture - The portrait texture
 */
function applyPortraitTexture(figure, texture) {
  // Find the head mesh
  const head = figure.children.find(child => child.userData.isHead);
  if (!head) return;
  
  // Create a material with the portrait texture
  const material = new THREE.MeshBasicMaterial({
    map: texture
  });
  
  // Create a plane slightly larger than the head to display the portrait
  const portraitGeometry = new THREE.PlaneGeometry(0.5, 0.5);
  const portrait = new THREE.Mesh(portraitGeometry, material);
  
  // Position the portrait in front of the head
  portrait.position.set(0, 0, 0.26);
  
  // Add the portrait to the head
  head.add(portrait);
  
  // Create a back side of the portrait (so it's visible from behind)
  const backPortrait = portrait.clone();
  backPortrait.rotation.y = Math.PI;
  backPortrait.position.z = -0.26;
  head.add(backPortrait);
}

/**
 * Creates a default texture with the MP's name when portrait is unavailable
 * @param {THREE.Group} figure - The MP figure
 * @param {string} name - The MP's name
 * @param {string} party - The MP's party
 */
function applyDefaultTexture(figure, name, party) {
  const head = figure.children.find(child => child.userData.isHead);
  if (!head) return;
  
  // Create a canvas to draw the name
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  
  // Fill with party color
  context.fillStyle = '#' + new THREE.Color(getPartyColor(party)).getHexString();
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add a lighter center area for the face
  context.fillStyle = 'rgba(255, 255, 255, 0.7)';
  context.beginPath();
  context.arc(canvas.width / 2, canvas.height / 2, canvas.width / 3, 0, Math.PI * 2);
  context.fill();
  
  // Add the name
  context.fillStyle = 'black';
  context.font = 'bold 24px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  
  // Split name into lines if needed
  const words = name.split(' ');
  if (words.length > 1) {
    context.fillText(words[0], canvas.width / 2, canvas.height / 2 - 15);
    context.fillText(words.slice(1).join(' '), canvas.width / 2, canvas.height / 2 + 15);
  } else {
    context.fillText(name, canvas.width / 2, canvas.height / 2);
  }
  
  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);
  
  // Apply the texture to the head
  head.material = new THREE.MeshLambertMaterial({ map: texture });
}

/**
 * Creates a text label for an MP
 * @param {string} text - The text to display
 * @returns {THREE.Object3D} The text label object
 */
function createTextLabel(text) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 256;
  canvas.height = 64;
  
  context.font = 'bold 24px Arial';
  context.fillStyle = 'white';
  context.textAlign = 'center';
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  
  // Add a background for better visibility
  context.globalCompositeOperation = 'destination-over';
  context.fillStyle = 'rgba(0, 0, 0, 0.5)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2, 0.5, 1);
  
  return sprite;
}

/**
 * Returns a color based on the MP's party
 * @param {string} party - The political party
 * @returns {number} The color as a hex value
 */
function getPartyColor(party) {
  switch (party.toLowerCase()) {
    case 'labour':
      return 0xE4003B; // Labour red
    case 'conservative':
      return 0x0087DC; // Conservative blue
    case 'liberal democrats':
      return 0xFAA61A; // Lib Dem orange
    case 'green':
      return 0x6AB023; // Green
    case 'scottish national party':
    case 'snp':
      return 0xFFF95D; // SNP yellow
    case 'plaid cymru':
      return 0x005B54; // Plaid Cymru green
    case 'non-partisan':
      return 0x777777; // Grey for non-partisan (like the Speaker)
    default:
      return 0xCCCCCC; // Default grey
  }
}

/**
 * Calculates seat positions for all MPs
 * @param {Array} mps - Array of MP data from mps.json
 * @returns {Object} Map of MP IDs to their calculated seat positions
 */
function calculateMPSeats(mps) {
  const seatMap = new Map();
  const occupiedSeats = new Set();
  
  // Sort MPs by importance for seating priority
  const sortedMPs = [...mps].sort((a, b) => {
    // Speaker gets highest priority
    if (a.position === 'Speaker of the House of Commons') return -1;
    if (b.position === 'Speaker of the House of Commons') return 1;
    
    // Prime Minister and Leader of Opposition next
    if (a.position === 'Prime Minister') return -1;
    if (b.position === 'Prime Minister') return 1;
    if (a.position === 'Leader of the Opposition') return -1;
    if (b.position === 'Leader of the Opposition') return 1;
    
    // Then other frontbench positions
    const aFront = Boolean(a.position);
    const bFront = Boolean(b.position);
    if (aFront && !bFront) return -1;
    if (!aFront && bFront) return 1;
    
    return 0;
  });

  sortedMPs.forEach(mp => {
    let seatPosition;
    
    // Special handling for Speaker
    if (mp.position === 'Speaker of the House of Commons') {
      seatPosition = { x: 0, y: 0.5, z: -13 };
      seatMap.set(mp.id, seatPosition);
      return;
    }

    // Handle specific positions
    switch (mp.position) {
      case 'Prime Minister':
        seatPosition = { x: 2, y: 0.5, z: -1 };
        break;
      case 'Leader of the Opposition':
        seatPosition = { x: -2, y: 0.5, z: -1 };
        break;
      case 'Deputy Prime Minister':
        seatPosition = { x: 2, y: 0.5, z: 1 };
        break;
      case 'Chancellor of the Exchequer':
        seatPosition = { x: 2, y: 0.5, z: -2 };
        break;
      case 'Shadow Chancellor':
        seatPosition = { x: -2, y: 0.5, z: -2 };
        break;
      case 'Leader of the Liberal Democrats':
        seatPosition = findMinorPartySeat(-1, 8, occupiedSeats);
        break;
      default:
        // Handle regular MPs based on party
        seatPosition = findRegularSeat(mp, occupiedSeats);
    }

    if (seatPosition) {
      const seatKey = `${seatPosition.x},${seatPosition.y},${seatPosition.z}`;
      if (!occupiedSeats.has(seatKey)) {
        seatMap.set(mp.id, seatPosition);
        occupiedSeats.add(seatKey);
      } else {
        // Find nearest available seat if preferred position is occupied
        seatPosition = findNearestAvailableSeat(seatPosition, mp.party, occupiedSeats);
        seatMap.set(mp.id, seatPosition);
        occupiedSeats.add(`${seatPosition.x},${seatPosition.y},${seatPosition.z}`);
      }
    }
  });

  return seatMap;
}

/**
 * Finds a seat for regular MPs based on their party
 * @param {Object} mp - MP data
 * @param {Set} occupiedSeats - Set of occupied seat positions
 * @returns {Object} Seat position {x, y, z}
 */
function findRegularSeat(mp, occupiedSeats) {
  const isFrontbench = Boolean(mp.position);
  
  switch (mp.party) {
    case 'Labour':
      return findPartyBenchSeat(1, isFrontbench, occupiedSeats); // Right side
    case 'Conservative':
      return findPartyBenchSeat(-1, isFrontbench, occupiedSeats); // Left side
    case 'Liberal Democrats':
      return findMinorPartySeat(-1, 8, occupiedSeats); // Opposition side, back
    default:
      return findMinorPartySeat(-1, 0, occupiedSeats); // Opposition side, middle
  }
}

/**
 * Finds a seat in the party benches
 * @param {number} side - Side of house (1 for government, -1 for opposition)
 * @param {boolean} isFrontbench - Whether MP is frontbench
 * @param {Set} occupiedSeats - Set of occupied seat positions
 * @returns {Object} Seat position {x, y, z}
 */
function findPartyBenchSeat(side, isFrontbench, occupiedSeats) {
  const startTier = isFrontbench ? 0 : 1;
  const maxTier = isFrontbench ? 0 : 7;
  
  for (let tier = startTier; tier <= maxTier; tier++) {
    const xBase = side * (3 + tier * 1.5);
    const yBase = tier * 0.25 + 0.5;
    
    // Search for empty seat in this tier
    for (let z = -10; z <= 10; z += 0.5) {
      // Skip dispatch box area for frontbench
      if (tier === 0 && z > -2 && z < 2) continue;
      
      const seatKey = `${xBase},${yBase},${z}`;
      if (!occupiedSeats.has(seatKey)) {
        return { x: xBase, y: yBase, z };
      }
    }
  }
  
  // Fallback position
  return { x: side * 10, y: 0.5, z: 0 };
}

/**
 * Finds nearest available seat to a preferred position
 * @param {Object} preferred - Preferred seat position
 * @param {string} party - MP's party
 * @param {Set} occupiedSeats - Set of occupied seat positions
 * @returns {Object} Available seat position
 */
function findNearestAvailableSeat(preferred, party, occupiedSeats) {
  const side = party === 'Labour' ? 1 : -1;
  const radius = 0.5;
  let attempts = 0;
  
  while (attempts < 20) {
    const x = preferred.x + (Math.random() - 0.5) * radius * attempts;
    const z = preferred.z + (Math.random() - 0.5) * radius * attempts;
    const y = preferred.y;
    
    const seatKey = `${x},${y},${z}`;
    if (!occupiedSeats.has(seatKey)) {
      return { x, y, z };
    }
    attempts++;
  }
  
  // Last resort fallback
  return { x: side * (10 + Math.random() * 2), y: 0.5, z: Math.random() * 10 - 5 };
}

/**
 * Finds a seat for minor party MPs
 * @param {number} side - Side of house (-1 for opposition side)
 * @param {number} zOffset - Position along length of chamber
 * @param {Set} occupiedSeats - Set of occupied seat positions
 * @returns {Object} Seat position {x, y, z}
 */
function findMinorPartySeat(side, zOffset, occupiedSeats) {
  const xBase = side * 12; // Further to the side
  
  // Try to find empty seat in the minor party area
  for (let row = 0; row < 3; row++) {
    for (let seat = 0; seat < 4; seat++) {
      const x = xBase + (row * 0.5);
      const y = row * 0.25 + 0.5;
      const z = zOffset + (seat * 0.5);
      
      const seatKey = `${x},${y},${z}`;
      if (!occupiedSeats.has(seatKey)) {
        return { x, y, z };
      }
    }
  }
  
  // Fallback position
  return { x: xBase, y: 0.5, z: zOffset };
}

/**
 * Updates MP positions in the scene
 * @param {Array} mps - Array of MP objects with meshes
 */
export function updateMPPositions(mps) {
  const seatMap = calculateMPSeats(mps.map(mp => mp.data));
  
  mps.forEach(mp => {
    const position = seatMap.get(mp.data.id);
    if (position) {
      mp.mesh.position.set(position.x, position.y, position.z);
      
      // Face toward center of chamber
      const angle = Math.atan2(-position.x, -position.z);
      mp.mesh.rotation.y = angle;
    }
  });
} 