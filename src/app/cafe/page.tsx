'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import RestaurantCard from './_components/CafeCard';
import LuckyBox from './_components/CafeLuckyBox';
import './cafe.css';
import Link from 'next/link';
import { Region, REGION_TO_PARAM, parseRegionParam } from '../enum/region';

interface Cafe {
  name: string;
  categories: string[];
  address: string;
  mainMenus: string[];
}

const REGION_CONFIG: Record<Region, { label: string; emoji: string; dataUrl: string }> = {
  '서대문': { label: '서대문', emoji: '🏛️', dataUrl: '/data/cafes.json' },
  '신촌': { label: '신촌', emoji: '🎓', dataUrl: '/data/sinchon_cafes.json' },
};

function CafePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeRegion, setActiveRegion] = useState<Region>(() => parseRegionParam(searchParams.get('region')));
  const [cafesByRegion, setCafesByRegion] = useState<Record<Region, Cafe[]>>({
    '서대문': [],
    '신촌': [],
  });
  const [isMounted, setIsMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategories, setActiveCategories] = useState<string[]>(['전체']);
  const [luckyResult, setLuckyResult] = useState<Cafe | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Fisher-Yates shuffle helper
  const shuffle = (arr: Cafe[]): Cafe[] => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Load data for both regions
  useEffect(() => {
    setIsMounted(true);

    const regions: Region[] = ['서대문', '신촌'];
    regions.forEach((region) => {
      fetch(REGION_CONFIG[region].dataUrl)
        .then((res) => res.json())
        .then((data: Cafe[]) => {
          setCafesByRegion((prev) => ({
            ...prev,
            [region]: shuffle(data),
          }));
        })
        .catch((err) => console.error(`Failed to load ${region} cafes:`, err));
    });
  }, []);

  // Active cafes for selected region
  const cafes = cafesByRegion[activeRegion];

  // Reset filters when region changes
  const handleRegionChange = (region: Region) => {
    setActiveRegion(region);
    setSearchTerm('');
    setActiveCategories(['전체']);
    const params = new URLSearchParams(searchParams.toString());
    params.set('region', REGION_TO_PARAM[region]);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  // Derive all unique categories
  const categories = useMemo(() => {
    const allCats = cafes.flatMap((r) => r.categories);
    const uniqueCats = Array.from(new Set(allCats));
    return ['전체', ...uniqueCats.sort()];
  }, [cafes]);

  // Handle Category Toggle
  const handleCategoryToggle = (category: string) => {
    if (category === '전체') {
      setActiveCategories(['전체']);
      return;
    }

    let nextCategories = activeCategories.includes('전체')
      ? [category]
      : (activeCategories.includes(category)
        ? activeCategories.filter(c => c !== category)
        : [...activeCategories, category]);

    if (nextCategories.length === 0) {
      nextCategories = ['전체'];
    }

    setActiveCategories(nextCategories);
  };

  // Filter logic
  const filteredCafes = useMemo(() => {
    return cafes.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.mainMenus.some((m) => m.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory =
        activeCategories.includes('전체') ||
        activeCategories.some((cat) => r.categories.includes(cat));

      return matchesSearch && matchesCategory;
    });
  }, [cafes, searchTerm, activeCategories]);

  // Lucky Box Logic
  const handleLuckyPick = () => {
    if (filteredCafes.length === 0) {
      alert('필터링된 결과가 없습니다. 조건을 변경해 보세요!');
      return;
    }
    const randomIndex = Math.floor(Math.random() * filteredCafes.length);
    setLuckyResult(filteredCafes[randomIndex]);
  };

  // Copy to Clipboard
  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address).then(() => {
      setToast('주소가 복사되었습니다! 📋');
      setTimeout(() => setToast(null), 2000);
    });
  };

  if (!isMounted) return null;

  return (
    <div className="cafe-page">
      <main className="cafe-container">
        <header className="cafe-page-header">
          <div className="cafe-header-title">
            <span style={{ fontSize: '2rem' }}>☕</span>
            <h1>오늘 뭐 먹지</h1>
          </div>

          {/* 데스크탑 링크 */}
          <div className="cafe-header-links cafe-header-links--desktop">
            <Link className="cafe-map-link" href="/">🍽 식당 보기</Link>
            <Link className="cafe-map-link" href="/whobuys">💸 누가 쏠까?</Link>
            <a className="cafe-map-link" href="https://naver.me/FYrUvEqc" target="_blank" rel="noopener noreferrer">🗺 지도 보기</a>
            <a className="cafe-map-link cafe-report-link" href="https://forms.gle/vM3hZ3RmeqSwbAJ68" target="_blank" rel="noopener noreferrer">✏️ 카페 제보</a>
          </div>

          {/* 모바일 햄버거 + 드롭다운 */}
          <div className="cafe-hamburger-wrapper">
            <button
              className={`cafe-hamburger${menuOpen ? ' open' : ''}`}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="메뉴 열기"
            >
              <span /><span /><span />
            </button>

            {menuOpen && (
              <div className="cafe-mobile-menu">
                <Link className="cafe-mobile-menu-item" href="/" onClick={() => setMenuOpen(false)}>🍽 식당 보기</Link>
                <Link className="cafe-mobile-menu-item" href="/whobuys" onClick={() => setMenuOpen(false)}>💸 누가 쏠까?</Link>
                <a className="cafe-mobile-menu-item" href="https://naver.me/FYrUvEqc" target="_blank" rel="noopener noreferrer">🗺 지도 보기</a>
                <a className="cafe-mobile-menu-item" href="https://forms.gle/vM3hZ3RmeqSwbAJ68" target="_blank" rel="noopener noreferrer">✏️ 카페 제보</a>
              </div>
            )}
          </div>
        </header>

        {/* 지역 탭 */}
        <div className="cafe-region-tabs">
          {(Object.keys(REGION_CONFIG) as Region[]).map((region) => (
            <button
              key={region}
              className={`cafe-region-tab ${activeRegion === region ? 'active' : ''}`}
              onClick={() => handleRegionChange(region)}
            >
              <span className="cafe-region-tab-emoji">{REGION_CONFIG[region].emoji}</span>
              <span className="cafe-region-tab-label">{REGION_CONFIG[region].label}</span>
            </button>
          ))}
          <div
            className="cafe-region-tab-indicator"
            style={{
              transform: `translateX(${activeRegion === '서대문' ? '0%' : '100%'})`,
            }}
          />
        </div>

        <section className="cafe-search-container">
          <div className="cafe-search-input-wrapper">
            <input
              type="text"
              className="cafe-search-input"
              placeholder="카페 이름 또는 메뉴를 검색하세요..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="cafe-filter-chips">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`cafe-chip ${activeCategories.includes(cat) ? 'active' : ''}`}
                onClick={() => handleCategoryToggle(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        <button className="cafe-lucky-button" onClick={handleLuckyPick}>
          🎲 카테고리 내 추천
        </button>

        <div className="cafe-restaurant-list">
          {filteredCafes.length > 0 ? (
            filteredCafes.map((res, index) => (
              <RestaurantCard
                key={`${res.name}-${index}`}
                restaurant={res}
                onCopy={handleCopy}
              />
            ))
          ) : (
            <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--cafe-text-muted)', gridColumn: '1 / -1' }}>
              {cafes.length === 0 ? '아직 등록된 카페가 없습니다.' : '검색 결과가 없습니다.'}
            </p>
          )}
        </div>

        <LuckyBox
          restaurant={luckyResult}
          onClose={() => setLuckyResult(null)}
        />

        {toast && (
          <div className="cafe-copy-toast">
            {toast}
          </div>
        )}

        {/* <footer style={{ marginTop: '5rem', paddingBottom: '2rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--cafe-text-muted)' }}>
          <p>© 2026 카페 큐레이션 리스트. All rights reserved.</p>
        </footer> */}
      </main>
    </div>
  );
}

export default function CafePage() {
  return (
    <Suspense>
      <CafePageContent />
    </Suspense>
  );
}
