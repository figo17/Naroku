/**
 * Generate a unique 6-character alphanumeric class code (e.g., 'HRK26A')
 * @param {number} length 
 * @returns {string}
 */
export function generateClassCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Check if the given coordinates are outside the map bounds
 * @param {number} x 
 * @param {number} y 
 * @param {number} mapWidth 
 * @param {number} mapHeight 
 * @returns {boolean}
 */
export function isOutOfBounds(x, y, mapWidth, mapHeight) {
  return x < 0 || y < 0 || x >= mapWidth || y >= mapHeight;
}

/**
 * Check if the given coordinates collide with an obstacle or are out of bounds
 * Collision matrix values: 0 = walkable, 1 = obstacle/wall, 2 = river/water
 * @param {number} x 
 * @param {number} y 
 * @param {number[][]} collisionMap 
 * @returns {boolean} true if collision / blocked, false if walkable (0)
 */
export function checkCollision(x, y, collisionMap) {
  if (!collisionMap || !Array.isArray(collisionMap) || collisionMap.length === 0) {
    return true;
  }
  const height = collisionMap.length;
  const width = collisionMap[0]?.length || 0;

  if (isOutOfBounds(x, y, width, height)) {
    return true;
  }

  // 0 is walkable, anything else (1 = wall/obstacle, 2 = river) is a collision
  return collisionMap[y][x] !== 0;
}

/**
 * Check if player collides with any dynamic entity (e.g., Macan, Kayu)
 * @param {{x: number, y: number}} playerPos 
 * @param {Array<{x: number, y: number, [key: string]: any}>} entities 
 * @returns {object|null} the collided entity or null
 */
export function checkEntityCollision(playerPos, entities = []) {
  if (!playerPos || !Array.isArray(entities)) {
    return null;
  }
  return entities.find((entity) => entity.x === playerPos.x && entity.y === playerPos.y) || null;
}
