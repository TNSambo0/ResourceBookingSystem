import React from 'react';
import HeroSection from './HeroSection';
import FeatureHighlights from './FeatureHighlights';

type LandingPageProps = {
    onLoginClick: (redirectPath: string) => void;
};

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
    return (
        <div className="container mt-5">
            {/* Hero section */}
            <HeroSection onLoginClick={onLoginClick} />

            {/* Features section */}
            <FeatureHighlights />
        </div>
    );
};

export default LandingPage;
