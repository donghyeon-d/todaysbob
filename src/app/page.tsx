'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import RestaurantCard from './_components/RestaurantCard';
import LuckyBox from './_components/LuckyBox';
import './bob.css';

import { Region, REGION_TO_PARAM, parseRegionParam } from './enum/region';
import { fetchCsvByRegion } from './utils/csvParser';

interface Restaurant {
  id: string;
  name: string;
  categories: string[];
  address: string;
  menuList: string[];
  mapUrl?: string;
}

const REGION_CONFIG: Record<Region, { label: string; emoji: string }> = {
  '서대문': { label: '서대문', emoji: '🏛️' },
  '신촌': { label: '신촌', emoji: '🎓' },
};

const CSV_URL = '/data/restaurants.csv';

function BobPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeRegion, setActiveRegion] = useState<Region>(() => parseRegionParam(searchParams.get('region')));
  const [restaurantsByRegion, setRestaurantsByRegion] = useState<Record<Region, Restaurant[]>>({
    '서대문': [],
    '신촌': [],
  });
  const [isMounted, setIsMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategories, setActiveCategories] = useState<string[]>(['전체']);
  const [luckyResult, setLuckyResult] = useState<Restaurant | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Fisher-Yates shuffle helper
  const shuffle = (arr: Restaurant[]): Restaurant[] => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Load data for both regions from a single CSV
  useEffect(() => {
    setIsMounted(true);

    const regions: Region[] = ['서대문', '신촌'];
    regions.forEach((region) => {
      fetchCsvByRegion<Restaurant>(CSV_URL, REGION_TO_PARAM[region])
        .then((data) => {
          setRestaurantsByRegion((prev) => ({
            ...prev,
            [region]: shuffle(data),
          }));
        })
        .catch((err) => console.error(`Failed to load ${region} restaurants:`, err));
    });
  }, []);

  // Active restaurants for selected region
  const restaurants = restaurantsByRegion[activeRegion];

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
    const allCats = restaurants.flatMap((r) => r.categories);
    const uniqueCats = Array.from(new Set(allCats));
    return ['전체', ...uniqueCats.sort()];
  }, [restaurants]);

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
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.menuList.some((m) => m.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory =
        activeCategories.includes('전체') ||
        activeCategories.some((cat) => r.categories.includes(cat));

      return matchesSearch && matchesCategory;
    });
  }, [restaurants, searchTerm, activeCategories]);

  // Lucky Box Logic
  const handleLuckyPick = () => {
    if (filteredRestaurants.length === 0) {
      alert('필터링된 결과가 없습니다. 조건을 변경해 보세요!');
      return;
    }
    const randomIndex = Math.floor(Math.random() * filteredRestaurants.length);
    setLuckyResult(filteredRestaurants[randomIndex]);
  };

  if (!isMounted) return null;

  return (
    <div className="bob-page">
      <main className="bob-container">
        <header className="bob-page-header">
          <div className="bob-header-title">
            <Image src="/img/bob.png" alt="밥" width={36} height={36} style={{ objectFit: 'contain' }} />
            <h1>오늘 뭐 먹지</h1>
          </div>

          {/* 데스크탑 링크 */}
          <div className="bob-header-links bob-header-links--desktop">
            <Link className="bob-map-link" href="/cafe">☕ 카페 보기</Link>
            <Link className="bob-map-link" href="/whobuys">💸 누가 쏠까</Link>
            <a className="bob-map-link" href="https://naver.me/FYrUvEqc" target="_blank" rel="noopener noreferrer">🗺 지도 보기</a>
            <a className="bob-map-link bob-report-link" href="https://forms.gle/vM3hZ3RmeqSwbAJ68" target="_blank" rel="noopener noreferrer">✏️ 맛집 제보</a>
          </div>

          {/* 모바일 햄버거 + 드롭다운 */}
          <div className="bob-hamburger-wrapper">
            <button
              className={`bob-hamburger${menuOpen ? ' open' : ''}`}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="메뉴 열기"
            >
              <span /><span /><span />
            </button>

            {menuOpen && (
              <div className="bob-mobile-menu">
                <Link className="bob-mobile-menu-item" href="/cafe" onClick={() => setMenuOpen(false)}>☕ 카페 보기</Link>
                <Link className="bob-mobile-menu-item" href="/whobuys" onClick={() => setMenuOpen(false)}>💸 누가 쏠까</Link>
                <a className="bob-mobile-menu-item" href="https://naver.me/FYrUvEqc" target="_blank" rel="noopener noreferrer">🗺 지도 보기</a>
                <a className="bob-mobile-menu-item" href="https://forms.gle/vM3hZ3RmeqSwbAJ68" target="_blank" rel="noopener noreferrer">✏️ 맛집 제보</a>
              </div>
            )}
          </div>
        </header>

        {/* 지역 탭 */}
        <div className="bob-region-tabs">
          {(Object.keys(REGION_CONFIG) as Region[]).map((region) => (
            <button
              key={region}
              className={`bob-region-tab ${activeRegion === region ? 'active' : ''}`}
              onClick={() => handleRegionChange(region)}
            >
              <span className="bob-region-tab-emoji">{REGION_CONFIG[region].emoji}</span>
              <span className="bob-region-tab-label">{REGION_CONFIG[region].label}</span>
            </button>
          ))}
          <div
            className="bob-region-tab-indicator"
            style={{
              transform: `translateX(${activeRegion === '서대문' ? '0%' : '100%'})`,
            }}
          />
        </div>

        <section className="bob-search-container">
          <div className="bob-search-input-wrapper">
            <input
              type="text"
              className="bob-search-input"
              placeholder="식당 이름 또는 메뉴를 검색하세요..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="bob-filter-chips">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`bob-chip ${activeCategories.includes(cat) ? 'active' : ''}`}
                onClick={() => handleCategoryToggle(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        <button className="bob-lucky-button" onClick={handleLuckyPick}>
          🎲 카테고리 내 추천
        </button>

        <div className="bob-restaurant-list">
          {filteredRestaurants.length > 0 ? (
            filteredRestaurants.map((res) => (
              <RestaurantCard
                key={res.id}
                restaurant={res}
              />
            ))
          ) : (
            <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--bob-text-muted)', gridColumn: '1 / -1' }}>
              {restaurants.length === 0 ? '아직 등록된 식당이 없습니다.' : '검색 결과가 없습니다.'}
            </p>
          )}
        </div>

        <LuckyBox
          restaurant={luckyResult}
          onClose={() => setLuckyResult(null)}
        />

        {/* <footer style={{ marginTop: '5rem', paddingBottom: '2rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--bob-text-muted)' }}>
          <p>© 2026 맛집 큐레이션 리스트. All rights reserved.</p>
        </footer> */}
      </main>
    </div>
  );
}

export default function BobPage() {
  return (
    <Suspense>
      <BobPageContent />
    </Suspense>
  );
}
