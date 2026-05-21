import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OperatorRoutePage from './OperatorRoutePage';
import type { JobDetail } from '../../lib/api';

const patchJobMock = vi.fn();
const updateJobLocationMock = vi.fn();

vi.mock('../../components/MapView', () => ({
  default: () => <div data-testid="map-view">map</div>,
}));

vi.mock('../../lib/api', () => ({
  patchJob: (...args: unknown[]) => patchJobMock(...args),
  updateJobLocation: (...args: unknown[]) => updateJobLocationMock(...args),
}));

const baseJob: JobDetail = {
  id: 'job_1',
  status: 'accepted',
  priceSnapshot: '500',
  distanceKm: 3.2,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  breakdownType: 'motor',
  cityCode: '34',
  customerEmail: 'musteri@towit.tr',
  customerVehicleBrand: null,
  customerVehicleModel: null,
  customerVehiclePlate: null,
  customerPhone: null,
  customerVehicleCategory: 'otomobil',
  pickup: { lat: 41.01, lng: 29.02 },
  destination: { lat: 41.02, lng: 29.01 },
  operator: {
    businessName: 'Towit Operator',
    vehicleType: 'platform',
    vehicleModel: 'Model',
    vehicleYear: 2022,
    phone: null,
  },
  operatorLocation: null,
};

describe('OperatorRoutePage', () => {
  beforeEach(() => {
    patchJobMock.mockReset();
    updateJobLocationMock.mockReset();
    updateJobLocationMock.mockResolvedValue({ ok: true });
    Object.defineProperty(globalThis.navigator, 'geolocation', {
      configurable: true,
      value: {
        watchPosition: (cb: (pos: { coords: { latitude: number; longitude: number } }) => void) => {
          cb({ coords: { latitude: 41.015, longitude: 29.05 } });
          return 1;
        },
        clearWatch: vi.fn(),
      },
    });
  });

  it('moves job to en_route before destination phase', async () => {
    patchJobMock.mockResolvedValue({ id: 'job_1', status: 'en_route' });

    render(<OperatorRoutePage job={baseJob} onBack={vi.fn()} onComplete={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Müşteriyi aldım/i }));

    await waitFor(() => {
      expect(patchJobMock).toHaveBeenCalledWith('job_1', 'en_route');
    });
    expect(screen.getByRole('button', { name: /Hedefe ulaştım/i })).toBeInTheDocument();
  });

  it('completes job on second phase', async () => {
    patchJobMock
      .mockResolvedValueOnce({ id: 'job_1', status: 'en_route' })
      .mockResolvedValueOnce({ id: 'job_1', status: 'completed' });
    const onComplete = vi.fn();

    render(<OperatorRoutePage job={baseJob} onBack={vi.fn()} onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('button', { name: /Müşteriyi aldım/i }));
    await screen.findByRole('button', { name: /Hedefe ulaştım/i });
    fireEvent.click(screen.getByRole('button', { name: /Hedefe ulaştım/i }));

    await waitFor(() => {
      expect(patchJobMock).toHaveBeenLastCalledWith('job_1', 'complete');
      expect(onComplete).toHaveBeenCalled();
    });
  });
});
