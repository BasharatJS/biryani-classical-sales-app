'use client';

import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import DashboardStats from '@/components/dashboard/DashboardStats';
import RecentOrders from '@/components/dashboard/RecentOrders';
import Link from 'next/link';

export default function DashboardPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <div className="text-sm text-secondary">
            Welcome to your Biryani Sales Manager
          </div>
        </div>
        
        <DashboardStats refreshTrigger={refreshTrigger} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link 
                href="/orders"
                className="w-full bg-primary text-primary-foreground px-4 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors block text-center"
              >
                📋 View All Orders
              </Link>
              <Link 
                href="/expenses"
                className="w-full bg-secondary text-secondary-foreground px-4 py-3 rounded-lg font-medium hover:bg-yellow-600 transition-colors block text-center"
              >
                💰 Add Expense
              </Link>
              <Link 
                href="/reports"
                className="w-full border border-border text-foreground px-4 py-3 rounded-lg font-medium hover:bg-background/50 transition-colors block text-center"
              >
                📊 View Reports
              </Link>
              <Link 
                href="/"
                className="w-full border border-primary text-primary px-4 py-3 rounded-lg font-medium hover:bg-primary/10 transition-colors block text-center"
              >
                🍛 Go to Order Page
              </Link>
            </div>
          </div>

          <RecentOrders refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </AppLayout>
  );
}