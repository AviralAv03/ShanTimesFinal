import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import ShareButtons from '../components/ShareButtons';
import SkeletonCard from '../components/SkeletonCard';

const NewsDetail = ({ lang }) => {
    const { newsId } = useParams();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const t = {
        readTime: lang === 'hi' ? 'मिनट पढ़ने का समय' : 'min read',
        published: lang === 'hi' ? 'प्रकाशित:' : 'Published:',
        share: lang === 'hi' ? 'साझा करें' : 'Share',
        backHome: lang === 'hi' ? 'होम पेज पर वापस जाएं' : 'Back to Home',
        notFound: lang === 'hi' ? 'समाचार नहीं मिला' : 'News article not found',
        loading: lang === 'hi' ? 'लोड हो रहा है...' : 'Loading...'
    };

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const docRef = doc(db, "news", newsId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = { id: docSnap.id, ...docSnap.data() };
                    setArticle(data);

                    // Update page title and meta tags dynamically
                    document.title = `${data.title} | Shan Times`;

                    // Update Open Graph meta tags for this specific article
                    updateMetaTags(data);
                } else {
                    setError('Article not found');
                }
            } catch (e) {
                console.error('Error fetching article:', e);
                setError('Failed to load article');
            }
            setLoading(false);
        };

        fetchArticle();

        // Cleanup: Reset title when leaving page
        return () => {
            document.title = 'राष्ट्रीय हिन्दी दैनिक: Shan Times';
            resetMetaTags();
        };
    }, [newsId]);

    const updateMetaTags = (data) => {
        const url = `https://shantimes.in/news/${data.id}`;
        const description = stripHtml(data.content)?.substring(0, 160) || '';
        const image = data.imgUrl || 'https://shantimes.in/og-image.png';

        // Update or create meta tags
        setMetaTag('property', 'og:title', data.title);
        setMetaTag('property', 'og:description', description);
        setMetaTag('property', 'og:url', url);
        setMetaTag('property', 'og:image', image);
        setMetaTag('property', 'og:type', 'article');

        setMetaTag('name', 'twitter:title', data.title);
        setMetaTag('name', 'twitter:description', description);
        setMetaTag('name', 'twitter:image', image);
        setMetaTag('name', 'twitter:url', url);

        setMetaTag('name', 'description', description);
    };

    const resetMetaTags = () => {
        const defaultDesc = 'शान टाइम्स - राष्ट्रीय हिन्दी दैनिक | Shan Times - National Hindi Daily Newspaper.';
        const defaultImg = 'https://shantimes.in/og-image.png';
        const defaultUrl = 'https://shantimes.in/';

        setMetaTag('property', 'og:title', 'शान टाइम्स | Shan Times - राष्ट्रीय हिन्दी दैनिक');
        setMetaTag('property', 'og:description', defaultDesc);
        setMetaTag('property', 'og:url', defaultUrl);
        setMetaTag('property', 'og:image', defaultImg);
        setMetaTag('property', 'og:type', 'website');

        setMetaTag('name', 'twitter:title', 'शान टाइम्स | Shan Times - राष्ट्रीय हिन्दी दैनिक');
        setMetaTag('name', 'twitter:description', defaultDesc);
        setMetaTag('name', 'twitter:image', defaultImg);
        setMetaTag('name', 'twitter:url', defaultUrl);

        setMetaTag('name', 'description', defaultDesc);
    };

    const setMetaTag = (attr, key, value) => {
        let element = document.querySelector(`meta[${attr}="${key}"]`);
        if (element) {
            element.setAttribute('content', value);
        }
    };

    const stripHtml = (html) => {
        if (!html) return '';
        return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    };

    const calculateReadTime = (content) => {
        if (!content) return 1;
        return Math.max(1, Math.ceil(content.split(/\s+/).length / 200));
    };

    if (loading) {
        return (
            <div className="container" style={{ padding: '40px 20px' }}>
                <SkeletonCard />
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className="container" style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div style={{
                    background: 'var(--card-bg)',
                    padding: '60px 40px',
                    borderRadius: '16px',
                    boxShadow: 'var(--shadow-md)'
                }}>
                    <i className="fas fa-exclamation-circle" style={{ fontSize: '4rem', color: 'var(--primary)', marginBottom: '20px' }}></i>
                    <h2 style={{ color: 'var(--text-primary)', marginBottom: '20px' }}>{t.notFound}</h2>
                    <Link to="/" className="read-more-btn" style={{ display: 'inline-flex' }}>
                        <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i>
                        {t.backHome}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '20px' }}>
            <article className="news-detail-page" style={{
                maxWidth: '900px',
                margin: '0 auto',
                background: 'var(--card-bg)',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-lg)'
            }}>
                {article.imgUrl && (
                    <img
                        src={article.imgUrl}
                        alt={article.title}
                        style={{
                            width: '100%',
                            maxHeight: '500px',
                            objectFit: 'cover'
                        }}
                    />
                )}

                <div style={{ padding: '30px' }}>
                    <div style={{ marginBottom: '15px' }}>
                        <span style={{
                            color: 'var(--primary)',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            fontSize: '0.9rem',
                            background: 'rgba(185, 28, 28, 0.1)',
                            padding: '5px 12px',
                            borderRadius: '20px'
                        }}>
                            {article.category}
                        </span>
                        {article.isPremium && (
                            <span style={{ marginLeft: '10px', color: '#f59e0b' }}>
                                <i className="fas fa-crown"></i>
                            </span>
                        )}
                    </div>

                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        color: 'var(--text-primary)',
                        lineHeight: '1.3',
                        marginBottom: '20px'
                    }}>
                        {article.title}
                    </h1>

                    <div className="card-meta" style={{ marginBottom: '25px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
                        <span>
                            <i className="fas fa-calendar"></i>
                            {t.published} {new Date(article.timestamp).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN')}
                        </span>
                        <span>
                            <i className="fas fa-clock"></i>
                            {calculateReadTime(article.content)} {t.readTime}
                        </span>
                    </div>

                    <div
                        className="rich-content"
                        dangerouslySetInnerHTML={{ __html: article.content }}
                        style={{
                            fontSize: '1.1rem',
                            lineHeight: '1.8',
                            color: 'var(--text-secondary)'
                        }}
                    />

                    <div style={{
                        marginTop: '30px',
                        paddingTop: '20px',
                        borderTop: '1px solid var(--border-color)'
                    }}>
                        <p style={{ fontWeight: 'bold', marginBottom: '15px', color: 'var(--text-primary)' }}>
                            <i className="fas fa-share-alt" style={{ marginRight: '8px', color: 'var(--primary)' }}></i>
                            {t.share}:
                        </p>
                        <ShareButtons title={article.title} articleId={article.id} />
                    </div>

                    <div style={{ marginTop: '30px', textAlign: 'center' }}>
                        <Link to="/" className="read-more-btn" style={{ display: 'inline-flex' }}>
                            <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i>
                            {t.backHome}
                        </Link>
                    </div>
                </div>
            </article>
        </div>
    );
};

export default NewsDetail;
