'use client';

import React from 'react';

interface Cafe {
  name: string;
  categories: string[];
  address: string;
  mainMenus: string[];
}

interface CafeLuckyBoxProps {
  restaurant: Cafe | null;
  onClose: () => void;
}

const CafeLuckyBox: React.FC<CafeLuckyBoxProps> = ({ restaurant, onClose }) => {
  if (!restaurant) return null;

  return (
    <div className="cafe-modal-overlay" onClick={onClose}>
      <div className="cafe-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="cafe-modal-title">✨ 오늘의 추천 카페! ✨</div>
        <div className="cafe-restaurant-name" style={{ fontSize: '2rem', marginBottom: '1rem' }}>
          {restaurant.name}
        </div>

        <div className="cafe-card-categories" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
          {restaurant.categories.map((cat, i) => (
            <span key={i} className="cafe-category-tag">{cat}</span>
          ))}
        </div>

        <div className="cafe-menu-list" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
          {restaurant.mainMenus.map((menu, i) => (
            <span key={i} className="cafe-menu-item">{menu}</span>
          ))}
        </div>

        <p style={{ color: 'var(--cafe-text-muted)', fontSize: '0.9rem' }}>
          {restaurant.address}
        </p>

        <button className="cafe-close-button" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
};

export default CafeLuckyBox;
