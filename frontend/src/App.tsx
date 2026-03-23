import { Route, Switch } from 'wouter';
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

  if (!user) {
    return <Login />;
  }

  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={user.role === 'TENANT' ? TenantDashboard : Dashboard} />
        <Route path="/properties" component={Properties} />
        <Route path="/tenants" component={Tenants} />
        <Route path="/complaints" component={Complaints} />
        <Route path="/notices" component={Notices} />
        <Route path="/caretakers" component={Caretakers} />
        <Route path="/settings" component={Settings} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/terms" component={Terms} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/help" component={Help} />
        <Route path="/">
          {user.role === 'TENANT' ? <TenantDashboard /> : <Dashboard />}
        </Route>
      </Switch>
    </AppLayout>
  );
}

export default App;
