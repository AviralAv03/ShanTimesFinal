import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import ShareButtons from '../components/ShareButtons';
import SkeletonCard from '../components/SkeletonCard';

const CategoryNews = ({ category, title, lang }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState(null);
  const [sortOrder, setSortOrder] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');

  const t = {
    readMore: lang === 'hi' ? 'पूरा पढ़िए' : 'Read More',
    published: lang === 'hi' ? 'प्रकाशित:' : 'Published:',
    noNews: lang === 'hi' ? 'इस श्रेणी में कोई समाचार नहीं मिला।' : 'No news found in this category.',
    readTime: lang === 'hi' ? 'मिनट पढ़ने का समय' : 'min read',
    share: lang === 'hi' ? 'साझा करें' : 'Share',
    newest: lang === 'hi' ? 'नवीनतम' : 'Newest',
    oldest: lang === 'hi' ? 'पुराना' : 'Oldest'
  };

  useEffect(() => {
    document.title = `${title} | Shan Times`;

    const fetchNews = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "news"), orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);
        const allNews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const filtered = allNews.filter(n => n.category && n.category.toLowerCase() === category.toLowerCase());
        setNews(filtered);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchNews();
  }, [category, title]);

  const calculateReadTime = (content) => {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
  };

  // Strip HTML tags from content for plain text excerpts
  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  };

  const sortedNews = [...news].sort((a, b) => {
    if (sortOrder === 'newest') {
      return b.timestamp - a.timestamp;
    }
    return a.timestamp - b.timestamp;
  });

  const openNews = (n) => setSelectedNews(n);

  return (
    <div className="container" style={{ flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h2 className="page-title" style={{ marginBottom: 0 }}>{title}</h2>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{
              padding: '10px 15px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--card-bg)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            <option value="newest">{t.newest}</option>
            <option value="oldest">{t.oldest}</option>
          </select>

          <div style={{ display: 'flex', gap: '5px' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: viewMode === 'grid' ? 'var(--primary)' : 'var(--card-bg)',
                color: viewMode === 'grid' ? 'white' : 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              <i className="fas fa-th-large"></i>
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: viewMode === 'list' ? 'var(--primary)' : 'var(--card-bg)',
                color: viewMode === 'list' ? 'white' : 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              <i className="fas fa-list"></i>
            </button>
          </div>
        </div>
      </div>

      <div className={viewMode === 'grid' ? 'news-grid' : ''} style={viewMode === 'list' ? { display: 'flex', flexDirection: 'column', gap: '20px' } : {}}>
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : sortedNews.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'var(--card-bg)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)'
          }}>
            <i className="fas fa-newspaper" style={{ fontSize: '3rem', color: 'var(--text-muted)', marginBottom: '15px' }}></i>
            <p style={{ color: 'var(--text-secondary)' }}>{t.noNews}</p>
          </div>
        ) : (
          sortedNews.map(n => (
            <div
              key={n.id}
              className="news-card"
              style={viewMode === 'list' ? { flexDirection: 'row', alignItems: 'stretch' } : {}}
            >
              {n.imgUrl && (
                <div className="card-img-wrapper" style={viewMode === 'list' ? { width: '300px', flexShrink: 0 } : {}}>
                  <img
                    src={n.imgUrl}
                    alt={n.title}
                    className="card-img"
                    onClick={() => openNews(n)}
                    loading="lazy"
                    style={viewMode === 'list' ? { height: '100%', minHeight: '180px' } : {}}
                  />
                </div>
              )}
              <div className="card-body">
                <span className="card-category">{n.category}</span>
                <h3 className="card-title" onClick={() => openNews(n)} style={{ cursor: 'pointer' }}>
                  {n.title}
                </h3>
                <p className="card-excerpt">
                  {stripHtml(n.content).substring(0, viewMode === 'list' ? 200 : 100)}...
                </p>
                <div className="card-meta">
                  <span>
                    <i className="fas fa-clock"></i>
                    {calculateReadTime(n.content)} {t.readTime}
                  </span>
                  <span>
                    <i className="fas fa-calendar"></i>
                    {new Date(n.timestamp).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN')}
                  </span>
                </div>
                <button className="read-more-btn" onClick={() => openNews(n)}>
                  {t.readMore}
                  <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedNews && (
        <div className="modal-overlay" onClick={() => setSelectedNews(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setSelectedNews(null)}>
              <i className="fas fa-times"></i>
            </button>

            {selectedNews.imgUrl && <img src={selectedNews.imgUrl} alt={selectedNews.title} />}

            <span style={{ color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>
              {selectedNews.category}
            </span>
            <h2>{selectedNews.title}</h2>
            <div className="rich-content" dangerouslySetInnerHTML={{ __html: selectedNews.content }}></div>

            <div className="modal-meta">
              <span>
                <i className="fas fa-calendar"></i>
                {t.published} {new Date(selectedNews.timestamp).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN')}
              </span>
              <span>
                <i className="fas fa-clock"></i>
                {calculateReadTime(selectedNews.content)} {t.readTime}
              </span>
            </div>

            <div style={{ marginTop: '20px' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '10px', color: 'var(--text-primary)' }}>
                <i className="fas fa-share-alt" style={{ marginRight: '8px', color: 'var(--primary)' }}></i>
                {t.share}:
              </p>
              <ShareButtons title={selectedNews.title} articleId={selectedNews.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryNews;