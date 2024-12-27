import {Component, inject} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {collection, collectionData, doc, docData, Firestore} from '@angular/fire/firestore';
import {AsyncPipe} from '@angular/common';
import {AuthComponent} from './auth/auth.component';
import {Auth, user} from '@angular/fire/auth';
import {map, Observable} from 'rxjs';
import {WeekTableComponent} from './week-table.component';
import {BookableUnit, ConfigData} from './types';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    AsyncPipe,
    AuthComponent,
    WeekTableComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private readonly auth = inject(Auth);
  user$ = user(this.auth);
  private readonly firestore = inject(Firestore);

  title = 'reservations-app';

  configYear = '2025';
  configCollection = collection(this.firestore, 'config');
  configRef = doc(this.configCollection, this.configYear);

  weeks$ = (docData(this.configRef) as Observable<ConfigData>).pipe(
    map(it => it?.weeks || []),
  ).pipe();

  unitsCollection = collection(this.firestore, 'units');
  units$ = collectionData(this.unitsCollection).pipe() as Observable<BookableUnit[]>;
}
