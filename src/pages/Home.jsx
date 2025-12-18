import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';

import WeatherWidget from '../components/WeatherWidget';
import TrendingNews from '../components/TrendingNews';
import Newsletter from '../components/Newsletter';
import ShareButtons from '../components/ShareButtons';
import SkeletonCard from '../components/SkeletonCard';

const Home = ({ lang, toast }) => {
  const [news, setNews] = useState([]);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState(null);
  const [features, setFeatures] = useState({ newsletterEnabled: true, adsEnabled: true });
  const [popularSettings, setPopularSettings] = useState({ weekManual: [], monthManual: [], autoPopulate: true });
  const [latestPaper, setLatestPaper] = useState(null);

  const t = {
    topStory: lang === 'hi' ? 'प्रमुख खबर' : 'TOP STORY',
    latestNews: lang === 'hi' ? 'ताज़ा खबरें' : 'Latest News',
    topNews: lang === 'hi' ? 'शीर्ष समाचार' : 'Top News',
    popularWeek: lang === 'hi' ? 'इस सप्ताह लोकप्रिय' : 'Popular This Week',
    popularMonth: lang === 'hi' ? 'इस माह लोकप्रिय' : 'Popular This Month',
    adSpace: lang === 'hi' ? 'विज्ञापन स्थान' : 'Ad Space',
    contactAd: lang === 'hi' ? 'संपर्क करें' : 'Contact Us',
    readMore: lang === 'hi' ? 'पूरा पढ़िए' : 'Read More',
    published: lang === 'hi' ? 'प्रकाशित:' : 'Published:',
    readTime: lang === 'hi' ? 'मिनट पढ़ने का समय' : 'min read',
    share: lang === 'hi' ? 'साझा करें' : 'Share',
    premium: lang === 'hi' ? 'प्रीमियम' : 'Premium'
  };

  useEffect(() => {
    document.title = "Shan Times | राष्ट्रीय हिन्दी दैनिक";
    fetchData();
  }, []);

  // Close modal on ESC key press
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setSelectedNews(null);
    };
    if (selectedNews) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [selectedNews]);

  const fetchData = async () => {
    try {
      const qNews = query(collection(db, "news"), orderBy("timestamp", "desc"));
      const newsSnap = await getDocs(qNews);
      setNews(newsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const qAds = query(collection(db, "ads"), orderBy("timestamp", "desc"));
      const adsSnap = await getDocs(qAds);
      setAds(adsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const featSnap = await getDoc(doc(db, "settings", "features"));
      if (featSnap.exists()) setFeatures(featSnap.data());

      const popSnap = await getDoc(doc(db, "settings", "popular"));
      if (popSnap.exists()) setPopularSettings(popSnap.data());

      // Fetch latest e-paper for today's PDF button
      const qPapers = query(collection(db, "epapers"), orderBy("timestamp", "desc"));
      const papersSnap = await getDocs(qPapers);
      if (!papersSnap.empty) {
        setLatestPaper(papersSnap.docs[0].data());
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const calculateReadTime = (content) => {
    if (!content) return 1;
    return Math.max(1, Math.ceil(content.split(/\s+/).length / 200));
  };

  // Strip HTML tags from content for plain text excerpts
  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  };

  const topStory = news.find(n => n.category === 'Top Story' || n.isHeadline) || news[0];
  const otherNews = news.filter(n => n.id !== topStory?.id);
  const sidebarAds = ads.filter(a => !a.position || a.position === 'sidebar');
  const topNewsItems = otherNews.slice(0, 4);

  const getPopularWeek = () => {
    if (popularSettings.weekManual?.filter(id => id).length > 0) {
      return popularSettings.weekManual.filter(id => id).map(id => news.find(n => n.id === id)).filter(n => n);
    }
    return otherNews.slice(0, 3);
  };

  const getPopularMonth = () => {
    if (popularSettings.monthManual?.filter(id => id).length > 0) {
      return popularSettings.monthManual.filter(id => id).map(id => news.find(n => n.id === id)).filter(n => n);
    }
    return otherNews.slice(3, 6);
  };

  const openNews = (n) => setSelectedNews(n);

  const SidebarSection = ({ title, icon, children }) => (
    <div className="sidebar-section">
      <h4 className="sidebar-title">
        <i className={`fas ${icon}`} style={{ marginRight: '8px', color: 'var(--primary)' }}></i>
        {title}
      </h4>
      {children}
    </div>
  );

  const MiniNewsCard = ({ article, index }) => (
    <div className="mini-news-card" onClick={() => openNews(article)}>
      <span className="mini-news-rank">{index + 1}</span>
      <div className="mini-news-content">
        <span className="mini-news-category">
          {article.category}
          {article.isPremium && <span style={{ marginLeft: '5px', color: '#f59e0b' }}><i className="fas fa-crown"></i></span>}
        </span>
        <h5 className="mini-news-title">{article.title}</h5>
      </div>
      {article.imgUrl && <img src={article.imgUrl} alt="" className="mini-news-thumb" />}
    </div>
  );

  return (
    <div className="container">
      <div className="main-content">
        {features.topNewsEnabled !== false && (
          <SidebarSection title={t.topNews} icon="fa-fire">
            {topNewsItems.length > 0 ? topNewsItems.map((n, i) => (
              <MiniNewsCard key={n.id} article={n} index={i} />
            )) : <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '15px' }}>No news</p>}
          </SidebarSection>
        )}

        {topStory && (
          <div className="top-story-card">
            {topStory.imgUrl && (
              <img src={topStory.imgUrl} alt={topStory.title} className="top-story-image" onClick={() => openNews(topStory)} />
            )}
            <div className="top-story-content">
              <span className="top-story-badge">
                <i className="fas fa-fire" style={{ marginRight: '8px' }}></i>{t.topStory}
              </span>
              <h2 className="top-story-title" onClick={() => openNews(topStory)}>{topStory.title}</h2>
              <p className="card-excerpt">{stripHtml(topStory.content)?.substring(0, 200)}...</p>
              <div className="card-meta">
                <span><i className="fas fa-clock"></i>{calculateReadTime(topStory.content)} {t.readTime}</span>
                <span><i className="fas fa-calendar"></i>{new Date(topStory.timestamp).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN')}</span>
              </div>
              <button className="read-more-btn" onClick={() => openNews(topStory)}>{t.readMore}<i className="fas fa-arrow-right"></i></button>
            </div>
          </div>
        )}

        {features.trendingNewsEnabled !== false && (
          <TrendingNews news={otherNews} lang={lang} onSelectNews={openNews} />
        )}

        <div className="section-title"><i className="fas fa-newspaper"></i><h2>{t.latestNews}</h2></div>

        <div className="news-grid">
          {loading ? (
            <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
          ) : otherNews.slice(0, 6).map(n => (
            <div key={n.id} className="news-card">
              <div className="card-img-wrapper">
                {n.imgUrl && <img src={n.imgUrl} alt={n.title} className="card-img" onClick={() => openNews(n)} loading="lazy" />}
                {n.isPremium && <span className="premium-tag"><i className="fas fa-crown"></i></span>}
              </div>
              <div className="card-body">
                <span className="card-category">{n.category}</span>
                <h3 className="card-title" onClick={() => openNews(n)}>{n.title}</h3>
                <p className="card-excerpt">{stripHtml(n.content)?.substring(0, 100)}...</p>
                <div className="card-meta"><span><i className="fas fa-clock"></i>{calculateReadTime(n.content)} {t.readTime}</span></div>
                <button className="read-more-btn" onClick={() => openNews(n)}>{t.readMore}<i className="fas fa-arrow-right"></i></button>
              </div>
            </div>
          ))}
        </div>

        {features.newsletterEnabled && <Newsletter lang={lang} onSuccess={(msg) => toast?.success(msg)} onError={(msg) => toast?.error(msg)} />}
      </div>

      <aside id="promo-sidebar">
        <WeatherWidget lang={lang} />

        {features.todaysPdfEnabled !== false && latestPaper && (
          <a
            href={latestPaper.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="todays-pdf-btn"
          >
            <i className="fas fa-file-pdf"></i>
            <span>{lang === 'hi' ? "आज का अंक डाउनलोड करें" : "Download Today's Edition"}</span>
            <small>{latestPaper.date}</small>
          </a>
        )}

        {features.popularWeekEnabled !== false && (
          <SidebarSection title={t.popularWeek} icon="fa-fire-alt">
            {getPopularWeek().map((article, i) => <MiniNewsCard key={article.id} article={article} index={i} />)}
          </SidebarSection>
        )}

        {features.adsEnabled && sidebarAds.length > 0 ? (
          <div className="sidebar-ad-card">
            <span className="sidebar-ad-label">{lang === 'hi' ? 'विज्ञापन' : 'Sponsored'}</span>
            <img src={sidebarAds[0].imgUrl} alt="Advertisement" />
          </div>
        ) : features.adsEnabled ? (
          <div className="sidebar-ad-placeholder">
            <i className="fas fa-ad"></i>
            <span>{t.adSpace}</span>
            <a href="/contact">{t.contactAd}</a>
          </div>
        ) : null}

        {features.popularMonthEnabled !== false && (
          <SidebarSection title={t.popularMonth} icon="fa-chart-line">
            {getPopularMonth().map((article, i) => <MiniNewsCard key={article.id} article={article} index={i} />)}
          </SidebarSection>
        )}

        {features.adsEnabled && sidebarAds.length > 1 && (
          <div className="sidebar-ad-card">
            <span className="sidebar-ad-label">{lang === 'hi' ? 'विज्ञापन' : 'Sponsored'}</span>
            <img src={sidebarAds[1].imgUrl} alt="Advertisement" />
          </div>
        )}
      </aside>

      {selectedNews && (
        <div className="modal-overlay" onClick={() => setSelectedNews(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setSelectedNews(null)}><i className="fas fa-times"></i></button>
            {selectedNews.imgUrl && <img src={selectedNews.imgUrl} alt={selectedNews.title} />}
            <span style={{ color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>{selectedNews.category}</span>
            <h2>{selectedNews.title}</h2>
            <div className="rich-content" dangerouslySetInnerHTML={{ __html: selectedNews.content }}></div>
            <div className="modal-meta">
              <span><i className="fas fa-calendar"></i>{t.published} {new Date(selectedNews.timestamp).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN')}</span>
              <span><i className="fas fa-clock"></i>{calculateReadTime(selectedNews.content)} {t.readTime}</span>
            </div>
            <div style={{ marginTop: '20px' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '10px', color: 'var(--text-primary)' }}>
                <i className="fas fa-share-alt" style={{ marginRight: '8px', color: 'var(--primary)' }}></i>{t.share}:
              </p>
              <ShareButtons title={selectedNews.title} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
