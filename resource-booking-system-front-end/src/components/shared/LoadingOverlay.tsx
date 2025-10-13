import React from 'react';
import './css/LoadingOverlay.css';

const LoadingOverlay: React.FC = () => {
    return (
        <div className="loading-overlay-content">
            <div className="spinner"></div>
        </div>
    );
};

export default LoadingOverlay;
