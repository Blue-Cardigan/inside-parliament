import * as THREE from 'three';

/**
 * Creates the House of Commons 3D environment
 * @param {THREE.Scene} scene - The Three.js scene
 * @returns {Promise<Array>} A promise that resolves with an array of collidable objects
 */
export function createHouseOfCommons(scene) {
  return new Promise((resolve) => {
    // Array to store collidable objects
    const collidableObjects = [];
    
    // Create the floor
    const floorGeometry = new THREE.PlaneGeometry(40, 40);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1b4d3e, // Dark green like the Commons carpet
      roughness: 0.8,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.userData.collidable = true;
    
    // Create a collision box for the floor
    const floorBox = new THREE.Box3();
    floorBox.setFromObject(floor);
    floor.geometry.boundingBox = floorBox;
    
    scene.add(floor);
    collidableObjects.push(floor);
    
    // Create walls
    const wallObjects = createWalls(scene);
    collidableObjects.push(...wallObjects);
    
    // Create the central aisle (the "floor of the house")
    createCentralAisle(scene);
    
    // Create tiered seating areas
    const seatingObjects = createTieredSeating(scene);
    collidableObjects.push(...seatingObjects);
    
    // Create the Speaker's area (raised platform)
    const speakerAreaObjects = createSpeakersArea(scene);
    if (speakerAreaObjects && speakerAreaObjects.length) {
      collidableObjects.push(...speakerAreaObjects);
    }
    
    // Create the Table of the House (central table)
    const tableObjects = createCentralTable(scene);
    collidableObjects.push(...tableObjects);
    
    // Create the Mace
    createMace(scene);
    
    // Create the Clerks' table
    const clerksTableObjects = createClerksTable(scene);
    collidableObjects.push(...clerksTableObjects);
    
    // Create the ceiling
    createCeiling(scene);
    
    // Create decorative elements
    createDecorativeElements(scene);
    
    // Create party areas markers
    createPartyAreaMarkers(scene);
    
    resolve(collidableObjects);
  });
}

/**
 * Creates the walls of the House of Commons
 * @param {THREE.Scene} scene - The Three.js scene
 * @returns {Array} Array of collidable wall objects
 */
function createWalls(scene) {
  const collidableObjects = [];
  
  // Wall material with wood texture
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x5c4033, // Brown wood color
    roughness: 0.7,
    metalness: 0.2
  });
  
  // Back wall (behind the Speaker's chair)
  const backWallGeometry = new THREE.BoxGeometry(30, 10, 0.5);
  const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
  backWall.position.set(0, 5, -15);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  backWall.userData.collidable = true;
  scene.add(backWall);
  collidableObjects.push(backWall);
  
  // Front wall (entrance)
  const frontWallGeometry = new THREE.BoxGeometry(30, 10, 0.5);
  const frontWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
  frontWall.position.set(0, 5, 15);
  frontWall.castShadow = true;
  frontWall.receiveShadow = true;
  frontWall.userData.collidable = true;
  scene.add(frontWall);
  collidableObjects.push(frontWall);
  
  // Left wall
  const leftWallGeometry = new THREE.BoxGeometry(0.5, 10, 30);
  const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
  leftWall.position.set(-15, 5, 0);
  leftWall.castShadow = true;
  leftWall.receiveShadow = true;
  leftWall.userData.collidable = true;
  scene.add(leftWall);
  collidableObjects.push(leftWall);
  
  // Right wall
  const rightWallGeometry = new THREE.BoxGeometry(0.5, 10, 30);
  const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
  rightWall.position.set(15, 5, 0);
  rightWall.castShadow = true;
  rightWall.receiveShadow = true;
  rightWall.userData.collidable = true;
  scene.add(rightWall);
  collidableObjects.push(rightWall);
  
  // Add paneling to the walls
  addWoodPaneling(scene);
  
  // Add windows to the walls
  addWindows(scene);
  
  return collidableObjects;
}

/**
 * Adds wood paneling to the walls
 * @param {THREE.Scene} scene - The Three.js scene
 */
function addWoodPaneling(scene) {
  const panelingMaterial = new THREE.MeshStandardMaterial({
    color: 0x8B4513, // Darker wood color
    roughness: 0.6,
    metalness: 0.3
  });
  
  // Add paneling to all walls
  const walls = [
    { pos: [0, 2.5, -14.7], rot: [0, 0, 0], size: [29, 5, 0.1] }, // Back wall
    { pos: [0, 2.5, 14.7], rot: [0, 0, 0], size: [29, 5, 0.1] },  // Front wall
    { pos: [-14.7, 2.5, 0], rot: [0, Math.PI/2, 0], size: [29, 5, 0.1] }, // Left wall
    { pos: [14.7, 2.5, 0], rot: [0, Math.PI/2, 0], size: [29, 5, 0.1] }   // Right wall
  ];
  
  walls.forEach(wall => {
    const paneling = new THREE.Mesh(
      new THREE.BoxGeometry(wall.size[0], wall.size[1], wall.size[2]),
      panelingMaterial
    );
    paneling.position.set(wall.pos[0], wall.pos[1], wall.pos[2]);
    paneling.rotation.set(wall.rot[0], wall.rot[1], wall.rot[2]);
    paneling.receiveShadow = true;
    scene.add(paneling);
  });
}

/**
 * Adds windows to the walls
 * @param {THREE.Scene} scene - The Three.js scene
 */
function addWindows(scene) {
  const windowMaterial = new THREE.MeshStandardMaterial({
    color: 0xadd8e6, // Light blue
    transparent: true,
    opacity: 0.7,
    roughness: 0.1,
    metalness: 0.9
  });
  
  // Add stained glass windows to the upper parts of walls
  const windowPositions = [
    // Left wall windows
    { pos: [-14.7, 7, -10], rot: [0, Math.PI/2, 0] },
    { pos: [-14.7, 7, -5], rot: [0, Math.PI/2, 0] },
    { pos: [-14.7, 7, 0], rot: [0, Math.PI/2, 0] },
    { pos: [-14.7, 7, 5], rot: [0, Math.PI/2, 0] },
    { pos: [-14.7, 7, 10], rot: [0, Math.PI/2, 0] },
    
    // Right wall windows
    { pos: [14.7, 7, -10], rot: [0, -Math.PI/2, 0] },
    { pos: [14.7, 7, -5], rot: [0, -Math.PI/2, 0] },
    { pos: [14.7, 7, 0], rot: [0, -Math.PI/2, 0] },
    { pos: [14.7, 7, 5], rot: [0, -Math.PI/2, 0] },
    { pos: [14.7, 7, 10], rot: [0, -Math.PI/2, 0] }
  ];
  
  windowPositions.forEach(window => {
    const windowGeometry = new THREE.PlaneGeometry(3, 2);
    const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
    windowMesh.position.set(window.pos[0], window.pos[1], window.pos[2]);
    windowMesh.rotation.set(window.rot[0], window.rot[1], window.rot[2]);
    
    // Add window frame
    const frameGeometry = new THREE.BoxGeometry(3.2, 2.2, 0.1);
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513, // Dark wood
      roughness: 0.7,
      metalness: 0.2
    });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.copy(windowMesh.position);
    frame.rotation.copy(windowMesh.rotation);
    
    scene.add(windowMesh);
    scene.add(frame);
  });
}

/**
 * Creates the central aisle of the House
 * @param {THREE.Scene} scene - The Three.js scene
 */
function createCentralAisle(scene) {
  const aisleGeometry = new THREE.PlaneGeometry(4, 20);
  const aisleMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x1b4d3e, // Dark green like the Commons carpet
    roughness: 0.8,
    metalness: 0.2
  });
  const aisle = new THREE.Mesh(aisleGeometry, aisleMaterial);
  aisle.rotation.x = -Math.PI / 2;
  aisle.position.set(0, 0.01, 0); // Slightly above the main floor to avoid z-fighting
  aisle.receiveShadow = true;
  scene.add(aisle);
  
  // Add the red lines that MPs must not cross
  const redLineGeometry = new THREE.PlaneGeometry(0.1, 20);
  const redLineMaterial = new THREE.MeshBasicMaterial({ color: 0xcc0000 });
  
  // Left red line
  const leftRedLine = new THREE.Mesh(redLineGeometry, redLineMaterial);
  leftRedLine.rotation.x = -Math.PI / 2;
  leftRedLine.position.set(-2, 0.02, 0);
  scene.add(leftRedLine);
  
  // Right red line
  const rightRedLine = new THREE.Mesh(redLineGeometry, redLineMaterial);
  rightRedLine.rotation.x = -Math.PI / 2;
  rightRedLine.position.set(2, 0.02, 0);
  scene.add(rightRedLine);
}

/**
 * Creates tiered seating areas for MPs
 * @param {THREE.Scene} scene - The Three.js scene
 */
function createTieredSeating(scene) {
  const collidableObjects = [];
  
  // Materials
  const benchMaterial = new THREE.MeshStandardMaterial({
    color: 0x1b4d3e, // Dark green like the Commons benches
    roughness: 0.9,
    metalness: 0.1
  });
  
  const stepMaterial = new THREE.MeshStandardMaterial({
    color: 0x8B4513, // Dark wood
    roughness: 0.7,
    metalness: 0.2
  });
  
  // Create government side (right side) - ~330 seats
  const govSeats = createTieredSide(scene, 1, benchMaterial, stepMaterial, 330);
  collidableObjects.push(...govSeats);
  
  // Create opposition side (left side) - ~320 seats
  const oppSeats = createTieredSide(scene, -1, benchMaterial, stepMaterial, 320);
  collidableObjects.push(...oppSeats);
  
  return collidableObjects;
}

/**
 * Creates one side of tiered seating
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {number} side - 1 for right (government), -1 for left (opposition)
 * @param {THREE.Material} benchMaterial - Material for benches
 * @param {THREE.Material} stepMaterial - Material for steps
 * @param {number} seatCount - Number of seats on this side
 */
function createTieredSide(scene, side, benchMaterial, stepMaterial, seatCount) {
  const collidableObjects = [];
  
  // Create 8 tiers of seating (increased from 5)
  for (let tier = 0; tier < 8; tier++) {
    // Position variables
    const xBase = side * (3 + tier * 1.5); // Reduced spacing between tiers
    const yBase = tier * 0.25; // Lower height increment
    const zStart = -13;
    const zEnd = 13;
    const benchLength = 2.5; // Shorter bench segments
    
    // Create the tier platform
    const tierGeometry = new THREE.BoxGeometry(2.5, 0.2, zEnd - zStart);
    const tierMesh = new THREE.Mesh(tierGeometry, stepMaterial);
    tierMesh.position.set(xBase, yBase, (zStart + zEnd) / 2);
    tierMesh.receiveShadow = true;
    tierMesh.castShadow = true;
    tierMesh.userData.collidable = true;
    scene.add(tierMesh);
    collidableObjects.push(tierMesh);
    
    // Calculate seats per row based on remaining seats and tiers
    const seatsPerRow = Math.ceil(seatCount / (8 * Math.floor((zEnd - zStart) / (benchLength + 0.2))));
    
    // Create benches on this tier
    for (let z = zStart + 1; z < zEnd - 1; z += benchLength + 0.2) {
      // Skip the area near the dispatch boxes for the front bench
      if (tier === 0 && z > -3 && z < 3) continue;
      
      // Create bench seat
      const benchGeometry = new THREE.BoxGeometry(1.5, 0.1, benchLength);
      const bench = new THREE.Mesh(benchGeometry, benchMaterial);
      bench.position.set(xBase, yBase + 0.5, z + benchLength/2);
      bench.castShadow = true;
      bench.receiveShadow = true;
      bench.userData.collidable = true;
      scene.add(bench);
      collidableObjects.push(bench);
      
      // Create individual seat markers and collision boxes
      for (let seat = 0; seat < seatsPerRow; seat++) {
        const seatWidth = benchLength / seatsPerRow;
        const seatPos = z + seatWidth/2 + (seat * seatWidth);
        
        // Seat collision box
        const seatCollision = new THREE.Mesh(
          new THREE.BoxGeometry(1.5, 1.2, seatWidth),
          new THREE.MeshBasicMaterial({ visible: false })
        );
        seatCollision.position.set(xBase, yBase + 1.1, seatPos);
        seatCollision.userData.collidable = true;
        seatCollision.userData.isSeat = true;
        seatCollision.userData.seatInfo = {
          tier,
          row: Math.floor((z - zStart) / (benchLength + 0.2)),
          seat,
          side: side === 1 ? 'government' : 'opposition'
        };
        scene.add(seatCollision);
        collidableObjects.push(seatCollision);
      }
      
      // Create bench back
      const backGeometry = new THREE.BoxGeometry(0.2, 0.8, benchLength);
      const back = new THREE.Mesh(backGeometry, benchMaterial);
      back.position.set(xBase + (side * 0.65), yBase + 0.9, z + benchLength/2);
      back.castShadow = true;
      back.receiveShadow = true;
      back.userData.collidable = true;
      scene.add(back);
      collidableObjects.push(back);
      
      // Add armrests at bench divisions
      const armGeometry = new THREE.BoxGeometry(1.5, 0.3, 0.1);
      
      // Front armrest
      const frontArm = new THREE.Mesh(armGeometry, benchMaterial);
      frontArm.position.set(xBase, yBase + 0.6, z);
      frontArm.castShadow = true;
      frontArm.receiveShadow = true;
      frontArm.userData.collidable = true;
      scene.add(frontArm);
      collidableObjects.push(frontArm);
      
      // Back armrest
      const backArm = new THREE.Mesh(armGeometry, benchMaterial);
      backArm.position.set(xBase, yBase + 0.6, z + benchLength);
      backArm.castShadow = true;
      backArm.receiveShadow = true;
      backArm.userData.collidable = true;
      scene.add(backArm);
      collidableObjects.push(backArm);
    }
  }
  
  return collidableObjects;
}

/**
 * Creates the Speaker's area
 * @param {THREE.Scene} scene - The Three.js scene
 */
function createSpeakersArea(scene) {
  const collidableObjects = [];
  
  // Create raised platform for Speaker
  const platformGeometry = new THREE.BoxGeometry(8, 0.5, 6);
  const platformMaterial = new THREE.MeshStandardMaterial({
    color: 0x8B4513, // Dark wood
    roughness: 0.7,
    metalness: 0.2
  });
  const platform = new THREE.Mesh(platformGeometry, platformMaterial);
  platform.position.set(0, 0.25, -12);
  platform.receiveShadow = true;
  platform.userData.collidable = true;
  scene.add(platform);
  collidableObjects.push(platform);
  
  // Add steps to the platform
  const stepGeometry = new THREE.BoxGeometry(4, 0.2, 1);
  
  for (let i = 0; i < 3; i++) {
    const step = new THREE.Mesh(stepGeometry, platformMaterial);
    step.position.set(0, 0.1 + (i * 0.2), -9 - (i * 1));
    step.receiveShadow = true;
    scene.add(step);
  }
  
  // Create Speaker's chair
  createSpeakersChair(scene);
  
  // Create clerks' seats
  const clerkSeatGeometry = new THREE.BoxGeometry(1.5, 0.1, 1);
  const clerkSeatMaterial = new THREE.MeshStandardMaterial({
    color: 0x006400, // Dark green
    roughness: 0.9,
    metalness: 0.1
  });
  
  // Left clerk seat
  const leftClerkSeat = new THREE.Mesh(clerkSeatGeometry, clerkSeatMaterial);
  leftClerkSeat.position.set(-2, 0.8, -12);
  leftClerkSeat.castShadow = true;
  leftClerkSeat.receiveShadow = true;
  scene.add(leftClerkSeat);
  
  // Right clerk seat
  const rightClerkSeat = new THREE.Mesh(clerkSeatGeometry, clerkSeatMaterial);
  rightClerkSeat.position.set(2, 0.8, -12);
  rightClerkSeat.castShadow = true;
  rightClerkSeat.receiveShadow = true;
  scene.add(rightClerkSeat);
  
  return collidableObjects;
}

/**
 * Creates the Speaker's chair
 * @param {THREE.Scene} scene - The Three.js scene
 */
function createSpeakersChair(scene) {
  // Chair base
  const baseGeometry = new THREE.BoxGeometry(3, 0.5, 2);
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0x8B4513, // Saddle brown
    roughness: 0.7,
    metalness: 0.3
  });
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.set(0, 0.75, -13);
  base.castShadow = true;
  base.receiveShadow = true;
  scene.add(base);
  
  // Chair back (with ornate design)
  const backGeometry = new THREE.BoxGeometry(3, 4, 0.5);
  const backMaterial = new THREE.MeshStandardMaterial({
    color: 0x8B4513, // Saddle brown
    roughness: 0.7,
    metalness: 0.3
  });
  const back = new THREE.Mesh(backGeometry, backMaterial);
  back.position.set(0, 3, -13.75);
  back.castShadow = true;
  back.receiveShadow = true;
  scene.add(back);
  
  // Add ornate top to the chair
  const topGeometry = new THREE.BoxGeometry(3.5, 1, 0.1);
  const topMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFD700, // Gold
    roughness: 0.3,
    metalness: 0.8
  });
  const top = new THREE.Mesh(topGeometry, topMaterial);
  top.position.set(0, 5.5, -13.75);
  top.castShadow = true;
  scene.add(top);
  
  // Chair seat
  const seatGeometry = new THREE.BoxGeometry(2.5, 0.3, 1.5);
  const seatMaterial = new THREE.MeshStandardMaterial({
    color: 0x006400, // Dark green
    roughness: 0.9,
    metalness: 0.1
  });
  const seat = new THREE.Mesh(seatGeometry, seatMaterial);
  seat.position.set(0, 1.3, -13);
  seat.castShadow = true;
  seat.receiveShadow = true;
  scene.add(seat);
  
  // Chair arms
  const armGeometry = new THREE.BoxGeometry(0.3, 1, 1.5);
  const armMaterial = new THREE.MeshStandardMaterial({
    color: 0x8B4513, // Saddle brown
    roughness: 0.7,
    metalness: 0.3
  });
  
  const leftArm = new THREE.Mesh(armGeometry, armMaterial);
  leftArm.position.set(-1.4, 1.8, -13);
  leftArm.castShadow = true;
  leftArm.receiveShadow = true;
  scene.add(leftArm);
  
  const rightArm = new THREE.Mesh(armGeometry, armMaterial);
  rightArm.position.set(1.4, 1.8, -13);
  rightArm.castShadow = true;
  rightArm.receiveShadow = true;
  scene.add(rightArm);
  
  // Add a canopy above the Speaker's chair
  const canopyGeometry = new THREE.BoxGeometry(4, 0.2, 3);
  const canopyMaterial = new THREE.MeshStandardMaterial({
    color: 0x8B4513, // Dark wood
    roughness: 0.7,
    metalness: 0.3
  });
  const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
  canopy.position.set(0, 6, -13);
  canopy.castShadow = true;
  scene.add(canopy);
  
  // Add decorative posts for the canopy
  const postGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
  const postMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFD700, // Gold
    roughness: 0.3,
    metalness: 0.8
  });
  
  const postPositions = [
    [-1.9, -11.5], [1.9, -11.5], [-1.9, -14.5], [1.9, -14.5]
  ];
  
  postPositions.forEach(pos => {
    const post = new THREE.Mesh(postGeometry, postMaterial);
    post.position.set(pos[0], 5, pos[1]);
    post.castShadow = true;
    scene.add(post);
  });
}

/**
 * Creates the central table
 * @param {THREE.Scene} scene - The Three.js scene
 * @returns {Array} Array of collidable table objects
 */
function createCentralTable(scene) {
  const collidableObjects = [];

  // Table top
  const tableGeometry = new THREE.BoxGeometry(4, 0.2, 8);
  const tableMaterial = new THREE.MeshStandardMaterial({
    color: 0x006400, // Dark green
    roughness: 0.9,
    metalness: 0.1
  });
  const table = new THREE.Mesh(tableGeometry, tableMaterial);
  table.position.set(0, 0.6, -5);
  table.castShadow = true;
  table.receiveShadow = true;
  table.userData.collidable = true;
  scene.add(table);
  collidableObjects.push(table);
  
  // Table legs
  const legGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.2);
  const legMaterial = new THREE.MeshStandardMaterial({
    color: 0x8B4513, // Saddle brown
    roughness: 0.7,
    metalness: 0.3
  });
  
  // Create four legs
  const positions = [
    [1.8, -8.9], [1.8, -1.1], [-1.8, -8.9], [-1.8, -1.1]
  ];
  
  positions.forEach(pos => {
    const leg = new THREE.Mesh(legGeometry, legMaterial);
    leg.position.set(pos[0], 0.3, pos[1]);
    leg.castShadow = true;
    leg.receiveShadow = true;
    leg.userData.collidable = true;
    scene.add(leg);
    collidableObjects.push(leg);
  });
  
  // Add books and papers on the table
  addTableItems(scene);
  
  return collidableObjects;
}

/**
 * Adds items to the central table
 * @param {THREE.Scene} scene - The Three.js scene
 */
function addTableItems(scene) {
  // Add books
  const bookGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.8);
  const bookMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x8B0000 }), // Dark red
    new THREE.MeshStandardMaterial({ color: 0x000080 }), // Navy blue
    new THREE.MeshStandardMaterial({ color: 0x006400 })  // Dark green
  ];
  
  // Stack of books positions
  const bookPositions = [
    { pos: [-1.5, 0.85, -7], rot: [0, 0.2, 0] },
    { pos: [-1.5, 1.15, -7], rot: [0, -0.1, 0] },
    { pos: [1.5, 0.85, -3], rot: [0, -0.3, 0] }
  ];
  
  bookPositions.forEach((pos, i) => {
    const book = new THREE.Mesh(bookGeometry, bookMaterials[i % bookMaterials.length]);
    book.position.set(pos.pos[0], pos.pos[1], pos.pos[2]);
    book.rotation.set(pos.rot[0], pos.rot[1], pos.rot[2]);
    book.castShadow = true;
    scene.add(book);
  });
  
  // Add papers
  const paperGeometry = new THREE.BoxGeometry(1, 0.02, 1.4);
  const paperMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFFAF0, // Floral white
    roughness: 0.9,
    metalness: 0.1
  });
  
  // Paper positions
  const paperPositions = [
    { pos: [0, 0.71, -4], rot: [0, 0.1, 0] },
    { pos: [1, 0.72, -6], rot: [0, -0.2, 0] },
    { pos: [-1, 0.73, -3], rot: [0, 0.3, 0] }
  ];
  
  paperPositions.forEach(pos => {
    const paper = new THREE.Mesh(paperGeometry, paperMaterial);
    paper.position.set(pos.pos[0], pos.pos[1], pos.pos[2]);
    paper.rotation.set(pos.rot[0], pos.rot[1], pos.rot[2]);
    paper.castShadow = true;
    scene.add(paper);
  });
}
// 

/**
 * Creates the Mace
 * @param {THREE.Scene} scene - The Three.js scene
 */
function createMace(scene) {
  // Mace body
  const maceBodyGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 16);
  const maceMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFD700, // Gold
    roughness: 0.3,
    metalness: 0.8
  });
  const maceBody = new THREE.Mesh(maceBodyGeometry, maceMaterial);
  maceBody.position.set(0, 0.9, -3);
  maceBody.rotation.x = Math.PI / 2;
  maceBody.castShadow = true;
  scene.add(maceBody);
  
  // Mace head
  const maceHeadGeometry = new THREE.SphereGeometry(0.15, 16, 16);
  const maceHead = new THREE.Mesh(maceHeadGeometry, maceMaterial);
  maceHead.position.set(0, 0.9, -4);
  maceHead.castShadow = true;
  scene.add(maceHead);
  
  // Mace crown
  const crownGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.2, 8);
  const crown = new THREE.Mesh(crownGeometry, maceMaterial);
  crown.position.set(0, 0.9, -4.2);
  crown.rotation.x = Math.PI / 2;
  crown.castShadow = true;
  scene.add(crown);
  
  // Mace decorative elements
  const decorGeometry = new THREE.TorusGeometry(0.08, 0.02, 8, 16);
  
  // Add decorative rings along the mace
  for (let i = 0; i < 4; i++) {
    const decor = new THREE.Mesh(decorGeometry, maceMaterial);
    decor.position.set(0, 0.9, -3 + (i * 0.4) - 0.8);
    decor.rotation.x = Math.PI / 2;
    decor.castShadow = true;
    scene.add(decor);
  }
}

/**
 * Creates the Clerks' table
 * @param {THREE.Scene} scene - The Three.js scene
 * @returns {Array} Array of collidable clerks' table objects
 */
function createClerksTable(scene) {
  const collidableObjects = [];

  // Table top
  const tableGeometry = new THREE.BoxGeometry(5, 0.1, 2);
  const tableMaterial = new THREE.MeshStandardMaterial({
    color: 0x006400, // Dark green
    roughness: 0.9,
    metalness: 0.1
  });
  const table = new THREE.Mesh(tableGeometry, tableMaterial);
  table.position.set(0, 0.7, -8);
  table.castShadow = true;
  table.receiveShadow = true;
  table.userData.collidable = true;
  scene.add(table);
  collidableObjects.push(table);
  
  // Table legs
  const legGeometry = new THREE.BoxGeometry(0.1, 0.7, 0.1);
  const legMaterial = new THREE.MeshStandardMaterial({
    color: 0x8B4513, // Dark wood
    roughness: 0.7,
    metalness: 0.3
  });
  
  // Create four legs
  const positions = [
    [2.4, -9], [2.4, -7], [-2.4, -9], [-2.4, -7]
  ];
  
  positions.forEach(pos => {
    const leg = new THREE.Mesh(legGeometry, legMaterial);
    leg.position.set(pos[0], 0.35, pos[1]);
    leg.castShadow = true;
    leg.receiveShadow = true;
    leg.userData.collidable = true;
    scene.add(leg);
    collidableObjects.push(leg);
  });
  
  return collidableObjects;
}

/**
 * Creates the ceiling
 * @param {THREE.Scene} scene - The Three.js scene
 */
function createCeiling(scene) {
  // Main ceiling
  const ceilingGeometry = new THREE.PlaneGeometry(30, 30);
  const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: 0xF5F5DC, // Beige
    side: THREE.DoubleSide,
    roughness: 0.9,
    metalness: 0.1
  });
  const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 10, 0);
  ceiling.receiveShadow = true;
  scene.add(ceiling);
  
  // Add decorative ceiling beams
  const beamGeometry = new THREE.BoxGeometry(30, 0.3, 0.5);
  const beamMaterial = new THREE.MeshStandardMaterial({
    color: 0x8B4513, // Dark wood
    roughness: 0.7,
    metalness: 0.3
  });
  
  // Add beams across the width
  for (let z = -12; z <= 12; z += 6) {
    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.set(0, 9.8, z);
    beam.castShadow = true;
    scene.add(beam);
  }
  
  // Add beams along the length
  const longBeamGeometry = new THREE.BoxGeometry(0.5, 0.3, 30);
  for (let x = -12; x <= 12; x += 6) {
    const beam = new THREE.Mesh(longBeamGeometry, beamMaterial);
    beam.position.set(x, 9.8, 0);
    beam.castShadow = true;
    scene.add(beam);
  }
  
  // Add chandeliers
  addChandeliers(scene);
}

/**
 * Adds chandeliers to the ceiling
 * @param {THREE.Scene} scene - The Three.js scene
 */
function addChandeliers(scene) {
  // Chandelier positions
  const chandelierPositions = [
    { x: -8, z: -8 },
    { x: 8, z: -8 },
    { x: -8, z: 8 },
    { x: 8, z: 8 },
    { x: 0, z: 0 }
  ];
  
  chandelierPositions.forEach(pos => {
    createChandelier(scene, pos.x, pos.z);
  });
}

/**
 * Creates a chandelier
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {number} x - X position
 * @param {number} z - Z position
 */
function createChandelier(scene, x, z) {
  // Chandelier base
  const baseGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 16);
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFD700, // Gold
    roughness: 0.3,
    metalness: 0.8
  });
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.set(x, 9.5, z);
  base.castShadow = true;
  scene.add(base);
  
  // Chandelier chain
  const chainGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
  const chain = new THREE.Mesh(chainGeometry, baseMaterial);
  chain.position.set(x, 9, z);
  chain.castShadow = true;
  scene.add(chain);
  
  // Chandelier body
  const bodyGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
  const body = new THREE.Mesh(bodyGeometry, baseMaterial);
  body.position.set(x, 8.5, z);
  body.castShadow = true;
  scene.add(body);
  
  // Add light
  const light = new THREE.PointLight(0xFFFFCC, 0.8, 15);
  light.position.set(x, 8.5, z);
  light.castShadow = true;
  light.shadow.mapSize.width = 512;
  light.shadow.mapSize.height = 512;
  scene.add(light);
  
  // Add light bulbs
  const bulbGeometry = new THREE.SphereGeometry(0.1, 16, 16);
  const bulbMaterial = new THREE.MeshBasicMaterial({
    color: 0xFFFFCC,
    transparent: true,
    opacity: 0.9
  });
  
  // Add multiple bulbs around the chandelier
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
    bulb.position.set(
      x + Math.cos(angle) * 0.3,
      8.4,
      z + Math.sin(angle) * 0.3
    );
    scene.add(bulb);
  }
}

/**
 * Creates decorative elements
 * @param {THREE.Scene} scene - The Three.js scene
 */
function createDecorativeElements(scene) {
  // Add coat of arms above the Speaker's chair
  const coatGeometry = new THREE.BoxGeometry(2, 2, 0.1);
  const coatMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFD700, // Gold
    roughness: 0.3,
    metalness: 0.8
  });
  const coat = new THREE.Mesh(coatGeometry, coatMaterial);
  coat.position.set(0, 7, -14.7);
  coat.castShadow = true;
  scene.add(coat);
  
  // Add decorative pillars
  const pillarGeometry = new THREE.CylinderGeometry(0.3, 0.3, 10, 16);
  const pillarMaterial = new THREE.MeshStandardMaterial({
    color: 0xF5F5DC, // Beige
    roughness: 0.7,
    metalness: 0.2
  });
  
  // Add pillars at corners and along walls
  const pillarPositions = [
    [-14, 0, -14], [14, 0, -14], [-14, 0, 14], [14, 0, 14],
    [-14, 0, 0], [14, 0, 0], [0, 0, -14], [0, 0, 14]
  ];
  
  pillarPositions.forEach(pos => {
    const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    pillar.position.set(pos[0], 5, pos[1]);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    scene.add(pillar);
  });
  
  // Add decorative arches between pillars
  addDecorativeArches(scene);
  
  // Add portraits of former Speakers
  addPortraits(scene);
}

/**
 * Adds decorative arches between pillars
 * @param {THREE.Scene} scene - The Three.js scene
 */
function addDecorativeArches(scene) {
  const archMaterial = new THREE.MeshStandardMaterial({
    color: 0xF5F5DC, // Beige
    roughness: 0.7,
    metalness: 0.2
  });
  
  // Add arches along the walls
  const archPositions = [
    // Back wall
    { start: [-14, 0, -14], end: [0, 0, -14] },
    { start: [0, 0, -14], end: [14, 0, -14] },
    // Front wall
    { start: [-14, 0, 14], end: [0, 0, 14] },
    { start: [0, 0, 14], end: [14, 0, 14] },
    // Left wall
    { start: [-14, 0, -14], end: [-14, 0, 0] },
    { start: [-14, 0, 0], end: [-14, 0, 14] },
    // Right wall
    { start: [14, 0, -14], end: [14, 0, 0] },
    { start: [14, 0, 0], end: [14, 0, 14] }
  ];
  
  archPositions.forEach(pos => {
    createArch(
      scene,
      new THREE.Vector3(pos.start[0], pos.start[1], pos.start[2]),
      new THREE.Vector3(pos.end[0], pos.end[1], pos.end[2]),
      archMaterial
    );
  });
}

/**
 * Creates an arch between two points
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {THREE.Vector3} start - Start position
 * @param {THREE.Vector3} end - End position
 * @param {THREE.Material} material - Material for the arch
 */
function createArch(scene, start, end, material) {
  const distance = start.distanceTo(end);
  const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  midPoint.y += 3; // Arch height
  
  // Create a curved path for the arch
  const curve = new THREE.QuadraticBezierCurve3(
    start.clone().setY(8), // Raise to pillar top
    midPoint.clone().setY(9.5), // Peak of the arch
    end.clone().setY(8) // Raise to pillar top
  );
  
  // Create geometry from the curve
  const points = curve.getPoints(10);
  const archGeometry = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points),
    12, // tubular segments
    0.2, // radius
    8, // radial segments
    false // closed
  );
  
  const arch = new THREE.Mesh(archGeometry, material);
  arch.castShadow = true;
  scene.add(arch);
}

/**
 * Adds portraits of former Speakers
 * @param {THREE.Scene} scene - The Three.js scene
 */
function addPortraits(scene) {
  const frameGeometry = new THREE.BoxGeometry(1.5, 2, 0.1);
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x8B4513, // Dark wood
    roughness: 0.7,
    metalness: 0.3
  });
  
  const portraitMaterial = new THREE.MeshStandardMaterial({
    color: 0xDDDDDD, // Light grey for portrait
    roughness: 0.9,
    metalness: 0.1
  });
  
  // Portrait positions along the walls
  const portraitPositions = [
    // Left wall
    { pos: [-14.4, 5, -10], rot: [0, Math.PI/2, 0] },
    { pos: [-14.4, 5, -5], rot: [0, Math.PI/2, 0] },
    { pos: [-14.4, 5, 5], rot: [0, Math.PI/2, 0] },
    { pos: [-14.4, 5, 10], rot: [0, Math.PI/2, 0] },
    
    // Right wall
    { pos: [14.4, 5, -10], rot: [0, -Math.PI/2, 0] },
    { pos: [14.4, 5, -5], rot: [0, -Math.PI/2, 0] },
    { pos: [14.4, 5, 5], rot: [0, -Math.PI/2, 0] },
    { pos: [14.4, 5, 10], rot: [0, -Math.PI/2, 0] },
    
    // Back wall
    { pos: [-10, 5, -14.4], rot: [0, 0, 0] },
    { pos: [-5, 5, -14.4], rot: [0, 0, 0] },
    { pos: [5, 5, -14.4], rot: [0, 0, 0] },
    { pos: [10, 5, -14.4], rot: [0, 0, 0] }
  ];
  
  portraitPositions.forEach(pos => {
    // Create frame
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(pos.pos[0], pos.pos[1], pos.pos[2]);
    frame.rotation.set(pos.rot[0], pos.rot[1], pos.rot[2]);
    frame.castShadow = true;
    scene.add(frame);
    
    // Create portrait inside frame
    const portraitGeometry = new THREE.PlaneGeometry(1.3, 1.8);
    const portrait = new THREE.Mesh(portraitGeometry, portraitMaterial);
    portrait.position.copy(frame.position);
    portrait.position.z += pos.rot[1] === 0 ? 0.06 : 0;
    portrait.position.x += pos.rot[1] === Math.PI/2 ? 0.06 : (pos.rot[1] === -Math.PI/2 ? -0.06 : 0);
    portrait.rotation.copy(frame.rotation);
    scene.add(portrait);
  });
}

/**
 * Creates markers for party areas
 * @param {THREE.Scene} scene - The Three.js scene
 */
function createPartyAreaMarkers(scene) {
  // Create subtle floor markers for different party areas
  
  // Government side (right)
  const govAreaGeometry = new THREE.PlaneGeometry(12, 24);
  const govAreaMaterial = new THREE.MeshBasicMaterial({
    color: 0xE4003B, // Labour red
    transparent: true,
    opacity: 0.05,
    side: THREE.DoubleSide
  });
  const govArea = new THREE.Mesh(govAreaGeometry, govAreaMaterial);
  govArea.rotation.x = -Math.PI / 2;
  govArea.position.set(9, 0.02, 0);
  scene.add(govArea);
  
  // Opposition side (left)
  const oppAreaGeometry = new THREE.PlaneGeometry(12, 24);
  const oppAreaMaterial = new THREE.MeshBasicMaterial({
    color: 0x0087DC, // Conservative blue
    transparent: true,
    opacity: 0.05,
    side: THREE.DoubleSide
  });
  const oppArea = new THREE.Mesh(oppAreaGeometry, oppAreaMaterial);
  oppArea.rotation.x = -Math.PI / 2;
  oppArea.position.set(-9, 0.02, 0);
  scene.add(oppArea);
  
  // Add small party areas (e.g., Liberal Democrats, SNP)
  const smallPartyGeometry = new THREE.PlaneGeometry(4, 4);
  
  // Lib Dem area
  const libDemMaterial = new THREE.MeshBasicMaterial({
    color: 0xFAA61A, // Lib Dem orange
    transparent: true,
    opacity: 0.05,
    side: THREE.DoubleSide
  });
  const libDemArea = new THREE.Mesh(smallPartyGeometry, libDemMaterial);
  libDemArea.rotation.x = -Math.PI / 2;
  libDemArea.position.set(-12, 0.02, 10);
  scene.add(libDemArea);
  
  // SNP area
  const snpMaterial = new THREE.MeshBasicMaterial({
    color: 0xFFF95D, // SNP yellow
    transparent: true,
    opacity: 0.05,
    side: THREE.DoubleSide
  });
  const snpArea = new THREE.Mesh(smallPartyGeometry, snpMaterial);
  snpArea.rotation.x = -Math.PI / 2;
  snpArea.position.set(-12, 0.02, -10);
  scene.add(snpArea);
  
  // Add text labels for party areas
  addPartyLabels(scene);
}

/**
 * Adds text labels for party areas
 * @param {THREE.Scene} scene - The Three.js scene
 */
function addPartyLabels(scene) {
  // Create canvas-based text labels for party areas
  createTextPlane(scene, "Government", 9, 0.03, 12, 0xE4003B);
  createTextPlane(scene, "Opposition", -9, 0.03, 12, 0x0087DC);
  createTextPlane(scene, "Lib Dems", -12, 0.03, 10, 0xFAA61A);
  createTextPlane(scene, "SNP", -12, 0.03, -10, 0xFFF95D);
  
  // Add frontbench/backbench labels
  createTextPlane(scene, "Frontbench", 5, 0.03, 0, 0xE4003B);
  createTextPlane(scene, "Backbench", 12, 0.03, 0, 0xE4003B);
  createTextPlane(scene, "Frontbench", -5, 0.03, 0, 0x0087DC);
  createTextPlane(scene, "Backbench", -12, 0.03, 0, 0x0087DC);
}

/**
 * Creates a text plane for labels
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {string} text - The text to display
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} z - Z position
 * @param {number} color - Text color
 */
function createTextPlane(scene, text, x, y, z, color) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 256;
  canvas.height = 64;
  
  // Draw background
  context.fillStyle = 'rgba(255, 255, 255, 0.1)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw text
  context.font = 'bold 32px Arial';
  context.fillStyle = '#' + new THREE.Color(color).getHexString();
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  
  // Create texture and material
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide
  });
  
  // Create plane
  const geometry = new THREE.PlaneGeometry(4, 1);
  const plane = new THREE.Mesh(geometry, material);
  plane.rotation.x = -Math.PI / 2;
  plane.position.set(x, y, z);
  scene.add(plane);
}