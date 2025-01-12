import {Routes} from '@angular/router';
import {ReservationsComponent} from './reservations.component';
import {AdminComponent} from './admin/admin.component';
import {FloorPlanComponent} from './admin/floor-plans.component';
import {UnitPricingComponent} from './admin/unit-pricing.component';

export const routes: Routes = [
  {path: 'reservations', component: ReservationsComponent},
  {
    path: 'admin',
    component: AdminComponent,
    children: [
      {
        path: 'floor-plans',
        component: FloorPlanComponent,
      },
      {
        path: 'unit-pricing',
        component: UnitPricingComponent,
      },
      {
        path: 'unit-pricing/:unitId',
        component: UnitPricingComponent,
      },
    ]
  },
  {path: '', redirectTo: '/reservations', pathMatch: 'full'},
];
