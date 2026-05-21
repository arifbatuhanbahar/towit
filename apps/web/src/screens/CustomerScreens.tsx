import MapView from '../components/MapView';
import { Icon } from '../components/Icons';
import CustomerPage from '../pages/customer/CustomerPage';
import CustomerJobPage from '../pages/customer/CustomerJobPage';
import CustomerProfile from '../pages/customer/CustomerProfile';
import CustomerHistory from '../pages/customer/CustomerHistory';
import type { Screen } from '../types/screen';
import type { AuthUser } from '../lib/api';

interface Props {
  user: AuthUser;
  screen: Screen;
  openJobId: string | null;
  onOpenJob: (id: string) => void;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
}

export default function CustomerScreens({ user, screen, openJobId, onOpenJob, onNavigate, onLogout }: Props) {
  if (screen === 'customer_home') {
    return (
      <div className="page-wide">
        <div className="customer-split">
          <div className="customer-split__wizard">
            <CustomerPage
              onOpenJob={onOpenJob}
              onGoProfile={() => onNavigate('customer_profile')}
              onGoHistory={() => onNavigate('customer_history')}
            />
          </div>
          <div className="customer-split__map-panel">
            <MapView height={340} chip={<><Icon.Pin size={11} /> İstanbul</>} />
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'customer_job' && openJobId) {
    return (
      <div className="page-narrow">
        <CustomerJobPage jobId={openJobId} onBack={() => onNavigate('customer_home')} />
      </div>
    );
  }

  if (screen === 'customer_profile') {
    return (
      <div className="page-narrow">
        <CustomerProfile user={user} onLogout={onLogout} onBack={() => onNavigate('customer_home')} />
      </div>
    );
  }

  if (screen === 'customer_history') {
    return (
      <div className="page-narrow">
        <CustomerHistory onBack={() => onNavigate('customer_home')} onOpenJob={onOpenJob} />
      </div>
    );
  }

  return null;
}
