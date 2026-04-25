'use client';

import React from 'react';

interface Restaurant {
  name: string;
  categories: string[];
  address: string;
  mainMenus: string[];
}

interface RestaurantCardProps {
  restaurant: Restaurant;
  onCopy: (address: string) => void;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, onCopy }) => {
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
        onClick={() => onCopy(restaurant.address)}
        title="클릭하여 주소 복사"
      >
        <span>📍 {restaurant.address}</span>
        {/* <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>(클릭하여 복사)</span> */}
      </div>

      <div className="bob-menu-list">
        {restaurant.mainMenus.map((menu, i) => (
          <span key={i} className="bob-menu-item">{menu}</span>
        ))}
      </div>
    </div>
  );
};

export default RestaurantCard;
