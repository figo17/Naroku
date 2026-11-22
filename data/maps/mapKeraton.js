/**
 * Babak 1: Keraton Map (15x15)
 * Collision values: 0 = walkable, 1 = obstacle/wall, 2 = river/water
 */
export const mapKeraton = {
  id: 'keraton',
  name: 'Keraton (Babak 1)',
  width: 15,
  height: 15,
  tileSize: 48,
  spawnPoint: { x: 5, y: 5 },
  collisionMatrix: [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 1],
    [1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ],
  npcs: [
    {
      id: 'rara_kuning',
      name: 'Putri Rara Kuning',
      x: 7,
      y: 3,
      sprite: '/sprites/rara_kuning.png',
      dialogStage: 1,
    },
    {
      id: 'abdi_dalem',
      name: 'Abdi Dalem',
      x: 4,
      y: 7,
      sprite: '/sprites/abdi_dalem.png',
      dialogStage: 1,
    },
    {
      id: 'prajurit',
      name: 'Prajurit Keraton',
      x: 2,
      y: 8,
      sprite: '/sprites/prajurit.png',
      dialogStage: 1,
    },
  ],
  items: [
    {
      code: 'selendang',
      nama_item: 'Selendang Keraton',
      deskripsi: 'Selendang sutra pusaka Keraton kanggo tandha panguwasa.',
      icon_url: '/sprites/selendang.png',
      x: 10,
      y: 10,
    },
  ],
};

export default mapKeraton;
