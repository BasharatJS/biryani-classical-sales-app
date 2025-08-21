'use client';

import { useState, useEffect } from 'react';
import { Order } from '@/lib/types';
import { OrderService } from '@/lib/firestore';

interface RecentOrdersProps {
  refreshTrigger?: number;
}


export default function RecentOrders({ refreshTrigger }: RecentOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecentOrders = async () => {
    try {
      setLoading(true);
      const todayOrders = await OrderService.getTodayOrders();
      setOrders(todayOrders.slice(0, 5));
    } catch (error) {
      console.error('Error fetching recent orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentOrders();
  }, [refreshTrigger]);

  const formatTime = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return 'N/A';
    
    const date = timestamp.toDate();
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Orders</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-border rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-border rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
      <h3 className="text-lg font-semibold text-foreground mb-4">Recent Orders</h3>
      
      {orders.length === 0 ? (
        <div className="text-center py-8 text-secondary">
          <svg className="mx-auto w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p>No orders today</p>
          <p className="text-sm">Orders will appear here once customers place them</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-medium text-foreground">Order #{order.id?.slice(-6) || 'N/A'}</h4>
                </div>
                <div className="text-sm text-secondary">
                  <span>{order.biryaniQuantity} items • </span>
                  <span>₹{order.totalAmount.toLocaleString()} • </span>
                  <span>{formatTime(order.orderDate)}</span>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm font-medium text-foreground">
                  ₹{order.totalAmount.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
          
          {orders.length === 5 && (
            <div className="text-center pt-2">
              <a 
                href="/orders" 
                className="text-primary text-sm font-medium hover:text-orange-600 transition-colors"
              >
                View all orders →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}