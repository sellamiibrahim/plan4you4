import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import './adminDashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div>
          <button className="admin-back" onClick={() => navigate('/')}>Back to app</button>
          <h1 className="admin-title">Admin Dashboard</h1>
          <p className="admin-subtitle">Signed in as {user?.username || 'admin'}</p>
        </div>
        <button className="admin-button secondary" onClick={handleLogout}>Logout</button>
      </header>

      <div className="admin-tabs">
        <NavLink
          to="overview"
          className={({ isActive }) => isActive ? 'tab active' : 'tab'}
        >
          Overview
        </NavLink>
        <NavLink
          to="users"
          className={({ isActive }) => isActive ? 'tab active' : 'tab'}
        >
          Users
        </NavLink>
        <NavLink
          to="posts"
          className={({ isActive }) => isActive ? 'tab active' : 'tab'}
        >
          Posts
        </NavLink>
        <NavLink
          to="reviews"
          className={({ isActive }) => isActive ? 'tab active' : 'tab'}
        >
          Reviews
        </NavLink>
      </div>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}

export default AdminDashboard;
