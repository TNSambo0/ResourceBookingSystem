import React from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const UnauthorizedPage: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="container text-center mt-5">
            <h2 className="fw-bold text-danger">403 - Unauthorized</h2>
            <p>You don’t have permission to view this page.</p>
            <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
    );
};

export default UnauthorizedPage;
