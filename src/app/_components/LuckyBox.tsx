'use client';

import React from 'react';

interface Restaurant {
  name: string;
  categories: string[];
  address: string;
  mainMenus: string[];
}

interface LuckyBoxProps {
  restaurant: Restaurant | null;
  onClose: () => void;
}

const LuckyBox: React.FC<LuckyBoxProps> = ({ restaurant, onClose }) => {
  if (!restaurant) return null;

  return (
    <div className="bob-modal-overlay" onClick={onClose}>
      <div className="bob-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="bob-modal-title">✨ 오늘의 추천 맛집! ✨</div>
        <div className="bob-restaurant-name" style={{ fontSize: '2rem', marginBottom: '1rem' }}>
          {restaurant.name}
        </div>
        
        <div className="bob-card-categories" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
          {restaurant.categories.map((cat, i) => (
            <span key={i} className="bob-category-tag">{cat}</span>
          ))}
        </div>

        <div className="bob-menu-list" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
          {restaurant.mainMenus.map((menu, i) => (
            <span key={i} className="bob-menu-item">{menu}</span>
          ))}
        </div>

        <p style={{ color: 'var(--bob-text-muted)', fontSize: '0.9rem' }}>
          {restaurant.address}
        </p>

        <button className="bob-close-button" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
};

export default LuckyBox;
