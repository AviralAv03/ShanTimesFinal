// SEO Utility Functions for Shan Times
// Handles dynamic meta tags, structured data, and canonical URLs

const BASE_URL = 'https://shantimes.in';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
const DEFAULT_TITLE = 'शान टाइम्स | Shan Times - राष्ट्रीय हिन्दी दैनिक';
const DEFAULT_DESCRIPTION = 'शान टाइम्स - राष्ट्रीय हिन्दी दैनिक | Shan Times - National Hindi Daily Newspaper. Latest news from Lucknow, National, Sports, Technology and more.';

/**
 * Set a single meta tag
 */
export const setMetaTag = (attr, key, value) => {
    let element = document.querySelector(`meta[${attr}="${key}"]`);
    if (element) {
        element.setAttribute('content', value);
    } else {
        // Create if doesn't exist
        element = document.createElement('meta');
        element.setAttribute(attr, key);
        element.setAttribute('content', value);
        document.head.appendChild(element);
    }
};

/**
 * Update page SEO - title, meta description, OG tags
 */
export const updatePageSEO = ({ title, description, url, image, type = 'website' }) => {
    // Update title
    if (title) {
        document.title = title;
    }

    const desc = description || DEFAULT_DESCRIPTION;
    const img = image || DEFAULT_IMAGE;
    const pageUrl = url || window.location.href;

    // Meta description
    setMetaTag('name', 'description', desc);

    // Open Graph
    setMetaTag('property', 'og:title', title || DEFAULT_TITLE);
    setMetaTag('property', 'og:description', desc);
    setMetaTag('property', 'og:url', pageUrl);
    setMetaTag('property', 'og:image', img);
    setMetaTag('property', 'og:type', type);

    // Twitter Card
    setMetaTag('name', 'twitter:title', title || DEFAULT_TITLE);
    setMetaTag('name', 'twitter:description', desc);
    setMetaTag('name', 'twitter:image', img);
    setMetaTag('name', 'twitter:url', pageUrl);

    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
        canonical.setAttribute('href', pageUrl);
    }
};

/**
 * Reset meta tags to defaults
 */
export const resetPageSEO = () => {
    updatePageSEO({
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        url: BASE_URL,
        image: DEFAULT_IMAGE,
        type: 'website'
    });
};

/**
 * Add BreadcrumbList structured data
 */
export const addBreadcrumbSchema = (items) => {
    // Remove existing breadcrumb schema
    const existing = document.querySelector('script[data-type="breadcrumb-schema"]');
    if (existing) existing.remove();

    const breadcrumbData = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": items.map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.name,
            "item": item.url
        }))
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-type', 'breadcrumb-schema');
    script.textContent = JSON.stringify(breadcrumbData);
    document.head.appendChild(script);
};

/**
 * Remove breadcrumb schema
 */
export const removeBreadcrumbSchema = () => {
    const existing = document.querySelector('script[data-type="breadcrumb-schema"]');
    if (existing) existing.remove();
};

/**
 * Category page metadata lookup
 */
export const getCategoryMeta = (category, lang = 'hi') => {
    const categoryMeta = {
        'Lucknow': {
            hi: {
                title: 'लखनऊ समाचार | Lucknow News - Shan Times',
                description: 'लखनऊ की ताज़ा खबरें, स्थानीय समाचार, और शहर की घटनाएं। Lucknow local news, city updates, events and more on Shan Times.'
            },
            en: {
                title: 'Lucknow News | Shan Times',
                description: 'Latest Lucknow news, local updates, city events and breaking news from the capital of Uttar Pradesh.'
            }
        },
        'National': {
            hi: {
                title: 'राष्ट्रीय समाचार | National News - Shan Times',
                description: 'भारत की ताज़ा राष्ट्रीय खबरें, देश-विदेश की घटनाएं। India national news, politics, government updates on Shan Times.'
            },
            en: {
                title: 'National News | Shan Times',
                description: 'Latest national news from India - politics, government, policy updates and breaking news.'
            }
        },
        'Sports': {
            hi: {
                title: 'खेल समाचार | Sports News - Shan Times',
                description: 'क्रिकेट, फुटबॉल, कबड्डी और अन्य खेलों की ताज़ा खबरें। Cricket, football, kabaddi and sports news on Shan Times.'
            },
            en: {
                title: 'Sports News | Shan Times',
                description: 'Latest sports news - cricket, football, kabaddi, Olympics and more sports updates.'
            }
        },
        'Technology': {
            hi: {
                title: 'प्रौद्योगिकी समाचार | Technology News - Shan Times',
                description: 'टेक्नोलॉजी, गैजेट्स, स्मार्टफोन और डिजिटल दुनिया की खबरें। Tech news, gadgets, smartphones on Shan Times.'
            },
            en: {
                title: 'Technology News | Shan Times',
                description: 'Latest technology news - gadgets, smartphones, apps, AI, and digital world updates.'
            }
        },
        'Editorial': {
            hi: {
                title: 'संपादकीय | Editorial - Shan Times',
                description: 'शान टाइम्स के संपादकीय लेख, विचार और विश्लेषण। Editorial opinions, analysis and thought leadership.'
            },
            en: {
                title: 'Editorial | Shan Times',
                description: 'Editorial articles, opinions, analysis and thought leadership from Shan Times.'
            }
        }
    };

    const meta = categoryMeta[category]?.[lang] || categoryMeta[category]?.['hi'];
    return meta || {
        title: `${category} News | Shan Times`,
        description: `Latest ${category} news and updates on Shan Times.`
    };
};
