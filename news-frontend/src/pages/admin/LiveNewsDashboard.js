import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import EntryForm from '../../components/live-news/EntryForm';
import EntryList from '../../components/live-news/EntryList';
import EditEntryModal from '../../components/live-news/EditEntryModal';
import ConfirmModal from '../../components/ConfirmModal';
import { useAuth } from '../../components/AuthContext';
import { getAccessToken } from '../../services/api';

const LiveNewsDashboard = () => {
  const { newsId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const clientRef = useRef(null);
  const [sortOrder, setSortOrder] = useState('desc'); 


    useEffect(() => {
            // Đợi authentication xong rồi mới kết nối WebSocket
            if (authLoading || !newsId) {
                return;
            }
            
            const connect = () => {
            const socket = new SockJS('/ws');
            const token = getAccessToken();
            const client = new Client({
            webSocketFactory: () => socket,
                    debug: () => {},
            reconnectDelay: 5000,
            connectHeaders: token ? {
                Authorization: `Bearer ${token}`
            } : {},
                });

                client.onConnect = () => {
                    console.log('Đã kết nối WebSocket');
                    setIsConnected(true);
                    client.subscribe(`/topic/live/${newsId}`, (frame) => {
                        const eventData = JSON.parse(frame.body);
                        console.log('eventData', eventData);
                        
                        switch(eventData.action){
                            case 'ADD_ENTRY':
                                console.log('add successfuly');
                                setEntries(prev => {
                                    if (sortOrder === 'desc') {
                                        return [eventData, ...prev]; 
                                    } else {
                                        return [...prev, eventData];
                                    }
                               });
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

            connect();

        return () => {
                if (clientRef.current?.active) {
                    clientRef.current.deactivate();
                }
        };
    }, [newsId, authLoading, sortOrder]);
    

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const res = await fetch(`/api/live-content/news/${newsId}?page=0&size=20&sort=${sortOrder}`);                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(`HTTP ${res.status}: ${text.slice(0,200)}`);
                  }
                const data = await res.json();
                setEntries(data.content);
            } catch (err) {
                console.error('Error loading initial data:', err);
                setEntries([]); // Set empty array on error
            }
        };

        if (newsId) {
            loadInitialData();
        }
    }, [newsId, sortOrder]);
    

    const sendEntry = (payload) => {
        if (!clientRef.current?.active) {
            console.error("Client is not connected.");
            return;
        }

        // Thêm userId vào payload
        const payloadWithUserId = {
            ...payload,
            userId: user?.id
        };

        clientRef.current.publish({
            destination: `/app/live/${newsId}/addEntry`,
            body: JSON.stringify(payloadWithUserId),
            
      });

  
    };

  

    const onEdit = (entry) => {

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

    const onDelete = (entry) => {
        setEntryToDelete(entry);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = () => {
        if (!entryToDelete) return;

        if (!clientRef.current?.active) {
            console.error('Không thể xóa: Mất kết nối WebSocket.');
            setShowDeleteModal(false);
            setEntryToDelete(null);
            return;
        }

        const payload = {
            action: 'REMOVE_ENTRY',
            id: entryToDelete.id 
        };

        clientRef.current.publish({
            destination: `/app/live/${newsId}/deleteEntry`,
            body: JSON.stringify(payload),
        });

        setShowDeleteModal(false);
        setEntryToDelete(null);
    };

    const handleCancelDelete = () => {
        setShowDeleteModal(false);
        setEntryToDelete(null);
    };



  return (
      <div className="container py-4">
          
          <EntryForm
              onSubmit={sendEntry}
              isConnected={isConnected}
          />
          {/* THANH CÔNG CỤ SẮP XẾP */}
          <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="fw-bold text-uppercase text-danger">
                    <span className="spinner-grow spinner-grow-sm me-2" role="status"/>
                    Trực tiếp
                </span>
                
                <div className="btn-group" role="group">
                    <button 
                        type="button" 
                        className={`btn btn-sm ${sortOrder === 'desc' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setSortOrder('desc')}
                    >
                         Mới nhất
                    </button>
                    <button 
                        type="button" 
                        className={`btn btn-sm ${sortOrder === 'asc' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setSortOrder('asc')}
                    >
                        Cũ nhất
                    </button>
                </div>
            </div>
          
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

          <ConfirmModal
              show={showDeleteModal}
              title="Xóa entry"
              message="Bạn có chắc chắn muốn xóa tin này? Hành động này không thể hoàn tác."
              confirmText="Xóa"
              cancelText="Hủy"
              confirmBtnClass="btn-danger"
              onConfirm={handleConfirmDelete}
              onClose={handleCancelDelete}
          />
    </div>
  );
};

export default LiveNewsDashboard;