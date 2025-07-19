import React, { useState, useEffect } from 'react';
import {
  UsersIcon,
  CubeIcon,
  DocumentTextIcon,
  ReceiptPercentIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import { customersAPI, inventoryAPI, salesOrdersAPI, invoicesAPI } from '../services/api';

interface DashboardStats {
  customers: number;
  inventory: number;
  salesOrders: number;
  invoices: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    customers: 0,
    inventory: 0,
    salesOrders: 0,
    invoices: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [customersRes, inventoryRes, salesOrdersRes, invoicesRes] = await Promise.all([
          customersAPI.getAll(),
          inventoryAPI.getAll(),
          salesOrdersAPI.getAll(),
          invoicesAPI.getAll(),
        ]);

        setStats({
          customers: customersRes.data.data?.length || 0,
          inventory: inventoryRes.data.data?.length || 0,
          salesOrders: salesOrdersRes.data.data?.length || 0,
          invoices: invoicesRes.data.data?.length || 0,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      name: 'Total Customers',
      value: stats.customers,
      icon: UsersIcon,
      change: '+12%',
      changeType: 'increase',
      color: 'bg-blue-500',
    },
    {
      name: 'Inventory Items',
      value: stats.inventory,
      icon: CubeIcon,
      change: '+8%',
      changeType: 'increase',
      color: 'bg-green-500',
    },
    {
      name: 'Sales Orders',
      value: stats.salesOrders,
      icon: DocumentTextIcon,
      change: '+15%',
      changeType: 'increase',
      color: 'bg-yellow-500',
    },
    {
      name: 'Invoices',
      value: stats.invoices,
      icon: ReceiptPercentIcon,
      change: '-2%',
      changeType: 'decrease',
      color: 'bg-purple-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your business.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {stat.changeType === 'increase' ? (
                <ArrowUpIcon className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDownIcon className="w-4 h-4 text-red-500" />
              )}
              <span
                className={`text-sm font-medium ml-1 ${
                  stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {stat.change}
              </span>
              <span className="text-sm text-gray-500 ml-1">from last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Sales Orders</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">SO-{1000 + item}</p>
                  <p className="text-xs text-gray-500">Customer {item}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">₹{(item * 1500).toLocaleString()}</p>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Pending
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Invoices</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">INV-{10000 + item}</p>
                  <p className="text-xs text-gray-500">Customer {item}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">₹{(item * 2000).toLocaleString()}</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    item === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {item === 1 ? 'Paid' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;