'use client';

import React from 'react';

interface Restaurant {
  id: string;
  name: string;
  categories: string[];
  address: string;
  menuList: string[];
  mapUrl?: string;
}

interface RestaurantCardProps {
  restaurant: Restaurant;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant }) => {
  return (
    <div className="bob-restaurant-card">
      <div className="bob-card-header">
        <h3 className="bob-restaurant-name">{restaurant.name}</h3>
        <div className="bob-card-categories">
          {restaurant.categories.map((cat, i) => (
            <span key={i} className="bob-category-tag">{cat}</span>
          ))}
        </div>
      </div>

      <div
        className="bob-address-box"
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

      <div className="bob-menu-list">
        {restaurant.menuList.map((menu, i) => (
          <span key={i} className="bob-menu-item">{menu}</span>
        ))}
      </div>
    </div>
  );
};

export default RestaurantCard;
