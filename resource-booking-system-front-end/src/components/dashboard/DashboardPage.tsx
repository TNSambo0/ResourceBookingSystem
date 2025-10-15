import { useAppSelector } from '../../hooks/reduxHooks';

const DashboardPage: React.FC = () => {
    const user = useAppSelector((state) => state.auth.user);

    return (
        <div className="container mt-4">
            <h2 className="fw-bold">Dashboard loaded</h2>
            <p className="text-muted">It works {user?.fullName}</p>
        </div>
    );
};

export default DashboardPage;
