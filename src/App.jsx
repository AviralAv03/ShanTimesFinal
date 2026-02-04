import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { db } from './firebase';
import { doc, getDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';

import Home from './pages/Home';
import CategoryNews from './pages/CategoryNews';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Epaper from './pages/Epaper';
import NewsDetail from './pages/NewsDetail';
import Admin from './Admin';

import ScrollToTop from './components/ScrollToTop';
import SearchModal from './components/SearchModal';
import { ToastProvider, useToast } from './components/Toast';

const AppContent = () => {
  const location = useLocation();
  const toast = useToast();
  const [ticker, setTicker] = useState('');
  const [tickerData, setTickerData] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lang, setLang] = useState(localStorage.getItem('siteLang') || 'hi');
  const [theme, setTheme] = useState(localStorage.getItem('siteTheme') || 'light');
  const [searchOpen, setSearchOpen] = useState(false);
  const [allNews, setAllNews] = useState([]);
  const [selectedNews, setSelectedNews] = useState(null);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [socialMediaEnabled, setSocialMediaEnabled] = useState(true);
  const [socialLinks, setSocialLinks] = useState({
    facebook: '',
    twitter: '',
    instagram: '',
    youtube: ''
  });
  const [featureToggles, setFeatureToggles] = useState({
    darkMode: true,
    languageSwitch: true,
    epaperEnabled: true,
    weatherEnabled: true
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('siteTheme', theme);
  }, [theme]);

  useEffect(() => {
    const loadTicker = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "ticker"));
        if (snap.exists()) {
          const data = snap.data();
          // Check if ticker has expired
          if (data.expiryTime && Date.now() > data.expiryTime) {
            setTicker('');
            setTickerData(null);
          } else {
            setTickerData(data);
            // Set ticker based on current language
            const text = lang === 'hi' ? (data.textHi || data.text) : (data.textEn || data.text);
            setTicker(text || '');
          }
        }
      } catch (e) {
        console.error("Ticker load error:", e);
      }
    };
    loadTicker();
  }, [lang]);

  useEffect(() => {
    const fetchAllNews = async () => {
      try {
        const q = query(collection(db, "news"), orderBy("timestamp", "desc"));
        const snap = await getDocs(q);
        setAllNews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("News fetch error:", e);
      }
    };
    fetchAllNews();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Google Analytics initialization
  useEffect(() => {
    const initAnalytics = async () => {
      try {
        const apiSnap = await getDoc(doc(db, "settings", "apis"));
        if (apiSnap.exists()) {
          const gaId = apiSnap.data().googleAnalyticsId;
          if (gaId && gaId.startsWith('G-')) {
            // Load GA4 script dynamically
            if (!window.gtag) {
              const script = document.createElement('script');
              script.async = true;
              script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
              document.head.appendChild(script);

              window.dataLayer = window.dataLayer || [];
              window.gtag = function () { window.dataLayer.push(arguments); };
              window.gtag('js', new Date());
              window.gtag('config', gaId);
            }
          }
        }
      } catch (e) {
        console.log("Analytics init error:", e);
      }
    };
    initAnalytics();
  }, []);

  // Track page views
  useEffect(() => {
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: location.pathname,
        page_title: document.title
      });
    }
  }, [location.pathname]);

  // Load social media settings and feature toggles
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const featSnap = await getDoc(doc(db, "settings", "features"));
        if (featSnap.exists()) {
          const data = featSnap.data();
          if (data.socialMediaEnabled !== undefined) {
            setSocialMediaEnabled(data.socialMediaEnabled);
          }
          // Load all feature toggles
          setFeatureToggles(prev => ({ ...prev, ...data }));
        }
        const socialSnap = await getDoc(doc(db, "settings", "social"));
        if (socialSnap.exists()) {
          setSocialLinks({ ...socialLinks, ...socialSnap.data() });
        }
      } catch (e) {
        console.log("Settings load error:", e);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setLangDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langDropdownOpen && !e.target.closest('.lang-dropdown')) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [langDropdownOpen]);

  const selectLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('siteLang', newLang);
    setLangDropdownOpen(false);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const t = (hi, en) => (lang === 'hi' ? hi : en);
  const isAdminPage = location.pathname === '/admin';

  const handleSelectNews = (article) => {
    setSelectedNews(article);
    setSearchOpen(false);
  };

  return (
    <div className="app-wrapper">
      {!isAdminPage && (
        <>
          {ticker && (
            <div className="ticker-wrap">
              <div className="ticker-badge">BREAKING</div>
              <div className="ticker-container">
                <div className="ticker-content">
                  {ticker} &nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp; {ticker} &nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp; {ticker}
                </div>
              </div>
            </div>
          )}

          <header>
            <div className="header-actions">
              <button
                onClick={() => setSearchOpen(true)}
                className="search-btn"
                aria-label="Open search"
              >
                <i className="fas fa-search"></i>
              </button>
              {featureToggles.darkMode !== false && (
                <button
                  onClick={toggleTheme}
                  className="theme-toggle"
                  aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                >
                  <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
                </button>
              )}
              {featureToggles.languageSwitch !== false && (
                <div className={`lang-dropdown ${langDropdownOpen ? 'open' : ''}`}>
                  <button
                    className="lang-dropdown-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLangDropdownOpen(!langDropdownOpen);
                    }}
                  >
                    <i className="fas fa-globe"></i>
                    {lang === 'hi' ? 'भाषा' : 'Lang'}
                    <i className="fas fa-chevron-down"></i>
                  </button>
                  <div className="lang-dropdown-menu">
                    <button
                      className={`lang-option ${lang === 'hi' ? 'active' : ''}`}
                      onClick={() => selectLang('hi')}
                    >
                      <span style={{ fontWeight: 'bold', color: '#f97316' }}>हि</span> हिन्दी
                      {lang === 'hi' && <i className="fas fa-check check"></i>}
                    </button>
                    <button
                      className={`lang-option ${lang === 'en' ? 'active' : ''}`}
                      onClick={() => selectLang('en')}
                    >
                      <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>EN</span> English
                      {lang === 'en' && <i className="fas fa-check check"></i>}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <h1 className="logo">शान टाइम्स</h1>
            </Link>
            <div className="tagline">राष्ट्रीय हिन्दी दैनिक</div>
          </header>

          <nav>
            <div className="nav-container">
              <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
                <i className={`fas ${menuOpen ? 'fa-times' : 'fa-bars'}`}></i>
              </div>
              <ul className={`menu ${menuOpen ? 'active' : ''}`} id="mobile-menu">
                <li
                  style={{ textAlign: 'right', padding: '10px', display: menuOpen ? 'block' : 'none' }}
                  onClick={() => setMenuOpen(false)}
                >
                  <i className="fas fa-times" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                </li>
                <li><Link to="/" className={location.pathname === '/' ? 'active' : ''}>{t("होम", "Home")}</Link></li>
                <li><Link to="/lucknow" className={location.pathname === '/lucknow' ? 'active' : ''}>{t("लखनऊ", "Lucknow")}</Link></li>
                <li><Link to="/national" className={location.pathname === '/national' ? 'active' : ''}>{t("राष्ट्रीय", "National")}</Link></li>
                <li><Link to="/sports" className={location.pathname === '/sports' ? 'active' : ''}>{t("खेल", "Sports")}</Link></li>
                <li><Link to="/technology" className={location.pathname === '/technology' ? 'active' : ''}>{t("प्रौद्योगिकी", "Technology")}</Link></li>
                <li><Link to="/editorial" className={location.pathname === '/editorial' ? 'active' : ''}>{t("संपादकीय", "Editorial")}</Link></li>
                {featureToggles.epaperEnabled !== false && (
                  <li><Link to="/epaper" className={location.pathname === '/epaper' ? 'active' : ''}>{t("ई-पेपर", "E-Paper")}</Link></li>
                )}
                <li><Link to="/contact" className={location.pathname === '/contact' ? 'active' : ''}>{t("संपर्क", "Contact")}</Link></li>

                {/* Mobile-only menu items */}
                <li className="mobile-menu-divider" />
                <li className="mobile-menu-actions">
                  <button className="mobile-action-btn" onClick={() => { setSearchOpen(true); setMenuOpen(false); }}>
                    <i className="fas fa-search"></i> {t("खोजें", "Search")}
                  </button>
                  {featureToggles.darkMode !== false && (
                    <button className="mobile-action-btn" onClick={() => { toggleTheme(); }}>
                      <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i> {theme === 'dark' ? t("लाइट मोड", "Light Mode") : t("डार्क मोड", "Dark Mode")}
                    </button>
                  )}
                  {featureToggles.languageSwitch !== false && (
                    <button className="mobile-action-btn" onClick={() => { selectLang(lang === 'hi' ? 'en' : 'hi'); setMenuOpen(false); }}>
                      <span>{lang === 'hi' ? '🌐' : '🇮🇳'}</span> {lang === 'hi' ? 'English' : 'हिन्दी'}
                    </button>
                  )}
                </li>
              </ul>
            </div>
          </nav>
        </>
      )}

      <Routes>
        <Route path="/" element={<Home lang={lang} toast={toast} />} />
        <Route path="/lucknow" element={<CategoryNews category="Lucknow" title={t("लखनऊ समाचार", "Lucknow News")} lang={lang} />} />
        <Route path="/national" element={<CategoryNews category="National" title={t("राष्ट्रीय समाचार", "National News")} lang={lang} />} />
        <Route path="/sports" element={<CategoryNews category="Sports" title={t("खेल समाचार", "Sports News")} lang={lang} />} />
        <Route path="/editorial" element={<CategoryNews category="Editorial" title={t("संपादकीय", "Editorials")} lang={lang} />} />
        <Route path="/technology" element={<CategoryNews category="Technology" title={t("प्रौद्योगिकी समाचार", "Technology News")} lang={lang} />} />
        <Route path="/epaper" element={<Epaper lang={lang} />} />
        <Route path="/contact" element={<Contact lang={lang} toast={toast} />} />
        <Route path="/news/:newsId" element={<NewsDetail lang={lang} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>

      {!isAdminPage && (
        <footer>
          <div className="footer-content">
            <div className="footer-col">
              <h3>SHAN TIMES</h3>
              <p><strong>RNI No:</strong> UPHIN/2009/30284</p>
              <p>
                <strong>{t("संस्थापक:", "Founder:")}</strong> {t("स्व. जंग बहादुर सक्सेना", "Late Jang Bahadur Saxena")}
              </p>
              <p>
                <strong>{t("संपादक:", "Editor:")}</strong> {t("सारिका सोनकर", "Sarika Sonkar")}
              </p>
              {socialMediaEnabled && (
                <div className="social-links">
                  {socialLinks.facebook && (
                    <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                      <i className="fab fa-facebook-f"></i>
                    </a>
                  )}
                  {socialLinks.twitter && (
                    <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                      <i className="fab fa-twitter"></i>
                    </a>
                  )}
                  {socialLinks.instagram && (
                    <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                      <i className="fab fa-instagram"></i>
                    </a>
                  )}
                  {socialLinks.youtube && (
                    <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                      <i className="fab fa-youtube"></i>
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="footer-col">
              <h3>{t("संपर्क", "Contact")}</h3>
              <p>
                <i className="fas fa-map-marker-alt"></i>
                <span>
                  {t(
                    "175/41 पीर जलील, अमीनाबाद पार्क, लखनऊ - 226018",
                    "175/41 Peer Jaleel, Aminabad Park, Lucknow - 226018"
                  )}
                </span>
              </p>
              <p><i className="fas fa-phone"></i> 9120967777, 9005008529</p>
              <p><i className="fas fa-envelope"></i> shantimes2009@gmail.com</p>
            </div>

            <div className="footer-col">
              <h3>{t("त्वरित लिंक", "Quick Links")}</h3>
              <p><Link to="/">{t("होम", "Home")}</Link></p>
              {featureToggles.epaperEnabled !== false && (
                <p><Link to="/epaper">{t("ई-पेपर", "E-Paper")}</Link></p>
              )}
              <p><Link to="/contact">{t("संपर्क करें", "Contact Us")}</Link></p>
              <p><a href="/admin" target="_blank" rel="noopener noreferrer">{t("एडमिन लॉगिन", "Admin Login")}</a></p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2025 Shan Times. {t("सर्वाधिकार सुरक्षित।", "All Rights Reserved.")}</p>
          </div>
        </footer>
      )}

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        news={allNews}
        onSelectNews={handleSelectNews}
      />

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
            <p>{selectedNews.content}</p>
            <div className="modal-meta">
              <span>
                <i className="fas fa-calendar"></i>
                {new Date(selectedNews.timestamp).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN')}
              </span>
            </div>
          </div>
        </div>
      )}

      <ScrollToTop />
    </div>
  );
};

const App = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App;