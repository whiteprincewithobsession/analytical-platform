import React from 'react';
import { SupersetDashboard } from '../components/SupersetDashboard';

export const OverviewPage: React.FC = () => {
  return (
    <div className="h-full">
      <SupersetDashboard
        dashboardId="2"
        height="100%"
      />
    </div>
  );
};
