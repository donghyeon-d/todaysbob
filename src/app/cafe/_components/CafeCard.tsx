'use client';

import React from 'react';

interface Cafe {
  name: string;
  categories: string[];
  address: string;
  mainMenus: string[];
}

interface CafeCardProps {
  restaurant: Cafe;
  onCopy: (address: string) => void;
}

const CafeCard: React.FC<CafeCardProps> = ({ restaurant, onCopy }) => {
  return (
    <div className="cafe-restaurant-card">
      <div className="cafe-card-header">
        <h3 className="cafe-restaurant-name">{restaurant.name}</h3>
        <div className="cafe-card-categories">
          {restaurant.categories.map((cat, i) => (
            <span key={i} className="cafe-category-tag">{cat}</span>
          ))}
        </div>
      </div>

      <div
        className="cafe-address-box"
        onClick={() => onCopy(restaurant.address)}
        title="클릭하여 주소 복사"
      >
        <span>📍 {restaurant.address}</span>
        {/* <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>(클릭하여 복사)</span> */}
      </div>

      <div className="cafe-menu-list">
        {restaurant.mainMenus.map((menu, i) => (
          <span key={i} className="cafe-menu-item">{menu}</span>
        ))}
      </div>
    </div>
  );
};

export default CafeCard;
