// src/components/live-news/EntryList.jsx

import React from 'react';
import EntryItem from './EntryItem';

const EntryList = ({ entries, onEdit, onTogglePin, onDelete }) => {
    if (entries.length === 0) {
        return <div className="alert alert-secondary text-center">Chưa có tin nào...</div>;
    }

    return (
        <div>
            {entries.map((entry) => (
                <EntryItem
                    key={entry.id ?? `temp-${entry.createdAt}`}
                    entry={entry}
                    onEdit={onEdit}
                    onTogglePin={onTogglePin}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
};

export default EntryList;