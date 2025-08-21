import { OrderService, ExpenseService } from './firestore';
import { Order, Expense } from './types';

export interface ProfitData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  totalOrders: number;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export class ProfitCalculator {
  
  // Get date range for different periods
  static getDateRange(period: 'today' | 'week' | 'month' | 'custom', customRange?: DateRange): DateRange {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        break;
      
      case 'week':
        startDate = new Date();
        startDate.setDate(now.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        break;
      
      case 'month':
        startDate = new Date();
        startDate.setDate(now.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
        break;
      
      case 'custom':
        if (!customRange) {
          throw new Error('Custom date range is required');
        }
        startDate = new Date(customRange.startDate);
        endDate = new Date(customRange.endDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    }

    return { startDate, endDate };
  }

  // Calculate profit for a specific date range
  static async calculateProfit(period: 'today' | 'week' | 'month' | 'custom', customRange?: DateRange): Promise<ProfitData> {
    const { startDate, endDate } = this.getDateRange(period, customRange);
    
    try {
      // Fetch orders and expenses for the date range
      const [orders, expenses] = await Promise.all([
        this.getOrdersInRange(startDate, endDate),
        ExpenseService.getExpensesByDateRange(startDate, endDate)
      ]);

      // Calculate revenue from completed orders (exclude cancelled)
      const completedOrders = orders.filter(order => order.status !== 'cancelled');
      const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      
      // Calculate total expenses
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      // Calculate net profit
      const netProfit = totalRevenue - totalExpenses;
      
      // Calculate profit margin (as percentage)
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      return {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        totalOrders: completedOrders.length
      };
    } catch (error) {
      console.error('Error calculating profit:', error);
      return {
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        profitMargin: 0,
        totalOrders: 0
      };
    }
  }

  // Helper method to get orders in a date range (since OrderService doesn't have this method yet)
  private static async getOrdersInRange(startDate: Date, endDate: Date): Promise<Order[]> {
    // For now, get all orders and filter by date
    // In production, you might want to add a specific Firestore query for date ranges
    const allOrders = await OrderService.getAllOrders(1000); // Get more orders for filtering
    
    return allOrders.filter(order => {
      if (!order.orderDate || !order.orderDate.toDate) return false;
      
      const orderDate = order.orderDate.toDate();
      return orderDate >= startDate && orderDate <= endDate;
    });
  }

  // Get today's profit
  static async getTodayProfit(): Promise<ProfitData> {
    return this.calculateProfit('today');
  }

  // Get weekly profit (last 7 days)
  static async getWeeklyProfit(): Promise<ProfitData> {
    return this.calculateProfit('week');
  }

  // Get monthly profit (last 30 days)
  static async getMonthlyProfit(): Promise<ProfitData> {
    return this.calculateProfit('month');
  }

  // Get profit breakdown by category for expenses
  static async getExpenseBreakdown(period: 'today' | 'week' | 'month' | 'custom', customRange?: DateRange) {
    const { startDate, endDate } = this.getDateRange(period, customRange);
    
    try {
      const expenses = await ExpenseService.getExpensesByDateRange(startDate, endDate);
      
      const breakdown: { [key: string]: number } = {
        ingredients: 0,
        fuel: 0,
        packaging: 0,
        utilities: 0,
        labor: 0,
        rent: 0,
        other: 0
      };

      expenses.forEach(expense => {
        breakdown[expense.category] += expense.amount;
      });

      // Calculate percentages
      const totalExpenses = Object.values(breakdown).reduce((sum, amount) => sum + amount, 0);
      
      const breakdownWithPercentages = Object.entries(breakdown).map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
      }));

      return {
        breakdown: breakdownWithPercentages,
        totalExpenses
      };
    } catch (error) {
      console.error('Error calculating expense breakdown:', error);
      return {
        breakdown: [],
        totalExpenses: 0
      };
    }
  }

  // Get daily profit trend for a period
  static async getDailyProfitTrend(days: number = 7): Promise<Array<{date: string, profit: number, revenue: number, expenses: number}>> {
    const trends: Array<{date: string, profit: number, revenue: number, expenses: number}> = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
      const endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
      
      const profitData = await this.calculateProfit('custom', { startDate, endDate });
      
      trends.push({
        date: date.toISOString().split('T')[0], // YYYY-MM-DD format
        profit: profitData.netProfit,
        revenue: profitData.totalRevenue,
        expenses: profitData.totalExpenses
      });
    }
    
    return trends;
  }

  // Format currency for display
  static formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  // Format percentage for display
  static formatPercentage(percentage: number): string {
    return `${percentage.toFixed(1)}%`;
  }
}