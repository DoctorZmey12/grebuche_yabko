const tg = window.Telegram.WebApp;
tg.expand();

let wheel;
let spinBtn = document.getElementById('spin-btn');
let timerEl = document.getElementById('timer');

// Инициализация колеса по данным с бэка
async function initWheel() {
  const userId = tg.initDataUnsafe.user.id;  // или другой способ получить user_id
  const resp = await fetch(`/wheel-data?user_id=${userId}`);
  const { prizes, canSpin, currentAttempt, remainingAttempts } = await resp.json();

  if (canSpin) {
    spinBtn.disabled = false;
    timerEl.textContent = `Попытка ${currentAttempt} из 3, осталось ${remainingAttempts}`;
  } else {
    spinBtn.disabled = true;
    timerEl.textContent = remainingAttempts === 0
      ? `Все спины исчерпаны`
      : `Колесо не активно`;
  }

  // Настраиваем сегменты колеса
  let segments = (prizes || []).map(p => ({
    fillStyle: p.color || '#eae56f',
    text: p.name
  }));

  wheel = new Winwheel({
    canvasId: 'canvas',
    numSegments: segments.length,
    segments,
    animation: {
      type: 'spinToStop',
      duration: 5,
      spins: 8,
      callbackFinished: alertPrize
    }
  });
}

function alertPrize(indicatedSegment) {
  const prizeText = indicatedSegment.text;
  tg.sendData(JSON.stringify({ won: prizeText }));
  spinBtn.textContent = `Вы выиграли: ${prizeText}`;
}

// Обработка нажатия на кнопку
spinBtn.addEventListener('click', async () => {
  spinBtn.disabled = true;
  const userId = tg.initDataUnsafe.user.id;
  const resp = await fetch('/spin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId })
  });
  const data = await resp.json();
  if (data.error) {
    timerEl.textContent = data.error;
    return;
  }
  // Запускаем анимацию на нужный сегмент
  wheel.animation.stopAngle = wheel.getRandomForSegment(data.segmentIndex + 1);
  wheel.startAnimation();
});

window.addEventListener('DOMContentLoaded', initWheel);
