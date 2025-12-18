import React from 'react';

const TrendingNews = ({ news, lang, onSelectNews }) => {
    const t = {
        title: lang === 'hi' ? 'ट्रेंडिंग खबरें' : 'Trending News'
    };

    const trendingNews = news.slice(0, 5);

    if (trendingNews.length === 0) return null;

    return (
        <div className="trending-section">
            <div className="section-title">
                <i className="fas fa-fire"></i>
                <h2>{t.title}</h2>
            </div>
            <div className="trending-list">
                {trendingNews.map((article, index) => (
                    <div
                        key={article.id}
                        className="trending-item"
                        onClick={() => onSelectNews(article)}
                    >
                        <span className="trending-number">{String(index + 1).padStart(2, '0')}</span>
                        <div className="trending-content">
                            <h4>{article.title.substring(0, 60)}{article.title.length > 60 ? '...' : ''}</h4>
                            <span>
                                <i className="fas fa-clock" style={{ marginRight: '5px' }}></i>
                                {new Date(article.timestamp).toLocaleDateString(
                                    lang === 'hi' ? 'hi-IN' : 'en-IN'
                                )}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TrendingNews;
