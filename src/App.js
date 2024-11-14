import React, { useState, useEffect, useRef } from 'react';
import { Pie, Line } from 'react-chartjs-2'; // Импортируем круговую диаграмму и линейный график
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
} from 'chart.js';  // Импортируем необходимые модули Chart.js
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
  const [showBetAmount, setShowBetAmount] = useState(false);
  const [resultsCount, setResultsCount] = useState({ wins: 0, losses: 0, ties: 0 });
  const [cardsDealt, setCardsDealt] = useState(false);
  const [buttonsDisabled, setButtonsDisabled] = useState(false);
  const [bankHistory, setBankHistory] = useState([]); // Для графика подсчета банка
  const [isBetButtonDisabled, setIsBetButtonDisabled] = useState(false); // Новое состояние для кнопки

  // Эффект для загрузки колоды карт после монтирования
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
  }, []);

  const startGame = async () => {
    if (bankAmount < playerBets) {
      alert("У вас недостаточно денег для этой ставки.");
      return;
    }

    setIsBetButtonDisabled(true); // Отключаем кнопку "Выбрать ставку"
    setShowBetAmount(false);
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
    if (!deckId) return;

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
      checkBankerScore();
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
    if (playerScoreRef.current > 21) {
      await new Promise(resolve => setTimeout(resolve, 1000)); 
      showResult("Перебор! Вы проиграли.");
      setResultsCount(prev => ({ ...prev, losses: prev.losses + 1 }));
      setCardsDealt(false);
      updateBankHistory();
    } else if (playerScoreRef.current === 21) {
      showResult("Поздравляем! Вы набрали 21 очко!");
      setBankAmount(prev => prev + playerBets * 2);
      setResultsCount(prev => ({ ...prev, wins: prev.wins + 1 }));
      updateBankHistory();
    }

  };

  const checkBankerScore = () => {
    if (bankerScoreRef.current > 21) {
      showResult("Банкир перебрал! Вы выиграли.");
      setResultsCount(prev => ({ ...prev, wins: prev.wins + 1 }));
      setCardsDealt(false);
      updateBankHistory();
    }

  };

  const endPlayerTurn = () => {
    playBankerTurn();
  };

  const playBankerTurn = async () => {
    while (bankerScoreRef.current < 17) {
      await drawBankerCard();
      await new Promise(resolve => setTimeout(resolve, 1000)); 
    }
    determineWinner();
  };

  const determineWinner = () => {
    let message;

    if (bankerScoreRef.current > 21) {
      message = "Банкир перебрал! Вы выиграли.";
      setBankAmount(prev => prev + playerBets * 2);
      setResultsCount(prev => ({ ...prev, wins: prev.wins + 1 }));
      updateBankHistory();
    } else if (playerScoreRef.current > bankerScoreRef.current) {
      message = "Поздравляем! Вы выиграли.";
      setBankAmount(prev => prev + playerBets * 2);
      setResultsCount(prev => ({ ...prev, wins: prev.wins + 1 }));
      updateBankHistory();
    } else if (playerScoreRef.current < bankerScoreRef.current) {
      message = "Вы проиграли!";
      setResultsCount(prev => ({ ...prev, losses: prev.losses + 1 }));
      updateBankHistory();
    } else {
      message = "Ничья, ваши ставки возвращаются.";
      setBankAmount(prev => prev + playerBets);
      setResultsCount(prev => ({ ...prev, ties: prev.ties + 1 }));
      updateBankHistory();
    }

    setResultMessage(message);
    const historyEntry = { result: message, bankAmount, playerScore: playerScoreRef.current, bankerScore: bankerScoreRef.current, playerBets };
    setGameHistory(prev => [...prev, historyEntry]);
    setCardsDealt(false);

    // Включаем кнопку "Выбрать ставку" в конце партии
    setIsBetButtonDisabled(false);

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
      setTimeout(resetGame, 2000);
    }
  };

  const resetGame = () => {
    setPlayerCards([]);
    setBankerCards([]);
    playerScoreRef.current = 0;
    bankerScoreRef.current = 0;
    setShowBetAmount(true);
    setCardsDealt(false);

    // Включаем кнопку "Выбрать ставку"
    setIsBetButtonDisabled(false);
  };

  const updateBankHistory = () => {
    setBankHistory(prev => [...prev, bankAmount]);
  };

  // Данные для круговой диаграммы
  const chartDataPie = {
    labels: ['Победы', 'Поражения', 'Ничьи'],
    datasets: [
      {
        label: 'Количество игр',
        data: [resultsCount.wins, resultsCount.losses, resultsCount.ties],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 206, 86, 0.6)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Данные для графика подсчетов банка в зависимости от партии
  const chartDataLine = {
    labels: bankHistory.map((_, index) => `Партию ${index + 1}`),
    datasets: [
      {
        label: 'Деньги',
        data: bankHistory,
        fill: false,
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1
      },
    ],
  };

  return (
    <body>
      <div className="container">
        <h1>Игра в 21 очко</h1>
        <div>Деньги: <span>{bankAmount}</span> долларов</div>
        {showBetAmount ? (
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
            <button onClick={startGame}>Подтвердить ставку</button>
          </div>
        ) : (
          <button onClick={() => setShowBetAmount(true)} disabled={isBetButtonDisabled}>Выбрать ставку</button>
        )}
  
        {cardsDealt && playerCards.length > 0 && (
          <div className="cards-section">
            <h2>Ваши карты:</h2>
            <div>{playerCards.map(card => <img key={card.code} src={card.image} alt={card.value} className="card" />)}</div>
            <div>Очки: <span>{playerScoreRef.current}</span></div>
            <div className="buttons">
              <button onClick={drawPlayerCard} disabled={buttonsDisabled}>Взять карту</button>
              <button onClick={endPlayerTurn} disabled={buttonsDisabled}>Остановиться</button>
            </div>
          </div>
        )}
        
        {cardsDealt && bankerCards.length > 0 && (
          <div className="cards-section">
            <h2>Карты банкира:</h2>
            <div>{bankerCards.map(card => <img key={card.code} src={card.image} alt={card.value} className="card" />)}</div>
            <div>Очки: <span>{bankerScoreRef.current}</span></div>
          </div>
        )}
        
        <div className={resultMessage ? '' : 'hidden'}>
          <p>{resultMessage}</p>
        </div>
      </div>
  
      <div className="chart-section" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          <div style={{ width: '300px', height: '300px' }}>
          <h2>Деньги</h2>
          <Line data={chartDataLine} options={{ maintainAspectRatio: false, responsive: true }} />
        </div>
        <div style={{ width: '300px', height: '300px' }}>
          <h2>История партий</h2>
          <Pie data={chartDataPie} options={{ maintainAspectRatio: false, responsive: true }} />
        </div>
      </div>
    </body>
  );
}

export default App;
