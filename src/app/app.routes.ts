import { Routes } from '@angular/router';
import { LandingComponent } from './components/landing/landing.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { PaymentsPageComponent } from './components/dashboard/pages/payments-page.component';
import { ReceiptPageComponent } from './components/dashboard/pages/receipt-page.component';
import { StudentBillsPageComponent } from './components/dashboard/pages/student-bills-page.component';
import { LibraryFinesPageComponent } from './components/dashboard/pages/library-fines-page.component';
import { RefundsPageComponent } from './components/dashboard/pages/refunds-page.component';
import { TransactionHistoryPageComponent } from './components/dashboard/pages/transaction-history-page.component';
import { HistoryPageComponent } from './components/dashboard/pages/history-page.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'payments', pathMatch: 'full' },
      { path: 'payments', component: PaymentsPageComponent },
      { path: 'student-bills', component: StudentBillsPageComponent }, 
      { path: 'receipt', component: ReceiptPageComponent },
      { path: 'library-fines', component: LibraryFinesPageComponent },
      { path: 'refunds', component: RefundsPageComponent },
      { path: 'transactions', component: TransactionHistoryPageComponent },
      { path: 'history', component: HistoryPageComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
