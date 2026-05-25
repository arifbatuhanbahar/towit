import MapView from '../components/MapView';
import { Icon } from '../components/Icons';
import CustomerPage, { type CustomerMapPanelContext } from '../pages/customer/CustomerPage';
import CustomerJobPage from '../pages/customer/CustomerJobPage';
import CustomerProfile from '../pages/customer/CustomerProfile';
import CustomerHistory from '../pages/customer/CustomerHistory';
import type { Screen } from '../types/screen';
import type { AuthUser } from '../lib/api';
import { useState } from 'react';

interface Props {
  user: AuthUser;
  screen: Screen;
  openJobId: string | null;
  onOpenJob: (id: string) => void;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
}

export default function CustomerScreens({ user, screen, openJobId, onOpenJob, onNavigate, onLogout }: Props) {
  const [panelContext, setPanelContext] = useState<CustomerMapPanelContext>({
    step: 1,
    panelTitle: 'Bölge seç',
    panelEyebrow: 'Talep akışı',
    center: { lat: 41.0082, lng: 28.9784 },
    pickup: null,
    destination: null,
    pickupLabel: '',
    destinationLabel: '',
    interactive: false,
    chip: <><Icon.Pin size={11} /> İstanbul</>,
    interactionHint: undefined,
    helperText: 'Konum seçim adımlarında büyük harita etkileşimli olarak kullanılır.',
  });

  const mapHeight =
    panelContext.step >= 3 && panelContext.step <= 4
      ? 'clamp(300px, 44vh, 430px)'
      : 'clamp(250px, 36vh, 340px)';

  if (screen === 'customer_home') {
    return (
      <div className="page-wide">
        <div className="customer-split">
          <div className="customer-split__wizard">
            <CustomerPage
              onOpenJob={onOpenJob}
              mapPanelActive
              onMapPanelChange={setPanelContext}
            />
          </div>
          <div className="customer-split__map-panel">
            <div className={`customer-map-stage${panelContext.interactive ? ' is-interactive' : ''}`}>
              <div className="customer-map-stage__head">
                <div className="customer-map-stage__eyebrow">{panelContext.panelEyebrow}</div>
                <div className="customer-map-stage__title">{panelContext.panelTitle}</div>
                <div className="customer-map-stage__sub">{panelContext.helperText}</div>
              </div>
              <div className="customer-map-stage__content">
                <div className="customer-map-stage__map">
                  <MapView
                    height={mapHeight}
                    center={panelContext.center}
                    pickup={panelContext.pickup}
                    destination={panelContext.destination}
                    interactive={panelContext.interactive}
                    interactionHint={panelContext.interactionHint}
                    onSelectLocation={panelContext.onSelectLocation}
                    chip={panelContext.chip}
                  />
                </div>
                <div className="customer-map-panel__summary">
                  <div className="customer-map-panel__summary-item">
                    <div className="customer-map-panel__summary-label">
                      <span className="dot is-pickup" />
                      Çekim
                    </div>
                    <div className="customer-map-panel__summary-value">
                      {panelContext.pickupLabel || (panelContext.pickup ? `${panelContext.pickup.lat.toFixed(5)}, ${panelContext.pickup.lng.toFixed(5)}` : 'Henüz seçilmedi')}
                    </div>
                  </div>
                  <div className="customer-map-panel__summary-item">
                    <div className="customer-map-panel__summary-label">
                      <span className="dot is-destination" />
                      Varış
                    </div>
                    <div className="customer-map-panel__summary-value">
                      {panelContext.destinationLabel || (panelContext.destination ? `${panelContext.destination.lat.toFixed(5)}, ${panelContext.destination.lng.toFixed(5)}` : 'Henüz seçilmedi')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
