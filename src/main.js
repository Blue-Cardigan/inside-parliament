import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import Stats from 'stats.js';
import { drawCommonsLayout, initializeMinimapInteractions, drawMPs } from './minimap.js';

import { loadMPs } from './mp-loader.js';
import { createMinimap } from './minimap.js';
import { createHouseOfCommons } from './commons-model.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x333333);

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 10); // Position camera at human eye level

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Controls for first-person navigation
const controls = new PointerLockControls(camera, document.body);

// Add click event to lock controls
document.addEventListener('click', () => {
  if (!controls.isLocked && !overviewMode) {
    controls.lock();
  }
});

// Physics variables
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = true;
let isJumping = false;
let jumpVelocity = 0;
const gravity = 30.0; // Gravity strength
const jumpHeight = 2.0; // Maximum jump height
const playerHeight = 1.6; // Player height (camera height)
const playerRadius = 0.3; // Player collision radius

// Collision objects array
let collisionObjects = [];

// Add a floor collision box to prevent falling through
const floorCollisionBox = new THREE.Box3(
  new THREE.Vector3(-20, -0.1, -20),
  new THREE.Vector3(20, 0.1, 20)
);

// Key event listeners
document.addEventListener('keydown', (event) => {
  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW':
      moveForward = true;
      hideInstructionsOnMovement();
      break;
    case 'ArrowLeft':
    case 'KeyA':
      moveLeft = true;
      hideInstructionsOnMovement();
      break;
    case 'ArrowDown':
    case 'KeyS':
      moveBackward = true;
      hideInstructionsOnMovement();
      break;
    case 'ArrowRight':
    case 'KeyD':
      moveRight = true;
      hideInstructionsOnMovement();
      break;
    case 'Space':
      if (canJump) {
        jumpVelocity = Math.sqrt(2 * gravity * jumpHeight);
        isJumping = true;
        canJump = false;
      }
      break;
  }
});

document.addEventListener('keyup', (event) => {
  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW':
      moveForward = false;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      moveLeft = false;
      break;
    case 'ArrowDown':
    case 'KeyS':
      moveBackward = false;
      break;
    case 'ArrowRight':
    case 'KeyD':
      moveRight = false;
      break;
  }
});

// Stats for performance monitoring
const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

// Raycaster for MP interaction and collision detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Store MP meshes for interaction
let mpMeshes = [];

// Load House of Commons model
createHouseOfCommons(scene).then((objects) => {
  console.log('House of Commons loaded');
  
  // Store collision objects
  collisionObjects = objects.filter(obj => obj.userData.collidable);
  console.log(`Loaded ${collisionObjects.length} collision objects`);
});

// Load MPs and set up their positions
loadMPs().then(mps => {
  mpMeshes = mps;
  
  // Add MP meshes to the scene
  mps.forEach(mp => {
    // Position MPs based on their roles
    const position = mp.mesh.position;
    
    // Add MP mesh to scene
    scene.add(mp.mesh);
    
    // Make MPs interactable
    mp.mesh.traverse(child => {
      if (child.isMesh) {
        child.userData.mpData = mp.data; // Store MP data for interaction
        child.userData.isInteractable = true;
      }
    });
  });
  
  // Create and initialize minimap
  const minimapCanvas = document.getElementById('minimap-canvas');
  if (minimapCanvas) {
    createMinimap(mps, camera);
    initializeMinimapInteractions(minimapCanvas, showMPInfo);
  }
  
  console.log(`Loaded ${mps.length} MPs into the scene`);
}).catch(error => {
  console.error('Error loading MPs:', error);
});

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Update MP interaction handler
document.addEventListener('click', (event) => {
  if (controls.isLocked) {
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    
    // Get all meshes from MP groups
    const allMpMeshes = [];
    mpMeshes.forEach(mp => {
      mp.mesh.traverse(child => {
        if (child.isMesh && child.userData.isInteractable) {
          allMpMeshes.push(child);
        }
      });
    });
    
    const intersects = raycaster.intersectObjects(allMpMeshes);
    
    if (intersects.length > 0) {
      const mpData = intersects[0].object.userData.mpData;
      if (mpData) {
        showMPInfo(mpData);
      }
    }
  }
});

// Update showMPInfo function to include party colors
function showMPInfo(mpData) {
  let mpInfoElement = document.getElementById('mp-info');
  if (!mpInfoElement) {
    mpInfoElement = document.createElement('div');
    mpInfoElement.id = 'mp-info';
    document.body.appendChild(mpInfoElement);
    
    // Style the info panel
    Object.assign(mpInfoElement.style, {
      position: 'fixed',
      right: '20px',
      top: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '15px',
      borderRadius: '5px',
      maxWidth: '300px',
      zIndex: '1000',
      display: 'none'
    });
  }
  
  // Get party color
  const partyColor = '#' + new THREE.Color(getPartyColor(mpData.party)).getHexString();
  
  // Create info panel content
  mpInfoElement.innerHTML = `
    ${mpData.portrait_URL ? 
      `<img src="${mpData.portrait_URL}" alt="${mpData.name}" 
       style="width: 100%; border-radius: 5px; margin-bottom: 10px;">` : ''}
    <h3 style="margin-top: 0; border-left: 5px solid ${partyColor}; padding-left: 10px;">
      ${mpData.name}
    </h3>
    <p><strong>Party:</strong> <span style="color: ${partyColor}">${mpData.party}</span></p>
    <p><strong>Constituency:</strong> ${mpData.constituency}</p>
    <p><strong>Position:</strong> ${mpData.position || 'Backbencher'}</p>
    <p>${mpData.bio}</p>
    <button id="close-mp-info" style="background: #333; color: white; border: none; 
     padding: 5px 10px; cursor: pointer; float: right;">Close</button>
  `;
  
  mpInfoElement.style.display = 'block';
  
  // Add close button handler
  document.getElementById('close-mp-info').addEventListener('click', () => {
    mpInfoElement.style.display = 'none';
  });
}

// Helper function to get party color
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

// Add a button to toggle between first-person and overview modes
const viewModeButton = document.createElement('button');
viewModeButton.textContent = 'Toggle View';
viewModeButton.style.position = 'fixed';
viewModeButton.style.bottom = '20px';
viewModeButton.style.right = '20px';
viewModeButton.style.padding = '10px';
viewModeButton.style.backgroundColor = '#333';
viewModeButton.style.color = 'white';
viewModeButton.style.border = 'none';
viewModeButton.style.borderRadius = '5px';
viewModeButton.style.cursor = 'pointer';
viewModeButton.style.zIndex = '1000';
document.body.appendChild(viewModeButton);

// Add overview camera controls
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.05;
orbitControls.screenSpacePanning = false;
orbitControls.minDistance = 5;
orbitControls.maxDistance = 30;
orbitControls.maxPolarAngle = Math.PI / 2;
orbitControls.enabled = false; // Start with first-person controls

// Toggle between first-person and overview modes
let overviewMode = false;
viewModeButton.addEventListener('click', () => {
  overviewMode = !overviewMode;
  
  if (overviewMode) {
    // Switch to overview mode
    controls.unlock();
    orbitControls.enabled = true;
    camera.position.set(0, 15, 0);
    camera.lookAt(0, 0, 0);
    instructions.classList.add('hidden');
  } else {
    // Switch to first-person mode
    orbitControls.enabled = false;
    instructions.classList.remove('hidden');
  }
});

// Instructions panel
const instructions = document.getElementById('instructions');
if (!instructions) {
  const instructionsDiv = document.createElement('div');
  instructionsDiv.id = 'instructions';
  instructionsDiv.innerHTML = `
    <h2>UK House of Commons Explorer</h2>
    <p>Click to start</p>
    <p>Use WASD or arrow keys to move</p>
    <p>SPACE to jump</p>
    <p>Mouse to look around</p>
    <p>Click on MPs to view their information</p>
    <p>Click on the minimap to see locations</p>
  `;
  instructionsDiv.style.position = 'fixed';
  instructionsDiv.style.top = '50%';
  instructionsDiv.style.left = '50%';
  instructionsDiv.style.transform = 'translate(-50%, -50%)';
  instructionsDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  instructionsDiv.style.color = 'white';
  instructionsDiv.style.padding = '20px';
  instructionsDiv.style.borderRadius = '5px';
  instructionsDiv.style.textAlign = 'center';
  instructionsDiv.style.zIndex = '100';
  document.body.appendChild(instructionsDiv);
}

// Show instructions when controls are unlocked
controls.addEventListener('unlock', () => {
  const instructions = document.getElementById('instructions');
  if (instructions) {
    instructions.classList.remove('hidden');
  }
});

// Add predefined viewpoints for important areas
const viewpoints = [
  { name: 'Speaker\'s Chair', position: new THREE.Vector3(0, 2, -10), target: new THREE.Vector3(0, 1, 0) },
  { name: 'Government Frontbench', position: new THREE.Vector3(2, 2, 0), target: new THREE.Vector3(-2, 1, 0) },
  { name: 'Opposition Frontbench', position: new THREE.Vector3(-2, 2, 0), target: new THREE.Vector3(2, 1, 0) },
  { name: 'Center of Chamber', position: new THREE.Vector3(0, 5, 0), target: new THREE.Vector3(0, 0, -5) },
  { name: 'Public Gallery', position: new THREE.Vector3(0, 8, 12), target: new THREE.Vector3(0, 1, 0) }
];

// Create viewpoint buttons
const viewpointContainer = document.createElement('div');
viewpointContainer.style.position = 'fixed';
viewpointContainer.style.top = '20px';
viewpointContainer.style.left = '20px';
viewpointContainer.style.zIndex = '1000';
document.body.appendChild(viewpointContainer);

viewpoints.forEach(viewpoint => {
  const button = document.createElement('button');
  button.textContent = viewpoint.name;
  button.style.display = 'block';
  button.style.margin = '5px';
  button.style.padding = '8px';
  button.style.backgroundColor = '#333';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '5px';
  button.style.cursor = 'pointer';
  
  button.addEventListener('click', () => {
    // Switch to overview mode
    overviewMode = true;
    controls.unlock();
    orbitControls.enabled = true;
    
    // Move camera to viewpoint
    camera.position.copy(viewpoint.position);
    orbitControls.target.copy(viewpoint.target);
    orbitControls.update();
    
    const instructions = document.getElementById('instructions');
    if (instructions) {
      instructions.classList.add('hidden');
    }
  });
  
  viewpointContainer.appendChild(button);
});

// Add debug info for collision detection
const debugInfo = document.createElement('div');
debugInfo.id = 'debug-info';
debugInfo.style.position = 'fixed';
debugInfo.style.bottom = '60px';
debugInfo.style.right = '20px';
debugInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
debugInfo.style.color = 'white';
debugInfo.style.padding = '10px';
debugInfo.style.borderRadius = '5px';
debugInfo.style.fontFamily = 'monospace';
debugInfo.style.fontSize = '12px';
debugInfo.style.zIndex = '1000';
document.body.appendChild(debugInfo);

// Add info button for instructions
const infoButton = document.createElement('button');
infoButton.innerHTML = 'ⓘ';
infoButton.style.position = 'fixed';
infoButton.style.top = '20px';
infoButton.style.left = '20px';
infoButton.style.width = '30px';
infoButton.style.height = '30px';
infoButton.style.borderRadius = '50%';
infoButton.style.backgroundColor = '#333';
infoButton.style.color = 'white';
infoButton.style.border = 'none';
infoButton.style.cursor = 'pointer';
infoButton.style.zIndex = '1000';
infoButton.style.fontSize = '16px';
infoButton.style.display = 'none'; // Hidden initially
document.body.appendChild(infoButton);

// Show/hide instructions
infoButton.addEventListener('click', () => {
  const instructions = document.getElementById('instructions');
  if (instructions) {
    instructions.style.display = instructions.style.display === 'none' ? 'block' : 'none';
  }
});

// Modify the existing movement handlers to hide instructions after first movement
function hideInstructionsOnMovement() {
  const instructions = document.getElementById('instructions');
  if (instructions && instructions.style.display !== 'none') {
    instructions.style.display = 'none';
    infoButton.style.display = 'block'; // Show the info button
  }
}

/**
 * Check for collisions with objects in the scene
 * @param {THREE.Vector3} position - The position to check
 * @param {number} radius - The radius of the player
 * @returns {Object} Collision information
 */
function checkCollisions(position, radius) {
  // Default result with no collision
  const result = {
    colliding: false,
    normal: new THREE.Vector3(),
    distance: Infinity
  };
  
  // Check floor collision box first
  const playerPosition = position.clone();
  const playerBottom = playerPosition.y - playerHeight / 2;
  
  if (playerBottom <= floorCollisionBox.max.y) {
    result.colliding = true;
    result.normal = new THREE.Vector3(0, 1, 0);
    result.distance = floorCollisionBox.max.y - playerBottom;
    return result;
  }
  
  // No collision objects yet
  if (!collisionObjects.length) return result;
  
  // Check each collision object
  for (const object of collisionObjects) {
    // Skip objects that are too far away (optimization)
    if (object.position && object.position.distanceTo(position) > 5) continue;
    
    // Get the object's world position and size
    const objectWorldPosition = new THREE.Vector3();
    if (object.getWorldPosition) {
      object.getWorldPosition(objectWorldPosition);
    } else {
      // If the object doesn't have getWorldPosition, use its position directly
      if (object.position) {
        objectWorldPosition.copy(object.position);
      } else {
        continue; // Skip objects without position
      }
    }
    
    // Get the object's bounding box
    let boundingBox;
    if (object.geometry) {
      if (!object.geometry.boundingBox) {
        object.geometry.computeBoundingBox();
      }
      boundingBox = object.geometry.boundingBox.clone();
      
      // Transform bounding box to world space
      boundingBox.min.add(objectWorldPosition);
      boundingBox.max.add(objectWorldPosition);
      
      // Expand bounding box by player radius
      boundingBox.expandByScalar(radius);
      
      // Check if position is inside the expanded bounding box
      if (boundingBox.containsPoint(position)) {
        // Calculate penetration depth and normal
        const center = new THREE.Vector3();
        boundingBox.getCenter(center);
        
        const size = new THREE.Vector3();
        boundingBox.getSize(size);
        
        const dx = (position.x - center.x) / size.x;
        const dy = (position.y - center.y) / size.y;
        const dz = (position.z - center.z) / size.z;
        
        // Find the axis with the smallest penetration
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        const absDz = Math.abs(dz);
        
        let normal = new THREE.Vector3();
        let distance = 0;
        
        if (absDx <= absDy && absDx <= absDz) {
          // X-axis has smallest penetration
          normal.set(Math.sign(dx), 0, 0);
          distance = (size.x / 2) - (absDx * size.x / 2);
        } else if (absDy <= absDx && absDy <= absDz) {
          // Y-axis has smallest penetration
          normal.set(0, Math.sign(dy), 0);
          distance = (size.y / 2) - (absDy * size.y / 2);
        } else {
          // Z-axis has smallest penetration
          normal.set(0, 0, Math.sign(dz));
          distance = (size.z / 2) - (absDz * size.z / 2);
        }
        
        // Update result if this collision is closer
        if (distance < result.distance) {
          result.colliding = true;
          result.normal = normal;
          result.distance = distance;
          result.object = object;
        }
      }
    }
  }
  
  return result;
}

/**
 * Check if the player is on the ground
 * @param {THREE.Vector3} position - The player's position
 * @returns {Object} Ground information
 */
function checkGround(position) {
  const result = {
    onGround: false,
    groundY: 0
  };
  
  // Cast a ray downward from the player's position
  raycaster.set(
    new THREE.Vector3(position.x, position.y, position.z),
    new THREE.Vector3(0, -1, 0)
  );
  
  const intersects = raycaster.intersectObjects(collisionObjects, true);
  
  if (intersects.length > 0 && intersects[0].distance < playerHeight * 0.5 + 0.1) {
    result.onGround = true;
    result.groundY = intersects[0].point.y;
    return result;
  }
  
  // Fallback: check if we're at or below floor level (y=0)
  if (position.y <= playerHeight) {
    result.onGround = true;
    result.groundY = 0;
  }
  
  return result;
}

// Animation loop
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  
  stats.begin();
  
  const delta = clock.getDelta();
  
  // Update controls based on mode
  if (overviewMode) {
    orbitControls.update();
  } else if (controls.isLocked) {
    // Store original position for collision detection
    const originalPosition = camera.position.clone();
    
    // Apply gravity and jumping
    if (isJumping) {
      // Apply jump velocity
      camera.position.y += jumpVelocity * delta;
      
      // Apply gravity to jump velocity
      jumpVelocity -= gravity * delta;
    }
    
    // Check if we're on the ground
    const groundCheck = checkGround(camera.position);
    
    // Update debug info
    debugInfo.innerHTML = `
      Position: ${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)}<br>
      Velocity: ${velocity.x.toFixed(2)}, ${jumpVelocity.toFixed(2)}, ${velocity.z.toFixed(2)}<br>
      On Ground: ${groundCheck.onGround}<br>
      Jumping: ${isJumping}<br>
      Can Jump: ${canJump}<br>
      Collision Objects: ${collisionObjects.length}
    `;
    
    // If we hit the ground while jumping
    if (isJumping && groundCheck.onGround && jumpVelocity <= 0) {
      isJumping = false;
      jumpVelocity = 0;
      camera.position.y = groundCheck.groundY + playerHeight;
      canJump = true;
    }
    
    // If we're not jumping but not on ground, start falling
    if (!isJumping && !groundCheck.onGround) {
      isJumping = true;
      jumpVelocity = 0; // Start with zero velocity (just falling)
      canJump = false;
    }
    
    // Enforce minimum height (emergency floor collision)
    if (camera.position.y < playerHeight) {
      camera.position.y = playerHeight;
      isJumping = false;
      jumpVelocity = 0;
      canJump = true;
    }
    
    // First-person movement code
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    
    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();
    
    if (moveForward || moveBackward) velocity.z -= direction.z * 20.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 20.0 * delta;
    
    // Move the player
    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);
    
    // Check for collisions after movement
    const collision = checkCollisions(camera.position, playerRadius);
    
    // If colliding, move the player back along the collision normal
    if (collision.colliding) {
      // Calculate the correction vector
      const correction = collision.normal.multiplyScalar(collision.distance + 0.01);
      
      // Apply the correction
      camera.position.add(correction);
      
      // If we hit a wall, zero out the velocity in that direction
      if (collision.normal.x !== 0) velocity.x = 0;
      if (collision.normal.z !== 0) velocity.z = 0;
    }
  }
  
  // Update minimap
  const minimapCanvas = document.getElementById('minimap-canvas');
  if (minimapCanvas) {
    const ctx = minimapCanvas.getContext('2d');
    ctx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);
    
    // Redraw the Commons layout
    drawCommonsLayout(ctx, minimapCanvas.width, minimapCanvas.height);
    
    // Draw MP positions
    if (mpMeshes.length > 0) {
      drawMPs(ctx, mpMeshes, minimapCanvas.width, minimapCanvas.height);
    }
    
    // Draw player position
    ctx.fillStyle = 'blue';
    ctx.beginPath();
    ctx.arc(
      (camera.position.x + 20) * (minimapCanvas.width / 40),
      (camera.position.z + 20) * (minimapCanvas.height / 40),
      5, 0, Math.PI * 2
    );
    ctx.fill();
    
    // Draw view direction
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(
      (camera.position.x + 20) * (minimapCanvas.width / 40),
      (camera.position.z + 20) * (minimapCanvas.height / 40)
    );
    ctx.lineTo(
      (camera.position.x + 20 + direction.x * 3) * (minimapCanvas.width / 40),
      (camera.position.z + 20 + direction.z * 3) * (minimapCanvas.height / 40)
    );
    ctx.stroke();
  }
  
  renderer.render(scene, camera);
  
  stats.end();
}

animate();