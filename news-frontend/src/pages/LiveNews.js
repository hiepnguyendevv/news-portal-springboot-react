import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import BookmarkButton from '../components/BookmarkButton';
import CommentSection from '../components/CommentSection';

// --- COMPONENT CON: HIỂN THỊ MỘT ENTRY ---
const LiveEntry = ({ entry }) => (
    <div className="live-entry-article border-bottom py-4">
        <p className="entry-timestamp text-muted mb-2">
            {entry.createdAt ? new Date(entry.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
        </p>
        <div className="entry-body">
            {entry.content && (
                <p className="mb-3" style={{
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    hyphens: 'auto',
                    maxWidth: '100%'
                }}>{entry.content}</p>
            )}
            
            {entry.mediaUrl && (
                <div className="my-3">
                    {/* Kiểm tra loại media dựa trên URL */}
                    {entry.mediaUrl.includes('youtube.com') || entry.mediaUrl.includes('youtu.be') || entry.mediaUrl.includes('vimeo.com') ? (
                        <div className="ratio ratio-16x9">
                            <iframe title={`video-${entry.id}`} src={entry.mediaUrl} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                        </div>
                    ) : entry.mediaUrl.includes('twitter.com') || entry.mediaUrl.includes('x.com') ? (
                        <a href={entry.mediaUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-secondary btn-sm">Xem trên Twitter/X</a>
                    ) : (
                        <figure className="figure">
                            <img src={entry.mediaUrl} alt="Nội dung tường thuật" className="figure-img img-fluid rounded" />
                        </figure>
                    )}
                </div>
            )}
        </div>
    </div>
);

// --- COMPONENT CON: NÚT SCROLL LÊN ĐẦU TRANG ---
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

// --- COMPONENT CHÍNH: LIVE BLOG ---
export default function LiveNews() {
    const { slugWithId } = useParams();
    
    // Extract ID từ slugWithId
    const extractId = (slugWithId) => {
        if (!slugWithId) return null;
        const parts = slugWithId.split('-');
        return parts[parts.length - 1]; // Lấy phần cuối cùng (123)
    };
    
    const newsId = extractId(slugWithId);
    const [entries, setEntries] = useState([]);
    const [pinnedEntry, setPinnedEntry] = useState(null);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState(null);
    const [news, setNews] = useState(null);
    const clientRef = useRef(null);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Load live content
                const res = await fetch(`http://localhost:8080/api/live-content/news/${newsId}?page=0&size=50`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const page = await res.json();
                if (page?.content) {
                    const allEntries = page.content;
                    const pinned = allEntries.find(e => e.entryStatus === 'PINNED');
                    const regular = allEntries.filter(e => e.entryStatus !== 'PINNED').reverse();
                    
                    setPinnedEntry(pinned);
                    setEntries(regular);
                }

                // Load news detail
                const newsRes = await fetch(`http://localhost:8080/api/news/${newsId}`);
                if (newsRes.ok) {
                    const newsData = await newsRes.json();
                    setNews(newsData);
                }
            } catch (e) {
                setError('Không thể tải dữ liệu');
            }
        };

        const connect = () => {
            const client = new Client({
                webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
                reconnectDelay: 5000,
                debug: () => {},
            });

            client.onConnect = () => {
                setConnected(true);
                setError(null);
                client.subscribe(`/topic/live/${newsId}`, (frame) => {
                    const newEntry = JSON.parse(frame.body);
                    
                    // **THAY ĐỔI LOGIC TẠI ĐÂY**
                    // Nếu tin mới là tin ghim, cập nhật tin ghim
                    if (newEntry.entryStatus === 'PINNED') {
                        setPinnedEntry(newEntry);
                    } else {
                        // Nếu không, thêm vào cuối danh sách tin thường
                        setEntries(prevEntries => [...prevEntries, newEntry]);
                    }
                });
            };

            client.onStompError = () => setError('Broker STOMP lỗi');
            client.onWebSocketError = () => { setConnected(false); setError('Không thể kết nối WebSocket'); };
            
            client.activate();
            clientRef.current = client;
        };

        loadInitialData();
        connect();

        return () => {
            try { clientRef.current?.deactivate(); } catch {}
        };
    }, [newsId]);

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

                    {/* Nội dung live blog */}
                    <div className="news-content">
                        <div className="fs-5 lh-lg">
                            {/* Hiển thị tin ghim */}
                    {pinnedEntry && (
                        <div className="pinned-entry bg-light p-3 p-md-4 rounded my-4">
                            <h5 className="fw-bold mb-3">📌 TIN NỔI BẬT</h5>
                            <div className="live-entry-article py-0">
                                 <LiveEntry entry={pinnedEntry} />
                            </div>
                        </div>
                    )}
                    
                            {/* Danh sách các entry */}
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
                            <BookmarkButton newsId={news?.id} />
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
            
            <CommentSection newsId={news?.id} />
        </div>
    );
}