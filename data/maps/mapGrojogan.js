/**
 * Babak 3: Grojogan Map (15x15)
 * Collision values: 0 = walkable, 1 = obstacle/wall/rocks, 2 = river/water
 */
export const mapGrojogan = {
  id: 'grojogan',
  name: 'Grojogan Rara Kuning (Babak 3)',
  width: 15,
  height: 15,
  tileSize: 48,
  spawnPoint: { x: 7, y: 13 },
  completionPoint: {
    x: 7,
    y: 7,
    radius: 1,
    description: 'Titik Suci Grojogan Rara Kuning (Penyelesaian Babak 3)',
  },
  collisionMatrix: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1],
    [1, 1, 1, 0, 0, 2, 2, 2, 2, 2, 0, 0, 1, 1, 1],
    [1, 1, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1],
    [1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  npcs: [
    {
      id: 'rara_kuning_pulih',
      name: 'Putri Rara Kuning',
      x: 8,
      y: 6,
      sprite: '/sprites/rara_kuning.png',
      dialogStage: 3,
    },
  ],
  items: [],
};

export default mapGrojogan;
