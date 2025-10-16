import React from 'react';

type HeroSectionProps = {
    onLoginClick: (redirectPath: string) => void;
};

const HeroSection: React.FC<HeroSectionProps> = ({ onLoginClick }) => {

    return (
        <div className="container my-5">
            <div className="row align-items-center">
                {/* Left Column: Text */}
                <div className="col-md-6 mb-4">
                    <h1 className="display-4 fw-bold text-primary">
                        Welcome to the Internal Resource Booking System
                    </h1>
                    <p className="lead">
                        Easily book meeting rooms, resources, and manage your reservations – all in one place!
                    </p>
                    <div className="mt-4">
                        <button
                            onClick={() => onLoginClick('/dashboard')}
                            className="btn btn-primary btn-lg me-3"
                        >
                            View Resources
                        </button>
                        <button
                            onClick={() => onLoginClick('/dashboard')}
                            className="btn btn-outline-primary btn-lg"
                        >
                            Book Now
                        </button>
                    </div>
                </div>

                {/* Right Column: Illustration */}
                <div className="col-md-6 text-center">
                    <img
                        src="https://cdn-icons-png.flaticon.com/512/2920/2920076.png"
                        alt="Booking illustration"
                        className="img-fluid"
                        style={{ maxHeight: '300px' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default HeroSection;
