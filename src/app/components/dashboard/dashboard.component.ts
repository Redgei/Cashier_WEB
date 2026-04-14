import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <section class="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_32%),linear-gradient(180deg,_#eff6ff_0%,_#ffffff_34%,_#f8fbff_100%)] text-slate-950 lg:h-screen lg:overflow-hidden">
      <div class="mx-auto flex min-h-screen max-w-7xl flex-col gap-4 px-3 py-4 sm:px-5 lg:h-screen lg:flex-row lg:items-stretch lg:gap-5 lg:px-6 lg:py-4">
        <aside class="flex w-full flex-col overflow-hidden rounded-[1rem] border border-blue-100 bg-white/90 p-3.5 shadow-xl shadow-blue-100 backdrop-blur lg:h-[calc(100vh-2rem)] lg:max-w-[15.5rem] lg:shrink-0">
          <div class="flex items-center gap-1.5">
            <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <span class="text-xs font-black">C</span>
            </div>
            <div>
              <p class="text-[9px] font-bold uppercase tracking-[0.28em] text-blue-700">School Cashier System</p>
              <p class="text-[10px] text-slate-500">System Navigation</p>
            </div>
          </div>

          <nav class="mt-14 flex flex-col gap-3 lg:flex-1">
            @for (item of navigationItems; track item.path) {
              <a
                [routerLink]="item.path"
                routerLinkActive
                #activeLink="routerLinkActive"
                [routerLinkActiveOptions]="{ exact: item.exact }"
                class="flex min-h-[2.25rem] items-center gap-1.5 rounded-xl border px-2 py-1 text-[11px] font-semibold leading-tight transition"
                [class.border-transparent]="!activeLink.isActive"
                [class.bg-blue-50]="!activeLink.isActive"
                [class.text-slate-700]="!activeLink.isActive"
                [class.hover:border-blue-100]="!activeLink.isActive"
                [class.hover:bg-white]="!activeLink.isActive"
                [class.hover:text-blue-700]="!activeLink.isActive"
                [class.border-blue-200]="activeLink.isActive"
                [class.bg-blue-600]="activeLink.isActive"
                [class.text-white]="activeLink.isActive"
                [class.shadow-lg]="activeLink.isActive"
                [class.shadow-blue-100]="activeLink.isActive"
              >
                <span
                  class="flex h-6 w-6 items-center justify-center rounded-lg text-[9px] font-bold shadow-sm transition"
                  [class.bg-white]="!activeLink.isActive"
                  [class.text-blue-700]="!activeLink.isActive"
                  [class.bg-blue-500]="activeLink.isActive"
                  [class.text-white]="activeLink.isActive"
                >
                  {{ item.tag }}
                </span>
                <span>{{ item.label }}</span>
              </a>
            }
          </nav>

          <button
            type="button"
            class="mt-6 flex items-center justify-center rounded-xl bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-blue-500 lg:mt-4 lg:shrink-0"
            (click)="logout()"
          >
            Sign Out
          </button>

          
        </aside>

        <main class="flex-1 lg:h-[calc(100vh-2rem)] lg:min-h-0 lg:overflow-y-auto lg:pr-1">
          <div class="dashboard-content rounded-[1.5rem] border border-blue-100 bg-white/85 p-3 shadow-xl shadow-blue-100 backdrop-blur sm:p-4 lg:min-h-full">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    </section>
  `
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  readonly navigationItems = [
    { label: 'Create Bill', path: '/dashboard/payments', tag: 'PY', exact: false },
    { label: 'Student Billings', path: '/dashboard/student-bills', tag: 'SB', exact: false }, 
    { label: 'Receipt', path: '/dashboard/receipt', tag: 'OR', exact: false },
    { label: 'Library Fines', path: '/dashboard/library-fines', tag: 'LF', exact: false },
    { label: 'Refunds', path: '/dashboard/refunds', tag: 'RF', exact: false },
    { label: 'Transactions', path: '/dashboard/transactions', tag: 'TX', exact: false },
    { label: 'History', path: '/dashboard/history', tag: 'HS', exact: false }
  ];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
  }

  logout() {
    const confirmed = window.confirm('Are you sure you want to log out?');

    if (!confirmed) {
      return;
    }

    this.authService.logout();
  }
}
