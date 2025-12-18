import React from 'react';

const ShareButtons = ({ title, url }) => {
    const shareUrl = url || window.location.href;
    const shareTitle = encodeURIComponent(title);
    const shareUrlEncoded = encodeURIComponent(shareUrl);

    const handleWhatsApp = () => {
        window.open(
            `https://api.whatsapp.com/send?text=${shareTitle}%20${shareUrlEncoded}`,
            '_blank'
        );
    };

    const handleFacebook = () => {
        window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${shareUrlEncoded}`,
            '_blank'
        );
    };

    const handleTwitter = () => {
        window.open(
            `https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrlEncoded}`,
            '_blank'
        );
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            alert('Link copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="share-buttons">
            <button className="share-btn whatsapp" onClick={handleWhatsApp}>
                <i className="fab fa-whatsapp"></i>
                WhatsApp
            </button>
            <button className="share-btn facebook" onClick={handleFacebook}>
                <i className="fab fa-facebook-f"></i>
                Facebook
            </button>
            <button className="share-btn twitter" onClick={handleTwitter}>
                <i className="fab fa-twitter"></i>
                Twitter
            </button>
            <button className="share-btn copy" onClick={handleCopy}>
                <i className="fas fa-link"></i>
                Copy Link
            </button>
        </div>
    );
};

export default ShareButtons;
