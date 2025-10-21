import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const LiveBlog = () => {
  const { slugWithId } = useParams();
  
  // Extract ID từ slugWithId nếu cần
  const extractId = (slugWithId) => {
    if (!slugWithId) return null;
    const parts = slugWithId.split('-');
    return parts[parts.length - 1]; // Lấy phần cuối cùng (123)
  };
  
  const id = extractId(slugWithId);
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  const stompClient = useRef(null);

  // Kết nối WebSocket
  useEffect(() => {
    if (!id) return;
    
    connectWebSocket();
    loadInitialData();

    return () => {
      if (stompClient.current) {
        stompClient.current.deactivate();
      }
    };
  }, [id]);

  const connectWebSocket = () => {
    try {
      const socket = new SockJS('http://localhost:8080/ws');

      // Tạo STOMP client
      stompClient.current = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 5000, // tự động reconnect sau 5s nếu mất kết nối
        debug: () => {}, // tắt log debug

        onConnect: () => {
          console.log('✅ Connected to WebSocket');
          setIsConnected(true);
          setError(null);

          // Subscribe để nhận dữ liệu realtime
          stompClient.current.subscribe(`/topic/live/${id}`, (message) => {
            const event = JSON.parse(message.body);
            console.log('📩 Received live update:', event);
            setEntries((prev) => [event, ...prev]);
          });
        },

        onStompError: (frame) => {
          console.error('Broker reported error: ' + frame.headers['message']);
          setError('Lỗi kết nối đến broker');
        },

        onWebSocketError: (err) => {
          console.error('WebSocket error:', err);
          setError('Không thể kết nối WebSocket');
          setIsConnected(false);
        },
      });

      stompClient.current.activate();
    } catch (err) {
      console.error('Error creating WebSocket connection:', err);
      setError('Lỗi tạo kết nối WebSocket');
    }
  };

  // Tải dữ liệu ban đầu
  const loadInitialData = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/live-content/news/${id}?page=0&size=20`);
      const data = await response.json();
      console.log('📤 Received initial data:', data);
      if (data.content) {
        setEntries(data.content);
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Không thể tải dữ liệu ban đầu');
    }
  };

  // Gửi entry mới
  const sendEntry = () => {
    if (!newEntry.trim() || !stompClient.current || !isConnected) return;

    const payload = {
      content: newEntry,
      contentType: 'TEXT',
      entryStatus: 'PUBLISHED',
    };

    try {
      stompClient.current.publish({
        destination: `/app/live/${id}/addEntry`,
        body: JSON.stringify(payload),
      });
      console.log('📤 Sent entry:', payload);
      setNewEntry('');
    } catch (err) {
      console.error('Error sending entry:', err);
      setError('Không thể gửi tin mới');
    }
  };

  const formatTime = (dateTime) => new Date(dateTime).toLocaleTimeString('vi-VN');

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Live Blog - News ID: {id}</h2>

      {/* Trạng thái kết nối */}
      <div style={{ marginBottom: '20px' }}>
        <span
          style={{
            color: isConnected ? 'green' : 'red',
            fontWeight: 'bold',
          }}
        >
          {isConnected ? '🟢 Đã kết nối' : '🔴 Chưa kết nối'}
        </span>
        {error && <span style={{ color: 'red', marginLeft: '10px' }}>❌ {error}</span>}
      </div>

      {/* Form gửi tin mới */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h3>Gửi tin mới:</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
            placeholder="Nhập nội dung tin mới..."
            style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '3px' }}
            onKeyPress={(e) => e.key === 'Enter' && sendEntry()}
          />
          <button
            onClick={sendEntry}
            disabled={!isConnected || !newEntry.trim()}
            style={{
              padding: '8px 16px',
              backgroundColor: isConnected ? '#007bff' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: isConnected ? 'pointer' : 'not-allowed',
            }}
          >
            Gửi
          </button>
        </div>
      </div>

      {/* Danh sách entries */}
      <div>
        <h3>Live Entries ({entries.length}):</h3>
        {entries.length === 0 ? (
          <p>Chưa có tin nào...</p>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {entries.map((entry, index) => (
              <div
                key={entry.id || index}
                style={{
                  padding: '10px',
                  marginBottom: '10px',
                  border: '1px solid #eee',
                  borderRadius: '5px',
                  backgroundColor: index === 0 ? '#f0f8ff' : 'white',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>#{entry.id}</strong>
                  <span style={{ color: '#666', fontSize: '12px' }}>{formatTime(entry.createdAt)}</span>
                </div>
                <div style={{ marginTop: '5px' }}>{entry.content}</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  Type: {entry.contentType} | Status: {entry.entryStatus}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveBlog;
