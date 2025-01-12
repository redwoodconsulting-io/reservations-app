import {Routes} from '@angular/router';
import {ReservationsComponent} from './reservations.component';
import {AdminComponent} from './admin/admin.component';
import {FloorPlanComponent} from './admin/floor-plans.component';

export const routes: Routes = [
  {path: 'reservations', component: ReservationsComponent},
  {
    path: 'admin',
    component: AdminComponent,
    children: [
      {
        path: 'floor-plans',
        component: FloorPlanComponent,
      }
    ]
  },
  {path: '', redirectTo: '/reservations', pathMatch: 'full'},
];
