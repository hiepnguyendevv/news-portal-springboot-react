import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { newsAPI } from '../../services/api';
import EntryForm from '../../components/live-news/EntryForm';
import EntryList from '../../components/live-news/EntryList';
import EditEntryModal from '../../components/live-news/EditEntryModal';

const LiveNewsDashboard = () => {
  const { newsId } = useParams();
  const [entries, setEntries] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const clientRef = useRef(null);


  useEffect(() => {
        const connect = () => {
        const socket = new SockJS('/ws');
        const client = new Client({
          webSocketFactory: () => socket,
                debug: () => {},
          reconnectDelay: 5000,
            });

            client.onConnect = () => {
                console.log('✅ Đã kết nối WebSocket');
                setIsConnected(true);
                client.subscribe(`/topic/live/${newsId}`, (frame) => {
                    const eventData = JSON.parse(frame.body);
                    console.log('eventData', eventData);
                    
                    switch(eventData.action){
                        case 'ADD_ENTRY':
                            console.log('add successfuly');
                            setEntries(prev => [eventData, ...prev]);
                            break;
                        case 'UPDATE_ENTRY':
                            console.log('update successfuly');
                            setEntries(prev => prev.map(entry => entry.id === eventData.id ? eventData : entry));
                            break;

                        case 'REMOVE_ENTRY':
                            setEntries(prev => prev.filter(entry => entry.id !== eventData.id));
                            console.log('remove successfuly');
                            break;
                        default:
                            console.error('Unknown action:', eventData.action);
                            break;
                    }
                });
            };

            client.onStompError = (frame) => {
                console.error('Lỗi kết nối STOMP:', frame.headers['message']);
                setIsConnected(false);
            };

            client.onWebSocketClose = () => {
                console.log('Kết nối WebSocket đã đóng');
                setIsConnected(false);
            };

            client.activate();
                clientRef.current = client;
    };

        if (newsId) {
            connect();
        }

    return () => {
            if (clientRef.current?.active) {
                clientRef.current.deactivate();
            }
    };
  }, [newsId]);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const res = await fetch(`/api/live-content/news/${newsId}?page=0&size=20`);
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(`HTTP ${res.status}: ${text.slice(0,200)}`);
                  }
                const data = await res.json();
                setEntries(data.content);
            } catch (err) {
                console.error('Error loading initial data:', err);
            }
        };

        if (newsId) {
            loadInitialData();
        }
    }, [newsId]);

    const sendEntry = (payload) => {
        if (!clientRef.current?.active) {
            console.error("Client is not connected.");
            return;
        }


        clientRef.current.publish({
            destination: `/app/live/${newsId}/addEntry`,
            body: JSON.stringify(payload),
            
      });

  
    };

  

    const onEdit = (entry) => {
        // === DEBUG 1: KIỂM TRA NGUỒN ===
        console.log('--- DEBUG 1: Mở Modal ---');
        console.log('Dữ liệu gốc (entry) được truyền vào:', entry);
        if (entry.content) {
            console.log('Nội dung gốc CÓ tồn tại:', entry.content.substring(0, 50) + '...'); // In 50 ký tự đầu
        } else {
            console.error('LỖI: Nội dung gốc (entry.content) là RỖNG hoặc NULL');
        }
        // === KẾT THÚC DEBUG 1 ===
        setEditingEntry(entry);
        setShowEditModal(true);
    };

    const onSaveEdit = (updatedEntry) => {
        if (clientRef.current?.active) {
            const payload = {
                action:'UPDATE_ENTRY',
                id: updatedEntry.id,
                content: updatedEntry.content,
                contentType: 'TEXT',
                entryStatus: updatedEntry.entryStatus,
                mediaUrl: updatedEntry.mediaUrl,    
                sortOrder: updatedEntry.sortOrder,
            };

            // === DEBUG: KIỂM TRA PAYLOAD CUỐI CÙNG ===
            console.log('--- LiveNewsDashboard: onSaveEdit ---');
            console.log('Payload sắp gửi qua WS:', JSON.stringify(payload, null, 2));
            // === KẾT THÚC DEBUG ===

            clientRef.current.publish({
                destination: `/app/live/${newsId}/updateEntry`,
                body: JSON.stringify(payload),
            });
        }
    };

    const onTogglePin = (entry) => {
        const newStatus = entry.entryStatus === 'PINNED' ? 'PUBLISHED' : 'PINNED';
        const updatedEntry = { ...entry, entryStatus: newStatus };
        onSaveEdit(updatedEntry);
    };

    const onDelete = async (entry) => {
        if (window.confirm('Bạn có chắc muốn xóa entry này?')) {
           
            if (!clientRef.current?.active) {
                console.error('Không thể xóa: Mất kết nối WebSocket.');
                return;
            }
    
            const payload = {
                action: 'REMOVE_ENTRY',
                id: entry.id 
            };
    
            clientRef.current.publish({
                destination: `/app/live/${newsId}/deleteEntry`,
                body: JSON.stringify(payload),
            });
        }
    };



  return (
      <div className="container py-4">
          
          <EntryForm
              onSubmit={sendEntry}
              isConnected={isConnected}
              newsId={newsId}
          />
          
          <EntryList
              entries={entries}
              onEdit={onEdit}
              onTogglePin={onTogglePin}
              onDelete={onDelete}
          />

          <EditEntryModal
              entry={editingEntry}
              isOpen={showEditModal}
              onClose={() => setShowEditModal(false)}
              onSave={onSaveEdit}
              isConnected={isConnected}
          />
    </div>
  );
};

export default LiveNewsDashboard;