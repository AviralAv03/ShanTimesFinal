import React, { useState, useEffect, useRef } from 'react';

const SearchModal = ({ isOpen, onClose, news, onSelectNews }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        if (query.length > 0) {
            const filtered = news.filter(n =>
                n.title.toLowerCase().includes(query.toLowerCase()) ||
                n.content.toLowerCase().includes(query.toLowerCase()) ||
                (n.category && n.category.toLowerCase().includes(query.toLowerCase()))
            );
            setResults(filtered.slice(0, 8));
        } else {
            setResults([]);
        }
    }, [query, news]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    const handleSelect = (article) => {
        onSelectNews(article);
        onClose();
        setQuery('');
    };

    if (!isOpen) return null;

    return (
        <div className="search-overlay" onClick={onClose}>
            <div className="search-container" onClick={(e) => e.stopPropagation()}>
                <div className="search-input-wrap">
                    <i className="fas fa-search"></i>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search news..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button className="search-close" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {results.length > 0 && (
                    <div className="search-results">
                        {results.map(article => (
                            <div
                                key={article.id}
                                className="search-result-item"
                                onClick={() => handleSelect(article)}
                            >
                                <h4>{article.title}</h4>
                                <p>
                                    <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                                        {article.category}
                                    </span>
                                    {' • '}
                                    {article.content.substring(0, 80)}...
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {query.length > 0 && results.length === 0 && (
                    <div className="search-results">
                        <div className="search-result-item">
                            <p style={{ textAlign: 'center', padding: '20px' }}>
                                No results found for "{query}"
                            </p>
                        </div>
                    </div>
                )}

                <p className="search-hint">
                    Press <kbd>ESC</kbd> to close
                </p>
            </div>
        </div>
    );
};

export default SearchModal;
