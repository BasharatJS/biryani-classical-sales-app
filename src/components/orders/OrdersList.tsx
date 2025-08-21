'use client';

import { useState, useEffect } from 'react';
import { Order } from '@/lib/types';
import { OrderService } from '@/lib/firestore';


interface OrdersListProps {
  refreshTrigger?: number;
}

export default function OrdersList({ refreshTrigger }: OrdersListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateRange: 'all'
  });

  const fetchOrders = async (dateRange = filters.dateRange) => {
    try {
      setLoading(true);
      let fetchedOrders: Order[] = [];
      
      if (dateRange === 'today') {
        fetchedOrders = await OrderService.getTodayOrders();
      } else {
        fetchedOrders = await OrderService.getAllOrders(200);
        
        if (dateRange === 'week') {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          fetchedOrders = fetchedOrders.filter(order => {
            if (!order.orderDate || !order.orderDate.toDate) return false;
            return order.orderDate.toDate() >= weekAgo;
          });
        } else if (dateRange === 'month') {
          const monthAgo = new Date();
          monthAgo.setDate(monthAgo.getDate() - 30);
          fetchedOrders = fetchedOrders.filter(order => {
            if (!order.orderDate || !order.orderDate.toDate) return false;
            return order.orderDate.toDate() >= monthAgo;
          });
        }
        // For 'all' dateRange, we keep all fetched orders
      }
      
      setAllOrders(fetchedOrders);
      applyFilters(fetchedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (ordersToFilter: Order[]) => {
    setOrders(ordersToFilter);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    if (key === 'dateRange') {
      fetchOrders(value);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [refreshTrigger]);


  const formatDate = (timestamp: any) => {
    if (!timestamp || !timestamp.toDate) return 'N/A';
    
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getOrderStats = () => {
    const stats = {
      total: orders.length,
      totalRevenue: orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.totalAmount, 0)
    };
    return stats;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading Filters and Stats */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Loading Date Filter */}
            <div className="animate-pulse max-w-xs">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
            
            {/* Loading Stats */}
            <div className="flex space-x-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="animate-pulse space-y-2 text-center">
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Loading Orders */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = getOrderStats();

  return (
    <div className="space-y-6">
      {/* Filters and Stats Combined */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Date Filter */}
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
            </select>
          </div>
          
          {/* Stats on the right */}
          <div className="flex space-x-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-100">
              <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
              <div className="text-xs text-gray-500">Total Orders</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-100">
              <div className="text-lg font-bold text-green-700">₹{stats.totalRevenue.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Total Revenue</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">All Orders ({orders.length})</h3>
        </div>
      
        {orders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="mx-auto w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-lg font-medium mb-2">No orders found</p>
            <p className="text-sm">
              {filters.dateRange !== 'all' 
                ? "No orders found for the selected date range"
                : "Orders will appear here once customers place them"
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {orders.map((order) => (
          <div key={order.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="font-semibold text-foreground">Order #{order.id?.slice(-6) || 'N/A'}</h4>
                </div>
                
                {/* Show ordered items */}
                <div className="mb-3">
                  {order.orderItems && order.orderItems.length > 0 ? (
                    <div className="space-y-1">
                      {order.orderItems.map((item, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          <span className="font-medium text-primary">{item.name}</span> 
                          <span className="text-gray-500"> × {item.quantity}</span>
                          <span className="text-gray-500 ml-2">₹{item.total.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium text-primary">Mixed Biryani Items</span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-secondary">
                  <div>
                    {order.notes && <p><span className="font-medium">Notes:</span> {order.notes}</p>}
                  </div>
                  <div>
                    <p><span className="font-medium">Total Items:</span> {order.biryaniQuantity} items</p>
                    <p><span className="font-medium">Total Amount:</span> ₹{order.totalAmount.toLocaleString()}</p>
                    <p><span className="font-medium">Date:</span> {formatDate(order.orderDate)}</p>
                  </div>
                </div>
              </div>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
      
    </div>
  );
}