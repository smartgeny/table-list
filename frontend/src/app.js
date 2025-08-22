import React, { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// const API_URL = 'http://localhost:3000/api';
const API_URL = '/api';



const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());

  const offsetRef = useRef(0);
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

 // frontend/src/App.js
const fetchItems = async (isInitial = false) => {
  if (loading || !hasMore) return;
  setLoading(true);

  let endpoint;
  if (isInitial) {
    endpoint = `/api/initial-state`;
  } else {
    endpoint = `/api/items?offset=${offsetRef.current}&limit=20&query=${debouncedSearchQuery}`;
  }

  try {
    const response = await fetch(`${API_URL}/items?offset=0&limit=20`);
    const data = await response.json();

    if (isInitial) {
      setItems(data.items);
      setSelectedIds(new Set(data.selectedIds));
      offsetRef.current = data.items.length;
    } else {
      setItems(prevItems => [...prevItems, ...data.items]);
      offsetRef.current += data.items.length;
    }

    setHasMore(data.hasMore);
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchItems(true);
  }, []);

  useEffect(() => {
    offsetRef.current = 0;
    setHasMore(true);
    setItems([]);
    fetchItems();
  }, [debouncedSearchQuery]);

  const onDragEnd = async (result) => {
    if (!result.destination) return;
  
    const reorderedItems = Array.from(items);
    const [movedItem] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, movedItem);
  
    setItems(reorderedItems);
  
    const newSortedIds = reorderedItems.map(item => item.id);
    await fetch(`${API_URL}/sort`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newSortedIds }),
    });
  };

  const handleCheckboxChange = async (id) => {
    const newSelectedIds = new Set(selectedIds);
    if (newSelectedIds.has(id)) {
      newSelectedIds.delete(id);
    } else {
      newSelectedIds.add(id);
    }
    setSelectedIds(newSelectedIds);
  
    await fetch(`${API_URL}/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(newSelectedIds) }),
    });
  };

  const observer = useRef(null);
  const lastItemRef = useRef(null);
  
  useEffect(() => {
    if (loading || !hasMore) return;
  
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        fetchItems();
      }
    });
  
    if (lastItemRef.current) {
      observer.current.observe(lastItemRef.current);
    }
  
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [loading, hasMore]);

  return (
    <div className="app">
      <h1>Тестовое задание</h1>
      <input
        type="text"
        placeholder="Поиск..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="search-input"
      />
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="droppable-list">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="list"
            >
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={String(item.id)} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="list-item"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => handleCheckboxChange(item.id)}
                      />
                      <span>{item.value}</span>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              {hasMore && <div ref={lastItemRef} className="loading-indicator">Загрузка...</div>}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

export default App;