'use client';

import { useState } from 'react';
import StaffLayout from '@/components/layout/StaffLayout';
import StaffDashboardStats from '@/components/dashboard/StaffDashboardStats';
import OrderTabs from '@/components/dashboard/OrderTabs';
import OrderForm from '@/components/forms/OrderForm';
import Modal from '@/components/ui/Modal';

export default function StaffDashboardPage() {
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleOrderSuccess = () => {
    setShowOrderForm(false);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <StaffLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Staff Dashboard</h1>
          <button
            onClick={() => setShowOrderForm(true)}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold text-lg hover:bg-orange-600 transition-colors shadow-lg"
          >
            + Take New Order
          </button>
        </div>
        
        <StaffDashboardStats refreshTrigger={refreshTrigger} />

        <OrderTabs refreshTrigger={refreshTrigger} />
      </div>

      {/* Staff Order Modal */}
      <Modal 
        isOpen={showOrderForm} 
        onClose={() => setShowOrderForm(false)}
        size="lg"
      >
        <OrderForm 
          onSuccess={handleOrderSuccess}
          onCancel={() => setShowOrderForm(false)}
          isStaffFlow={true}
          orderType="offline"
          title="Take New Order"
        />
      </Modal>
    </StaffLayout>
  );
}