'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import './whobuys.css';

type Mode = 'draw' | 'ladder' | 'roulette' | 'finger';

interface Verse {
  text: string;
  reference: string;
}

function WinnerResult({ name, verse }: { name: string; verse: Verse | null }) {
  return (
    <>
      🎉 <strong>{name}</strong> 이(가) 쏩니다!
      {verse && (
        <div style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: 'var(--wb-muted)', fontStyle: 'italic', lineHeight: '1.4', wordBreak: 'keep-all' }}>
          "{verse.text}"
          <br />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, display: 'inline-block', marginTop: '0.3rem' }}>- {verse.reference}</span>
        </div>
      )}
    </>
  );
}

/* ─────────────── 유틸 ─────────────── */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ═══════════════════════════════════════
   1. 제비뽑기 컴포넌트
═══════════════════════════════════════ */
function DrawLots({ members, verses }: { members: string[]; verses: Verse[] }) {
  const [picked, setPicked] = useState<{ name: string, verse: Verse | null } | null>(null);
  const [shaking, setShaking] = useState(false);
  const [revealed, setRevealed] = useState<boolean[]>([]);
  const [sticks, setSticks] = useState<{ name: string; isWinner: boolean }[]>([]);
  const [done, setDone] = useState(false);

  const reset = useCallback(() => {
    if (members.length === 0) return;
    const winnerIdx = Math.floor(Math.random() * members.length);
    const shuffledMembers = shuffle(members);
    const newSticks = shuffledMembers.map((name, i) => ({
      name,
      isWinner: i === shuffledMembers.indexOf(shuffledMembers.find((_, si) => members[winnerIdx] === shuffledMembers[si])!),
    }));
    // 실제로 winner 하나만 true
    const winnerName = members[winnerIdx];
    const finalSticks = shuffle(shuffledMembers).map((name) => ({
      name,
      isWinner: name === winnerName,
    }));
    setSticks(finalSticks);
    setRevealed(new Array(members.length).fill(false));
    setPicked(null);
    setDone(false);
  }, [members]);

  useEffect(() => {
    reset();
  }, [reset]);

  const handleReveal = (idx: number) => {
    if (revealed[idx] || done) return;
    const next = [...revealed];
    next[idx] = true;
    setRevealed(next);

    if (sticks[idx].isWinner) {
      setPicked({ name: sticks[idx].name, verse: verses.length ? verses[Math.floor(Math.random() * verses.length)] : null });
      setDone(true);
      setShaking(true);
      setRevealed(new Array(members.length).fill(true));
      setTimeout(() => setShaking(false), 600);
    } else if (next.filter(Boolean).length === members.length - 1) {
      // 마지막 하나 남으면 자동 공개
      const lastIdx = next.findIndex((v) => !v);
      if (lastIdx !== -1) {
        setRevealed(new Array(members.length).fill(true));
        setPicked({ name: sticks[lastIdx].name, verse: verses.length ? verses[Math.floor(Math.random() * verses.length)] : null });
        setDone(true);
      }
    }
  };

  if (members.length < 2) {
    return <p className="wb-empty-hint">참가자를 2명 이상 추가해주세요 👆</p>;
  }

  return (
    <div className="wb-draw-wrap">
      <p className="wb-draw-hint">제비를 클릭하면 당첨 여부가 공개됩니다!</p>
      <div className="wb-sticks-row">
        {sticks.map((stick, i) => (
          <button
            key={i}
            className={`wb-stick ${revealed[i] ? (stick.isWinner ? 'winner' : 'loser') : ''}`}
            onClick={() => handleReveal(i)}
          >
            <div className="wb-stick-result">
              {stick.isWinner ? '당첨' : '통과'}
            </div>
            <span className="wb-stick-bar" />
            <span className="wb-stick-label">
              {stick.name}
            </span>
          </button>
        ))}
      </div>

      {picked && (
        <div className={`wb-result-banner ${shaking ? 'shake' : ''}`}>
          <WinnerResult name={picked.name} verse={picked.verse} />
        </div>
      )}

      <button className="wb-reset-btn" onClick={reset}>🔄 다시 뽑기</button>
    </div>
  );
}

/* ═══════════════════════════════════════
   2. 사다리타기 컴포넌트
═══════════════════════════════════════ */
function LadderGame({ members, verses }: { members: string[]; verses: Verse[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [result, setResult] = useState<React.ReactNode | null>(null);
  const [animating, setAnimating] = useState(false);
  const [ladderData, setLadderData] = useState<boolean[][]>([]);
  const [bottomResults, setBottomResults] = useState<string[]>([]);
  const [startCol, setStartCol] = useState<number>(-1);
  const ROW_COUNT = 10;

  const COLORS = useMemo(() => ({
    line: '#cbd5e1',
    highlight: '#10b981',
    text: '#1e293b',
  }), []);

  const generateLadder = useCallback(() => {
    if (members.length < 2) return [];
    const cols = members.length;

    // 최대 500번 재시도하며 안전하게 사다리 생성
    for (let attempts = 0; attempts < 500; attempts++) {
      const rows: boolean[][] = [];
      const counts = new Array(cols - 1).fill(0);

      for (let r = 0; r < ROW_COUNT; r++) {
        const row: boolean[] = new Array(cols - 1).fill(false);
        for (let c = 0; c < cols - 1; c++) {
          if (c > 0 && row[c - 1]) continue; // 가로줄 연속 방지

          const chance = counts[c] < 2 ? 0.65 : 0.35; // 2개 미만일 경우 확률 높임
          if (Math.random() < chance) {
            row[c] = true;
            counts[c]++;
          }
        }
        rows.push(row);
      }

      // 모든 세로줄 사이 간격에 가로줄이 2개 이상인지 확인
      if (counts.every(cnt => cnt >= 2)) {
        return rows;
      }
    }

    // 혹시라도 500번 실패시 기본 교차 패턴 생성
    const fallbackRows: boolean[][] = [];
    for (let r = 0; r < ROW_COUNT; r++) {
      const row: boolean[] = new Array(cols - 1).fill(false);
      for (let c = 0; c < cols - 1; c++) {
        if (c > 0 && row[c - 1]) continue;
        if ((r + c) % 2 === 0) row[c] = true;
      }
      fallbackRows.push(row);
    }
    return fallbackRows;
  }, [members.length]);

  const drawLadder = useCallback(
    (ladder: boolean[][], bottomRes: string[], highlightPath?: { r: number; c: number }[], sCol = -1) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const cols = members.length;
      if (cols < 2) return;

      const W = canvas.width;
      const H = canvas.height;
      const padX = 40;
      const padY = 30;
      const colW = (W - padX * 2) / (cols - 1);

      const Y_START = padY + 25;
      const Y_END = H - padY - 25;
      const rowH = (Y_END - Y_START) / (ROW_COUNT + 1);

      ctx.clearRect(0, 0, W, H);

      // 1. Base ladder
      ctx.strokeStyle = COLORS.line;
      ctx.lineWidth = 2;
      for (let c = 0; c < cols; c++) {
        const x = padX + c * colW;
        ctx.beginPath();
        ctx.moveTo(x, Y_START);
        ctx.lineTo(x, Y_END);
        ctx.stroke();
      }
      for (let r = 0; r < ROW_COUNT; r++) {
        for (let c = 0; c < cols - 1; c++) {
          if (ladder[r]?.[c]) {
            const x1 = padX + c * colW;
            const x2 = padX + (c + 1) * colW;
            const y = Y_START + rowH * (r + 1);
            ctx.beginPath();
            ctx.moveTo(x1, y);
            ctx.lineTo(x2, y);
            ctx.stroke();
          }
        }
      }

      // 2. Highlighted path
      if (highlightPath && highlightPath.length > 0) {
        ctx.strokeStyle = COLORS.highlight;
        ctx.lineWidth = 4;
        ctx.beginPath();
        let headX = padX + highlightPath[0].c * colW;
        ctx.moveTo(headX, Y_START);

        for (let i = 1; i < highlightPath.length; i++) {
          const p = highlightPath[i];
          const prevP = highlightPath[i - 1];
          const nextY = p.r === ROW_COUNT ? Y_END : Y_START + rowH * (p.r + 1);

          ctx.lineTo(padX + prevP.c * colW, nextY);
          if (prevP.c !== p.c) {
            ctx.lineTo(padX + p.c * colW, nextY);
          }
        }
        ctx.stroke();

        const last = highlightPath[highlightPath.length - 1];
        const dotX = padX + last.c * colW;
        const dotY = last.r === ROW_COUNT ? Y_END : (last.r < 0 ? Y_START : Y_START + rowH * (last.r + 1));
        ctx.beginPath();
        ctx.arc(dotX, dotY, 6, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.highlight;
        ctx.fill();
      }

      // Member names (top)
      members.forEach((name, c) => {
        const x = padX + c * colW;
        ctx.fillStyle = sCol === c ? COLORS.highlight : COLORS.text;
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(name.length > 4 ? name.slice(0, 4) + '…' : name, x, padY);

        ctx.font = '14px sans-serif';
        ctx.fillText('👇', x, padY + 18);
      });

      // Results (bottom)
      if (bottomRes.length > 0) {
        bottomRes.forEach((res, c) => {
          const x = padX + c * colW;
          const isWinner = res === '당첨';
          ctx.fillStyle = isWinner ? '#ef4444' : '#64748b'; // red for winner
          ctx.font = isWinner ? 'bold 18px sans-serif' : 'bold 15px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(res, x, Y_END + 20);
        });
      }
    },
    [members, COLORS]
  );

  const initLadder = useCallback(() => {
    if (members.length < 2) return;
    const ladder = generateLadder();
    setLadderData(ladder);

    // N-1 통과, 1 당첨
    const results = new Array(members.length).fill('통과');
    results[Math.floor(Math.random() * members.length)] = '당첨';
    setBottomResults(results);

    setResult(null);
    setStartCol(-1);
    drawLadder(ladder, results);
  }, [members, generateLadder, drawLadder]);

  useEffect(() => {
    initLadder();
  }, [initLadder]);

  const tracePath = useCallback(
    (ladder: boolean[][], stCol: number) => {
      const path: { r: number; c: number }[] = [];
      let c = stCol;
      path.push({ r: -1, c });
      for (let r = 0; r < ROW_COUNT; r++) {
        if (c > 0 && ladder[r]?.[c - 1]) c--;
        else if (c < members.length - 1 && ladder[r]?.[c]) c++;
        path.push({ r, c });
      }
      path.push({ r: ROW_COUNT, c });
      return { path, finalCol: c };
    },
    [members.length]
  );

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (animating || members.length < 2) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const padX = 40;
    const colW = (canvas.width - padX * 2) / (members.length - 1);

    // 모바일 터치 영역을 늘리기 위해 y < 90 으로 여유를 둡니다.
    if (y < 90) {
      let closestCol = -1;
      let minD = 999;
      for (let c = 0; c < members.length; c++) {
        const cx = padX + c * colW;
        if (Math.abs(x - cx) < minD) {
          minD = Math.abs(x - cx);
          closestCol = c;
        }
      }
      // 인식 반경도 45px로 늘려서 약간 빗나가도 터치되도록 함
      if (minD < 45 && closestCol !== -1) {
        runGameForCol(closestCol);
      }
    }
  };

  const runGameForCol = (stCol: number) => {
    if (members.length < 2 || animating) return;
    setResult(null);
    setStartCol(stCol);
    setAnimating(true);

    const { path, finalCol } = tracePath(ladderData, stCol);

    let step = 0;
    const interval = setInterval(() => {
      drawLadder(ladderData, bottomResults, path.slice(0, step + 1), stCol);
      step++;
      if (step >= path.length) {
        clearInterval(interval);
        const resText = bottomResults[finalCol];
        if (resText === '당첨') {
          const verse = verses.length > 0 ? verses[Math.floor(Math.random() * verses.length)] : null;
          setResult(<WinnerResult name={members[stCol]} verse={verse} />);
        } else {
          setResult(`[${members[stCol]}] 님은 "${resText}"입니다!`);
        }
        setAnimating(false);
      }
    }, 80);
  };

  if (members.length < 2) {
    return <p className="wb-empty-hint">참가자를 2명 이상 추가해주세요 👆</p>;
  }

  return (
    <div className="wb-ladder-wrap">
      <p className="wb-draw-hint">이름을 클릭하면 사다리를 탑니다!</p>
      <canvas
        ref={canvasRef}
        className="wb-ladder-canvas"
        width={560}
        height={420}
        onClick={handleCanvasClick}
        style={{ cursor: animating ? 'default' : 'pointer' }}
      />
      {result && (
        <div className="wb-result-banner">
          {result}
        </div>
      )}
      <button className="wb-reset-btn" onClick={initLadder} disabled={animating} style={{ marginTop: '1.5rem' }}>
        🔄 다시 섞기
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════
   3. 룰렛 컴포넌트
═══════════════════════════════════════ */
const ROULETTE_COLORS = [
  '#f97316', '#3b82f6', '#10b981', '#8b5cf6',
  '#ec4899', '#f59e0b', '#06b6d4', '#ef4444',
  '#84cc16', '#6366f1', '#14b8a6', '#f43f5e',
];

function Roulette({ members, verses }: { members: string[]; verses: Verse[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ name: string, verse: Verse | null } | null>(null);
  const angleRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const draw = useCallback(
    (angle: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H / 2;
      const r = Math.min(cx, cy) - 10;

      ctx.clearRect(0, 0, W, H);

      const n = members.length;
      const slice = (Math.PI * 2) / n;

      members.forEach((name, i) => {
        const start = angle + i * slice;
        const end = start + slice;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, start, end);
        ctx.closePath();
        ctx.fillStyle = ROULETTE_COLORS[i % ROULETTE_COLORS.length];
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // label
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(start + slice / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.min(15, Math.max(10, 120 / n))}px sans-serif`;
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 3;
        ctx.fillText(name.length > 5 ? name.slice(0, 5) + '…' : name, r - 12, 5);
        ctx.restore();
      });

      // center circle
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.stroke();

      // pointer
      ctx.beginPath();
      ctx.moveTo(cx + r + 8, cy);
      ctx.lineTo(cx + r - 18, cy - 12);
      ctx.lineTo(cx + r - 18, cy + 12);
      ctx.closePath();
      ctx.fillStyle = '#1e293b';
      ctx.fill();
    },
    [members]
  );

  useEffect(() => {
    draw(angleRef.current);
  }, [draw]);

  const spin = () => {
    if (spinning || members.length < 2) return;
    setResult(null);
    setSpinning(true);

    const targetRotation = Math.random() * Math.PI * 2 + Math.PI * 2 * (5 + Math.random() * 5);
    const startAngle = angleRef.current;
    const duration = 4000 + Math.random() * 1500;
    const startTime = performance.now();

    const n = members.length;
    const slice = (Math.PI * 2) / n;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentAngle = startAngle + targetRotation * eased;
      angleRef.current = currentAngle;
      draw(currentAngle);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        // 최종 각도에서 어떤 멤버가 포인터에 걸리는지 계산
        // 포인터는 오른쪽(0도), 룰렛 슬라이스는 angle + i*slice ~ angle + (i+1)*slice
        const finalAngle = currentAngle % (Math.PI * 2);
        // 포인터 위치는 각도 0 (오른쪽), 슬라이스에서 인덱스를 역산
        let normalized = ((-finalAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const idx = Math.floor(normalized / slice) % n;
        setResult({ name: members[idx], verse: verses.length > 0 ? verses[Math.floor(Math.random() * verses.length)] : null });
        setSpinning(false);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (members.length < 2) {
    return <p className="wb-empty-hint">참가자를 2명 이상 추가해주세요 👆</p>;
  }

  return (
    <div className="wb-roulette-wrap">
      <canvas ref={canvasRef} className="wb-roulette-canvas" width={400} height={400} />
      {result && (
        <div className="wb-result-banner">
          <WinnerResult name={result.name} verse={result.verse} />
        </div>
      )}
      <button className="wb-start-btn" onClick={spin} disabled={spinning}>
        {spinning ? '돌아가는 중...' : '🎡 룰렛 돌리기!'}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════
   4. 손가락 뽑기 컴포넌트
═══════════════════════════════════════ */
const FINGER_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#14b8a6', '#0ea5e9', '#6366f1', '#8b5cf6', '#d946ef'
];

function FingerPicker({ verses }: { verses: Verse[] }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [touches, setTouches] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const [resultVerse, setResultVerse] = useState<Verse | null>(null);
  const [counting, setCounting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setCounting(false);
  }, []);

  const updateTouches = useCallback((touchList: React.TouchList, shouldReset: boolean) => {
    if (isDone) return;

    const rect = areaRef.current?.getBoundingClientRect();
    const newTouches = Array.from(touchList).map((t) => {
      const x = rect ? t.clientX - rect.left : t.clientX;
      const y = rect ? t.clientY - rect.top : t.clientY;
      const existing = touches.find(et => et.id === t.identifier);
      const color = existing ? existing.color : FINGER_COLORS[t.identifier % FINGER_COLORS.length];
      return { id: t.identifier, x, y, color };
    });

    setTouches(newTouches);

    if (shouldReset) {
      resetTimer();
      if (newTouches.length >= 2) {
        setCounting(true);
        timerRef.current = setTimeout(() => {
          // 추첨 로직
          const winner = newTouches[Math.floor(Math.random() * newTouches.length)];
          setWinnerId(winner.id);
          setResultVerse(verses.length > 0 ? verses[Math.floor(Math.random() * verses.length)] : null);
          setIsDone(true);
          setCounting(false);
        }, 3000);
      }
    }
  }, [isDone, touches, verses, resetTimer]);

  const handleTouchStart = (e: React.TouchEvent) => {
    // 손가락이 추가되면 리셋
    updateTouches(e.touches, true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // 움직일 때는 타이머 유지
    updateTouches(e.touches, false);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isDone) return;
    // 손가락이 떨어지면 리셋
    updateTouches(e.touches, true);
  };

  const handleTouchCancel = (e: React.TouchEvent) => {
    if (isDone) return;
    updateTouches(e.touches, true);
  };

  const reset = () => {
    setIsDone(false);
    setWinnerId(null);
    setResultVerse(null);
    setTouches([]);
    resetTimer();
  };

  const exitFullscreen = () => {
    reset();
    setIsFullscreen(false);
  };

  if (!isFullscreen) {
    return (
      // <div className="wb-finger-wrap-intro">
      // <p className="wb-draw-hint" style={{ marginBottom: '1.5rem' }}>시작하기를 눌러<br/>넓은 전체 화면에서 손가락을 올려보세요!</p>
      <button className="wb-start-btn" onClick={() => setIsFullscreen(true)}>
        👆 손가락 뽑기 시작<br />(전체화면으로 진행됩니다)
      </button>
      // </div>
    );
  }

  return (
    <div className="wb-finger-fullscreen">
      <div
        ref={areaRef}
        className="wb-finger-area"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        {touches.length === 0 && !isDone && (
          <p className="wb-finger-hint">여러 손가락을 3초 이상 올려두세요 👆<br /><br />(모바일에서만 가능합니다)</p>
        )}

        {touches.map(t => {
          let stateClass = '';
          if (isDone) {
            stateClass = t.id === winnerId ? 'winner' : 'loser';
          } else if (counting) {
            stateClass = 'counting';
          }

          return (
            <div
              key={t.id}
              className={`wb-finger-touch`}
              data-state={stateClass}
              style={{ left: t.x, top: t.y, backgroundColor: t.color }}
            />
          );
        })}
      </div>

      {isDone && (
        <div className="wb-finger-result-overlay">
          <div className="wb-result-banner shake">
            <WinnerResult name="🎉 당신" verse={resultVerse} />
          </div>
          <button className="wb-reset-btn" onClick={exitFullscreen} style={{ marginTop: '1.5rem', position: 'relative', zIndex: 100 }}>
            ⬅️ 나가기
          </button>
        </div>
      )}

      {!isDone && (
        <button className="wb-finger-exit-btn" onClick={exitFullscreen} aria-label="닫기">
          ✕
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   5. 메인 페이지
═══════════════════════════════════════ */
export default function WhoBuysPage() {
  const [mode, setMode] = useState<Mode>('roulette');
  const [members, setMembers] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [verses, setVerses] = useState<Verse[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/data/verses.json')
      .then((res) => res.json())
      .then((data) => setVerses(data))
      .catch((err) => console.error('Failed to load verses:', err));
  }, []);

  const addMember = () => {
    const name = inputValue.trim();
    if (!name || members.includes(name)) return;
    if (members.length >= 20) {
      alert('최대 20명까지만 추가할 수 있습니다 😅');
      return;
    }
    setMembers((prev) => [...prev, name]);
    setInputValue('');
    inputRef.current?.focus();
  };

  const removeMember = (name: string) => {
    setMembers((prev) => prev.filter((m) => m !== name));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') addMember();
  };

  const modes: { id: Mode; label: string; emoji: string }[] = [
    { id: 'roulette', label: '룰렛', emoji: '🎡' },
    { id: 'draw', label: '제비뽑기', emoji: '🎋' },
    { id: 'ladder', label: '사다리타기', emoji: '🪜' },
    { id: 'finger', label: '손가락 뽑기', emoji: '👆' },
  ];

  return (
    <div className="wb-page">
      <main className="wb-container">
        {/* ── 헤더 ── */}
        <header className="wb-header">
          <div className="wb-header-title">
            <span style={{ fontSize: '2rem' }}>💸</span>
            <h1>누가 쏠까?</h1>
          </div>

          <div className="wb-header-links wb-header-links--desktop">
            <Link className="wb-nav-link" href="/">🍽 식당 보기</Link>
            <Link className="wb-nav-link" href="/cafe">☕ 카페 보기</Link>
          </div>

          <div className="wb-hamburger-wrapper">
            <button
              className={`wb-hamburger ${menuOpen ? 'open' : ''}`}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="메뉴 열기"
            >
              <span /><span /><span />
            </button>
            {menuOpen && (
              <div className="wb-mobile-menu">
                <Link className="wb-mobile-menu-item" href="/" onClick={() => setMenuOpen(false)}>🍽 식당 보기</Link>
                <Link className="wb-mobile-menu-item" href="/cafe" onClick={() => setMenuOpen(false)}>☕ 카페 보기</Link>
              </div>
            )}
          </div>
        </header>

        <div className="wb-body">
          {/* ── 왼쪽: 참가자 패널 ── */}
          <aside className="wb-sidebar">
            <h2 className="wb-sidebar-title">👥 참가자</h2>

            <div className="wb-member-input-row">
              <input
                ref={inputRef}
                className="wb-member-input"
                placeholder="이름 입력..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={10}
              />
              <button className="wb-add-btn" onClick={addMember}>추가</button>
            </div>

            <ul className="wb-member-list">
              {members.map((m) => (
                <li key={m} className="wb-member-item">
                  <span>{m}</span>
                  <button
                    className="wb-remove-btn"
                    onClick={() => removeMember(m)}
                    aria-label={`${m} 삭제`}
                  >
                    ✕
                  </button>
                </li>
              ))}
              {members.length === 0 && (
                <li className="wb-member-empty">아직 참가자가 없어요</li>
              )}
            </ul>
          </aside>

          {/* ── 오른쪽: 게임 패널 ── */}
          <section className="wb-game-panel">
            {/* 모드 탭 */}
            <div className="wb-mode-tabs">
              {modes.map((m) => (
                <button
                  key={m.id}
                  className={`wb-mode-tab ${mode === m.id ? 'active' : ''}`}
                  onClick={() => setMode(m.id)}
                >
                  {m.emoji} {m.label}
                </button>
              ))}
            </div>

            {/* 게임 영역 */}
            <div className="wb-game-area">
              {mode === 'draw' && <DrawLots members={members} verses={verses} />}
              {mode === 'ladder' && <LadderGame members={members} verses={verses} />}
              {mode === 'roulette' && <Roulette members={members} verses={verses} />}
              {mode === 'finger' && <FingerPicker verses={verses} />}
            </div>
          </section>
        </div>

        {/* <footer className="wb-footer">
          <p>© 2026 누가 쏠까. All rights reserved.</p>
        </footer> */}
      </main>
    </div>
  );
}
