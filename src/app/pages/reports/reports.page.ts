import { Component, OnInit, inject } from '@angular/core';
import { PosService, TopProduct, PaymentMethodStat } from '../../services/pos';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
  standalone: false,
})
export class ReportsPage implements OnInit {
  private pos = inject(PosService);

  period = 'semana';
  periodLabel = 'Día';
  chartData: number[] = [];
  chartLabels: string[] = [];
  maxChart = 0;
  currentSales = 0;
  currentTickets = 0;
  avgTicket = 0;
  topProducts: TopProduct[] = [];
  paymentMethods: PaymentMethodStat[] = [];
  recentSales: any[] = [];
  loading = true;

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.loading = true;
    try {
      const [stats, top, payments, sales] = await Promise.all([
        this.pos.getDailyStats(),
        this.pos.getTopProducts(),
        this.pos.getPaymentMethods(),
        this.pos.getSales(20),
      ]);
      this.topProducts = top;
      this.paymentMethods = payments;
      this.recentSales = sales;
      this.currentSales = stats.today_sales;
      this.currentTickets = stats.today_tickets;
      this.avgTicket = stats.avg_ticket;
      await this.loadChart();
    } catch (e) {
      console.error(e);
    } finally {
      this.loading = false;
    }
  }

  async changePeriod() {
    await this.loadChart();
  }

  async loadChart() {
    try {
      if (this.period === 'dia') {
        this.periodLabel = 'Hora';
        const hourly = await this.pos.getHourlySales();
        this.chartLabels = hourly.map(p => p.day);
        this.chartData   = hourly.map(p => p.total);
        const s = await this.pos.getDailyStats();
        this.currentSales   = s.today_sales;
        this.currentTickets = s.today_tickets;
        this.avgTicket      = s.avg_ticket;
      } else if (this.period === 'semana') {
        this.periodLabel = 'Día';
        const weekly = await this.pos.getWeeklySales();
        this.chartLabels = weekly.map(p => p.day);
        this.chartData   = weekly.map(p => p.total);
        const s = await this.pos.getDailyStats();
        this.currentSales   = s.week_sales;
        this.currentTickets = 0;
        this.avgTicket      = 0;
      } else {
        this.periodLabel = 'Mes';
        const monthly = await this.pos.getMonthlySales();
        this.chartLabels = monthly.map(p => p.day);
        this.chartData   = monthly.map(p => p.total);
        const s = await this.pos.getDailyStats();
        this.currentSales   = s.month_sales;
        this.currentTickets = 0;
        this.avgTicket      = 0;
      }
      this.maxChart = Math.max(...this.chartData, 1);
    } catch (e) {
      console.error(e);
    }
  }
}
