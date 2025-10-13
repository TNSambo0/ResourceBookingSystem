import React from 'react';
import HeroSection from './HeroSection';
import FeatureHighlights from './FeatureHighlights';

type LandingPageProps = {
    onLoginClick: () => void;
};

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
    return (
        <div className="container mt-5">
            {/* Hero section */}
            <HeroSection onLoginClick={onLoginClick}></HeroSection>

            {/* Features section */}
            <FeatureHighlights></FeatureHighlights>
        </div>
    );
};

export default LandingPage;
