const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

// --- Инициализация и хранение данных в памяти ---
const DATA_SIZE = 1000000;
const rawData = Array.from({ length: DATA_SIZE }, (_, i) => ({
  id: i + 1,
  value: `Элемент №${i + 1}`,
}));

// Хранилище для состояния
let sortedIds = rawData.map(item => item.id);
let selectedIds = new Set();
const itemsMap = new Map(rawData.map(item => [item.id, item]));
// --- Конец инициализации ---


// Эндпоинт для получения данных с пагинацией и фильтрацией
app.get('/api/items', (req, res) => {
  const { offset = 0, limit = 20, query = '' } = req.query;

  let currentIds;
  if (query) {
    const filteredItems = rawData.filter(item =>
      item.value.toLowerCase().includes(query.toLowerCase())
    );
    currentIds = filteredItems.map(item => item.id);
  } else {
    currentIds = sortedIds;
  }

  const paginatedIds = currentIds.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  const items = paginatedIds.map(id => itemsMap.get(id));
  const hasMore = paginatedIds.length < currentIds.length;

  res.json({ items, hasMore });
});

// Эндпоинт для сохранения сортировки
app.post('/api/sort', (req, res) => {
  const { newSortedIds } = req.body;
  if (!newSortedIds) {
    return res.status(400).send('Invalid data.');
  }
  sortedIds = newSortedIds;
  res.status(200).send('Sort order saved.');
});

// Эндпоинт для сохранения выбранных элементов
app.post('/api/select', (req, res) => {
  const { ids } = req.body;
  selectedIds = new Set(ids);
  res.status(200).send('Selection saved.');
});

// Эндпоинт для получения начального состояния
app.get('/api/initial-state', (req, res) => {
  const initialIds = sortedIds.slice(0, 20);
  const initialItems = initialIds.map(id => itemsMap.get(id));
  const hasMore = sortedIds.length > 20;

  res.json({
    items: initialItems,
    hasMore,
    selectedIds: Array.from(selectedIds),
  });
});

module.exports = app;

// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });