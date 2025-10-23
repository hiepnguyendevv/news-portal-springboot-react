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

  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [pin, setPin] = useState(false);
  const [sortOrder, setSortOrder] = useState('');

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
                if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
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

    const sendEntry = () => {
        if (!clientRef.current?.active) {
            console.error("Client is not connected.");
            return;
        }

        const payload = {
            action:'ADD_ENTRY',
            content: content,
            contentType: 'TEXT',
            entryStatus: pin ? 'PINNED' : 'PUBLISHED',
            mediaUrl: mediaUrl || null,
            sortOrder: sortOrder ? Number(sortOrder) : null,
    };

        clientRef.current.publish({
            destination: `/app/live/${newsId}/addEntry`,
            body: JSON.stringify(payload),
            
      });

      setContent('');
      setMediaUrl('');
      setPin(false);
      setSortOrder('');
    };

  

    const onEdit = (entry) => {
        setEditingEntry(entry);
        setShowEditModal(true);
    };

    const onSaveEdit = (updatedEntry) => {
        // Gửi update qua WebSocket
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

    // Đóng gói props cho form
    const formState = { content, mediaUrl, pin, sortOrder };
    const formHandlers = { setContent, setMediaUrl, setPin, setSortOrder };

  return (
      <div className="container py-4">
          
          <EntryForm
              data={formState}
              handlers={formHandlers}
              onSubmit={sendEntry}
              isConnected={isConnected}
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