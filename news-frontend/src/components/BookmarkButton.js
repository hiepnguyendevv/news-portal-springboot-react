import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { newsAPI } from '../services/api';

const BookmarkButton = ({ newsId, size = 'md' }) => {
    const { user } = useAuth();
    const [bookmarked, setBookmarked] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if(!user) return;
        newsAPI.isBookmarked(newsId).then(res => setBookmarked(res.data.bookmarked)).catch(()=>{});
    }, [newsId, user]);

    const handleToggle = async () => {
        if(!user) {window.location.href = '/login'; return;}
        try {
            setLoading(true);
            await newsAPI.toggleBookmark(newsId, bookmarked);
            setBookmarked(!bookmarked);

        }finally {
            setLoading(false);
        }
    };

    return (
        <button 
        className={`btn btn-${bookmarked ? 'warning' : 'outline-warning'} btn-${size}`}
        onClick={handleToggle} 
        disabled={loading}
        title={bookmarked ? 'Bỏ lưu' : 'Lưu'}
        aria-label={bookmarked ? 'Bỏ lưu' : 'Lưu tin'}

        >
            <i className={`fas ${bookmarked ? 'fa-bookmark' : 'fa-bookmark'}`}></i>
            {bookmarked ? ' Đã lưu' : ' Lưu'}

        </button>
    );
};

export default BookmarkButton;
    
