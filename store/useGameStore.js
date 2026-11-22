import { create } from 'zustand';

export const useGameStore = create((set, get) => ({
  pos: { x: 5, y: 5 },
  direction: 'down',
  isMoving: false,
  currentMap: 'keraton',
  questStage: 1,
  isCompleted: false,
  dynamicEntities: [],

  // Actions
  move: (dx, dy) =>
    set((state) => {
      let direction = state.direction;
      if (dx > 0) direction = 'right';
      else if (dx < 0) direction = 'left';
      else if (dy > 0) direction = 'down';
      else if (dy < 0) direction = 'up';

      return {
        pos: { x: state.pos.x + dx, y: state.pos.y + dy },
        direction,
        isMoving: true,
      };
    }),

  setPos: (pos) => set({ pos }),
  setDirection: (direction) => set({ direction }),
  setIsMoving: (isMoving) => set({ isMoving }),

  setMap: (map) => set({ currentMap: map }),

  setQuestStage: (n) => set({ questStage: n }),

  setIsCompleted: (isCompleted) => set({ isCompleted }),

  initEntities: (entities) => set({ dynamicEntities: entities }),

  updateEntityPositions: () =>
    set((state) => ({
      dynamicEntities: state.dynamicEntities.map((entity) => {
        if (entity.route && Array.isArray(entity.route) && entity.route.length > 0) {
          const currentIndex = entity.routeIndex ?? 0;
          const nextIndex = (currentIndex + 1) % entity.route.length;
          const nextPos = entity.route[nextIndex];
          return {
            ...entity,
            x: nextPos.x,
            y: nextPos.y,
            routeIndex: nextIndex,
          };
        }
        return entity;
      }),
    })),

  resetPlayer: (x = 5, y = 5) =>
    set({
      pos: { x, y },
      isMoving: false,
    }),
}));
