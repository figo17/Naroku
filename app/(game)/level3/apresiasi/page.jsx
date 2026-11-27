'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const AVATARS = [
  '/assets/level3/avatar-1.png',
  '/assets/level3/avatar-2.png',
  '/assets/level3/avatar-3.png',
  '/assets/level3/avatar-4.png',
];

const QUICK_PRAISES = [
  '🌟 Critane runtut lan apik banget!',
  '👏 Pilihan tembunge alus lan trep!',
  '🔥 Imajinasine kreatif lan urip!',
  '💚 Semangat terus anggone nulis!',
];

function pickAvatar(uid = '') {
  let sum = 0;
  for (let i = 0; i < uid.length; i += 1) sum += uid.charCodeAt(i);
  return AVATARS[sum % AVATARS.length];
}

export default function Level3GaleriApresiasiPage() {
  const router = useRouter();
  const supabase = createClient();
  const audioCtxRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);

  const [stories, setStories] = useState([]);
  const [likesByAnswer, setLikesByAnswer] = useState({});
  const [commentsByAnswer, setCommentsByAnswer] = useState({});
  const [classMap, setClassMap] = useState({});
  const [profileMap, setProfileMap] = useState({});

  const [sortBy, setSortBy] = useState('popular'); // 'popular' | 'newest'
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [burstId, setBurstId] = useState(null);

  const [activeStoryUserId, setActiveStoryUserId] = useState(null);
  const [commentInput, setCommentInput] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [toast, setToast] = useState(null);

  const playLikePop = useCallback((liked = true) => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current && AudioCtx) audioCtxRef.current = new AudioCtx();
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const notes = liked ? [587.33, 783.99, 1046.5] : [440];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const s = now + i * 0.065;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, s);
        gain.gain.setValueAtTime(0.18, s);
        gain.gain.exponentialRampToValueAtTime(0.001, s + 0.26);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(s);
        osc.stop(s + 0.3);
      });
    } catch {
      // Ignore audio restriction
    }
  }, []);

  const loadGalleryData = useCallback(async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);

      const [meRes, ansRes, likesRes, comRes, profRes, clsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase
          .from('level3_nulis_answers')
          .select('*')
          .order('updated_at', { ascending: false }),
        supabase.from('level3_narasi_likes').select('*'),
        supabase
          .from('level3_narasi_comments')
          .select('*')
          .order('created_at', { ascending: true }),
        supabase.from('profiles').select('id, nama_lengkap, nomor_induk, class_id, role'),
        supabase.from('classes').select('id, nama_kelas'),
      ]);

      if (meRes.data) setMyProfile(meRes.data);

      const cMap = {};
      (clsRes.data || []).forEach((c) => {
        cMap[c.id] = c.nama_kelas;
      });
      setClassMap(cMap);

      const pMap = {};
      (profRes.data || []).forEach((p) => {
        pMap[p.id] = p;
      });
      setProfileMap(pMap);

      const lMap = {};
      (likesRes.data || []).forEach((lk) => {
        if (!lMap[lk.answer_user_id]) lMap[lk.answer_user_id] = [];
        lMap[lk.answer_user_id].push(lk);
      });
      setLikesByAnswer(lMap);

      const cmMap = {};
      (comRes.data || []).forEach((cm) => {
        if (!cmMap[cm.answer_user_id]) cmMap[cm.answer_user_id] = [];
        cmMap[cm.answer_user_id].push(cm);
      });
      setCommentsByAnswer(cmMap);

      const validStories = (ansRes.data || []).filter((a) => a.narasi?.trim());
      setStories(validStories);
    } catch (err) {
      console.error('Error loading Galeri Apresiasi:', err);
    } finally {
      setLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    loadGalleryData();
  }, [loadGalleryData]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const isStaff = myProfile?.role === 'guru' || myProfile?.role === 'admin';

  const handleClose = () => {
    if (isStaff) router.push('/guru/rekap-level3');
    else router.push('/level3/nulis');
  };

  // Toggle ❤️ Love with instant optimistic state
  const handleToggleLike = async (answerUserId, e) => {
    if (e) e.stopPropagation();
    if (!currentUser) return;

    const existingList = likesByAnswer[answerUserId] || [];
    const alreadyLiked = existingList.some((lk) => lk.liker_user_id === currentUser.id);

    if (alreadyLiked) {
      setLikesByAnswer((prev) => ({
        ...prev,
        [answerUserId]: (prev[answerUserId] || []).filter(
          (lk) => lk.liker_user_id !== currentUser.id
        ),
      }));
      playLikePop(false);

      await supabase
        .from('level3_narasi_likes')
        .delete()
        .eq('answer_user_id', answerUserId)
        .eq('liker_user_id', currentUser.id);
    } else {
      const optimisticLike = {
        id: `temp-${Date.now()}`,
        answer_user_id: answerUserId,
        liker_user_id: currentUser.id,
        liker_name: myProfile?.nama_lengkap || currentUser.email?.split('@')[0] || 'Pengguna',
        liker_role: myProfile?.role || 'murid',
        created_at: new Date().toISOString(),
      };
      setLikesByAnswer((prev) => ({
        ...prev,
        [answerUserId]: [...(prev[answerUserId] || []), optimisticLike],
      }));
      setBurstId(answerUserId);
      setTimeout(() => setBurstId(null), 550);
      playLikePop(true);

      const { data: inserted, error } = await supabase
        .from('level3_narasi_likes')
        .insert({
          answer_user_id: answerUserId,
          liker_user_id: currentUser.id,
          liker_name: optimisticLike.liker_name,
          liker_role: optimisticLike.liker_role,
        })
        .select()
        .single();

      if (error) {
        console.error('Error liking story:', error);
      } else if (inserted) {
        setLikesByAnswer((prev) => ({
          ...prev,
          [answerUserId]: (prev[answerUserId] || []).map((lk) =>
            lk.id === optimisticLike.id ? inserted : lk
          ),
        }));
      }
    }
  };

  // Submit 💬 Comment (Student or Teacher)
  const handleSendComment = async (textOverride) => {
    if (!currentUser || !activeStoryUserId) return;
    const content = (typeof textOverride === 'string' ? textOverride : commentInput).trim();
    if (!content) return;

    setIsSendingComment(true);
    try {
      const authorName =
        myProfile?.nama_lengkap || currentUser.email?.split('@')[0] || 'Kanca';
      const authorRole = myProfile?.role || 'murid';

      const { data: inserted, error } = await supabase
        .from('level3_narasi_comments')
        .insert({
          answer_user_id: activeStoryUserId,
          author_user_id: currentUser.id,
          author_name: authorName,
          author_role: authorRole,
          content,
        })
        .select()
        .single();

      if (error) {
        console.error('Error posting comment:', error);
        setToast({ type: 'error', text: 'Gagal ngirim komentar. Coba maneh!' });
      } else if (inserted) {
        setCommentsByAnswer((prev) => ({
          ...prev,
          [activeStoryUserId]: [...(prev[activeStoryUserId] || []), inserted],
        }));
        if (typeof textOverride !== 'string') setCommentInput('');
        playLikePop(true);
        setToast({ type: 'success', text: '💬 Apresiasimu kasil dikirim!' });
      }
    } finally {
      setIsSendingComment(false);
    }
  };

  const handleDeleteComment = async (comment) => {
    if (!comment) return;
    const { error } = await supabase
      .from('level3_narasi_comments')
      .delete()
      .eq('id', comment.id);

    if (!error) {
      setCommentsByAnswer((prev) => ({
        ...prev,
        [comment.answer_user_id]: (prev[comment.answer_user_id] || []).filter(
          (c) => c.id !== comment.id
        ),
      }));
      setToast({ type: 'success', text: '🗑️ Komentar dibusak.' });
    }
  };

  // Enrich, filter, and sort stories
  const enrichedStories = useMemo(() => {
    const q = search.trim().toLowerCase();
    const mapped = stories.map((st) => {
      const prof = profileMap[st.user_id];
      const displayName = prof?.nama_lengkap || st.student_name || 'Siswa';
      const clsName =
        (prof?.class_id && classMap[prof.class_id]) ||
        (st.student_nisn ? `NISN ${st.student_nisn}` : 'Siswa');
      const likes = likesByAnswer[st.user_id] || [];
      const comments = commentsByAnswer[st.user_id] || [];
      const likedByMe = currentUser
        ? likes.some((lk) => lk.liker_user_id === currentUser.id)
        : false;
      const hasGuruAppreciation =
        likes.some((lk) => lk.liker_role === 'guru' || lk.liker_role === 'admin') ||
        comments.some((cm) => cm.author_role === 'guru' || cm.author_role === 'admin');

      return {
        ...st,
        displayName,
        clsName,
        likes,
        likeCount: likes.length,
        comments,
        commentCount: comments.length,
        likedByMe,
        hasGuruAppreciation,
        avatar: pickAvatar(st.user_id),
      };
    });

    const filtered = q
      ? mapped.filter(
          (item) =>
            item.displayName.toLowerCase().includes(q) ||
            item.clsName.toLowerCase().includes(q) ||
            item.narasi.toLowerCase().includes(q)
        )
      : mapped;

    return [...filtered].sort((a, b) => {
      if (sortBy === 'popular') {
        if (b.likeCount !== a.likeCount) return b.likeCount - a.likeCount;
        if (b.commentCount !== a.commentCount) return b.commentCount - a.commentCount;
      }
      return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
    });
  }, [classMap, commentsByAnswer, currentUser, likesByAnswer, profileMap, search, sortBy, stories]);

  const CARDS_PER_PAGE = 6;
  const totalPages = Math.max(1, Math.ceil(enrichedStories.length / CARDS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const visibleStories = enrichedStories.slice(
    (safePage - 1) * CARDS_PER_PAGE,
    safePage * CARDS_PER_PAGE
  );

  const activeStory = useMemo(
    () => enrichedStories.find((s) => s.user_id === activeStoryUserId) || null,
    [activeStoryUserId, enrichedStories]
  );

  return (
    <div className="relative w-screen h-screen bg-[#04100b] text-stone-100 flex items-center justify-center overflow-hidden select-none font-sans">
      {/* Container 4:3 (1024 x 768) */}
      <div className="relative w-full h-full max-w-[calc(100vh*4/3)] max-h-[calc(100vw*3/4)] aspect-[4/3] overflow-hidden shadow-2xl">
        <Image
          src="/assets/level3/screen_galeri_apresiasi.jpg"
          alt="Galeri Wangsulan Siswa – Apresiasi Crita Level 3"
          fill
          priority
          sizes="100vw"
          className="object-contain object-center"
        />

        {/* ===== TOP BAR HITBOXES ===== */}
        {!isStaff && (
          <Link
            href="/level3/simpanan"
            title="Inventori – Simpanan Jawabanmu"
            className="absolute left-[53.2%] top-[1.0%] w-[9.6%] h-[5.0%] rounded-lg bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30"
          />
        )}
        <Link
          href={isStaff ? '/guru/rekap-level3' : '/level3'}
          title={isStaff ? 'Rekap Guru Level 3' : 'Tujuan Misi Level 3'}
          className="absolute left-[63.8%] top-[1.0%] w-[7.2%] h-[5.0%] rounded-lg bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30"
        />
        <Link
          href={isStaff ? '/guru' : '/peta'}
          title={isStaff ? 'Dashboard Guru' : 'Peta Petualangan'}
          className="absolute left-[71.8%] top-[1.0%] w-[7.6%] h-[5.0%] rounded-lg bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30"
        />
        <button
          type="button"
          onClick={handleClose}
          title={isStaff ? 'Bali menyang Rekap Level 3' : 'Bali menyang Mode Nulis'}
          className="absolute left-[80.2%] top-[1.0%] w-[9.2%] h-[5.0%] rounded-lg bg-transparent hover:bg-yellow-400/15 cursor-pointer z-30"
        />

        {/* ===== TOMBOL CLOSE ABANG (✕) ===== */}
        <button
          type="button"
          onClick={handleClose}
          title="Tutup Galeri Apresiasi"
          aria-label="Tutup"
          className="absolute left-[92.2%] top-[13.2%] w-[4.5%] h-[5.6%] rounded-full bg-transparent hover:bg-white/20 hover:ring-2 hover:ring-yellow-200 active:scale-95 transition-all cursor-pointer z-35"
        >
          <span className="sr-only">Tutup</span>
        </button>

        {/* ===== BARIS FILTER & PENCARIAN MINI ING NDHUWUR KARTU ===== */}
        <div className="absolute left-[6.8%] top-[23.8%] w-[86.4%] z-30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setSortBy('popular');
                setPage(1);
              }}
              className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-[11px] font-extrabold transition cursor-pointer border ${
                sortBy === 'popular'
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-950 border-yellow-200 shadow-[0_0_12px_rgba(250,204,21,0.5)]'
                  : 'bg-[#2a190c]/90 text-amber-200/80 border-amber-700/50 hover:text-yellow-200'
              }`}
            >
              🏆 Paling Disenengi
            </button>
            <button
              type="button"
              onClick={() => {
                setSortBy('newest');
                setPage(1);
              }}
              className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-[11px] font-extrabold transition cursor-pointer border ${
                sortBy === 'newest'
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-950 border-yellow-200 shadow-[0_0_12px_rgba(250,204,21,0.5)]'
                  : 'bg-[#2a190c]/90 text-amber-200/80 border-amber-700/50 hover:text-yellow-200'
              }`}
            >
              🕒 Anyar
            </button>
            {isStaff && (
              <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-900/90 border border-emerald-400 text-emerald-100 text-[10px] font-bold">
                👩‍🏫 Mode Apresiasi Guru
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="🔍 Goleki kanca / isi..."
              className="w-28 sm:w-44 px-2.5 py-0.5 sm:py-1 rounded-full bg-[#1f1208]/95 border border-amber-600/60 text-[9.5px] sm:text-[11px] text-amber-100 placeholder:text-amber-300/50 focus:outline-none focus:border-yellow-400 select-text"
            />
            <button
              type="button"
              onClick={handleClose}
              className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-amber-900/90 hover:bg-amber-800 border border-yellow-400/70 text-yellow-200 text-[9px] sm:text-[11px] font-bold cursor-pointer whitespace-nowrap"
            >
              {isStaff ? '⬅ Rekap Guru' : '✍️ Nulis Critaku'}
            </button>
          </div>
        </div>

        {/* ===== GRID 3x2 KARTU GALERI WANGSULAN SISWA ===== */}
        <div className="absolute left-[6.8%] top-[28.2%] w-[86.4%] h-[50.8%] z-25 grid grid-cols-3 grid-rows-2 gap-x-3 sm:gap-x-4 gap-y-3.5 sm:gap-y-4">
          {loading ? (
            <div className="col-span-3 row-span-2 flex flex-col items-center justify-center text-amber-200 gap-2.5">
              <div className="w-9 h-9 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs sm:text-sm font-serif">Mbukak Galeri Wangsulan Siswa...</p>
            </div>
          ) : visibleStories.length === 0 ? (
            <div className="col-span-3 row-span-2 flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-[#24150b]/80 border border-amber-700/40 text-amber-200 gap-2">
              <span className="text-3xl">📜</span>
              <p className="font-serif font-bold text-sm sm:text-base text-yellow-300">
                {search ? 'Ora ana wangsulan sing cocog karo golekanmu.' : 'Durung ana crita sing dikirim siswa.'}
              </p>
              {!isStaff && !search && (
                <Link
                  href="/level3/nulis"
                  className="mt-1 px-4 py-1.5 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 text-stone-950 font-black text-xs shadow-lg"
                >
                  ✍️ Dadi sing Kapisan Nulis Crita!
                </Link>
              )}
            </div>
          ) : (
            visibleStories.map((st, idx) => {
              const globalRank = (safePage - 1) * CARDS_PER_PAGE + idx + 1;
              const isTopChampion = sortBy === 'popular' && globalRank === 1 && st.likeCount > 0;
              const isMine = currentUser?.id === st.user_id;
              const isBursting = burstId === st.user_id;

              return (
                <div
                  key={st.user_id}
                  onClick={() => setActiveStoryUserId(st.user_id)}
                  className={`group relative rounded-2xl bg-gradient-to-b from-[#fff6e0] via-[#fae7be] to-[#f1d59b] p-2 sm:p-2.5 pb-4 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${
                    isTopChampion
                      ? 'border-2 border-yellow-300 ring-2 ring-yellow-400/80 shadow-[0_0_22px_rgba(250,204,21,0.75)]'
                      : isMine
                      ? 'border-2 border-emerald-500 shadow-[0_4px_14px_rgba(16,185,129,0.3)]'
                      : 'border-2 border-[#d4ab63] hover:border-amber-400 shadow-[0_5px_14px_rgba(0,0,0,0.45)]'
                  }`}
                >
                  {/* Mahkota Emas kanggo Juara #1 Love Terbanyak (Persis Mockup!) */}
                  {isTopChampion && (
                    <div
                      title="Wangsulan Paling Disenengi #1"
                      className="absolute -top-2.5 -right-2 z-20 text-lg sm:text-2xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.65)] rotate-12 pointer-events-none"
                    >
                      👑
                    </div>
                  )}

                  {/* Ornamen Godhong Pojok Kiwa Ngisor */}
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1 -left-1 text-xs sm:text-sm pointer-events-none select-none drop-shadow"
                  >
                    🌿
                  </span>

                  {/* Header Profil Siswa */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative w-7 h-7 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 border-amber-600 shadow bg-amber-200 shrink-0">
                      <Image
                        src={st.avatar}
                        alt={st.displayName}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <h3 className="font-sans font-extrabold text-[#2a1705] text-[10px] sm:text-xs leading-tight truncate">
                          {st.displayName}
                        </h3>
                        {isMine && (
                          <span className="shrink-0 px-1.5 py-0.2 rounded-full bg-emerald-700 text-emerald-50 text-[7.5px] sm:text-[8.5px] font-bold">
                            Karyamu
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[8.5px] sm:text-[10px] text-[#6d4820] font-semibold truncate">
                        <span>{st.clsName}</span>
                        {st.hasGuruAppreciation && (
                          <span
                            title="Wis diapresiasi Guru!"
                            className="px-1 rounded bg-amber-700/20 border border-amber-700/40 text-amber-900 font-extrabold text-[7.5px] sm:text-[8.5px]"
                          >
                            ⭐ Guru
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cuplikan Cerita Narasi Siswa */}
                  <p className="my-auto py-1 text-[#2f1b07] font-sans text-[9px] sm:text-[10.5px] md:text-[11px] leading-[1.32] line-clamp-4">
                    {st.narasi}
                  </p>

                  {/* Pill Apresiasi Mengambang ing Garis Ngisor Kartu: ❤️ Love & 💬 Komentar */}
                  <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => handleToggleLike(st.user_id, e)}
                      title={st.likedByMe ? 'Batalake Love' : 'Wenehi Love Apresiasi!'}
                      className={`px-2.5 py-0.5 rounded-full border-2 flex items-center gap-1 text-[9.5px] sm:text-[11px] font-extrabold shadow-md transition-all cursor-pointer ${
                        st.likedByMe
                          ? 'bg-gradient-to-b from-rose-100 to-rose-200 border-rose-500 text-rose-800 scale-105'
                          : 'bg-gradient-to-b from-[#fff8e8] to-[#f2dfb6] border-[#c89643] text-[#3d2308] hover:border-rose-400'
                      } ${isBursting ? ' scale-125' : ''}`}
                    >
                      <span className={st.likedByMe ? 'text-rose-600' : 'text-rose-500'}>❤️</span>
                      <span>{st.likeCount}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveStoryUserId(st.user_id);
                      }}
                      title="Waca lengkap & tulis komentar apresiasi"
                      className="px-2 py-0.5 rounded-full bg-gradient-to-b from-[#fff8e8] to-[#f2dfb6] hover:from-yellow-100 hover:to-amber-200 border-2 border-[#c89643] text-[#3d2308] flex items-center gap-1 text-[9.5px] sm:text-[11px] font-extrabold shadow-md transition-all cursor-pointer"
                    >
                      <span>💬</span>
                      <span>{st.commentCount}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ===== PAGINATION TENGAH NGISOR: ❮  1 / N  ❯ ===== */}
        <div className="absolute left-1/2 top-[81.6%] -translate-x-1/2 z-30 flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => setPage((p) => (p > 1 ? p - 1 : totalPages))}
            title="Kaca Sadurunge"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-b from-yellow-300 to-amber-500 hover:from-yellow-200 hover:to-amber-400 border-2 border-amber-900 text-amber-950 font-black text-xs sm:text-sm shadow-lg active:scale-90 transition cursor-pointer flex items-center justify-center"
          >
            ❮
          </button>

          <div className="px-4 py-0.5 sm:px-5 sm:py-1 rounded-md bg-[#231409] border border-amber-500/75 text-amber-100 font-sans font-extrabold text-[10px] sm:text-xs shadow-inner">
            {safePage} / {totalPages}
          </div>

          <button
            type="button"
            onClick={() => setPage((p) => (p < totalPages ? p + 1 : 1))}
            title="Kaca Sabanjure"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-b from-yellow-300 to-amber-500 hover:from-yellow-200 hover:to-amber-400 border-2 border-amber-900 text-amber-950 font-black text-xs sm:text-sm shadow-lg active:scale-90 transition cursor-pointer flex items-center justify-center"
          >
            ❯
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] px-4 py-2.5 rounded-2xl border shadow-2xl text-xs sm:text-sm font-bold ${
            toast.type === 'error'
              ? 'bg-red-950/95 border-red-400 text-red-200'
              : 'bg-emerald-950/95 border-emerald-400 text-emerald-100'
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* ===== MODAL WACA NARASI LENGKAP + LOVE + KOMENTAR MURID & GURU ===== */}
      {activeStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl max-h-[90vh] bg-[#1c1108] border-2 border-amber-400 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-100">
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-[#2e1b0d] to-[#1f1208] border-b border-amber-700/50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-yellow-400 shrink-0 bg-amber-200">
                  <Image
                    src={activeStory.avatar}
                    alt={activeStory.displayName}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif font-black text-yellow-300 text-base sm:text-lg truncate">
                    {activeStory.displayName}
                  </h3>
                  <p className="text-xs text-amber-200/80">
                    {activeStory.clsName} · {activeStory.word_count || 0} tembung
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleLike(activeStory.user_id)}
                  className={`px-3.5 py-1.5 rounded-full border-2 font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                    activeStory.likedByMe
                      ? 'bg-rose-600 border-rose-300 text-white shadow-[0_0_15px_rgba(244,63,94,0.6)]'
                      : 'bg-stone-900 hover:bg-stone-800 border-amber-500/70 text-amber-100'
                  }`}
                >
                  <span>❤️</span>
                  <span>{activeStory.likedByMe ? 'Disenengi' : 'Love'} ({activeStory.likeCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveStoryUserId(null)}
                  className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 border border-red-300 text-white font-black text-sm cursor-pointer flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body: Full Story + Comments */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Lembar Cerita Narasi */}
              <div className="p-4 rounded-xl bg-gradient-to-b from-[#fff7e4] to-[#f5e1b5] border-2 border-[#d4ab63] text-[#2b1704] font-serif text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-inner select-text">
                {activeStory.narasi}
              </div>

              {/* Daftar Komentar Apresiasi */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-serif font-bold text-yellow-300 flex items-center gap-1.5">
                    <span>💬</span>
                    <span>Tanggepan &amp; Apresiasi ({activeStory.commentCount})</span>
                  </h4>
                </div>

                {/* Tombol Cepat Stiker Kalimat Apresiasi */}
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PRAISES.map((praise) => (
                    <button
                      key={praise}
                      type="button"
                      disabled={isSendingComment}
                      onClick={() => handleSendComment(praise)}
                      className="px-2.5 py-1 rounded-full bg-amber-950/70 hover:bg-amber-900 border border-amber-600/50 text-amber-200 text-[10px] sm:text-[11px] font-semibold transition cursor-pointer"
                    >
                      + {praise}
                    </button>
                  ))}
                </div>

                {/* Feed Komentar */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {activeStory.comments.length === 0 ? (
                    <p className="text-xs text-stone-400 italic py-2">
                      Durung ana komentar. Ayo wenehi apresiasi kapisan kanggo kancamu!
                    </p>
                  ) : (
                    activeStory.comments.map((cm) => {
                      const isGuruComment = cm.author_role === 'guru' || cm.author_role === 'admin';
                      const canDelete =
                        currentUser?.id === cm.author_user_id || isStaff;

                      return (
                        <div
                          key={cm.id}
                          className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-2 ${
                            isGuruComment
                              ? 'bg-gradient-to-r from-amber-950/90 to-yellow-950/60 border-yellow-400/80 shadow-[0_0_12px_rgba(250,204,21,0.2)]'
                              : 'bg-stone-900/90 border-stone-700/80'
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-amber-200">{cm.author_name}</span>
                              {isGuruComment && (
                                <span className="px-2 py-0.2 rounded-full bg-yellow-400 text-stone-950 font-black text-[9.5px]">
                                  👩‍🏫 Apresiasi Guru
                                </span>
                              )}
                              <span className="text-[10px] text-stone-400">
                                · {new Date(cm.created_at).toLocaleString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-stone-100 leading-relaxed break-words select-text">
                              {cm.content}
                            </p>
                          </div>

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(cm)}
                              title="Busak komentar"
                              className="text-stone-400 hover:text-red-400 text-xs px-1 cursor-pointer shrink-0"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Form Input Komentar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendComment();
              }}
              className="p-3.5 bg-[#140c06] border-t border-amber-800/50 flex items-center gap-2"
            >
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder={
                  isStaff
                    ? 'Tulis apresiasi utawa masukan Guru kanggo siswa iki...'
                    : 'Tulis komentar apresiasi kanggo kancamu...'
                }
                className="flex-1 px-3.5 py-2 rounded-xl bg-stone-900 border border-amber-700/60 text-xs sm:text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-yellow-400 select-text"
              />
              <button
                type="submit"
                disabled={isSendingComment || !commentInput.trim()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 disabled:opacity-50 text-stone-950 font-black text-xs sm:text-sm shadow-md cursor-pointer whitespace-nowrap"
              >
                {isSendingComment ? 'Ngirim...' : 'Kirim ➤'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
