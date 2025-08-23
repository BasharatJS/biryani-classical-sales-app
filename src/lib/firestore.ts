import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Order, Expense, Settings, DailySummary, OrderFormData, ExpenseFormData } from './types';

export const collections = {
  orders: 'orders',
  expenses: 'expenses',
  settings: 'settings',
  dailySummaries: 'daily_summaries',
} as const;

export class OrderService {
  // Create new order for manager dashboard
  static async createOrder(orderData: OrderFormData): Promise<string> {
    const totalAmount = orderData.orderItems.reduce((sum, item) => sum + item.total, 0);
    
    const order: Omit<Order, 'id'> = {
      biryaniQuantity: orderData.biryaniQuantity,
      totalAmount,
      orderItems: orderData.orderItems,
      status: 'pending',
      orderDate: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      notes: orderData.notes,
    };

    const docRef = await addDoc(collection(db, collections.orders), order);
    return docRef.id;
  }

  // Create order from customer portal (public orders)
  static async createCustomerOrder(orderData: any): Promise<any> {
    const totalAmount = orderData.orderItems.reduce((sum: number, item: any) => sum + item.total, 0);
    
    const order: any = {
      biryaniQuantity: orderData.biryaniQuantity,
      totalAmount,
      orderItems: orderData.orderItems,
      status: 'pending',
      orderDate: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      notes: orderData.notes,
      paymentMode: orderData.paymentMode,
      orderType: 'online', // Mark as online order
      ...(orderData.customerName && { customerName: orderData.customerName }),
      ...(orderData.customerPhone && { customerPhone: orderData.customerPhone }),
    };

    const docRef = await addDoc(collection(db, collections.orders), order);
    
    return {
      id: docRef.id,
      ...order
    };
  }

  // Create order from staff dashboard with customer details
  static async createStaffOrder(orderData: any): Promise<any> {
    const totalAmount = orderData.orderItems.reduce((sum: number, item: any) => sum + item.total, 0);
    
    const order: any = {
      biryaniQuantity: orderData.biryaniQuantity,
      totalAmount,
      orderItems: orderData.orderItems,
      status: 'pending',
      orderDate: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      notes: orderData.notes,
      paymentMode: orderData.paymentMode,
      ...(orderData.customerName && { customerName: orderData.customerName }),
      ...(orderData.customerPhone && { customerPhone: orderData.customerPhone }),
      ...(orderData.orderType && { orderType: orderData.orderType }),
    };

    const docRef = await addDoc(collection(db, collections.orders), order);
    
    return {
      id: docRef.id,
      ...order
    };
  }

  static async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    const orderRef = doc(db, collections.orders, orderId);
    await updateDoc(orderRef, {
      status,
      updatedAt: Timestamp.now(),
    });
  }


  static async getTodayOrders(): Promise<Order[]> {
    const today = new Date();
    const startOfToday = Timestamp.fromDate(new Date(today.setHours(0, 0, 0, 0)));
    const endOfToday = Timestamp.fromDate(new Date(today.setHours(23, 59, 59, 999)));

    const q = query(
      collection(db, collections.orders),
      where('orderDate', '>=', startOfToday),
      where('orderDate', '<=', endOfToday),
      orderBy('orderDate', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order));
  }

  static async getAllOrders(limitCount = 50): Promise<Order[]> {
    const q = query(
      collection(db, collections.orders),
      orderBy('orderDate', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order));
  }
}

export class ExpenseService {
  // Add new business expense
  static async createExpense(expenseData: ExpenseFormData): Promise<string> {
    const expense: Omit<Expense, 'id'> = {
      ...expenseData,
      date: Timestamp.fromDate(expenseData.date),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, collections.expenses), expense);
    return docRef.id;
  }

  // Get today's expenses only
  static async getTodayExpenses(): Promise<Expense[]> {
    const today = new Date();
    const startOfToday = Timestamp.fromDate(new Date(today.setHours(0, 0, 0, 0)));
    const endOfToday = Timestamp.fromDate(new Date(today.setHours(23, 59, 59, 999)));

    const q = query(
      collection(db, collections.expenses),
      where('date', '>=', startOfToday),
      where('date', '<=', endOfToday),
      orderBy('date', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Expense));
  }

  static async getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]> {
    const q = query(
      collection(db, collections.expenses),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Expense));
  }

  static async deleteExpense(expenseId: string): Promise<void> {
    await deleteDoc(doc(db, collections.expenses, expenseId));
  }
}

export class SettingsService {
  // Get business settings configuration
  static async getSettings(): Promise<Settings | null> {
    const snapshot = await getDocs(collection(db, collections.settings));
    if (snapshot.empty) return null;
    
    const settingsDoc = snapshot.docs[0];
    return {
      id: settingsDoc.id,
      ...settingsDoc.data()
    } as Settings;
  }

  static async updateSettings(settings: Partial<Omit<Settings, 'id' | 'createdAt'>>): Promise<void> {
    const existingSettings = await this.getSettings();
    
    if (existingSettings?.id) {
      const settingsRef = doc(db, collections.settings, existingSettings.id);
      await updateDoc(settingsRef, {
        ...settings,
        updatedAt: Timestamp.now(),
      });
    } else {
      const newSettings: Omit<Settings, 'id'> = {
        pricePerPlate: 150,
        taxRate: 0,
        deliveryCharge: 0,
        businessName: 'Biryani House',
        businessPhone: '',
        businessAddress: '',
        currency: '₹',
        workingHours: {
          open: '10:00',
          close: '22:00',
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        ...settings,
      };
      
      await addDoc(collection(db, collections.settings), newSettings);
    }
  }
}

export class UserService {
  // Check if email exists in pre-authorized users database
  static async checkEmailExists(email: string): Promise<{ exists: boolean; userData?: any }> {
    const q = query(
      collection(db, 'users'),
      where('email', '==', email)
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { exists: false };
    }

    const userDoc = snapshot.docs[0];
    return { 
      exists: true, 
      userData: { 
        id: userDoc.id, 
        ...userDoc.data() 
      } 
    };
  }
}

export class DashboardService {
  // Get pre-calculated daily profit/loss summary
  static async getDailySummary(date: Date): Promise<DailySummary | null> {
    const dateStr = date.toISOString().split('T')[0];
    const q = query(
      collection(db, collections.dailySummaries),
      where('date', '==', dateStr)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as DailySummary;
  }

  static async calculateAndStoreDailySummary(date: Date): Promise<DailySummary> {
    const dateStr = date.toISOString().split('T')[0];
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const ordersQuery = query(
      collection(db, collections.orders),
      where('orderDate', '>=', Timestamp.fromDate(startOfDay)),
      where('orderDate', '<=', Timestamp.fromDate(endOfDay))
    );

    const expensesQuery = query(
      collection(db, collections.expenses),
      where('date', '>=', Timestamp.fromDate(startOfDay)),
      where('date', '<=', Timestamp.fromDate(endOfDay))
    );

    const [ordersSnapshot, expensesSnapshot] = await Promise.all([
      getDocs(ordersQuery),
      getDocs(expensesQuery)
    ]);

    const orders = ordersSnapshot.docs.map(doc => doc.data() as Order);
    const expenses = expensesSnapshot.docs.map(doc => doc.data() as Expense);

    const totalRevenue = orders
      .filter(order => order.status !== 'cancelled')
      .reduce((sum, order) => sum + order.totalAmount, 0);

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    const summary: Omit<DailySummary, 'id'> = {
      date: dateStr,
      totalOrders: orders.filter(order => order.status !== 'cancelled').length,
      totalRevenue,
      totalExpenses,
      netProfit,
      createdAt: Timestamp.now(),
    };

    const existingSummary = await this.getDailySummary(date);
    if (existingSummary?.id) {
      const summaryRef = doc(db, collections.dailySummaries, existingSummary.id);
      await updateDoc(summaryRef, summary);
      return { id: existingSummary.id, ...summary };
    } else {
      const docRef = await addDoc(collection(db, collections.dailySummaries), summary);
      return { id: docRef.id, ...summary };
    }
  }
}