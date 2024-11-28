import React, { useEffect } from 'react';

const DeckLoader = ({ setDeckId }) => {
  useEffect(() => {
    const fetchDeck = async () => {
      try {
        const response = await fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1');
        const data = await response.json();
        setDeckId(data.deck_id);
      } catch (error) {
        console.error("Ошибка при загрузке колоды: ", error);
        alert("Не удалось загрузить колоду. Пожалуйста, попробуйте еще раз.");
      }
    };

    fetchDeck();
  }, [setDeckId]);

  return null;
};

export default DeckLoader;