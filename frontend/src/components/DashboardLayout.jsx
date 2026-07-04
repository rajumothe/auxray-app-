import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { 
  Sun, LayoutDashboard, Building2, Users, MapPin, 
  Package, IndianRupee, LogOut, UserCircle, Factory, ClipboardCheck
} from 'lucide-react';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const user = JSON.parse(localStorage.getItem('user') || '{ "fullName": "System Administrator", "role": "HOD" }');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

 const baseMenuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Companies', icon: Building2, path: '/config' }, // Renamed/pointed directly to Company
    { name: 'Plants', icon: Factory, path: '/config/plants' }, // Direct link added
    { name: 'Sales Offices', icon: Building2, path: '/config/sales-offices' }, // Direct link added
    { name: 'Routes & Customers', icon: MapPin, path: '/config/routes' }, // Direct link added
    { name: 'Employees', icon: Users, path: '/employees' },
    { name: 'Customers & Leads', icon: MapPin, path: '/routes' },
    { name: 'Attendance & Visits', icon: ClipboardCheck, path: '/attendance-visits' },
    { name: 'Material Types', icon: Package, path: '/config/material-types' },
    { name: 'Item Master', icon: Package, path: '/config/sku' },
    { name: 'Price & Tax', icon: IndianRupee, path: '/pricing' },
  ];

  const canSeeBackOffice = ['HOD', 'RSM', 'ASM', 'State Head'].includes(user.role);
  const menuItems = canSeeBackOffice
    ? [...baseMenuItems, { name: 'Back Office Approvals', icon: ClipboardCheck, path: '/backoffice/approvals' }]
    : baseMenuItems;

  const activeMenu = menuItems.find(m => m.path === location.pathname) || { name: 'Dashboard' };

  // --- FULLY FLUID & RESPONSIVE INLINE STYLES ---
  const styles = {
    shell: { 
      display: 'flex', 
      height: '100vh', 
      width: '100vw', 
      backgroundColor: '#0f172a', 
      color: '#f8fafc', 
      fontFamily: 'system-ui, -apple-system, sans-serif', 
      overflow: 'hidden' 
    },
    sidebar: { 
      width: '260px', 
      backgroundColor: '#1e293b', 
      borderRight: '1px solid #334155', 
      display: 'flex', 
      flexDirection: 'column', 
      flexShrink: 0,
      height: '100%',
    },
    brandBoxFlexCol: {
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      height: '100%',
      overflow: 'hidden'
    },
    brandBox: { 
      height: '64px', 
      display: 'flex', 
      alignItems: 'center', 
      padding: '0 24px', 
      borderBottom: '1px solid #334155', 
      gap: '10px', 
      color: '#0ea5e9',
      flexShrink: 0
    },
    brandTitle: { fontSize: '1.125rem', fontWeight: '700', color: '#ffffff' },
    menu: { 
      flex: '1', 
      padding: '24px 16px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '6px', 
      overflowY: 'auto' 
    },
    menuItem: { 
      display: 'flex', 
      alignItems: 'center', 
      padding: '12px 14px', 
      borderRadius: '10px', 
      color: '#94a3b8', 
      textDecoration: 'none', 
      fontSize: '0.875rem', 
      fontWeight: '500', 
      gap: '12px', 
      transition: 'all 0.2s' 
    },
    menuItemActive: { backgroundColor: '#0ea5e9', color: '#ffffff' },
    sidebarFooter: { 
      padding: '16px', 
      borderTop: '1px solid #334155', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '12px', 
      fontSize: '0.875rem', 
      fontWeight: '500',
      flexShrink: 0
    },
    mainContent: { 
      flex: '1', 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden',
      height: '100%'
    },
    contentWrapper: {
      display: 'flex',
      flexDirection: 'column',
      flex: '1',
      minHeight: 0
    },
    header: { 
      height: '64px', 
      backgroundColor: '#111827', 
      borderBottom: '1px solid #334155', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: '0 32px', 
      zIndex: 10,
      flexShrink: 0
    },
    headerTitle: { fontSize: '1.25rem', fontWeight: '600' },
    btnSignout: { 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px', 
      backgroundColor: 'rgba(255, 255, 255, 0.03)', 
      border: '1px solid #334155', 
      padding: '8px 16px', 
      borderRadius: '10px', 
      color: '#cbd5e1', 
      fontSize: '0.875rem', 
      fontWeight: '500', 
      cursor: 'pointer', 
      transition: 'all 0.2s' 
    },
    pageContainer: { 
      flex: '1', 
      width: '100%',
      padding: '32px',
      paddingBottom: '96px',
      overflowY: 'auto', 
      backgroundColor: '#0f172a',
      boxSizing: 'border-box'
    },
    responsiveWrapper: {
      width: '100%',
      maxWidth: '1200px', 
      margin: '0 auto'
    },
 footer: {
      backgroundColor: '#111827',
      borderTop: '1px solid #334155',
      padding: '16px 32px', 
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '4px',
      fontSize: '0.75rem', 
      color: '#94a3b8',
      position: 'fixed',
      left: '260px',
      right: 0,
      bottom: 0,
      zIndex: 20,
      boxSizing: 'border-box',
      whiteSpace: 'normal',
      textAlign: 'center'
    }
  };

  return (
    <div style={styles.shell}>
      
      {/* --- SIDEBAR --- */}
      <aside style={styles.sidebar}>
        <div style={styles.brandBox}>
          <Sun size={24} />
          <span style={styles.brandTitle}>Auxray Energy</span>
        </div>

        <nav style={styles.menu}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                style={{
                  ...styles.menuItem,
                  ...(isActive ? styles.menuItemActive : {})
                }}
              >
                <item.icon size={20} style={{ color: isActive ? '#ffffff' : undefined }} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div style={styles.sidebarFooter}>
          <UserCircle size={32} style={{ color: '#64748b' }} />
          <div>
            <div>{user.fullName}</div>
            <div style={{ fontSize: '0.75rem', color: '#0ea5e9', fontWeight: '700', marginTop: '2px' }}>{user.role}</div>
          </div>
        </div>
      </aside>

      {/* --- MAIN WORKSPACE --- */}
      <div style={styles.mainContent}>
        <header style={styles.header}>
          <h2 style={styles.headerTitle}>{activeMenu.name}</h2>
          <button 
            onClick={handleLogout} 
            style={styles.btnSignout}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
              e.currentTarget.style.color = '#fca5a5';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
              e.currentTarget.style.borderColor = '#334155';
              e.currentTarget.style.color = '#cbd5e1';
            }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </header>

        <div style={styles.contentWrapper}>
          <main style={styles.pageContainer}>
            <div style={styles.responsiveWrapper}>
              <Outlet />
            </div>
          </main>

          {/* --- Global Footer --- */}
          <footer style={styles.footer}>
            <div>© {new Date().getFullYear()} Auxray Energy. All rights reserved.</div>
            <div>Developed by <span style={{ color: '#0ea5e9', fontWeight: '600' }}>Karprex IT Solutions</span></div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;