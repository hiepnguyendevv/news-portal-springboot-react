import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import BookmarkButton from '../components/BookmarkButton';
import CommentSection from '../components/CommentSection';
import { newsAPI } from '../services/api';
import { useAuth } from '../components/AuthContext';

const LiveEntry = ({ entry }) => (
    <div className="live-entry-article border-bottom py-4">
        <p className="entry-timestamp text-muted mb-2">
            {entry.createdAt ? new Date(entry.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
        </p>
        <div className="entry-body">
            {entry.content && (
                <div
                    className="mb-3"
                    style={{
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        hyphens: 'auto',
                        maxWidth: '100%'
                    }}
                    dangerouslySetInnerHTML={{ __html: entry.content }}
                />
            )}
            
            {entry.mediaUrl && (
                <div className="my-3">
                    {(() => {
                        const url = entry.mediaUrl;
                        const isVideo = /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) || url.includes('/video/');
                        const mediaStyle = { width: '100%', height: 'auto', maxHeight: '800px', objectFit: 'contain' };
                        if (isVideo) {
                            return (
                                <video src={url} controls className="rounded" style={mediaStyle} />
                            );
                        }
                        return (
                            <img src={url} alt="Nội dung tường thuật" className="rounded" style={mediaStyle} />
                        );
                    })()}
                </div>
            )}
        </div>
    </div>
);

const ScrollToTopButton = () => {
    const [isVisible, setIsVisible] = useState(false);

    const toggleVisibility = () => {
        if (window.pageYOffset > 300) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    };

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    useEffect(() => {
        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    return (
        <div className="scroll-to-top">
            {isVisible && 
                <button onClick={scrollToTop} className="btn btn-light border shadow-sm">
                    ↑
                </button>
            }
        </div>
    );
};

export default function LiveNews() {
    const { slugWithId } = useParams();
    const { loading: authLoading } = useAuth();
    
    // Extract ID từ slugWithId
    const extractId = (slugWithId) => {
        if (!slugWithId) return null;
        const parts = slugWithId.split('-');
        return parts[parts.length - 1]; 
    };
    
    const newsId = extractId(slugWithId);
    const [entries, setEntries] = useState([]);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState(null);
    const [news, setNews] = useState(null);
    const clientRef = useRef(null);
    const [sortOrder, setSortOrder] = useState('desc');

    useEffect(() => {
        if (!newsId || authLoading) return; // Đợi auth xong

        const loadInitialData = async () => {
            try {
                // Load live content với sort
                const liveRes = await newsAPI.getLiveContent(newsId, 0, 1000, sortOrder);
                setEntries(liveRes.data.content || liveRes.data || []);

                // Load news detail
                const newsRes = await newsAPI.getNewsById(newsId);
                setNews(newsRes.data);
            } catch (e) {
                console.error('Error loading data:', e);
                setError('Không thể tải dữ liệu: ' + e.message);
                setEntries([]);
            }
        };

        const connect = () => {
            const client = new Client({
                webSocketFactory: () => new SockJS('/ws'),
                reconnectDelay: 5000,
                debug: () => {},
            });

            client.onConnect = () => {
                setConnected(true);
                setError(null);
                client.subscribe(`/topic/live/${newsId}`, (frame) => {
                    try {
                        const eventData = JSON.parse(frame.body);
                        console.log('LiveNews received:', eventData);
                        
                        switch(eventData.action) {
                            case 'ADD_ENTRY':
                                setEntries(prevEntries => {
                                    if (sortOrder === 'desc') {
                                        return [eventData, ...prevEntries];
                                    } else {
                                        return [...prevEntries, eventData];
                                    }
                                });
                                break;
                                
                            case 'UPDATE_ENTRY':
                                setEntries(prevEntries => 
                                    prevEntries.map(entry => entry.id === eventData.id ? eventData : entry)
                                );
                                break;
                                
                            case 'REMOVE_ENTRY':
                                setEntries(prevEntries => 
                                    prevEntries.filter(entry => entry.id !== eventData.id)
                                );
                                break;
                                
                            default:
                                console.log('Unknown action:', eventData.action);
                                break;
                        }
                    } catch (e) {
                        console.error('Error parsing WebSocket message:', e, frame.body);
                    }
                });
            };

            client.onStompError = () => setError('Broker STOMP lỗi');
            client.onWebSocketError = () => { setConnected(false); setError('Không thể kết nối WebSocket'); };
            
            client.activate();
            clientRef.current = client;
        };

        if (newsId) {
            loadInitialData();
            connect();
        }

        return () => {
            try { clientRef.current?.deactivate(); } catch {}
        };
    }, [newsId, sortOrder, authLoading]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            // hour: '2-digit',
            // minute: '2-digit'
        });
    };



    return (
        <div className="container py-4">
            {news && (
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                            <Link to="/" className="text-decoration-none">Trang chủ</Link>
                        </li>
                        <li className="breadcrumb-item">
                            <Link className="text-decoration-none" to={`/category/${encodeURIComponent(news.category?.slug || news.category)}`}>
                                {news.category?.name || news.category}
                            </Link>
                        </li>
                        <li className="breadcrumb-item active">{news.title}</li>
                    </ol>
                </nav>
            )}

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            <article className="row">
                <div className="col-lg-8 mx-auto">
                    {news && (
                        <header className="mb-4">
                       
                            <h1 className="display-6 mb-3">{news.title}</h1>
                            
                            <div className="news-meta text-muted mb-3">
                                <i className="fas fa-user me-1"></i>
                                {news.author?.fullName || news.author?.username || news.author}
                                <i className="fas fa-clock ms-3 me-1"></i>
                                {formatDate(news.createdAt)}
                            </div>
                            
                            {news.summary && (
                                <p className="lead text-muted">{news.summary}</p>
                            )}
                        </header>
                    )}

                    <div className="news-content">
                        <div className="d-flex justify-content-end mb-3 gap-2">
                            <button 
                                className={`btn btn-sm ${sortOrder === 'desc' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                onClick={() => setSortOrder('desc')}
                            >
                                Mới nhất
                            </button>
                            <button 
                                className={`btn btn-sm ${sortOrder === 'asc' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                onClick={() => setSortOrder('asc')}
                            >
                                Cũ nhất
                            </button>
                        </div>

                        <div className="fs-5 lh-lg">
                            <div>
                                {entries.map(e => <LiveEntry key={e.id} entry={e} />)}
                            </div>
                        </div>
                    </div>

                    <ScrollToTopButton />

                    <hr className="my-5" />
                    
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <small className="text-muted">
                                Cập nhật lần cuối: {formatDate(news?.updatedAt)}
                            </small>
                        </div>
                        <div>
                            <button className="btn btn-outline-primary me-2">
                                <i className="fas fa-share me-1"></i>
                                Chia sẻ
                            </button>
                            {news?.id && <BookmarkButton newsId={news.id} />}
                        </div>
                    </div>
                    
                    <div className="mb-4 mt-4">
                        <div className="d-flex flex-wrap">
                            {news?.tags && news.tags.map((tag) => (
                                <span key={tag.id} className="badge bg-primary me-2">
                                    {tag != null ? tag.name : 'null'}
                                </span>
                            ))}
                        </div>
                    </div>
                    
                </div>
            </article>
            
            {news?.id && <CommentSection newsId={news.id} />}
        </div>
    );
}