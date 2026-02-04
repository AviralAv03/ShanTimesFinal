import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { updatePageSEO, resetPageSEO } from '../utils/seo';

const Contact = ({ lang, toast }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [mapEnabled, setMapEnabled] = useState(true);
  const [mapEmbedUrl, setMapEmbedUrl] = useState('');

  useEffect(() => {
    // Set Contact page SEO
    updatePageSEO({
      title: lang === 'hi' ? 'संपर्क करें | Shan Times' : 'Contact Us | Shan Times',
      description: lang === 'hi'
        ? 'शान टाइम्स से संपर्क करें। पता: 175/41 पीर जलील, अमीनाबाद पार्क, लखनऊ। फोन: 9120967777'
        : 'Contact Shan Times. Address: 175/41 Peer Jaleel, Aminabad Park, Lucknow. Phone: 9120967777',
      url: 'https://shantimes.in/contact',
      type: 'website'
    });

    // Load map settings from Firebase
    const loadMapSettings = async () => {
      try {
        const featSnap = await getDoc(doc(db, "settings", "features"));
        if (featSnap.exists()) {
          setMapEnabled(featSnap.data().mapEnabled !== false);
        }
        const contactSnap = await getDoc(doc(db, "settings", "contact"));
        if (contactSnap.exists() && contactSnap.data().mapEmbedUrl) {
          setMapEmbedUrl(contactSnap.data().mapEmbedUrl);
        }
      } catch (e) {
        console.log("Error loading map settings:", e);
      }
    };
    loadMapSettings();

    return () => resetPageSEO();
  }, [lang]);

  const t = {
    title: lang === 'hi' ? 'संपर्क करें' : 'Contact Us',
    addressLabel: lang === 'hi' ? 'पता' : 'Address',
    phoneLabel: lang === 'hi' ? 'फ़ोन' : 'Phone',
    emailLabel: lang === 'hi' ? 'ईमेल' : 'Email',
    addressText: lang === 'hi'
      ? '175/41 पीर जलील, अमीनाबाद पार्क, लखनऊ - 226018'
      : '175/41 Peer Jaleel, Aminabad Park, Lucknow - 226018',
    mgmtTitle: lang === 'hi' ? 'प्रबंधन टीम' : 'Management Team',
    founder: lang === 'hi' ? 'संस्थापक' : 'Founder',
    editor: lang === 'hi' ? 'संपादक' : 'Editor',
    manager: lang === 'hi' ? 'प्रबंधक (प्रसार)' : 'Manager (Circulation)',
    founderName: lang === 'hi' ? 'स्व. जंग बहादुर सक्सेना' : 'Late Jang Bahadur Saxena',
    editorName: lang === 'hi' ? 'सारिका सोनकर' : 'Sarika Sonkar',
    managerName: lang === 'hi' ? 'योगेंद्र पाल' : 'Yogendra Pal',
    formTitle: lang === 'hi' ? 'हमें संदेश भेजें' : 'Send us a Message',
    namePlaceholder: lang === 'hi' ? 'आपका नाम' : 'Your Name',
    emailPlaceholder: lang === 'hi' ? 'आपका ईमेल' : 'Your Email',
    phonePlaceholder: lang === 'hi' ? 'फ़ोन नंबर' : 'Phone Number',
    subjectPlaceholder: lang === 'hi' ? 'विषय' : 'Subject',
    messagePlaceholder: lang === 'hi' ? 'आपका संदेश' : 'Your Message',
    submitBtn: lang === 'hi' ? 'संदेश भेजें' : 'Send Message',
    submitting: lang === 'hi' ? 'भेजा जा रहा है...' : 'Sending...',
    successMsg: lang === 'hi' ? 'संदेश भेज दिया गया!' : 'Message sent successfully!',
    errorMsg: lang === 'hi' ? 'कुछ गलत हो गया।' : 'Something went wrong.',
    workingHours: lang === 'hi' ? 'कार्य समय' : 'Working Hours',
    weekdays: lang === 'hi' ? 'सोमवार - शनिवार: सुबह 9 बजे - शाम 6 बजे' : 'Monday - Saturday: 9 AM - 6 PM',
    sunday: lang === 'hi' ? 'रविवार: बंद' : 'Sunday: Closed',
    invalidEmail: lang === 'hi' ? 'कृपया वैध ईमेल दर्ज करें' : 'Please enter a valid email',
    invalidPhone: lang === 'hi' ? 'कृपया वैध फोन नंबर दर्ज करें' : 'Please enter a valid phone number'
  };

  const validateForm = () => {
    const newErrors = {};
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = t.invalidEmail;
    }
    // Phone validation (optional, but if provided must be valid)
    if (formData.phone) {
      const phoneRegex = /^[0-9]{10,12}$/;
      if (!phoneRegex.test(formData.phone.replace(/[\s-]/g, ''))) {
        newErrors.phone = t.invalidPhone;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      await addDoc(collection(db, 'contacts'), {
        ...formData,
        timestamp: Date.now(),
        status: 'new'
      });

      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      if (toast) toast.success(t.successMsg);
    } catch (error) {
      console.error('Contact form error:', error);
      if (toast) toast.error(t.errorMsg);
    }

    setLoading(false);
  };

  return (
    <div className="container" style={{ flexDirection: 'column', alignItems: 'center' }}>
      <h2 className="page-title">{t.title}</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px', width: '100%', maxWidth: '1000px' }}>

        <div className="contact-box">
          <div className="contact-row">
            <p>
              <i className="fas fa-newspaper"></i>
              <strong>RNI:</strong> UPHIN/2009/30284
            </p>
          </div>
          <div className="contact-row">
            <p><strong><i className="fas fa-map-marker-alt"></i> {t.addressLabel}:</strong></p>
            <p style={{ marginLeft: '30px', marginTop: '8px' }}>{t.addressText}</p>
          </div>
          <div className="contact-row">
            <p><i className="fas fa-phone"></i> <strong>{t.phoneLabel}:</strong> 9120967777, 9005008529</p>
          </div>
          <div className="contact-row" style={{ borderBottom: 'none' }}>
            <p><i className="fas fa-envelope"></i> <strong>{t.emailLabel}:</strong> shantimes2009@gmail.com</p>
          </div>

          <div style={{
            background: 'var(--bg-secondary)',
            padding: '25px',
            borderRadius: '12px',
            marginTop: '25px',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{ marginTop: 0, borderBottom: '2px solid var(--primary)', display: 'inline-block', paddingBottom: '8px', color: 'var(--text-primary)' }}>
              {t.mgmtTitle}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 12px', marginTop: '15px' }}>
              <strong style={{ color: 'var(--primary)' }}>{t.founder}:</strong>
              <span>{t.founderName}</span>
              <strong style={{ color: 'var(--primary)' }}>{t.editor}:</strong>
              <span>{t.editorName}</span>
              <strong style={{ color: 'var(--primary)' }}>{t.manager}:</strong>
              <span>{t.managerName}</span>
            </div>
          </div>
        </div>

        <div className="contact-box">
          <h3 style={{
            marginTop: 0,
            marginBottom: '25px',
            borderBottom: '2px solid var(--primary)',
            display: 'inline-block',
            paddingBottom: '8px',
            color: 'var(--text-primary)'
          }}>
            <i className="fas fa-paper-plane" style={{ marginRight: '10px', color: 'var(--primary)' }}></i>
            {t.formTitle}
          </h3>

          <form className="contact-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder={t.namePlaceholder}
              value={formData.name}
              onChange={handleChange}
              required
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <input
                  type="email"
                  name="email"
                  placeholder={t.emailPlaceholder}
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={{
                    borderColor: errors.email ? '#ef4444' : undefined,
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />
                {errors.email && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px' }}>{errors.email}</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <input
                  type="tel"
                  name="phone"
                  placeholder={t.phonePlaceholder}
                  value={formData.phone}
                  onChange={handleChange}
                  style={{
                    borderColor: errors.phone ? '#ef4444' : undefined,
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />
                {errors.phone && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px' }}>{errors.phone}</span>}
              </div>
            </div>
            <input
              type="text"
              name="subject"
              placeholder={t.subjectPlaceholder}
              value={formData.subject}
              onChange={handleChange}
              required
            />
            <textarea
              name="message"
              placeholder={t.messagePlaceholder}
              value={formData.message}
              onChange={handleChange}
              rows="4"
              required
            ></textarea>
            <button type="submit" disabled={loading}>
              <i className="fas fa-paper-plane" style={{ marginRight: '8px' }}></i>
              {loading ? t.submitting : t.submitBtn}
            </button>
          </form>
        </div>
      </div>

      {mapEnabled && (
        <div style={{
          marginTop: '40px',
          width: '100%',
          maxWidth: '1000px',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid var(--border-color)'
        }}>
          <iframe
            src={mapEmbedUrl || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3559.5!2d80.9462!3d26.8467!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjbCsDUwJzQ4LjEiTiA4MMKwNTYnNDYuMyJF!5e0!3m2!1sen!2sin!4v1234567890"}
            width="100%"
            height="300"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Shan Times Location"
          ></iframe>
        </div>
      )}
    </div>
  );
};

export default Contact;