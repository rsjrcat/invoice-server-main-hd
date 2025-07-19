import React, { useState, useEffect } from 'react';
import { PlusIcon, EyeIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { invoicesAPI, customersAPI, salesOrdersAPI } from '../services/api';
import { Invoice, Customer, SalesOrder } from '../types';
import Modal from '../components/UI/Modal';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { format } from 'date-fns';

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState({
    customerId: '',
    salesOrderId: '',
    issueDate: '',
    dueDate: '',
    notes: '',
    terms: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invoicesRes, customersRes, salesOrdersRes] = await Promise.all([
        invoicesAPI.getAll(),
        customersAPI.getAll(),
        salesOrdersAPI.getAll(),
      ]);
      
      setInvoices(invoicesRes.data.data || []);
      setCustomers(customersRes.data.data || []);
      setSalesOrders(salesOrdersRes.data.data?.filter((order: SalesOrder) => order.status === 'ACCEPTED') || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await invoicesAPI.create(formData);
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  };

  const handleStatusUpdate = async (id: string, status: 'paid' | 'overdue' | 'cancelled') => {
    try {
      await invoicesAPI.updateStatus(id, status);
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleViewInvoice = async (id: string) => {
    try {
      const response = await invoicesAPI.getById(id);
      setViewingInvoice(response.data.data);
      setIsViewModalOpen(true);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      customerId: '',
      salesOrderId: '',
      issueDate: '',
      dueDate: '',
      notes: '',
      terms: '',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses]}`}>
        {status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600">Manage your invoices</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Invoice
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Invoice #</th>
                <th className="table-header">Customer</th>
                <th className="table-header">Issue Date</th>
                <th className="table-header">Due Date</th>
                <th className="table-header">Total</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">INV-{invoice.invoiceNumber.toString().padStart(5, '0')}</td>
                  <td className="table-cell">{invoice.customer?.name || 'Unknown'}</td>
                  <td className="table-cell">{format(new Date(invoice.issueDate), 'MMM dd, yyyy')}</td>
                  <td className="table-cell">{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</td>
                  <td className="table-cell">₹{invoice.items.reduce((total, item) => total + (item.quantity * item.unitPrice), 0).toLocaleString()}</td>
                  <td className="table-cell">{getStatusBadge(invoice.status)}</td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewInvoice(invoice.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      {invoice.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(invoice.id, 'paid')}
                            className="text-green-600 hover:text-green-900"
                            title="Mark as Paid"
                          >
                            <CheckIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(invoice.id, 'cancelled')}
                            className="text-red-600 hover:text-red-900"
                            title="Cancel"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Create Invoice"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Customer</label>
              <select
                required
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="input-field mt-1"
              >
                <option value="">Select Customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Sales Order (Optional)</label>
              <select
                value={formData.salesOrderId}
                onChange={(e) => setFormData({ ...formData, salesOrderId: e.target.value })}
                className="input-field mt-1"
              >
                <option value="">Select Sales Order</option>
                {salesOrders.map((order) => (
                  <option key={order.id} value={order.id}>
                    SO-{order.orderNumber.toString().padStart(5, '0')} - {order.customer?.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Issue Date</label>
              <input
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                className="input-field mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="input-field mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input-field mt-1"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Terms</label>
              <textarea
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                className="input-field mt-1"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={handleCloseModal} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Invoice
            </button>
          </div>
        </form>
      </Modal>

      {/* View Invoice Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Invoice INV-${viewingInvoice?.invoiceNumber?.toString().padStart(5, '0')}`}
        size="xl"
      >
        {viewingInvoice && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-900">Customer Information</h3>
                <p className="text-sm text-gray-600">{viewingInvoice.customer?.name}</p>
                <p className="text-sm text-gray-600">{viewingInvoice.customer?.email}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Invoice Details</h3>
                <p className="text-sm text-gray-600">Issue Date: {format(new Date(viewingInvoice.issueDate), 'MMM dd, yyyy')}</p>
                <p className="text-sm text-gray-600">Due Date: {format(new Date(viewingInvoice.dueDate), 'MMM dd, yyyy')}</p>
                <p className="text-sm text-gray-600">Status: {viewingInvoice.status}</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3">Items</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="table-header">Item</th>
                      <th className="table-header">Qty</th>
                      <th className="table-header">Price</th>
                      <th className="table-header">Tax</th>
                      <th className="table-header">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {viewingInvoice.items.map((item, index) => (
                      <tr key={index}>
                        <td className="table-cell">{item.inventoryItem?.name}</td>
                        <td className="table-cell">{item.quantity}</td>
                        <td className="table-cell">₹{item.unitPrice.toLocaleString()}</td>
                        <td className="table-cell">{item.taxRate || 0}%</td>
                        <td className="table-cell">₹{(item.quantity * item.unitPrice).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-end">
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    Total: ₹{viewingInvoice.items.reduce((total, item) => total + (item.quantity * item.unitPrice), 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Invoices;