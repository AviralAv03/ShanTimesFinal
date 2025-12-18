import React from 'react';

const SkeletonCard = () => {
    return (
        <div className="skeleton-card">
            <div className="skeleton skeleton-image"></div>
            <div className="skeleton skeleton-text short" style={{ marginTop: '20px' }}></div>
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-text"></div>
            <div className="skeleton skeleton-text short" style={{ marginBottom: '20px' }}></div>
        </div>
    );
};

export default SkeletonCard;
