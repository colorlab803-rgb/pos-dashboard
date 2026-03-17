import { Component, OnInit, inject } from '@angular/core';
import { PosService, DailyStats, WeeklyPoint, TopProduct } from '../../services/pos';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false,
})
export class DashboardPage implements OnInit {
  private pos = inject(PosService);

  stats: DailyStats = {
    today_sales: 0, today_tickets: 0, avg_ticket: 0,
    week_sales: 0, month_sales: 0, new_customers: 0,
  };
  weeklySales: number[] = [];
  weekDays: string[] = [];
  maxWeekly = 0;
  topProducts: TopProduct[] = [];
  recentSales: any[] = [];
  loading = true;

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.loading = true;
    try {
      const [stats, weekly, top, sales] = await Promise.all([
        this.pos.getDailyStats(),
        this.pos.getWeeklySales(),
        this.pos.getTopProducts(),
        this.pos.getSales(5),
      ]);
      this.stats = stats;
      this.weekDays = weekly.map(p => p.day);
      this.weeklySales = weekly.map(p => p.total);
      this.maxWeekly = Math.max(...this.weeklySales, 1);
      this.topProducts = top;
      this.recentSales = sales;
    } catch (e) {
      console.error('Error cargando dashboard', e);
    } finally {
      this.loading = false;
    }
  }
}
