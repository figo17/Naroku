'use client';

import React, { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useGameStore } from '@/store/useGameStore';
import { useInventoryStore } from '@/store/useInventoryStore';
import { useUIStore } from '@/store/useUIStore';

import Map from '@/components/game/Map';
import Player from '@/components/game/Player';
import Npc from '@/components/game/Npc';
import DynamicEntity from '@/components/game/DynamicEntity';
import HUD from '@/components/game/HUD';
import DialogBox from '@/components/game/DialogBox';
import QuizModal from '@/components/game/QuizModal';
import GlossaryModal from '@/components/game/GlossaryModal';
import InventoryModal from '@/components/game/InventoryModal';
import VirtualDPad from '@/components/game/VirtualDPad';

import { mapKeraton } from '@/data/maps/mapKeraton';
import { mapHutanWilis } from '@/data/maps/mapHutanWilis';
import { mapGrojogan } from '@/data/maps/mapGrojogan';
import { dialogs } from '@/data/dialogs';

function PlayPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [studentProfile, setStudentProfile] = useState(null);
  const [studentClassName, setStudentClassName] = useState('Kelas');
  const [isLoading, setIsLoading] = useState(true);

  // Zustand Store
  const {
    pos,
    currentMap,
    questStage,
    dynamicEntities,
    setMap,
    setPos,
    setQuestStage,
    setIsCompleted,
    initEntities,
    updateEntityPositions,
    resetPlayer,
  } = useGameStore();

  const { addItem, hasItem } = useInventoryStore();
  const { openDialog, openQuiz, isDialogOpen, isQuizOpen } = useUIStore();

  // Maps reference
  const mapsData = {
    keraton: mapKeraton,
    hutan_wilis: mapHutanWilis,
    grojogan: mapGrojogan,
  };

  const activeMapData = mapsData[currentMap] || mapKeraton;

  // 1. Initial Auth & Class Gatekeeper
  useEffect(() => {
    async function initMurid() {
      try {
        const {
          data: { user },
          error: authErr,
        } = await supabase.auth.getUser();

        if (authErr || !user) {
          router.push('/login');
          return;
        }

        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profErr || !prof) {
          router.push('/login');
          return;
        }

        setStudentProfile(prof);

        // Fetch or create game_progress
        const { data: progress } = await supabase
          .from('game_progress')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        const levelParam = searchParams?.get('level');
        if (levelParam === '1') {
          setMap('keraton');
          setPos({ x: 5, y: 5 });
          setQuestStage(1);
          setIsCompleted(false);
        } else if (levelParam === '2') {
          setMap('hutan_wilis');
          setPos({ x: 2, y: 2 });
          setQuestStage(2);
          setIsCompleted(false);
        } else if (levelParam === '3') {
          setMap('grojogan');
          setPos({ x: 7, y: 13 });
          setQuestStage(3);
          setIsCompleted(false);
        } else if (progress) {
          setMap(progress.current_map || 'keraton');
          setPos({ x: progress.pos_x ?? 5, y: progress.pos_y ?? 5 });
          setQuestStage(progress.quest_stage ?? 1);
          setIsCompleted(progress.is_completed ?? false);
        } else {
          // Initialize fresh progress
          await supabase.from('game_progress').insert({
            user_id: user.id,
            current_map: 'keraton',
            pos_x: 5,
            pos_y: 5,
            quest_stage: 1,
            is_completed: false,
          });
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initMurid();
  }, [router, supabase, setMap, setPos, setQuestStage, setIsCompleted]);

  // 2. Map Entities initialization
  useEffect(() => {
    if (activeMapData.dynamicEntities) {
      initEntities(activeMapData.dynamicEntities);
    } else {
      initEntities([]);
    }
  }, [currentMap, activeMapData, initEntities]);

  // 3. Dynamic Entity Loop (Patrol movement every 1000ms)
  useEffect(() => {
    if (!dynamicEntities || dynamicEntities.length === 0) return;

    const interval = setInterval(() => {
      updateEntityPositions();
    }, 1000);

    return () => clearInterval(interval);
  }, [dynamicEntities, updateEntityPositions]);

  // 4. Save progress to Supabase debounced or on stage transition
  const saveProgressToDb = useCallback(
    async (mapId, position, stage, completed) => {
      if (!studentProfile) return;
      try {
        await supabase.from('game_progress').upsert(
          {
            user_id: studentProfile.id,
            current_map: mapId,
            pos_x: position.x,
            pos_y: position.y,
            quest_stage: stage,
            is_completed: completed,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
      } catch (err) {
        console.error('Failed to sync progress:', err);
      }
    },
    [studentProfile, supabase]
  );

  // 5. Dynamic Collision & Hazard Handling
  useEffect(() => {
    if (!dynamicEntities || dynamicEntities.length === 0) return;

    const hitEntity = dynamicEntities.find((e) => e.x === pos.x && e.y === pos.y);
    if (hitEntity) {
      if (hitEntity.type === 'macan') {
        // Respawn back to safe spawn point
        alert('Awake kena serangan Macan! Sampeyan bali menyang wiwitaning alas!');
        const spawn = activeMapData.spawnPoint || { x: 2, y: 2 };
        resetPlayer(spawn.x, spawn.y);
        saveProgressToDb(currentMap, spawn, questStage, false);
      }
    }
  }, [pos, dynamicEntities, currentMap, activeMapData, questStage, resetPlayer, saveProgressToDb]);

  // 6. Handle Player Step Check (Goal Zones, River Safe Checks)
  const handlePlayerStep = useCallback(
    (newPos) => {
      // Check Grojogan Completion Point
      if (currentMap === 'grojogan' && activeMapData.completionPoint) {
        const pt = activeMapData.completionPoint;
        if (Math.abs(newPos.x - pt.x) <= pt.radius && Math.abs(newPos.y - pt.y) <= pt.radius) {
          setIsCompleted(true);
          saveProgressToDb('grojogan', newPos, 3, true);
        }
      }

      // Check River Tile Hazard on Hutan Wilis
      if (currentMap === 'hutan_wilis') {
        const tileType = activeMapData.collisionMatrix?.[newPos.y]?.[newPos.x];
        if (tileType === 2) {
          // Player is on river. Must be supported by a Kayu Bergerak at the exact tile
          const hasPlatform = dynamicEntities.some(
            (e) => e.type === 'kayu' && e.x === newPos.x && e.y === newPos.y
          );
          if (!hasPlatform) {
            alert('Kintir ing kali Wilis! Sampeyan kudu numpak kayu glondhongan sing mili!');
            const spawn = activeMapData.spawnPoint || { x: 2, y: 2 };
            resetPlayer(spawn.x, spawn.y);
            saveProgressToDb(currentMap, spawn, questStage, false);
            return;
          }
        }
      }

      saveProgressToDb(currentMap, newPos, questStage, false);
    },
    [currentMap, activeMapData, dynamicEntities, questStage, setIsCompleted, resetPlayer, saveProgressToDb]
  );

  // 7. Handle NPC Interaction
  const handleNpcInteract = (npc) => {
    // Stage 1 dialogues
    if (currentMap === 'keraton') {
      const script = dialogs?.[1] || {
        speaker: npc.name,
        lines: [{ speaker: npc.name, text: 'Ayo budhal nulungi Rara Kuning!' }],
      };

      openDialog({
        ...script,
        onComplete: async () => {
          // If Putri dialogue completed, prompt Quiz Stage 1 before transition
          if (npc.id === 'rara_kuning') {
            // Fetch Quiz 1 from DB
            const { data: q1 } = await supabase
              .from('quizzes')
              .select('*')
              .eq('quest_stage', 1)
              .limit(1)
              .maybeSingle();

            if (q1) {
              openQuiz(q1);
            } else {
              // Transition to Babak 2
              setMap('hutan_wilis');
              setPos({ x: 2, y: 2 });
              setQuestStage(2);
              saveProgressToDb('hutan_wilis', { x: 2, y: 2 }, 2, false);
            }
          }
        },
      });
    } else if (currentMap === 'hutan_wilis') {
      const script = dialogs?.[2] || {
        speaker: npc.name,
        lines: [{ speaker: npc.name, text: 'Ati-ati marang macan lan jurang kali!' }],
      };
      openDialog(script);
    } else if (currentMap === 'grojogan') {
      const script = dialogs?.[3] || {
        speaker: npc.name,
        lines: [
          {
            speaker: npc.name,
            text: 'Matur nuwun sanget Dewi Kilisuci, banyu grojogan iki wis marasake lelaraku!',
          },
        ],
      };
      openDialog({
        ...script,
        onComplete: async () => {
          // Fetch Quiz 3 from DB
          const { data: q3 } = await supabase
            .from('quizzes')
            .select('*')
            .eq('quest_stage', 3)
            .limit(1)
            .maybeSingle();

          if (q3) {
            openQuiz(q3);
          }
        },
      });
    }
  };

  // 8. Handle Quiz Finish
  const handleQuizFinished = (result) => {
    if (questStage === 1) {
      setMap('hutan_wilis');
      setPos({ x: 2, y: 2 });
      setQuestStage(2);
      saveProgressToDb('hutan_wilis', { x: 2, y: 2 }, 2, false);
    } else if (questStage === 2) {
      setMap('grojogan');
      setPos({ x: 7, y: 13 });
      setQuestStage(3);
      saveProgressToDb('grojogan', { x: 7, y: 13 }, 3, false);
    }
  };

  // 9. Collect Item
  const handleCollectItem = (item) => {
    if (!hasItem(item.code)) {
      addItem(item);
      alert(`Panjenengan pikantuk: ${item.nama_item}!`);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-stone-950 text-amber-200 gap-3">
        <div className="text-4xl animate-spin">⏳</div>
        <div className="font-serif text-lg">Nyiapake Jagad Haroku Adventure...</div>
      </div>
    );
  }

  // Camera viewport follow calculation (center player)
  const tileSize = 48;
  const cameraX = -(pos.x * tileSize - (typeof window !== 'undefined' ? window.innerWidth / 2 : 400));
  const cameraY = -(pos.y * tileSize - (typeof window !== 'undefined' ? window.innerHeight / 2 : 300));

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-stone-950">
      {/* Top HUD */}
      <HUD
        studentName={studentProfile?.nama_lengkap || 'Dewi Kilisuci'}
      />

      {/* World Map & Game Canvas Container */}
      <div
        className="w-full h-full relative cursor-crosshair transition-transform duration-100 ease-out flex items-center justify-center"
        style={{
          transform: `translate3d(${cameraX}px, ${cameraY}px, 0)`,
        }}
      >
        {/* Map Grid & Tiles */}
        <Map
          mapData={activeMapData}
          onCollectItem={handleCollectItem}
        />

        {/* NPCs */}
        {activeMapData.npcs?.map((npc) => {
          const isNearby = Math.abs(pos.x - npc.x) <= 1 && Math.abs(pos.y - npc.y) <= 1;
          return (
            <Npc
              key={npc.id}
              npc={npc}
              onInteract={handleNpcInteract}
              isNearby={isNearby}
            />
          );
        })}

        {/* Dynamic Entities (Macan & Kayu) */}
        {dynamicEntities.map((entity) => (
          <DynamicEntity key={entity.id} entity={entity} />
        ))}

        {/* Dewi Kilisuci Player */}
        <Player
          collisionMatrix={activeMapData.collisionMatrix}
          onStep={handlePlayerStep}
          disabled={isDialogOpen || isQuizOpen}
        />
      </div>

      {/* Virtual D-Pad for Mobile/Touch */}
      <VirtualDPad
        collisionMatrix={activeMapData.collisionMatrix}
        onStep={handlePlayerStep}
        disabled={isDialogOpen || isQuizOpen}
      />

      {/* Modals & Dialogs */}
      <DialogBox />
      <QuizModal onQuizFinished={handleQuizFinished} />
      <GlossaryModal />
      <InventoryModal />
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <div className="w-screen h-screen bg-[#061e12] flex items-center justify-center text-yellow-300 font-bold">
          Memuat Petualangan Haroku...
        </div>
      }
    >
      <PlayPageContent />
    </Suspense>
  );
}
