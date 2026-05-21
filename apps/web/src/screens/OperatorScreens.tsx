import OperatorHomeWeb from '../pages/operator/OperatorHomeWeb';
import OperatorJobPage from '../pages/operator/OperatorJobPage';
import OperatorProfile from '../pages/operator/OperatorProfile';
import OperatorHistory from '../pages/operator/OperatorHistory';
import type { Screen } from '../types/screen';
import type { JobDetail } from '../lib/api';

interface Props {
  screen: Screen;
  openJobId: string | null;
  onOpenJob: (id: string) => void;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  onOpenRoute: (job: JobDetail) => void;
}

export default function OperatorScreens({ screen, openJobId, onOpenJob, onNavigate, onLogout, onOpenRoute }: Props) {
  if (screen === 'operator_home') {
    return <OperatorHomeWeb onOpenJob={onOpenJob} />;
  }

  if (screen === 'operator_job' && openJobId) {
    return (
      <div className="page-narrow">
        <OperatorJobPage
          jobId={openJobId}
          onBack={() => onNavigate('operator_home')}
          onGoRoute={onOpenRoute}
        />
      </div>
    );
  }

  if (screen === 'operator_profile') {
    return (
      <div className="page-narrow">
        <OperatorProfile onLogout={onLogout} onBack={() => onNavigate('operator_home')} />
      </div>
    );
  }

  if (screen === 'operator_history') {
    return (
      <div className="page-narrow">
        <OperatorHistory onBack={() => onNavigate('operator_home')} />
      </div>
    );
  }

  return null;
}
