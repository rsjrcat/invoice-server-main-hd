import React, { useState, useEffect } from 'react';
import { PlusIcon, EyeIcon, CheckIcon, XMarkIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { salesOrdersAPI, customersAPI, inventoryAPI } from '../services/api';
import { SalesOrder, Customer, InventoryItem } from '../types';
import Modal from '../components/UI/Modal';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { format } from 'date-fns';

const SalesOrders: React.FC = () => {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<SalesOrder | null>(null);
  const [formData, setFormData] = useState({
    customerId: '',
    notes: '',
    terms: '',
    placeOfSupply: '',
    items: [{ inventoryItemId: '', quantity: 1, unitPrice: 0, taxRate: 0, hsnOrSacCode: '' }],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [salesOrdersRes, customersRes, inventoryRes] = await Promise.all([
        salesOrdersAPI.getAll(),
        customersAPI.getAll(),
        inventoryAPI.getAll(),
      ]);
      
      setSalesOrders(salesOrdersRes.data.data || []);
      setCustomers(customersRes.data.data || []);
      setInventoryItems(inventoryRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await salesOrdersAPI.create(formData);
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error creating sales order:', error);
    }
  };

  const handleStatusUpdate = async (id: string, status: 'accept' | 'reject') => {
    try {
      await salesOrdersAPI.updateStatus(id, status);
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleSendEmail = async (id: string) => {
    try {
      await salesOrdersAPI.sendEmail(id);
      alert('Email sent successfully!');
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email');
    }
  };

  const handleViewOrder = async (id: string) => {
    try {
      const response = await salesOrdersAPI.getById(id);
      setViewingOrder(response.data.data);
      setIsViewModalOpen(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { inventoryItemId: '', quantity: 1, unitPrice: 0, taxRate: 0, hsnOrSacCode: '' }],
    });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-fill price and tax rate when inventory item is selected
    if (field === 'inventoryItemId') {
      const selectedItem = inventoryItems.find(item => item.id === value);
      if (selectedItem) {
        newItems[index].unitPrice = selectedItem.unitPrice;
        newItems[index].taxRate = selectedItem.taxRate || 0;
        newItems[index].hsnOrSacCode = selectedItem.hsnOrSacCode || '';
      }
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      customerId: '',
      notes: '',
      terms: '',
      placeOfSupply: '',
      items: [{ inventoryItemId: '', quantity: 1, unitPrice: 0, taxRate: 0, hsnOrSacCode: '' }],
    });
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
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
          <h1 className="text-2xl font-bold text-gray-900">Sales Orders</h1>
          <p className="text-gray-600">Manage your sales orders</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Sales Order
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Order #</th>
                <th className="table-header">Customer</th>
                <th className="table-header">Date</th>
                <th className="table-header">Total</th>
                <th className="table-header">Status</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salesOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium">SO-{order.orderNumber.toString().padStart(5, '0')}</td>
                  <td className="table-cell">{order.customer?.name || 'Unknown'}</td>
                  <td className="table-cell">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</td>
                  <td className="table-cell">₹{order.total.toLocaleString()}</td>
                  <td className="table-cell">{getStatusBadge(order.status)}</td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewOrder(order.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      {order.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'accept')}
                            className="text-green-600 hover:text-green-900"
                            title="Accept"
                          >
                            <CheckIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(order.id, 'reject')}
                            className="text-red-600 hover:text-red-900"
                            title="Reject"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleSendEmail(order.id)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Send Email"
                      >
                        <EnvelopeIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Sales Order Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="Create Sales Order"
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
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
              <label className="block text-sm font-medium text-gray-700">Place of Supply</label>
              <input
                type="text"
                value={formData.placeOfSupply}
                onChange={(e) => setFormData({ ...formData, placeOfSupply: e.target.value })}
                className="input-field mt-1"
                placeholder="e.g., Rajasthan (08)"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Items</label>
            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-end">
                <div className="col-span-4">
                  <select
                    required
                    value={item.inventoryItemId}
                    onChange={(e) => updateItem(index, 'inventoryItemId', e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select Item</option>
                    {inventoryItems.map((invItem) => (
                      <option key={invItem.id} value={invItem.id}>
                        {invItem.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                    className="input-field"
                    placeholder="Qty"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, 'unitPrice', parseInt(e.target.value))}
                    className="input-field"
                    placeholder="Price"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={item.taxRate}
                    onChange={(e) => updateItem(index, 'taxRate', parseFloat(e.target.value))}
                    className="input-field"
                    placeholder="Tax %"
                  />
                </div>
                <div className="col-span-2">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="btn-danger w-full"
                    disabled={formData.items.length === 1}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addItem}
              className="btn-secondary mt-2"
            >
              Add Item
            </button>
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
              Create Sales Order
            </button>
          </div>
        </form>
      </Modal>

      {/* View Sales Order Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Sales Order SO-${viewingOrder?.orderNumber?.toString().padStart(5, '0')}`}
        size="xl"
      >
        {viewingOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-900">Customer Information</h3>
                <p className="text-sm text-gray-600">{viewingOrder.customer?.name}</p>
                <p className="text-sm text-gray-600">{viewingOrder.customer?.email}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Order Details</h3>
                <p className="text-sm text-gray-600">Date: {format(new Date(viewingOrder.createdAt), 'MMM dd, yyyy')}</p>
                <p className="text-sm text-gray-600">Status: {viewingOrder.status}</p>
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
                    {viewingOrder.items.map((item, index) => (
                      <tr key={index}>
                        <td className="table-cell">{item.inventoryItem?.name}</td>
                        <td className="table-cell">{item.quantity}</td>
                        <td className="table-cell">₹{item.unitPrice.toLocaleString()}</td>
                        <td className="table-cell">{item.taxRate || 0}%</td>
                        <td className="table-cell">₹{item.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-end space-y-1">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Subtotal: ₹{viewingOrder.subTotal.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Tax: ₹{viewingOrder.taxAmount.toLocaleString()}</p>
                  <p className="text-lg font-bold text-gray-900">Total: ₹{viewingOrder.total.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SalesOrders;