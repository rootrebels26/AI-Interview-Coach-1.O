// Route guard that restricts pages by login status and user role.
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ adminOnly = false, userOnly = false }) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
        return <Navigate to="/login" />;
    }

    if (adminOnly && user.role !== 'admin') {
        return <Navigate to="/" />;
    }

    if (userOnly && user.role === 'admin') {
        return <Navigate to="/admin" />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
