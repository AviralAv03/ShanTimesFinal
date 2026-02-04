import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { updatePageSEO, resetPageSEO } from '../utils/seo';

const Epaper = ({ lang }) => {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [searchDate, setSearchDate] = useState('');
  const [previewPaper, setPreviewPaper] = useState(null);
  const [features, setFeatures] = useState({ paywallEnabled: false });

  const t = {
    title: lang === 'hi' ? 'ई-पेपर संग्रह' : 'E-Paper Archive',
    subtitle: lang === 'hi' ? 'पिछले अंक यहाँ पढ़ें' : 'Read past editions here',
    download: lang === 'hi' ? 'डाउनलोड करें' : 'Download',
    preview: lang === 'hi' ? 'पूर्वावलोकन' : 'Preview',
    premium: lang === 'hi' ? 'प्रीमियम' : 'Premium',
    noPapers: lang === 'hi' ? 'कोई ई-पेपर नहीं मिला' : 'No E-Papers found',
    searchDate: lang === 'hi' ? 'तारीख खोजें' : 'Search by date',
    edition: lang === 'hi' ? 'संस्करण' : 'Edition',
    close: lang === 'hi' ? 'बंद करें' : 'Close',
    subscribeToRead: lang === 'hi' ? 'पढ़ने के लिए सब्सक्राइब करें' : 'Subscribe to read'
  };

  useEffect(() => {
    // Set E-paper page SEO
    updatePageSEO({
      title: lang === 'hi' ? 'ई-पेपर संग्रह | Shan Times' : 'E-Paper Archive | Shan Times',
      description: lang === 'hi'
        ? 'शान टाइम्स ई-पेपर संग्रह। पिछले सभी अंक डाउनलोड करें और पढ़ें। राष्ट्रीय हिन्दी दैनिक।'
        : 'Shan Times E-Paper archive. Download and read all past editions of the National Hindi Daily.',
      url: 'https://shantimes.in/epaper',
      type: 'website'
    });
    fetchData();

    return () => resetPageSEO();
  }, [lang]);

  const fetchData = async () => {
    try {
      const q = query(collection(db, "epapers"), orderBy("timestamp", "desc"));
      const snap = await getDocs(q);
      setPapers(snap.docs.map(d => ({ id: d.id, ...d.data() })));

      const featSnap = await getDoc(doc(db, "settings", "features"));
      if (featSnap.exists()) setFeatures(featSnap.data());
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const filteredPapers = searchDate
    ? papers.filter(p => p.date === searchDate)
    : papers;

  const getGooglePreviewUrl = (url) => {
    if (url.includes('drive.google.com')) {
      const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match) {
        return `https://drive.google.com/file/d/${match[1]}/preview`;
      }
    }
    return url;
  };

  const handlePreview = (paper) => {
    if (paper.isPremium && features.paywallEnabled) {
      alert(t.subscribeToRead);
      return;
    }
    setPreviewPaper(paper);
  };

  const handleDownload = (paper) => {
    if (paper.isPremium && features.paywallEnabled) {
      alert(t.subscribeToRead);
      return;
    }
    window.open(paper.pdfUrl, '_blank');
  };

  return (
    <div className="container" style={{ flexDirection: 'column' }}>
      <div className="page-header" style={{ width: '100%', marginBottom: '0', paddingBottom: '10px' }}>
        <h1 className="page-title" style={{ marginBottom: '5px' }}>
          <i className="fas fa-newspaper" style={{ marginRight: '15px', color: 'var(--primary)' }}></i>
          {t.title}
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '5px' }}>{t.subtitle}</p>
      </div>

      <div className="epaper-controls" style={{ width: '100%' }}>
        <div className="search-filter">
          <i className="fas fa-calendar"></i>
          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            placeholder={t.searchDate}
          />
          {searchDate && (
            <button onClick={() => setSearchDate('')} className="clear-btn">
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        <div className="view-toggle">
          <button
            className={viewMode === 'grid' ? 'active' : ''}
            onClick={() => setViewMode('grid')}
          >
            <i className="fas fa-th-large"></i>
          </button>
          <button
            className={viewMode === 'list' ? 'active' : ''}
            onClick={() => setViewMode('list')}
          >
            <i className="fas fa-list"></i>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>{lang === 'hi' ? 'लोड हो रहा है...' : 'Loading...'}</p>
        </div>
      ) : filteredPapers.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-newspaper"></i>
          <h3>{t.noPapers}</h3>
        </div>
      ) : (
        <div className={`epaper-${viewMode}`}>
          {filteredPapers.map((paper) => (
            <div key={paper.id} className="epaper-card">
              <div className="epaper-icon">
                <i className="fas fa-file-pdf"></i>
                {paper.isPremium && (
                  <span className="premium-badge">
                    <i className="fas fa-crown"></i> {t.premium}
                  </span>
                )}
              </div>
              <div className="epaper-info">
                <h3>{t.edition}</h3>
                <p className="epaper-date">
                  {new Date(paper.date).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div className="epaper-actions">
                <button
                  className="preview-btn"
                  onClick={() => handlePreview(paper)}
                >
                  <i className="fas fa-eye"></i> {t.preview}
                </button>
                <button
                  className="download-btn"
                  onClick={() => handleDownload(paper)}
                >
                  <i className="fas fa-download"></i> {t.download}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {previewPaper && (
        <div className="modal-overlay" onClick={() => setPreviewPaper(null)}>
          <div className="pdf-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preview-header">
              <h3>
                <i className="fas fa-file-pdf" style={{ marginRight: '10px', color: 'var(--primary)' }}></i>
                {t.edition} - {new Date(previewPaper.date).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN')}
              </h3>
              <button className="close-preview" onClick={() => setPreviewPaper(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="preview-content">
              <iframe
                src={getGooglePreviewUrl(previewPaper.pdfUrl)}
                title="E-Paper Preview"
                width="100%"
                height="100%"
                style={{ border: 'none' }}
                allowFullScreen
              ></iframe>
            </div>
            <div className="preview-footer">
              <button
                className="download-btn"
                onClick={() => handleDownload(previewPaper)}
              >
                <i className="fas fa-download"></i> {t.download}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Epaper;