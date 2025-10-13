import React from 'react';

const features = [
    {
        icon: "bi bi-calendar-check",
        colorClass: "text-primary",
        title: "Quick Bookings",
        description: "Reserve a resource in just a few clicks with our intuitive booking flow."
    },
    {
        icon: "bi bi-clock-history",
        colorClass: "text-success",
        title: "Track Reservations",
        description: "View and manage your upcoming and past bookings easily."
    },
    {
        icon: "bi bi-people",
        colorClass: "text-danger",
        title: "Collaborate",
        description: "See who’s using which resources and avoid double bookings."
    }
];

const FeatureHighlights: React.FC = () => {
    return (
        <div className="row text-center">
            {features.map((feature) => (
                <div key={feature.title} className="col-md-4 mb-4">
                    <div className="card shadow-sm h-100">
                        <div className="card-body">
                            <i className={`${feature.icon} display-4 ${feature.colorClass}`}></i>
                            <h5 className="card-title mt-3">{feature.title}</h5>
                            <p className="card-text">{feature.description}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default FeatureHighlights;
