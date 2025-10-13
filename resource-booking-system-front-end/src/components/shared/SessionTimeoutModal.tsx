import React, { useEffect, useState } from 'react';
import { Modal, Button } from 'react-bootstrap';

type SessionTimeoutModalProps = {
    show: boolean;
    countdown: number;
    onStayLoggedIn: () => void;
    onLogout: () => void;
};

const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({
    show,
    countdown,
    onStayLoggedIn,
    onLogout,
}) => {
    const [seconds, setSeconds] = useState(countdown);

    useEffect(() => {
        if (!show) return;

        setSeconds(countdown);
        const timer = setInterval(() => {
            setSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onLogout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [show, countdown, onLogout]);

    return (
        <Modal
            show={show}
            backdrop="static"
            keyboard={false}
            centered
            className="fade"
        >
            <Modal.Header>
                <Modal.Title>Session Timeout Warning</Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center">
                <p>Your session will expire soon due to inactivity.</p>
                <h4 className="fw-bold">{seconds}s</h4>
            </Modal.Body>
            <Modal.Footer className="d-flex justify-content-center">
                <Button variant="secondary" onClick={onStayLoggedIn}>
                    Stay Logged In
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default SessionTimeoutModal;
