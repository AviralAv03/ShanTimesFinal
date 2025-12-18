import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

const Newsletter = ({ lang, onSuccess, onError }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const t = {
        title: lang === 'hi' ? 'न्यूज़लेटर सब्सक्राइब करें' : 'Subscribe to Newsletter',
        subtitle: lang === 'hi'
            ? 'ताज़ा खबरें सीधे अपने इनबॉक्स में पाएं'
            : 'Get the latest news delivered to your inbox',
        placeholder: lang === 'hi' ? 'अपना ईमेल दर्ज करें' : 'Enter your email',
        button: lang === 'hi' ? 'सब्सक्राइब' : 'Subscribe',
        subscribing: lang === 'hi' ? 'सब्सक्राइब हो रहा है...' : 'Subscribing...'
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !email.includes('@')) {
            if (onError) onError('Please enter a valid email');
            return;
        }

        setLoading(true);

        try {
            await addDoc(collection(db, 'subscribers'), {
                email: email,
                timestamp: Date.now(),
                source: 'website'
            });

            setEmail('');
            if (onSuccess) onSuccess('Successfully subscribed!');
        } catch (error) {
            console.error('Newsletter subscription error:', error);
            if (onError) onError('Subscription failed. Please try again.');
        }

        setLoading(false);
    };

    return (
        <div className="newsletter-section">
            <h2>{t.title}</h2>
            <p>{t.subtitle}</p>
            <form className="newsletter-form" onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder={t.placeholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <button type="submit" disabled={loading}>
                    {loading ? t.subscribing : t.button}
                </button>
            </form>
        </div>
    );
};

export default Newsletter;
