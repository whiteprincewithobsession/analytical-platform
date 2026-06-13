import React from 'react';
import { SupersetDashboard } from '../components/SupersetDashboard';

export const OverviewPage: React.FC = () => {
  return (
    <div className="h-full">
      <SupersetDashboard
        dashboardId="6"
        height="100%"
      />
    </div>
  );
};
