import {Routes} from '@angular/router';
import {ReservationsComponent} from './reservations.component';
import {AdminComponent} from './admin/admin.component';

export const routes: Routes = [
  {path: 'reservations', component: ReservationsComponent},
  {path: 'admin', component: AdminComponent},
  {path: '', redirectTo: '/reservations', pathMatch: 'full'},
];
