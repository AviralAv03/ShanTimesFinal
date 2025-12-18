import React, { useState, useEffect } from 'react';
import { db, auth, storage } from './firebase';
import { collection, addDoc, setDoc, doc, getDocs, deleteDoc, updateDoc, orderBy, query, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import RichTextEditor from './components/RichTextEditor';
import { uploadPdfToSupabase, deletePdfFromSupabase } from './supabase';

const Admin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  const [allNews, setAllNews] = useState([]);
  const [allAds, setAllAds] = useState([]);
  const [allPapers, setAllPapers] = useState([]);
  const [allContacts, setAllContacts] = useState([]);
  const [allSubscribers, setAllSubscribers] = useState([]);
  const [currentTicker, setCurrentTicker] = useState('');

  const [siteSettings, setSiteSettings] = useState({
    headlineFont: 'Rozha One',
    headlineSize: '2rem',
    articleFont: 'Noto Sans Devanagari',
    primaryColor: '#b91c1c'
  });

  const [featureToggles, setFeatureToggles] = useState({
    darkMode: true,
    languageSwitch: true,
    adsEnabled: true,
    epaperEnabled: true,
    newsletterEnabled: true,
    paywallEnabled: false,
    premiumSignup: false,
    weatherEnabled: true,
    topNewsEnabled: true,
    popularWeekEnabled: true,
    popularMonthEnabled: true,
    trendingNewsEnabled: true
  });

  const [apiSettings, setApiSettings] = useState({
    imgbbKey: '',
    googleAdsId: '',
    googleAnalyticsId: '',
    weatherApiKey: ''
  });

  const [popularSettings, setPopularSettings] = useState({
    weekManual: [],
    monthManual: [],
    autoPopulate: true
  });

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Lucknow');
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [newsDuration, setNewsDuration] = useState(7);
  const [isPremium, setIsPremium] = useState(false);
  const [isHeadline, setIsHeadline] = useState(false);
  const [neverExpire, setNeverExpire] = useState(false);

  const [tickerText, setTickerText] = useState('');
  const [tickerDuration, setTickerDuration] = useState(24);
  const [paperDate, setPaperDate] = useState('');
  const [driveLink, setDriveLink] = useState('');
  const [paperPremium, setPaperPremium] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);

  const [adPosition, setAdPosition] = useState('sidebar');
  const [editingNews, setEditingNews] = useState(null);
  const [showApiKeys, setShowApiKeys] = useState({});
  const [successModal, setSuccessModal] = useState({ show: false, message: '', type: 'success' });
  const [messageFilter, setMessageFilter] = useState('all');
  const [tickerTextHi, setTickerTextHi] = useState('');
  const [tickerTextEn, setTickerTextEn] = useState('');

  const fontOptions = ['Rozha One', 'Noto Sans Devanagari', 'Teko', 'Poppins', 'Arial', 'Georgia', 'Times New Roman'];
  const sizeOptions = ['1.5rem', '1.75rem', '2rem', '2.25rem', '2.5rem', '3rem'];

  useEffect(() => {
    document.title = "Admin Panel | Shan Times";
    const authData = localStorage.getItem('shanAuth');
    if (!authData) {
      navigate('/login');
    } else {
      // Check session expiry (1 hour)
      try {
        const { timestamp } = JSON.parse(authData);
        const oneHour = 60 * 60 * 1000;
        if (Date.now() - timestamp > oneHour) {
          localStorage.removeItem('shanAuth');
          navigate('/login');
          return;
        }
      } catch (e) {
        // Old format, migrate to new
        localStorage.setItem('shanAuth', JSON.stringify({ loggedIn: true, timestamp: Date.now() }));
      }
      fetchAndCleanup();
      loadAllSettings();
    }
  }, [navigate]);

  const loadAllSettings = async () => {
    try {
      const siteSnap = await getDoc(doc(db, "settings", "site"));
      if (siteSnap.exists()) setSiteSettings({ ...siteSettings, ...siteSnap.data() });

      const featSnap = await getDoc(doc(db, "settings", "features"));
      if (featSnap.exists()) setFeatureToggles({ ...featureToggles, ...featSnap.data() });

      const apiSnap = await getDoc(doc(db, "settings", "apis"));
      if (apiSnap.exists()) setApiSettings({ ...apiSettings, ...apiSnap.data() });

      const popSnap = await getDoc(doc(db, "settings", "popular"));
      if (popSnap.exists()) setPopularSettings({ ...popularSettings, ...popSnap.data() });
    } catch (e) { console.log("Settings load error:", e); }
  };

  const saveSettings = async (type, data) => {
    try {
      await setDoc(doc(db, "settings", type), data);
      showSuccess("Settings saved!");
    } catch (e) { showSuccess("Error: " + e.message, 'error'); }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setImagePreview(null);
    }
  };

  const handleResetForms = () => {
    setTitle(''); setContent(''); setCategory('Lucknow'); setFile(null); setImagePreview(null);
    setTickerText(''); setPaperDate(''); setDriveLink(''); setIsPremium(false); setIsHeadline(false);
    setEditingNews(null); setNeverExpire(false); setPaperPremium(false); setPdfFile(null);
    document.querySelectorAll('input[type="file"]').forEach(input => input.value = '');
  };

  const handleLogout = async () => {
    if (window.confirm("Logout?")) {
      await signOut(auth);
      localStorage.removeItem('shanAuth');
      navigate('/login');
    }
  };

  const fetchAndCleanup = async () => {
    setLoading(true);
    const now = Date.now();
    try {
      const qNews = query(collection(db, "news"), orderBy("timestamp", "desc"));
      const newsSnap = await getDocs(qNews);
      const validNews = [];
      for (let d of newsSnap.docs) {
        const data = d.data();
        if (data.expiryTime && now > data.expiryTime) {
          await deleteDoc(doc(db, "news", d.id));
        } else { validNews.push({ id: d.id, ...data }); }
      }
      setAllNews(validNews);

      const qAds = query(collection(db, "ads"), orderBy("timestamp", "desc"));
      const adsSnap = await getDocs(qAds);
      setAllAds(adsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const qPapers = query(collection(db, "epapers"), orderBy("timestamp", "desc"));
      const papersSnap = await getDocs(qPapers);
      const validPapers = [];
      for (let d of papersSnap.docs) {
        const data = d.data();
        if (data.expiryTime && now > data.expiryTime) {
          // Delete expired e-paper and its PDF from Storage if it's a Firebase Storage URL
          try {
            if (data.pdfUrl && data.pdfUrl.includes('firebasestorage.googleapis.com')) {
              const storageRef = ref(storage, data.pdfUrl);
              await deleteObject(storageRef).catch(() => { }); // Ignore if already deleted
            }
          } catch (e) { console.log("Storage cleanup:", e); }
          await deleteDoc(doc(db, "epapers", d.id));
        } else {
          validPapers.push({ id: d.id, ...data });
        }
      }
      setAllPapers(validPapers);

      try {
        const qContacts = query(collection(db, "contacts"), orderBy("timestamp", "desc"));
        const contactsSnap = await getDocs(qContacts);
        setAllContacts(contactsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { }

      try {
        const qSubs = query(collection(db, "subscribers"), orderBy("timestamp", "desc"));
        const subsSnap = await getDocs(qSubs);
        setAllSubscribers(subsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { }

      const tickerSnap = await getDoc(doc(db, "settings", "ticker"));
      if (tickerSnap.exists()) {
        const data = tickerSnap.data();
        if (data.expiryTime && now > data.expiryTime) {
          await setDoc(doc(db, "settings", "ticker"), { text: "" });
          setCurrentTicker("");
        } else { setCurrentTicker(data.text || ""); }
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleDelete = async (col, id) => {
    if (window.confirm("Delete?")) {
      await deleteDoc(doc(db, col, id));
      fetchAndCleanup();
    }
  };

  const handleClearTicker = async () => {
    await setDoc(doc(db, "settings", "ticker"), { text: "" });
    fetchAndCleanup();
  };

  const getImgbbKey = () => apiSettings.imgbbKey || "a7f3177ee25d671123895f60c7d80017";

  const uploadToImgBB = async (imageFile) => {
    const formData = new FormData();
    formData.append("image", imageFile);
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${getImgbbKey()}`, { method: "POST", body: formData });
    const data = await res.json();
    return data.data.url;
  };

  const handleNewsSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = editingNews?.imgUrl || "";
      if (file) imageUrl = await uploadToImgBB(file);
      const expiryTime = neverExpire ? null : Date.now() + (newsDuration * 24 * 60 * 60 * 1000);
      const newsData = {
        title,
        content,
        category,
        imgUrl: imageUrl,
        timestamp: Date.now(),
        expiryTime,
        isPremium,
        isHeadline,
        neverExpire
      };

      if (editingNews) {
        await updateDoc(doc(db, "news", editingNews.id), newsData);
        showSuccess("News Updated!");
      } else {
        await addDoc(collection(db, "news"), newsData);
        showSuccess("News Published!");
      }
      handleResetForms();
      fetchAndCleanup();
    } catch (err) { showSuccess("Error: " + err.message, 'error'); }
    setLoading(false);
  };

  const handleEditNews = (news) => {
    setEditingNews(news);
    setTitle(news.title);
    setContent(news.content);
    setCategory(news.category);
    setIsPremium(news.isPremium || false);
    setIsHeadline(news.isHeadline || false);
    setNeverExpire(news.neverExpire || false);
    setImagePreview(news.imgUrl);
    setActiveTab('upload');
  };

  const handleTickerSubmit = async (e) => {
    e.preventDefault();
    const expiryTime = Date.now() + (tickerDuration * 60 * 60 * 1000);
    await setDoc(doc(db, "settings", "ticker"), {
      text: tickerText,
      textHi: tickerTextHi || tickerText,
      textEn: tickerTextEn || tickerText,
      timestamp: Date.now(),
      expiryTime
    });
    showSuccess("Ticker Updated!");
    setTickerText('');
    setTickerTextHi('');
    setTickerTextEn('');
    fetchAndCleanup();
  };

  const handlePaperSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let pdfUrl = driveLink;

      // If a PDF file is selected, upload to Supabase Storage
      if (pdfFile) {
        const fileName = `${paperDate}_${Date.now()}.pdf`;
        pdfUrl = await uploadPdfToSupabase(pdfFile, fileName);
      }

      if (!pdfUrl) throw new Error("Please provide a PDF file or Google Drive link");

      const expiryTime = Date.now() + (90 * 24 * 60 * 60 * 1000); // 90 days expiry
      await addDoc(collection(db, "epapers"), {
        date: paperDate,
        pdfUrl: pdfUrl,
        timestamp: Date.now(),
        expiryTime,
        isPremium: paperPremium
      });
      showSuccess("E-Paper Published!");
      setPaperDate(''); setDriveLink(''); setPaperPremium(false); setPdfFile(null);
      fetchAndCleanup();
    } catch (err) { showSuccess("Error: " + err.message, 'error'); }
    setLoading(false);
  };

  const handleAdSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (adPosition === 'google') {
        // Google Ads don't need image upload
        await addDoc(collection(db, "ads"), { position: 'google', timestamp: Date.now() });
        showSuccess("Google Ad Slot Added!");
      } else {
        if (!file) throw new Error("Select Image");
        const imageUrl = await uploadToImgBB(file);
        await addDoc(collection(db, "ads"), { imgUrl: imageUrl, position: adPosition, timestamp: Date.now() });
        showSuccess("Ad Published!");
      }
      setFile(null); setImagePreview(null);
      fetchAndCleanup();
    } catch (err) { showSuccess("Error: " + err.message, 'error'); }
    setLoading(false);
  };

  const showSuccess = (message, type = 'success') => {
    setSuccessModal({ show: true, message, type });
    setTimeout(() => setSuccessModal({ show: false, message: '', type: 'success' }), 2500);
  };

  const handleMarkRead = async (id, currentStatus) => {
    const newStatus = currentStatus === 'read' ? 'unread' : 'read';
    await updateDoc(doc(db, 'contacts', id), { status: newStatus });
    fetchAndCleanup();
  };

  const filteredContacts = messageFilter === 'all'
    ? allContacts
    : allContacts.filter(c => (c.status || 'unread') === messageFilter);

  const unreadCount = allContacts.filter(c => (c.status || 'unread') === 'unread').length;

  const ToggleSwitch = ({ value, onChange, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ color: '#374151' }}>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        style={{
          width: '50px', height: '26px', borderRadius: '13px',
          background: value ? '#10b981' : '#cbd5e1',
          position: 'relative', cursor: 'pointer', border: 'none', transition: '0.3s'
        }}
      >
        <span style={{
          width: '22px', height: '22px', borderRadius: '50%', background: 'white',
          position: 'absolute', top: '2px', left: value ? '26px' : '2px', transition: '0.3s'
        }}></span>
      </button>
    </div>
  );

  const styles = {
    sidebar: { width: '260px', background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)', color: 'white', padding: '25px 20px', display: 'flex', flexDirection: 'column', minHeight: '100vh' },
    navBtn: (active) => ({ background: active ? 'linear-gradient(135deg, #b91c1c, #991b1b)' : 'transparent', border: 'none', color: 'white', padding: '14px 18px', textAlign: 'left', cursor: 'pointer', borderRadius: '10px', display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.95rem', marginBottom: '5px', width: '100%' }),
    main: { flex: 1, padding: '30px', background: '#f1f5f9', overflowY: 'auto' },
    card: { background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '20px' },
    input: { padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box' },
    button: (bg) => ({ background: bg, color: 'white', padding: '12px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }),
    statCard: (bg) => ({ background: bg, color: 'white', padding: '20px', borderRadius: '12px', textAlign: 'center', flex: 1, minWidth: '150px' }),
    listItem: { display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #f1f5f9', alignItems: 'center' },
    deleteBtn: { color: '#ef4444', background: '#fef2f2', padding: '6px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer' },
    editBtn: { color: '#3b82f6', background: '#eff6ff', padding: '6px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', marginRight: '8px' }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={styles.sidebar}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '25px', paddingBottom: '15px', borderBottom: '1px solid #334155' }}>
          <i className="fas fa-newspaper" style={{ marginRight: '10px' }}></i>Admin Panel
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {[
            ['dashboard', 'fa-chart-pie', 'Dashboard'],
            ['upload', 'fa-upload', 'Upload News'],
            ['manage', 'fa-tasks', 'Manage'],
            ['toggles', 'fa-toggle-on', 'Feature Toggles'],
            ['apis', 'fa-key', 'APIs'],
            ['popular', 'fa-fire', 'Popular News'],
            ['analytics', 'fa-chart-line', 'Analytics'],
            ['contacts', 'fa-envelope', `Messages${unreadCount > 0 ? ` (${unreadCount})` : ''}`],
            ['subscribers', 'fa-users', `Subscribers (${allSubscribers.length})`]
          ].map(([tab, icon, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={styles.navBtn(activeTab === tab)}>
              <i className={`fas ${icon}`}></i>{label}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 'auto', borderTop: '1px solid #334155', paddingTop: '15px' }}>
          <button onClick={handleResetForms} style={{ ...styles.navBtn(false), color: '#fbbf24' }}>
            <i className="fas fa-eraser"></i>Reset Forms
          </button>
          <button onClick={handleLogout} style={{ ...styles.navBtn(false), color: '#f87171' }}>
            <i className="fas fa-sign-out-alt"></i>Logout
          </button>
        </div>
      </div>

      <div style={styles.main}>
        {loading && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ background: 'white', padding: '30px 50px', borderRadius: '16px', textAlign: 'center' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#b91c1c' }}></i>
              <p>Processing...</p>
            </div>
          </div>
        )}

        {successModal.show && (
          <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 10000, animation: 'slideIn 0.3s ease' }}>
            <div style={{
              background: successModal.type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: 'white',
              padding: '15px 25px',
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              minWidth: '280px'
            }}>
              <i className={`fas ${successModal.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} style={{ fontSize: '1.3rem' }}></i>
              <span style={{ fontWeight: '500' }}>{successModal.message}</span>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <>
            <h2 style={{ margin: '0 0 20px' }}>Dashboard</h2>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '25px' }}>
              <div style={styles.statCard('linear-gradient(135deg, #b91c1c, #991b1b)')}>
                <i className="fas fa-newspaper" style={{ fontSize: '1.5rem' }}></i>
                <h3 style={{ fontSize: '2rem', margin: '8px 0' }}>{allNews.length}</h3>
                <p style={{ margin: 0 }}>News</p>
              </div>
              <div style={styles.statCard('linear-gradient(135deg, #f59e0b, #d97706)')}>
                <i className="fas fa-ad" style={{ fontSize: '1.5rem' }}></i>
                <h3 style={{ fontSize: '2rem', margin: '8px 0' }}>{allAds.length}</h3>
                <p style={{ margin: 0 }}>Ads</p>
              </div>
              <div style={styles.statCard('linear-gradient(135deg, #10b981, #059669)')}>
                <i className="fas fa-file-pdf" style={{ fontSize: '1.5rem' }}></i>
                <h3 style={{ fontSize: '2rem', margin: '8px 0' }}>{allPapers.length}</h3>
                <p style={{ margin: 0 }}>E-Papers</p>
              </div>
              <div style={styles.statCard('linear-gradient(135deg, #3b82f6, #2563eb)')}>
                <i className="fas fa-users" style={{ fontSize: '1.5rem' }}></i>
                <h3 style={{ fontSize: '2rem', margin: '8px 0' }}>{allSubscribers.length}</h3>
                <p style={{ margin: 0 }}>Subscribers</p>
              </div>
            </div>

            <div style={styles.card}>
              <h3><i className="fas fa-rss" style={{ color: '#b91c1c', marginRight: '10px' }}></i>Current Ticker</h3>
              <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '8px', marginTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span>{currentTicker || "No ticker set"}</span>
                {currentTicker && <button onClick={handleClearTicker} style={styles.deleteBtn}>Clear</button>}
              </div>
            </div>

            <div style={styles.card}>
              <h3><i className="fas fa-clock" style={{ color: '#b91c1c', marginRight: '10px' }}></i>Recent News</h3>
              {allNews.slice(0, 5).map(n => (
                <div key={n.id} style={styles.listItem}>
                  <span>
                    <strong style={{ color: '#b91c1c' }}>[{n.category}]</strong>
                    {n.isPremium && <span style={{ background: '#f59e0b', color: 'white', padding: '2px 6px', borderRadius: '4px', marginLeft: '5px', fontSize: '0.7rem' }}>PREMIUM</span>}
                    {n.neverExpire && <span style={{ background: '#10b981', color: 'white', padding: '2px 6px', borderRadius: '4px', marginLeft: '5px', fontSize: '0.7rem' }}>∞</span>}
                    {' '}{n.title.substring(0, 40)}...
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{new Date(n.timestamp).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'toggles' && (
          <div style={styles.card}>
            <h2 style={{ marginTop: 0 }}><i className="fas fa-toggle-on" style={{ marginRight: '10px', color: '#10b981' }}></i>Feature Toggles</h2>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>Enable or disable site features globally</p>

            <div style={{ maxWidth: '500px' }}>
              <ToggleSwitch
                label="Dark Mode (Allow users to switch)"
                value={featureToggles.darkMode}
                onChange={(v) => setFeatureToggles({ ...featureToggles, darkMode: v })}
              />
              <ToggleSwitch
                label="Language Switcher"
                value={featureToggles.languageSwitch}
                onChange={(v) => setFeatureToggles({ ...featureToggles, languageSwitch: v })}
              />
              <ToggleSwitch
                label="Show Advertisements"
                value={featureToggles.adsEnabled}
                onChange={(v) => setFeatureToggles({ ...featureToggles, adsEnabled: v })}
              />
              <ToggleSwitch
                label="E-Paper Section"
                value={featureToggles.epaperEnabled}
                onChange={(v) => setFeatureToggles({ ...featureToggles, epaperEnabled: v })}
              />
              <ToggleSwitch
                label="Newsletter Subscription"
                value={featureToggles.newsletterEnabled}
                onChange={(v) => setFeatureToggles({ ...featureToggles, newsletterEnabled: v })}
              />
              <ToggleSwitch
                label="Weather Widget"
                value={featureToggles.weatherEnabled}
                onChange={(v) => setFeatureToggles({ ...featureToggles, weatherEnabled: v })}
              />
              <ToggleSwitch
                label="Top News Section"
                value={featureToggles.topNewsEnabled}
                onChange={(v) => setFeatureToggles({ ...featureToggles, topNewsEnabled: v })}
              />
              <ToggleSwitch
                label="Popular This Week Section"
                value={featureToggles.popularWeekEnabled}
                onChange={(v) => setFeatureToggles({ ...featureToggles, popularWeekEnabled: v })}
              />
              <ToggleSwitch
                label="Popular This Month Section"
                value={featureToggles.popularMonthEnabled}
                onChange={(v) => setFeatureToggles({ ...featureToggles, popularMonthEnabled: v })}
              />
              <ToggleSwitch
                label="Trending News Section"
                value={featureToggles.trendingNewsEnabled}
                onChange={(v) => setFeatureToggles({ ...featureToggles, trendingNewsEnabled: v })}
              />
              <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '2px solid #e2e8f0' }}>
                <h4 style={{ color: '#f59e0b', marginBottom: '15px' }}><i className="fas fa-crown" style={{ marginRight: '8px' }}></i>Premium Features</h4>
                <ToggleSwitch
                  label="Enable Paywall System"
                  value={featureToggles.paywallEnabled}
                  onChange={(v) => setFeatureToggles({ ...featureToggles, paywallEnabled: v })}
                />
                <ToggleSwitch
                  label="Premium Signup (Allow new registrations)"
                  value={featureToggles.premiumSignup}
                  onChange={(v) => setFeatureToggles({ ...featureToggles, premiumSignup: v })}
                />
              </div>
            </div>

            <button onClick={() => saveSettings('features', featureToggles)} style={{ ...styles.button('#10b981'), marginTop: '25px' }}>
              <i className="fas fa-save"></i>Save Toggles
            </button>
          </div>
        )}

        {activeTab === 'apis' && (
          <div style={styles.card}>
            <h2 style={{ marginTop: 0 }}><i className="fas fa-key" style={{ marginRight: '10px', color: '#8b5cf6' }}></i>API Management</h2>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>Configure external service integrations</p>

            <div style={{ display: 'grid', gap: '20px', maxWidth: '600px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
                  <i className="fas fa-image" style={{ marginRight: '8px', color: '#f59e0b' }}></i>ImgBB API Key
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type={showApiKeys.imgbb ? 'text' : 'password'}
                    value={apiSettings.imgbbKey}
                    onChange={(e) => setApiSettings({ ...apiSettings, imgbbKey: e.target.value })}
                    placeholder="Your ImgBB API key"
                    style={styles.input}
                  />
                  <button onClick={() => setShowApiKeys({ ...showApiKeys, imgbb: !showApiKeys.imgbb })} style={{ ...styles.button('#64748b'), padding: '10px 15px' }}>
                    <i className={`fas ${showApiKeys.imgbb ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                <small style={{ color: '#94a3b8' }}>Used for image uploads. Get key from imgbb.com</small>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
                  <i className="fab fa-google" style={{ marginRight: '8px', color: '#4285f4' }}></i>Google Ads Publisher ID
                </label>
                <input
                  type="text"
                  value={apiSettings.googleAdsId}
                  onChange={(e) => setApiSettings({ ...apiSettings, googleAdsId: e.target.value })}
                  placeholder="ca-pub-xxxxxxxxxx"
                  style={styles.input}
                />
                <small style={{ color: '#94a3b8' }}>Your AdSense publisher ID for displaying Google Ads</small>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
                  <i className="fas fa-chart-bar" style={{ marginRight: '8px', color: '#f59e0b' }}></i>Google Analytics ID
                </label>
                <input
                  type="text"
                  value={apiSettings.googleAnalyticsId}
                  onChange={(e) => setApiSettings({ ...apiSettings, googleAnalyticsId: e.target.value })}
                  placeholder="G-XXXXXXXXXX or UA-XXXXXXXX-X"
                  style={styles.input}
                />
                <small style={{ color: '#94a3b8' }}>For tracking page views and user analytics</small>
              </div>
            </div>

            <button onClick={() => saveSettings('apis', apiSettings)} style={{ ...styles.button('#8b5cf6'), marginTop: '25px' }}>
              <i className="fas fa-save"></i>Save API Settings
            </button>
          </div>
        )}

        {activeTab === 'popular' && (
          <div style={styles.card}>
            <h2 style={{ marginTop: 0 }}><i className="fas fa-fire" style={{ marginRight: '10px', color: '#f59e0b' }}></i>Popular News Management</h2>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>Manually select featured articles or use auto-population</p>

            <ToggleSwitch
              label="Auto-populate from latest articles"
              value={popularSettings.autoPopulate}
              onChange={(v) => setPopularSettings({ ...popularSettings, autoPopulate: v })}
            />

            <div style={{ marginTop: '25px' }}>
              <h4><i className="fas fa-fire-alt" style={{ marginRight: '8px', color: '#ef4444' }}></i>Popular This Week (Select up to 3)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                {[0, 1, 2].map(i => (
                  <select
                    key={i}
                    value={popularSettings.weekManual[i] || ''}
                    onChange={(e) => {
                      const newWeek = [...popularSettings.weekManual];
                      newWeek[i] = e.target.value;
                      setPopularSettings({ ...popularSettings, weekManual: newWeek });
                    }}
                    style={styles.input}
                  >
                    <option value="">-- Select Article {i + 1} --</option>
                    {allNews.map(n => (
                      <option key={n.id} value={n.id}>[{n.category}] {n.title.substring(0, 50)}...</option>
                    ))}
                  </select>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '25px' }}>
              <h4><i className="fas fa-chart-line" style={{ marginRight: '8px', color: '#10b981' }}></i>Popular This Month (Select up to 3)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                {[0, 1, 2].map(i => (
                  <select
                    key={i}
                    value={popularSettings.monthManual[i] || ''}
                    onChange={(e) => {
                      const newMonth = [...popularSettings.monthManual];
                      newMonth[i] = e.target.value;
                      setPopularSettings({ ...popularSettings, monthManual: newMonth });
                    }}
                    style={styles.input}
                  >
                    <option value="">-- Select Article {i + 1} --</option>
                    {allNews.map(n => (
                      <option key={n.id} value={n.id}>[{n.category}] {n.title.substring(0, 50)}...</option>
                    ))}
                  </select>
                ))}
              </div>
            </div>

            <button onClick={() => saveSettings('popular', popularSettings)} style={{ ...styles.button('#f59e0b'), marginTop: '25px' }}>
              <i className="fas fa-save"></i>Save Popular Settings
            </button>
          </div>
        )}

        {activeTab === 'upload' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={styles.card}>
              <h3>{editingNews ? 'Edit News' : 'Publish News'}</h3>
              <form onSubmit={handleNewsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
                <select value={category} onChange={e => setCategory(e.target.value)} style={styles.input}>
                  <option>Lucknow</option><option>National</option><option>Sports</option><option>Editorial</option><option>Technology</option><option>Top Story</option>
                </select>
                <input placeholder="Headline" value={title} onChange={e => setTitle(e.target.value)} style={styles.input} required />
                <RichTextEditor value={content} onChange={setContent} placeholder="Write your article content here..." />

                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <ToggleSwitch label="Make Headline" value={isHeadline} onChange={setIsHeadline} />
                  <ToggleSwitch label="Premium Content" value={isPremium} onChange={setIsPremium} />
                </div>

                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                  <ToggleSwitch label="Never Auto-Delete" value={neverExpire} onChange={setNeverExpire} />
                  {!neverExpire && (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px' }}>
                      <label>Auto-delete after:</label>
                      <input type="number" min="1" value={newsDuration} onChange={e => setNewsDuration(e.target.value)} style={{ width: '60px', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                      <span>days</span>
                    </div>
                  )}
                </div>

                <input type="file" accept="image/*" onChange={handleFileChange} />
                {imagePreview && <img src={imagePreview} alt="Preview" style={{ maxHeight: '120px', borderRadius: '8px' }} />}
                <button type="submit" style={styles.button('#2563eb')}>
                  <i className="fas fa-paper-plane"></i>{editingNews ? 'Update' : 'Publish'}
                </button>
                {editingNews && <button type="button" onClick={handleResetForms} style={styles.button('#64748b')}>Cancel Edit</button>}
              </form>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={styles.card}>
                <h3><i className="fas fa-bolt" style={{ color: '#e11d48', marginRight: '8px' }}></i>Breaking News Ticker</h3>
                <form onSubmit={handleTickerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '4px', display: 'block' }}>
                      <i className="fas fa-globe" style={{ marginRight: '6px' }}></i>Main Text (Fallback)
                    </label>
                    <input placeholder="Breaking news text..." value={tickerText} onChange={e => setTickerText(e.target.value)} style={styles.input} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '4px', display: 'block' }}>
                        <span style={{ color: '#f97316', fontWeight: 'bold' }}>हि</span> Hindi
                      </label>
                      <input placeholder="हिंदी में टिकर..." value={tickerTextHi} onChange={e => setTickerTextHi(e.target.value)} style={styles.input} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '4px', display: 'block' }}>
                        <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>EN</span> English
                      </label>
                      <input placeholder="Ticker in English..." value={tickerTextEn} onChange={e => setTickerTextEn(e.target.value)} style={styles.input} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <label>Show for:</label>
                    <input type="number" min="1" value={tickerDuration} onChange={e => setTickerDuration(e.target.value)} style={{ width: '60px', padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                    <span>hours</span>
                  </div>
                  <button type="submit" style={styles.button('#e11d48')}><i className="fas fa-sync"></i>Update Ticker</button>
                </form>
              </div>

              <div style={styles.card}>
                <h3><i className="fas fa-file-pdf" style={{ color: '#059669', marginRight: '8px' }}></i>E-Paper</h3>
                <form onSubmit={handlePaperSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                  <input type="date" value={paperDate} onChange={e => setPaperDate(e.target.value)} style={styles.input} required />

                  <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '8px', border: '1px dashed #10b981' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#059669', fontSize: '0.9rem' }}>
                      <i className="fas fa-upload" style={{ marginRight: '6px' }}></i>Upload PDF (Supabase Storage)
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setPdfFile(e.target.files[0])}
                      style={{ fontSize: '0.9rem' }}
                    />
                    {pdfFile && <span style={{ display: 'block', marginTop: '6px', color: '#10b981', fontSize: '0.85rem' }}><i className="fas fa-check"></i> {pdfFile.name}</span>}
                  </div>

                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>— OR —</div>

                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#64748b', fontSize: '0.9rem' }}>
                      <i className="fab fa-google-drive" style={{ marginRight: '6px' }}></i>Google Drive Link (Fallback)
                    </label>
                    <input
                      placeholder="Paste Google Drive share link..."
                      value={driveLink}
                      onChange={e => setDriveLink(e.target.value)}
                      style={styles.input}
                    />
                  </div>

                  <ToggleSwitch label="Premium E-Paper (Requires subscription)" value={paperPremium} onChange={setPaperPremium} />
                  <button type="submit" style={styles.button('#059669')}><i className="fas fa-upload"></i>Publish E-Paper</button>
                </form>
              </div>

              <div style={styles.card}>
                <h3><i className="fas fa-ad" style={{ color: '#d97706', marginRight: '8px' }}></i>Advertisement</h3>
                <form onSubmit={handleAdSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                  <select value={adPosition} onChange={e => setAdPosition(e.target.value)} style={styles.input}>
                    <option value="sidebar">Sidebar</option>
                    <option value="header">Header Banner</option>
                    <option value="between">Between Articles</option>
                    <option value="footer">Footer</option>
                    <option value="google">Google Ads Slot</option>
                  </select>
                  {adPosition !== 'google' && (
                    <>
                      <input type="file" accept="image/*" onChange={handleFileChange} required />
                      {imagePreview && <img src={imagePreview} alt="Preview" style={{ maxHeight: '80px', borderRadius: '6px' }} />}
                    </>
                  )}
                  {adPosition === 'google' && (
                    <p style={{ color: '#64748b', fontSize: '0.85rem', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                      <i className="fab fa-google" style={{ marginRight: '8px' }}></i>
                      Google Ads will use your Publisher ID from API settings
                    </p>
                  )}
                  <button type="submit" style={styles.button('#d97706')}><i className="fas fa-upload"></i>Add Advertisement</button>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            <h2 style={{ margin: '0 0 20px' }}><i className="fas fa-chart-line" style={{ marginRight: '10px', color: '#3b82f6' }}></i>Analytics Dashboard</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '25px' }}>
              <div style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                <i className="fas fa-newspaper" style={{ fontSize: '1.5rem' }}></i>
                <h3 style={{ fontSize: '2rem', margin: '8px 0' }}>{allNews.length}</h3>
                <p style={{ margin: 0 }}>Total Articles</p>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                <i className="fas fa-users" style={{ fontSize: '1.5rem' }}></i>
                <h3 style={{ fontSize: '2rem', margin: '8px 0' }}>{allSubscribers.length}</h3>
                <p style={{ margin: 0 }}>Subscribers</p>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                <i className="fas fa-crown" style={{ fontSize: '1.5rem' }}></i>
                <h3 style={{ fontSize: '2rem', margin: '8px 0' }}>{allNews.filter(n => n.isPremium).length}</h3>
                <p style={{ margin: 0 }}>Premium</p>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: 'white', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                <i className="fas fa-ad" style={{ fontSize: '1.5rem' }}></i>
                <h3 style={{ fontSize: '2rem', margin: '8px 0' }}>{allAds.length}</h3>
                <p style={{ margin: 0 }}>Active Ads</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={styles.card}>
                <h4 style={{ marginTop: 0 }}><i className="fas fa-chart-bar" style={{ marginRight: '8px', color: '#3b82f6' }}></i>Articles by Category</h4>
                <div style={{ marginTop: '15px' }}>
                  {['Lucknow', 'National', 'Sports', 'Editorial', 'Top Story'].map(cat => {
                    const count = allNews.filter(n => n.category === cat).length;
                    const percent = allNews.length > 0 ? (count / allNews.length * 100) : 0;
                    return (
                      <div key={cat} style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.9rem', color: '#475569' }}>{cat}</span>
                          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{count}</span>
                        </div>
                        <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${percent}%`, background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', borderRadius: '4px', transition: 'width 0.5s' }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={styles.card}>
                <h4 style={{ marginTop: 0 }}><i className="fas fa-bullseye" style={{ marginRight: '8px', color: '#f59e0b' }}></i>Ad Placement Stats</h4>
                <div style={{ marginTop: '15px' }}>
                  {['sidebar', 'header', 'between', 'footer', 'google'].map(pos => {
                    const count = allAds.filter(a => (a.position || 'sidebar') === pos).length;
                    return (
                      <div key={pos} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f8fafc', borderRadius: '8px', marginBottom: '8px' }}>
                        <span style={{ textTransform: 'capitalize' }}>{pos}</span>
                        <span style={{ fontWeight: 'bold', color: count > 0 ? '#10b981' : '#94a3b8' }}>{count} ads</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={styles.card}>
                <h4 style={{ marginTop: 0 }}><i className="fas fa-clock" style={{ marginRight: '8px', color: '#10b981' }}></i>Recent Activity</h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {allNews.slice(0, 5).map(n => (
                    <div key={n.id} style={{ display: 'flex', gap: '10px', marginBottom: '12px', padding: '8px', background: '#f8fafc', borderRadius: '8px' }}>
                      <div style={{ width: '40px', height: '40px', background: '#e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <i className="fas fa-file-alt" style={{ color: '#64748b' }}></i>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</p>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(n.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={styles.card}>
                <h4 style={{ marginTop: 0 }}><i className="fas fa-envelope-open" style={{ marginRight: '8px', color: '#b91c1c' }}></i>Messages Overview</h4>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <div style={{ flex: 1, background: '#fef2f2', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                    <h3 style={{ color: '#b91c1c', margin: 0 }}>{allContacts.length}</h3>
                    <p style={{ margin: '5px 0 0', fontSize: '0.85rem', color: '#64748b' }}>Total Messages</p>
                  </div>
                  <div style={{ flex: 1, background: '#f0fdf4', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
                    <h3 style={{ color: '#10b981', margin: 0 }}>{allSubscribers.length}</h3>
                    <p style={{ margin: '5px 0 0', fontSize: '0.85rem', color: '#64748b' }}>Newsletter Subs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'manage' && (
          <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Manage Content</h2>
              <button onClick={fetchAndCleanup} style={styles.button('#475569')}><i className="fas fa-sync-alt"></i>Refresh</button>
            </div>

            <h4><i className="fas fa-newspaper" style={{ marginRight: '8px', color: '#b91c1c' }}></i>News ({allNews.length})</h4>
            <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '20px' }}>
              {allNews.map(n => (
                <div key={n.id} style={styles.listItem}>
                  <span>
                    <strong style={{ color: '#2563eb' }}>[{n.category}]</strong>
                    {n.isPremium && <span style={{ background: '#f59e0b', color: 'white', padding: '2px 6px', borderRadius: '4px', marginLeft: '5px', fontSize: '0.7rem' }}>$</span>}
                    {n.neverExpire && <span style={{ background: '#10b981', color: 'white', padding: '2px 6px', borderRadius: '4px', marginLeft: '5px', fontSize: '0.7rem' }}>∞</span>}
                    {' '}{n.title.substring(0, 50)}...
                  </span>
                  <div>
                    <button onClick={() => handleEditNews(n)} style={styles.editBtn}><i className="fas fa-edit"></i></button>
                    <button onClick={() => handleDelete('news', n.id)} style={styles.deleteBtn}><i className="fas fa-trash"></i></button>
                  </div>
                </div>
              ))}
            </div>

            <h4><i className="fas fa-ad" style={{ marginRight: '8px', color: '#d97706' }}></i>Ads ({allAds.length})</h4>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {allAds.map(a => (
                <div key={a.id} style={{ position: 'relative', width: '100px' }}>
                  <img src={a.imgUrl} alt="Ad" style={{ width: '100%', borderRadius: '6px' }} />
                  <span style={{ fontSize: '0.65rem', background: '#f59e0b', color: 'white', padding: '2px 4px', borderRadius: '3px', position: 'absolute', bottom: '2px', left: '2px' }}>{a.position || 'sidebar'}</span>
                  <button onClick={() => handleDelete('ads', a.id)} style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: 'white', borderRadius: '50%', width: '20px', height: '20px', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>×</button>
                </div>
              ))}
            </div>

            <h4><i className="fas fa-file-pdf" style={{ marginRight: '8px', color: '#059669' }}></i>E-Papers ({allPapers.length})</h4>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {allPapers.map(p => (
                <div key={p.id} style={styles.listItem}>
                  <span>
                    <strong>{p.date}</strong>
                    {p.isPremium && <span style={{ background: '#f59e0b', color: 'white', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px', fontSize: '0.7rem' }}>PREMIUM</span>}
                  </span>
                  <div>
                    <a href={p.pdfUrl} target="_blank" rel="noopener noreferrer" style={{ ...styles.editBtn, textDecoration: 'none' }}><i className="fas fa-external-link-alt"></i></a>
                    <button onClick={() => handleDelete('epapers', p.id)} style={styles.deleteBtn}><i className="fas fa-trash"></i></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ marginTop: 0, marginBottom: 0 }}>
                <i className="fas fa-envelope" style={{ marginRight: '10px', color: '#b91c1c' }}></i>
                Messages ({allContacts.length})
                {unreadCount > 0 && <span style={{ background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', marginLeft: '10px' }}>{unreadCount} new</span>}
              </h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['all', 'unread', 'read'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setMessageFilter(filter)}
                    style={{
                      padding: '8px 16px',
                      border: messageFilter === filter ? 'none' : '1px solid #e2e8f0',
                      background: messageFilter === filter ? '#b91c1c' : 'white',
                      color: messageFilter === filter ? 'white' : '#64748b',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                      fontWeight: messageFilter === filter ? 'bold' : 'normal'
                    }}
                  >{filter}</button>
                ))}
              </div>
            </div>
            {filteredContacts.length === 0 ? <p style={{ color: '#94a3b8' }}>No messages</p> : filteredContacts.map(c => (
              <div key={c.id} style={{
                background: (c.status || 'unread') === 'unread' ? '#fef2f2' : '#f8fafc',
                padding: '15px',
                borderRadius: '10px',
                marginBottom: '10px',
                border: (c.status || 'unread') === 'unread' ? '1px solid #fecaca' : '1px solid #e2e8f0',
                borderLeft: (c.status || 'unread') === 'unread' ? '4px solid #b91c1c' : '4px solid #94a3b8'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <strong>{c.name}</strong>
                    {(c.status || 'unread') === 'unread' && <span style={{ background: '#b91c1c', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem' }}>NEW</span>}
                  </div>
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{new Date(c.timestamp).toLocaleString()}</span>
                </div>
                <p style={{ margin: '5px 0', fontSize: '0.9rem' }}><i className="fas fa-envelope" style={{ marginRight: '6px' }}></i>{c.email}</p>
                {c.phone && <p style={{ margin: '5px 0', fontSize: '0.9rem' }}><i className="fas fa-phone" style={{ marginRight: '6px' }}></i>{c.phone}</p>}
                <p style={{ margin: '5px 0' }}><strong>Subject:</strong> {c.subject}</p>
                <p style={{ background: 'white', padding: '10px', borderRadius: '6px', marginTop: '10px' }}>{c.message}</p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button
                    onClick={() => handleMarkRead(c.id, c.status || 'unread')}
                    style={{ ...styles.editBtn }}
                  >
                    <i className={`fas ${(c.status || 'unread') === 'unread' ? 'fa-check' : 'fa-envelope'}`}></i>
                    {(c.status || 'unread') === 'unread' ? ' Mark Read' : ' Mark Unread'}
                  </button>
                  <button onClick={() => handleDelete('contacts', c.id)} style={styles.deleteBtn}>
                    <i className="fas fa-trash"></i> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'subscribers' && (
          <div style={styles.card}>
            <h2 style={{ marginTop: 0 }}><i className="fas fa-users" style={{ marginRight: '10px', color: '#10b981' }}></i>Newsletter Subscribers ({allSubscribers.length})</h2>
            {allSubscribers.length === 0 ? <p style={{ color: '#94a3b8' }}>No subscribers yet</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                <thead><tr style={{ background: '#f1f5f9' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>#</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '10px' }}>Action</th>
                </tr></thead>
                <tbody>
                  {allSubscribers.map((s, i) => (
                    <tr key={s.id}>
                      <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{i + 1}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{s.email}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{new Date(s.timestamp).toLocaleDateString()}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
                        <button onClick={() => handleDelete('subscribers', s.id)} style={styles.deleteBtn}><i className="fas fa-trash"></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;