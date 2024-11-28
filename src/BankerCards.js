import React from 'react';

const BankerCards = ({ bankerCards, bankerScore }) => {
  return (
    <div className="cards-section">
      <h2>Карты банкира:</h2>
      <div>{bankerCards.map(card => <img key={card.code} src={card.image} alt={card.value} className="card" />)}</div>
      <div>Очки: <span>{bankerScore}</span></div>
    </div>
  );
};

export default BankerCards;