// 7573253327:AAGK3qD_q2ZEx2bZ599xm8UsxpBrJdjprmo
// 1002188856350

require('dotenv').config();
const axios = require('axios');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Настройка middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Функция для чтения всех данных из папки `data`
function loadAllItems() {
  const dataPath = path.join(__dirname, 'data');
  const files = fs.readdirSync(dataPath);
  return files.map((file) => JSON.parse(fs.readFileSync(path.join(dataPath, file), 'utf-8')));
}

// Функция для загрузки данных конкретного пункта
function loadItemByRoute(route) {
  const items = loadAllItems();
  return items.find((item) => item.route === route) || null;
}

// Главная страница
app.get('/', (req, res) => {
  const items = loadAllItems();

  const gridHtml = items.map(
    (item) => `<div><a href='/item/${item.route}'>${item.name}</a></div>`
  ).join('');

  const html = renderHtml('views/layout.html', { 
    content: renderHtml('views/index.html', { gridHtml })
  });
  res.send(html);
});

// Страницы пунктов
app.get('/item/:route', (req, res) => {
  const item = loadItemByRoute(req.params.route);

  if (!item) {
    return res.status(404).send('<h1>Страница не найдена</h1>');
  }

  const html = renderHtml('views/layout.html', { 
    content: renderHtml('views/item.html', {
      itemName: item.name,
      itemDescription: item.description,
    })
  });
  res.send(html);
});

// // Функция для чтения HTML-файлов
// function renderHtml(filePath, replacements = {}) {
//   let html = fs.readFileSync(path.join(__dirname, filePath), 'utf-8');
//   for (const [key, value] of Object.entries(replacements)) {
//     html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
//   }
//   return html;
// }

function renderHtml(filePath, replacements = {}) {
  let html = fs.readFileSync(path.join(__dirname, filePath), 'utf-8');
  
  // Чтение футера
  const footerHtml = fs.readFileSync(path.join(__dirname, 'views/footer.html'), 'utf-8');
  replacements.footer = footerHtml;

  for (const [key, value] of Object.entries(replacements)) {
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return html;
}

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;


// Обработчик формы
app.post('/submit-form', async (req, res) => {
  const { name, phone, email, problem, consultationType } = req.body;

  // Сообщение для Telegram
  const message = `
  📝 Новая заявка на консультацию:
  - Имя: ${name}
  - Телефон: ${phone}
  - Email: ${email}
  - Проблема: ${problem}
  - Формат консультации: ${consultationType}
  `;

  try {
    // Отправляем сообщение в Telegram
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHANNEL_ID,
      text: message,
    });

    res.send('<h1>Спасибо за вашу заявку! Мы свяжемся с вами в ближайшее время.</h1>');
  } catch (error) {
    console.error('Ошибка отправки в Telegram:', error);
    res.status(500).send('<h1>Ошибка отправки данных. Пожалуйста, попробуйте позже.</h1>');
  }
});


// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
