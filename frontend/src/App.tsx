import { Route, Switch, useLocation } from 'wouter';
import { useAuthStore } from '@/store/useAuthStore';
import { AppLayout } from './layouts/AppLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Properties } from './pages/Properties';
import { Tenants } from './pages/Tenants';
import { Complaints } from './pages/Complaints';
import { Settings } from './pages/Settings';
import { Pricing } from './pages/Pricing';
import { Notices } from './pages/Notices';
import { Caretakers } from './pages/Caretakers';
import { TenantDashboard } from './pages/TenantDashboard';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';
import { Help } from './pages/Help';

function App() {
  const { user } = useAuthStore();
  const [location] = useLocation();

  // Handle common public routes regardless of login state
  if (location === '/terms') return <Terms />;
  if (location === '/privacy') return <Privacy />;

  // Force login if no user is found
  if (!user) {
    return <Login />;
  }

  // Dashboard landing logic (Redirects to correct view inside AppLayout)
  const DashboardComponent = user.role === 'TENANT' ? TenantDashboard : Dashboard;

  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={DashboardComponent} />
        <Route path="/properties" component={Properties} />
        <Route path="/tenants" component={Tenants} />
        <Route path="/complaints" component={Complaints} />
        <Route path="/notices" component={Notices} />
        <Route path="/caretakers" component={Caretakers} />
        <Route path="/settings" component={Settings} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/help" component={Help} />
        {/* Default fallback to dashboard */}
        <Route path="/:rest*" component={DashboardComponent} />
      </Switch>
    </AppLayout>
  );
}

export default App;
