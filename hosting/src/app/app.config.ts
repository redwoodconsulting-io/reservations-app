import {ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {initializeApp, provideFirebaseApp} from '@angular/fire/app';
import {getAuth, provideAuth} from '@angular/fire/auth';
import {getFirestore, provideFirestore} from '@angular/fire/firestore';

import reservationsAppConfig from './reservations-app.config.json';

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
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
  ],
};
