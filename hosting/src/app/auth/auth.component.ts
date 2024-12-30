import {Component, inject, OnDestroy, PLATFORM_ID} from '@angular/core';
import {Auth, signInWithEmailAndPassword, signOut, User} from '@angular/fire/auth';
import {switchMap} from 'rxjs/operators';
import {AsyncPipe, isPlatformBrowser} from '@angular/common';
import cookies from 'js-cookie';
import {BehaviorSubject, from, Observable} from 'rxjs';
import {beforeAuthStateChanged, onAuthStateChanged, onIdTokenChanged} from "firebase/auth";
import {ɵzoneWrap} from "@angular/fire";
import {LoginDialog} from './login-dialog.component';
import {MatDialog} from '@angular/material/dialog';
import {MatError} from '@angular/material/form-field';
import {ANIMATION_SETTINGS} from '../app.config';

// TODO bring this to RxFire
function _authState(auth: Auth): Observable<User | null> {
  return from(auth.authStateReady()).pipe(
    switchMap(() => new Observable<User | null>((subscriber) => {
      const unsubscribe = onAuthStateChanged(
        auth,
        subscriber.next.bind(subscriber),
        subscriber.error.bind(subscriber),
        subscriber.complete.bind(subscriber),
      );
      return {unsubscribe};
    }))
  );
}

export const authState = ɵzoneWrap(_authState, true);

@Component({
  selector: 'app-auth',
  templateUrl: 'auth.component.html',
  standalone: true,
  imports: [AsyncPipe, LoginDialog, MatError]
})
export class AuthComponent implements OnDestroy {

  private readonly auth = inject(Auth);
  protected readonly authState = authState(this.auth);

  protected readonly user = this.authState.pipe();

  private readonly unsubscribeFromOnIdTokenChanged: (() => void) | undefined;
  private readonly unsubscribeFromBeforeAuthStateChanged: (() => void) | undefined;

  protected loginErrorMessage = new BehaviorSubject("");
  loginErrorMessage$ = this.loginErrorMessage.asObservable();

  readonly dialog = inject(MatDialog);

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {

      this.unsubscribeFromOnIdTokenChanged = onIdTokenChanged(this.auth, async (user) => {
        if (user) {
          const idToken = await user.getIdToken();
          cookies.set("__session", idToken);
        } else {
          cookies.remove("__session");
        }
      });

      let priorCookieValue: string | undefined;
      this.unsubscribeFromBeforeAuthStateChanged = beforeAuthStateChanged(this.auth, async (user) => {
        priorCookieValue = cookies.get("__session");
        const idToken = await user?.getIdToken();
        if (idToken) {
          cookies.set("__session", idToken);
        } else {
          cookies.remove("__session");
        }
      }, async () => {
        // If another beforeAuthStateChanged rejects, revert the cookie (best-effort)
        if (priorCookieValue) {
          cookies.set("__session", priorCookieValue);
        } else {
          cookies.remove("__session");
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.unsubscribeFromBeforeAuthStateChanged?.();
    this.unsubscribeFromOnIdTokenChanged?.();
  }

  async logout() {
    return await signOut(this.auth);
  }

  login() {
    const dialogRef = this.dialog.open(LoginDialog, {
      ...ANIMATION_SETTINGS,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result || !result.email || !result.password) {
        // Skip: missing email or password
        return;
      }

      console.log(`Attempting password login for: ${result.email}`);
      signInWithEmailAndPassword(this.auth, result.email, result.password)
        .then((userCredential) => {
          const user = userCredential.user;
          console.log(`Signed in as ${user.email}`);
          this.loginErrorMessage.next("");
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          console.error(`Error: ${errorCode} - ${errorMessage}`);
          this.loginErrorMessage.next(errorCode);
        });
    });
  }
}
