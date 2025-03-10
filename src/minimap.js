import * as THREE from 'three';

// Add this at the module level (top of file)
const mpPositions = new Map();

/**
 * Creates and initializes the minimap
 * @param {Array} mps - Array of MP objects
 * @param {THREE.Camera} camera - The main camera
 */
export function createMinimap(mps, camera) {
  const minimapCanvas = document.getElementById('minimap-canvas');
  if (!minimapCanvas) return;
  
  const ctx = minimapCanvas.getContext('2d');
  minimapCanvas.width = 200;
  minimapCanvas.height = 150;
  
  // Modified click handler
  minimapCanvas.addEventListener('click', (event) => {
    const rect = minimapCanvas.getBoundingClientRect();
    const scale = minimapContainer.style.transform === 'scale(1.5)' ? 1.5 : 1;
    
    // Adjust click coordinates based on scale
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;
    
    // Check if click is near any MP
    for (const [mp, pos] of mpPositions) {
      const dx = x - pos.x;
      const dy = y - pos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 5) { // Click radius of 5 pixels
        showMPInfo(mp.data);
        return;
      }
    }
    
    // If no MP clicked, handle regular minimap navigation
    const worldX = (x / minimapCanvas.width * 40) - 20;
    const worldZ = (y / minimapCanvas.height * 40) - 20;
    console.log(`Clicked on minimap at world position: (${worldX.toFixed(2)}, ${worldZ.toFixed(2)})`);
    drawClickMarker(ctx, x, y);
  });
  
  // Modify the drawMPs function to store positions
  function drawMPs(ctx, mps, width, height) {
    mpPositions.clear();
    
    mps.forEach(mp => {
      const position = mp.mesh.position;
      const x = (position.x + 20) * (width / 40);
      const y = (position.z + 20) * (height / 40);
      
      // Store MP position for click detection
      mpPositions.set(mp, { x, y });
      
      // Draw MP dot with party color
      let color = '#000000';
      if (mp.mesh.material && mp.mesh.material.color) {
        color = '#' + mp.mesh.material.color.getHexString();
      }
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Add hover effect
      minimapCanvas.addEventListener('mousemove', (event) => {
        const rect = minimapCanvas.getBoundingClientRect();
        const scale = minimapContainer.style.transform === 'scale(1.5)' ? 1.5 : 1;
        const mouseX = (event.clientX - rect.left) / scale;
        const mouseY = (event.clientY - rect.top) / scale;
        
        const dx = mouseX - x;
        const dy = mouseY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 5) {
          minimapCanvas.style.cursor = 'pointer';
          // Show MP name tooltip
          const tooltip = document.createElement('div');
          tooltip.textContent = mp.data.name;
          tooltip.style.position = 'absolute';
          tooltip.style.left = `${event.clientX + 10}px`;
          tooltip.style.top = `${event.clientY + 10}px`;
          tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
          tooltip.style.color = 'white';
          tooltip.style.padding = '5px';
          tooltip.style.borderRadius = '3px';
          tooltip.style.zIndex = '1001';
          document.body.appendChild(tooltip);
          
          // Remove tooltip when mouse moves away
          minimapCanvas.addEventListener('mouseout', () => {
            tooltip.remove();
            minimapCanvas.style.cursor = 'default';
          }, { once: true });
        }
      });
    });
  }
  
  // Initial draw
  drawCommonsLayout(ctx, minimapCanvas.width, minimapCanvas.height);
  drawMPs(ctx, mps, minimapCanvas.width, minimapCanvas.height);
  drawPlayer(ctx, camera, minimapCanvas.width, minimapCanvas.height);
}

/**
 * Draws the House of Commons layout on the minimap
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 */
export function drawCommonsLayout(ctx, width, height) {
  // Clear canvas
  ctx.fillStyle = '#333';
  ctx.fillRect(0, 0, width, height);
  
  // Draw the main chamber outline
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  // Main rectangular chamber
  const chamberWidth = width * 0.8;
  const chamberHeight = height * 0.7;
  const chamberX = (width - chamberWidth) / 2;
  const chamberY = (height - chamberHeight) / 2;
  
  ctx.rect(chamberX, chamberY, chamberWidth, chamberHeight);
  ctx.stroke();
  
  // Draw the central aisle
  ctx.strokeStyle = '#1b4d3e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(width / 2, chamberY);
  ctx.lineTo(width / 2, chamberY + chamberHeight);
  ctx.stroke();
  
  // Draw the red lines
  ctx.strokeStyle = '#cc0000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 10, chamberY);
  ctx.lineTo(width / 2 - 10, chamberY + chamberHeight);
  ctx.moveTo(width / 2 + 10, chamberY);
  ctx.lineTo(width / 2 + 10, chamberY + chamberHeight);
  ctx.stroke();
  
  // Draw the government benches (right side)
  ctx.fillStyle = 'rgba(228, 0, 59, 0.2)'; // Labour red with transparency
  ctx.beginPath();
  ctx.rect(width / 2 + 10, chamberY + 5, chamberWidth / 2 - 15, chamberHeight - 10);
  ctx.fill();
  
  // Draw the opposition benches (left side)
  ctx.fillStyle = 'rgba(0, 135, 220, 0.2)'; // Conservative blue with transparency
  ctx.beginPath();
  ctx.rect(chamberX + 5, chamberY + 5, chamberWidth / 2 - 15, chamberHeight - 10);
  ctx.fill();
  
  // Draw the Speaker's area
  ctx.fillStyle = '#777';
  ctx.beginPath();
  ctx.rect(width / 2 - 15, chamberY + chamberHeight - 20, 30, 15);
  ctx.fill();
  
  // Draw the Table of the House
  ctx.fillStyle = '#006400';
  ctx.beginPath();
  ctx.rect(width / 2 - 10, chamberY + chamberHeight / 2 - 15, 20, 30);
  ctx.fill();
  
  // Draw the Dispatch Boxes
  ctx.fillStyle = '#8B0000';
  ctx.beginPath();
  ctx.rect(width / 2 - 8, chamberY + chamberHeight / 2 + 20, 7, 5);
  ctx.rect(width / 2 + 1, chamberY + chamberHeight / 2 + 20, 7, 5);
  ctx.fill();
  
  // Draw the Clerks' table
  ctx.fillStyle = '#006400';
  ctx.beginPath();
  ctx.rect(width / 2 - 12, chamberY + chamberHeight - 35, 24, 10);
  ctx.fill();
  
  // Add labels
  ctx.fillStyle = 'white';
  ctx.font = '8px Arial';
  ctx.textAlign = 'center';
  
  // Party labels
  ctx.fillText('Government', width / 2 + chamberWidth / 4, chamberY - 2);
  ctx.fillText('Opposition', width / 2 - chamberWidth / 4, chamberY - 2);
  
  // Frontbench/Backbench labels
  ctx.font = '6px Arial';
  ctx.fillText('Frontbench', width / 2 + 20, chamberY + chamberHeight / 2);
  ctx.fillText('Backbench', width / 2 + chamberWidth / 4 + 10, chamberY + chamberHeight / 2);
  ctx.fillText('Frontbench', width / 2 - 20, chamberY + chamberHeight / 2);
  ctx.fillText('Backbench', width / 2 - chamberWidth / 4 - 10, chamberY + chamberHeight / 2);
  
  // Speaker label
  ctx.font = '7px Arial';
  ctx.fillText('Speaker', width / 2, chamberY + chamberHeight - 5);
}

/**
 * Draws the player position on the minimap
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {THREE.Camera} camera - The main camera
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 */
function drawPlayer(ctx, camera, width, height) {
  // Convert 3D world coordinates to minimap coordinates
  const x = (camera.position.x + 20) * (width / 40);
  const y = (camera.position.z + 20) * (height / 40);
  
  // Draw player position
  ctx.fillStyle = 'blue';
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw direction indicator
  const direction = new THREE.Vector3(0, 0, -1);
  direction.applyQuaternion(camera.quaternion);
  
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + direction.x * 10, y + direction.z * 10);
  ctx.stroke();
}

/**
 * Draws a marker at the clicked position on the minimap
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 */
function drawClickMarker(ctx, x, y) {
  // Draw a temporary marker
  ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.fill();
  
  // Fade out after 1 second
  setTimeout(() => {
    // Redraw the minimap (this will be handled by the animation loop)
  }, 1000);
}

// Add minimap styling
const minimapContainer = document.getElementById('minimap-container');
if (minimapContainer) {
  minimapContainer.style.transition = 'transform 0.3s ease';
  minimapContainer.addEventListener('mouseenter', () => {
    minimapContainer.style.transform = 'scale(1.5)';
    minimapContainer.style.transformOrigin = 'bottom left';
  });
  
  minimapContainer.addEventListener('mouseleave', () => {
    minimapContainer.style.transform = 'scale(1)';
  });
}

/**
 * Draws MP positions on the minimap
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array} mps - Array of MP objects
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 */
export function drawMPs(ctx, mps, width, height) {
  mpPositions.clear();
  
  mps.forEach(mp => {
    const position = mp.mesh.position;
    const x = (position.x + 20) * (width / 40);
    const y = (position.z + 20) * (height / 40);
    
    // Store MP position for click detection
    mpPositions.set(mp, { x, y });
    
    // Draw MP dot with party color
    let color = '#000000';
    if (mp.mesh.material && mp.mesh.material.color) {
      color = '#' + mp.mesh.material.color.getHexString();
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Add this new function to handle minimap interactions
export function initializeMinimapInteractions(minimapCanvas, showMPInfo) {
  if (!minimapCanvas) return;
  
  const minimapContainer = minimapCanvas.parentElement;
  
  // Add hover expansion
  if (minimapContainer) {
    minimapContainer.style.transition = 'transform 0.3s ease';
    minimapContainer.addEventListener('mouseenter', () => {
      minimapContainer.style.transform = 'scale(1.5)';
      minimapContainer.style.transformOrigin = 'bottom left';
    });
    
    minimapContainer.addEventListener('mouseleave', () => {
      minimapContainer.style.transform = 'scale(1)';
    });
  }
  
  // Handle clicks on MPs
  minimapCanvas.addEventListener('click', (event) => {
    const rect = minimapCanvas.getBoundingClientRect();
    const scale = minimapContainer.style.transform === 'scale(1.5)' ? 1.5 : 1;
    
    // Adjust click coordinates based on scale
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;
    
    // Check if click is near any MP
    for (const [mp, pos] of mpPositions) {
      const dx = x - pos.x;
      const dy = y - pos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 5) { // Click radius of 5 pixels
        showMPInfo(mp.data);
        return;
      }
    }
    
    // If no MP clicked, handle regular minimap navigation
    const worldX = (x / minimapCanvas.width * 40) - 20;
    const worldZ = (y / minimapCanvas.height * 40) - 20;
    console.log(`Clicked on minimap at world position: (${worldX.toFixed(2)}, ${worldZ.toFixed(2)})`);
    drawClickMarker(ctx, x, y);
  });
  
  // Add MP hover effects
  minimapCanvas.addEventListener('mousemove', (event) => {
    const rect = minimapCanvas.getBoundingClientRect();
    const scale = minimapContainer.style.transform === 'scale(1.5)' ? 1.5 : 1;
    const mouseX = (event.clientX - rect.left) / scale;
    const mouseY = (event.clientY - rect.top) / scale;
    
    let foundMP = false;
    
    for (const [mp, pos] of mpPositions) {
      const dx = mouseX - pos.x;
      const dy = mouseY - pos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 5) {
        minimapCanvas.style.cursor = 'pointer';
        foundMP = true;
        
        // Remove any existing tooltip
        const existingTooltip = document.getElementById('mp-tooltip');
        if (existingTooltip) existingTooltip.remove();
        
        // Show MP name tooltip
        const tooltip = document.createElement('div');
        tooltip.id = 'mp-tooltip';
        tooltip.textContent = mp.data.name;
        tooltip.style.position = 'absolute';
        tooltip.style.left = `${event.clientX + 10}px`;
        tooltip.style.top = `${event.clientY + 10}px`;
        tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        tooltip.style.color = 'white';
        tooltip.style.padding = '5px';
        tooltip.style.borderRadius = '3px';
        tooltip.style.zIndex = '1001';
        document.body.appendChild(tooltip);
        break;
      }
    }
    
    if (!foundMP) {
      minimapCanvas.style.cursor = 'default';
      const tooltip = document.getElementById('mp-tooltip');
      if (tooltip) tooltip.remove();
    }
  });
  
  // Remove tooltip when mouse leaves minimap
  minimapCanvas.addEventListener('mouseleave', () => {
    const tooltip = document.getElementById('mp-tooltip');
    if (tooltip) tooltip.remove();
    minimapCanvas.style.cursor = 'default';
  });
}

/**
 * Updates the minimap display
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array} mps - Array of MP objects
 * @param {THREE.Camera} camera - The main camera
 */
export function updateMinimap(ctx, mps, camera) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  // Clear and redraw base layout
  drawCommonsLayout(ctx, width, height);
  
  // Draw MPs
  drawMPs(ctx, mps, width, height);
  
  // Draw player position
  drawPlayer(ctx, camera, width, height);
} 