import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import CompanyConfig from './pages/CompanyConfig';
import PlantConfig from './pages/PlantConfig';
import SalesOfficeConfig from './pages/SalesOfficeConfig';
import RouteConfig from './pages/RouteConfig';
import DashboardLayout from './components/DashboardLayout';
import EmployeeRoster from './pages/EmployeeRoster';
import Items from "./pages/ItemMaster";
import PriceTaxConfig from './pages/PriceTaxConfig';
import MaterialTypeConfig from './pages/MaterialTypeConfig';
import BackOfficeApprovals from './pages/BackOfficeApprovals';
import CustomerLeadLists from './pages/CustomerLeadLists';
import AttendanceVisitLists from './pages/AttendanceVisitLists';


const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

// Polished dashboard home banner component
const DashboardHome = () => (
  <div style={{ 
    backgroundColor: '#1e293b', 
    border: '1px solid #334155', 
    borderRadius: '16px', 
    padding: '32px', 
    width: '100%',
    boxSizing: 'border-box'
  }}>
    <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '8px', color: '#ffffff' }}>Welcome to Auxray Energy Terminal</h3>
    <p style={{ color: '#94a3b8', fontSize: '1rem' }}>Select a module from the side navigation panel to manage operational master data.</p>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="config" element={<CompanyConfig />} />
          <Route path="config/plants" element={<PlantConfig />} />
          <Route path="config/sales-offices" element={<SalesOfficeConfig />} />
          <Route path="config/routes" element={<RouteConfig />} />
          <Route path="config/material-types" element={<MaterialTypeConfig />} />
          <Route path="config/sku" element={<Items />} />
          <Route path="pricing" element={<PriceTaxConfig />} />
          <Route path="routes" element={<CustomerLeadLists />} />
          <Route path="employees" element={<EmployeeRoster />} />
          <Route path="attendance-visits" element={<AttendanceVisitLists />} />
          <Route path="backoffice/approvals" element={<BackOfficeApprovals />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;