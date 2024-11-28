import React from 'react';

const PlayerCards = ({ playerCards, playerScore, drawPlayerCard, endPlayerTurn, isBankerTurn }) => {
  return (
    <div className="cards-section">
      <h2>Ваши карты:</h2>
      <div>{playerCards.map(card => <img key={card.code} src={card.image} alt={card.value} className="card" />)}</div>
      <div>Очки: <span>{playerScore}</span></div>
      <div className="buttons">
        {!isBankerTurn && (
          <>
            <button onClick={drawPlayerCard}>Взять карту</button>
            <button onClick={endPlayerTurn}>Остановиться</button>
          </>
        )}
      </div>
    </div>
  );
};

export default PlayerCards;