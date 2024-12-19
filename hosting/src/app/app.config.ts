import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideFirebaseApp(() => initializeApp({"projectId":"your-firebase-project-id","appId":"FIREBASE_APP_ID","storageBucket":"your-firebase-project-id.firebasestorage.app","apiKey":"FIREBASE_API_KEY","authDomain":"your-firebase-project-id.firebaseapp.com","messagingSenderId":"FIREBASE_MESSAGING_SENDER_ID"})), provideAuth(() => getAuth()), provideFirestore(() => getFirestore())]
};
