import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideFirebaseApp(() => initializeApp({"projectId":"ce-reservations-prod","appId":"1:133249541973:web:6124dc83ce01c6033771dc","storageBucket":"ce-reservations-prod.firebasestorage.app","apiKey":"AIzaSyBp9zK7wryzEV3SnCyH_PcrFQVLXCgEy6w","authDomain":"ce-reservations-prod.firebaseapp.com","messagingSenderId":"133249541973"})), provideAuth(() => getAuth()), provideFirestore(() => getFirestore())]
};
