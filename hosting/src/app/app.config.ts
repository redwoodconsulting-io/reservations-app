import {ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {initializeApp, provideFirebaseApp} from '@angular/fire/app';
import {connectAuthEmulator, getAuth, provideAuth} from '@angular/fire/auth';
import {connectFirestoreEmulator, getFirestore, provideFirestore} from '@angular/fire/firestore';

import reservationsAppConfig from './reservations-app.config.json';
import {environment} from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp({
      "projectId": reservationsAppConfig.projectId,
      "appId": reservationsAppConfig.appId,
      "storageBucket": reservationsAppConfig.storageBucket,
      "apiKey": reservationsAppConfig.apiKey,
      "authDomain": reservationsAppConfig.authDomain,
      "messagingSenderId": reservationsAppConfig.messagingSenderId,
    })),
    provideAuth(() => {
      const auth = getAuth();
      if (environment.useEmulators) {
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      }
      return auth;
    }),
    provideFirestore(() => {
      const firestore = getFirestore();
      if (environment.useEmulators) {
        connectFirestoreEmulator(firestore, 'localhost', 8080)
      }
      return firestore;
    }),
  ],
};
