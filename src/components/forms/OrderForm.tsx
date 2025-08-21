'use client';

import { useState } from 'react';
import { OrderFormData, MenuItem, OrderItem } from '@/lib/types';
import { OrderService } from '@/lib/firestore';
import Invoice from '@/components/orders/Invoice';
import PaymentModeModal from '@/components/modals/PaymentModeModal';
import { Timestamp } from 'firebase/firestore';

interface OrderFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  title?: string;
  isCustomerFlow?: boolean;
}

const menuItems: MenuItem[] = [
  { id: 1, name: "Mutton Biryani (Special) 2 pc", price: 300.00, category: "mutton" },
  { id: 2, name: "Mutton Egg Biryani", price: 180.00, category: "mutton" },
  { id: 3, name: "Mutton Biryani", price: 170.00, category: "mutton" },
  { id: 4, name: "Chicken Biryani (Special) 2 pc", price: 160.00, category: "chicken" },
  { id: 5, name: "Chicken Egg Biryani", price: 110.00, category: "chicken" },
  { id: 6, name: "Chicken Biryani", price: 100.00, category: "chicken" },
  { id: 7, name: "Chicken Biryani (Half)", price: 80.00, category: "chicken" },
  { id: 8, name: "Mutton Biryani (Half)", price: 150.00, category: "mutton" },
  { id: 9, name: "Egg Biryani", price: 80.00, category: "egg" },
  { id: 10, name: "Aloo Biryani", price: 70.00, category: "veg" },
  { id: 11, name: "Mutton Chaap", price: 120.00, category: "mutton" },
  { id: 12, name: "Chicken Chaap", price: 50.00, category: "chicken" },
  { id: 13, name: "Extra Rice", price: 50.00, category: "extras" },
  { id: 14, name: "Mutton Extra", price: 110.00, category: "extras" },
  { id: 15, name: "Chicken Extra", price: 40.00, category: "extras" },
  { id: 16, name: "Gravy", price: 10.00, category: "extras" },
  { id: 17, name: "Raita", price: 10.00, category: "extras" },
  { id: 18, name: "Aloo Extra", price: 5.00, category: "extras" },
  { id: 19, name: "Salad", price: 10.00, category: "extras" }
];

const getCategoryEmoji = (category: string): string => {
  switch (category) {
    case 'mutton': return '🐑';
    case 'chicken': return '🐔';
    case 'egg': return '🥚';
    case 'veg': return '🥔';
    case 'extras': return '🍽️';
    default: return '🍛';
  }
};

export default function OrderForm({ onSuccess, onCancel, title, isCustomerFlow = false }: OrderFormProps) {
  const [currentStep, setCurrentStep] = useState<'menu' | 'payment' | 'invoice'>('menu');
  const [quantities, setQuantities] = useState<{[key: number]: number}>({});
  const [generatedOrder, setGeneratedOrder] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<'UPI' | 'Cash' | null>(null);
  
  const [formData, setFormData] = useState<OrderFormData>({
    biryaniQuantity: 1,
    orderItems: [],
    notes: '',
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedItems = Object.entries(quantities)
    .filter(([_, quantity]) => quantity > 0)
    .map(([menuItemId, quantity]) => {
      const menuItem = menuItems.find(item => item.id === parseInt(menuItemId))!;
      return {
        menuItemId: menuItem.id,
        name: menuItem.name,
        quantity,
        price: menuItem.price,
        total: menuItem.price * quantity
      };
    });

  const totalAmount = selectedItems.reduce((sum, item) => sum + item.total, 0);
  const totalItems = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

  const updateQuantity = (menuItemId: number, delta: number) => {
    setQuantities(prev => {
      const currentQty = prev[menuItemId] || 0;
      const newQty = Math.max(0, currentQty + delta);
      return { ...prev, [menuItemId]: newQty };
    });
  };

  const validateForm = (): boolean => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item to proceed.');
      return false;
    }
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'biryaniQuantity' ? parseInt(value) || 0 : value
    }));

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setShowPaymentModal(true);
  };

  const handlePaymentModeSelect = async (paymentMode: 'UPI' | 'Cash') => {
    setSelectedPaymentMode(paymentMode);
    setShowPaymentModal(false);
    setIsSubmitting(true);

    try {
      const orderData = {
        ...formData,
        orderItems: selectedItems,
        biryaniQuantity: totalItems,
        paymentMode: paymentMode
      };

      let createdOrder;
      if (isCustomerFlow) {
        createdOrder = await OrderService.createCustomerOrder(orderData);
      } else {
        createdOrder = await OrderService.createOrder(orderData);
      }
      
      // Generate order object for invoice
      const orderForInvoice = {
        ...createdOrder,
        id: createdOrder.id || Date.now().toString(),
        biryaniQuantity: totalItems,
        totalAmount: totalAmount,
        orderItems: selectedItems,
        orderDate: Timestamp.now(),
        status: 'pending' as const,
        notes: formData.notes,
        paymentMode: paymentMode
      };
      
      setGeneratedOrder(orderForInvoice);
      setCurrentStep('invoice');
      
    } catch (error: any) {
      console.error('Error creating order:', error);
      alert(error.message || 'Failed to create order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteOrder = () => {
    setFormData({
      biryaniQuantity: 1,
      orderItems: [],
      notes: '',
    });
    setQuantities({});
    setCurrentStep('menu');
    setGeneratedOrder(null);
    setSelectedPaymentMode(null);
    
    if (onSuccess) {
      onSuccess();
    }
  };

  if (currentStep === 'invoice' && generatedOrder) {
    return (
      <div className="max-w-4xl mx-auto">
        <Invoice order={generatedOrder} onPrint={handleCompleteOrder} />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white p-6 text-center">
        <span className="text-4xl mb-2 block">🍛</span>
        <h2 className="text-2xl font-bold mb-1">Choose Your Biryani</h2>
        <p className="text-orange-100">Select from our delicious menu</p>
        {totalItems > 0 && (
          <div className="mt-4 bg-white/20 rounded-lg p-3">
            <p className="font-medium">Selected: {totalItems} items | Total: ₹{totalAmount.toLocaleString()}</p>
          </div>
        )}
      </div>

      <div className="p-6">
        {currentStep === 'menu' ? (
          <div>
            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {menuItems.map((item) => {
                const quantity = quantities[item.id] || 0;
                return (
                  <div key={item.id} className="bg-white border-2 border-border rounded-xl p-4 hover:border-primary transition-colors">
                    <div className="text-center mb-3">
                      <span className="text-3xl mb-2 block">{getCategoryEmoji(item.category)}</span>
                      <h3 className="font-bold text-foreground text-lg leading-tight">{item.name}</h3>
                      <p className="text-2xl font-bold text-primary mt-2">₹{item.price}</p>
                    </div>
                    
                    <div className="flex items-center justify-center space-x-3">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        disabled={quantity === 0}
                        className="w-10 h-10 rounded-full bg-danger text-white font-bold text-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-danger/90 transition-colors"
                      >
                        −
                      </button>
                      <span className="text-xl font-bold min-w-[2rem] text-center">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-10 h-10 rounded-full bg-success text-white font-bold text-xl hover:bg-success/90 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    
                    {quantity > 0 && (
                      <div className="mt-3 text-center">
                        <p className="text-sm font-medium text-success">
                          Total: ₹{(item.price * quantity).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selected Items Summary */}
            {selectedItems.length > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-primary mb-2">Selected Items ({totalItems}):</h3>
                <div className="space-y-1">
                  {selectedItems.map((item) => (
                    <div key={item.menuItemId} className="flex justify-between text-sm">
                      <span>{item.name} × {item.quantity}</span>
                      <span className="font-medium">₹{item.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold text-lg text-primary">
                    <span>Total Amount:</span>
                    <span>₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Place Order Button */}
            {selectedItems.length > 0 && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-primary text-primary-foreground py-4 px-6 rounded-lg font-bold text-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Processing Order...' : 'Select Payment Mode'}
              </button>
            )}
          </div>
        ) : null}
      </div>

      {/* Payment Mode Modal */}
      <PaymentModeModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSelect={handlePaymentModeSelect}
        totalAmount={totalAmount}
      />
    </div>
  );
}