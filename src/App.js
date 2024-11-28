import React, { useState, useRef } from 'react';
import DeckLoader from './DeckLoader';
import PlayerCards from './PlayerCards';
import BankerCards from './BankerCards';
import ChartContainer from './ChartContainer'; 
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
} from 'chart.js';
import './App.css';

// Регистрируем компоненты
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale
);

function App() {
  const [bankAmount, setBankAmount] = useState(1000);
  const [deckId, setDeckId] = useState(null);
  const playerScoreRef = useRef(0);
  const bankerScoreRef = useRef(0);
  const [playerCards, setPlayerCards] = useState([]);
  const [bankerCards, setBankerCards] = useState([]);
  const [playerBets, setPlayerBets] = useState(100);
  const [gameHistory, setGameHistory] = useState([]);
  const [resultMessage, setResultMessage] = useState('');
  const [resultsCount, setResultsCount] = useState({ wins: 0, losses: 0, ties: 0 });
  const [cardsDealt, setCardsDealt] = useState(false);
  const [isBankerTurn, setIsBankerTurn] = useState(false);
  const [bankHistory, setBankHistory] = useState([]);
  const [isBetButtonDisabled, setIsBetButtonDisabled] = useState(false);

  const startGame = async () => {
    if (bankAmount < playerBets) {
      alert("У вас недостаточно денег для этой ставки.");
      return;
    }

    setIsBetButtonDisabled(true);
    setPlayerCards([]);
    setBankerCards([]);
    playerScoreRef.current = 0;
    bankerScoreRef.current = 0;
    setCardsDealt(false);

    try {
      await drawPlayerCard();
      await drawBankerCard();
      setBankAmount(prev => prev - playerBets);
      setCardsDealt(true);
    } catch (error) {
      console.error("Ошибка при запуске игры: ", error);
      alert("Произошла ошибка при начертании игры. Попробуйте еще раз.");
    }
  };

  const drawPlayerCard = async () => {
    if (!deckId || isBankerTurn) return;

    try {
      const response = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`);
      const data = await response.json();

      if (!data.cards || data.cards.length === 0) {
        alert("Не удалось вытащить карту. Попробуйте снова.");
        return;
      }

      const card = data.cards[0];
      setPlayerCards(prev => [...prev, card]);
      playerScoreRef.current += getCardValue(card);
      checkPlayerScore();
    } catch (error) {
      console.error("Ошибка при вытаскивании карты: ", error);
      alert("Не удалось вытащить карту. Попробуйте еще раз.");
    }
  };

  const drawBankerCard = async () => {
    if (!deckId) return;

    try {
      const response = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`);
      const data = await response.json();

      if (!data.cards || data.cards.length === 0) {
        alert("Не удалось вытащить карту банкира. Попробуйте снова.");
        return;
      }

      const card = data.cards[0];
      setBankerCards(prev => [...prev, card]);
      bankerScoreRef.current += getCardValue(card);
    } catch (error) {
      console.error("Ошибка при вытаскивании карты банкира: ", error);
      alert("Не удалось вытащить карту банкира. Попробуйте еще раз.");
    }
  };

  const getCardValue = (card) => {
    if (card.value === 'ACE') return 11;
    if (card.value === 'KING') return 4;
    if (card.value === 'QUEEN') return 3;
    if (card.value === 'JACK') return 2;
    return parseInt(card.value) || 0;
  };

  const checkPlayerScore = async () => {
    setIsBankerTurn(true);
    if (playerScoreRef.current > 21) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showResult("Перебор! Вы проиграли.");
      setResultsCount(prev => ({ ...prev, losses: prev.losses + 1 }));
      setCardsDealt(false);
      updateBankHistory();
      setIsBankerTurn(false);
    } else if (playerScoreRef.current === 21) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showResult("Поздравляем! Вы набрали 21 очко!");
      setBankAmount(prev => prev + playerBets * 2);
      setResultsCount(prev => ({ ...prev, wins: prev.wins + 1 }));
      updateBankHistory();
      setIsBankerTurn(false);
    }
    if (playerScoreRef.current < 21) setIsBankerTurn(false);
  };

  const endPlayerTurn = () => {
    playBankerTurn();
  };

  const playBankerTurn = async () => {
    setIsBankerTurn(true);
    while (bankerScoreRef.current < 17) {
      await drawBankerCard();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    determineWinner();
    setIsBankerTurn(false);
  };

  const determineWinner = () => {
    if (bankerScoreRef.current > 21) {
      showResult("Банкир перебрал! Вы выиграли.");
      setBankAmount(prev => prev + playerBets * 2);
      setResultsCount(prev => ({ ...prev, wins: prev.wins + 1 }));
      updateBankHistory();
    } else if (playerScoreRef.current > bankerScoreRef.current) {
      showResult("Поздравляем! Вы выиграли.");
      setBankAmount(prev => prev + playerBets * 2);
      setResultsCount(prev => ({ ...prev, wins: prev.wins + 1 }));
      updateBankHistory();
    } else if (playerScoreRef.current < bankerScoreRef.current) {
      showResult("Вы проиграли!");
      setResultsCount(prev => ({ ...prev, losses: prev.losses + 1 }));
      updateBankHistory();
    } else {
      showResult("Ничья, ваши ставки возвращаются.");
      setBankAmount(prev => prev + playerBets);
      setResultsCount(prev => ({ ...prev, ties: prev.ties + 1 }));
      updateBankHistory();
    }

    const historyEntry = {
      bankAmount,
      playerScore: playerScoreRef.current,
      bankerScore: bankerScoreRef.current,
      playerBets
    };
    setGameHistory(prev => [...prev, historyEntry]);
    setCardsDealt(false);

    if (bankAmount <= 0) {
      setTimeout(() => {
        alert("Вы проиграли! У вас недостаточно средств для продолжения.");
        window.location.reload();
      }, 2000);
    }
  };

  const showResult = (message) => {
    setResultMessage(message);
    if (bankAmount < 100) {
      setTimeout(() => {
        alert("Игра завершена! У вас недостаточно средств для продолжения.");
        window.location.reload();
      }, 2000);
    } else {
      setTimeout(() => {
        resetGame();
        setResultMessage('');
      }, 1000);
    }
  };

  const resetGame = () => {
    setPlayerCards([]);
    setBankerCards([]);
    playerScoreRef.current = 0;
    bankerScoreRef.current = 0;
    setCardsDealt(false);
    setIsBetButtonDisabled(false);
  };

  const updateBankHistory = () => {
    setBankHistory(prev => [...prev, bankAmount]);
  };

  return (
    <body>
      <DeckLoader setDeckId={setDeckId} />
      <div className="container">
        <h1>Игра в 21 очко</h1>
        <div>Деньги: <span>{bankAmount}</span> долларов</div>

        <div>
          <h2>Ставка:</h2>
          <input
            type="range"
            min="100"
            max={bankAmount}
            step="100"
            value={playerBets}
            onChange={e => setPlayerBets(parseInt(e.target.value))}
          />
          <div>Выбрано: <span>{playerBets}</span> долларов</div>

          {!isBetButtonDisabled && (
            <button onClick={startGame}>Подтвердить ставку</button>
          )}
        </div>

        {cardsDealt && playerCards.length > 0 && (
          <PlayerCards 
            playerCards={playerCards} 
            playerScore={playerScoreRef.current} 
            drawPlayerCard={drawPlayerCard} 
            endPlayerTurn={endPlayerTurn} 
            isBankerTurn={isBankerTurn} 
          />
        )}

        {cardsDealt && bankerCards.length > 0 && (
          <BankerCards 
            bankerCards={bankerCards} 
            bankerScore={bankerScoreRef.current} 
          />
        )}

        <div className={resultMessage ? '' : 'hidden'}>
          <p>{resultMessage}</p>
        </div>
      </div>
      <ChartContainer resultsCount={resultsCount} bankHistory={bankHistory} />
    </body>
  );
}

export default App;