'use client';

import React from 'react';

interface Cafe {
  id: string;
  name: string;
  categories: string[];
  address: string;
  menuList: string[];
  mapUrl?: string;
}

interface CafeCardProps {
  restaurant: Cafe;
}

const CafeCard: React.FC<CafeCardProps> = ({ restaurant }) => {
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
        onClick={() => {
          if (restaurant.mapUrl && restaurant.mapUrl.trim() !== "") {
            window.open(restaurant.mapUrl, '_blank', 'noopener,noreferrer');
          }
        }}
        style={{ cursor: restaurant.mapUrl && restaurant.mapUrl.trim() !== "" ? 'pointer' : 'default' }}
        title={restaurant.mapUrl && restaurant.mapUrl.trim() !== "" ? "클릭하여 지도 보기" : ""}
      >
        <span>📍 {restaurant.address}</span>
        {/* <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>(클릭하여 복사)</span> */}
      </div>

      <div className="cafe-menu-list">
        {restaurant.menuList.map((menu, i) => (
          <span key={i} className="cafe-menu-item">{menu}</span>
        ))}
      </div>
    </div>
  );
};

export default CafeCard;
