import {Component, inject, OnDestroy, PLATFORM_ID} from '@angular/core';
import {Auth, signInAnonymously, signOut, User} from '@angular/fire/auth';
import {switchMap} from 'rxjs/operators';
import {AsyncPipe, isPlatformBrowser} from '@angular/common';
import cookies from 'js-cookie';
import {from, Observable} from 'rxjs';
import {
  beforeAuthStateChanged,
  GoogleAuthProvider,
  onAuthStateChanged,
  onIdTokenChanged,
  signInWithPopup
} from "firebase/auth";
import {ɵzoneWrap} from "@angular/fire";
import {LoginDialog} from './login-dialog.component';
import {MatDialog} from '@angular/material/dialog';

// TODO bring this to RxFire
function _authState(auth: Auth): Observable<User|null> {
  return from(auth.authStateReady()).pipe(
    switchMap(() => new Observable<User|null>((subscriber) => {
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
  template: `
    <p>
      @if ((user | async) === null) {
        <button (click)="login()">Log in</button>
      } @else {
        <p>
          Logged in as {{ (user | async)?.email }}
          <button (click)="logout()">Log out</button>
        </p>
      }
    </p>
  `,
  standalone: true,
  imports: [AsyncPipe, LoginDialog]
})
export class AuthComponent implements OnDestroy {

  private readonly auth = inject(Auth);
  protected readonly authState = authState(this.auth);

  protected readonly user = this.authState.pipe();

  private readonly unsubscribeFromOnIdTokenChanged: (() => void) | undefined;
  private readonly unsubscribeFromBeforeAuthStateChanged: (() => void) | undefined;

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

      let priorCookieValue: string|undefined;
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
    const enterAnimationDuration = "250ms";
    const exitAnimationDuration = "250ms";

    const dialogRef = this.dialog.open(LoginDialog, {
      width: '250px',
      enterAnimationDuration,
      exitAnimationDuration,
    });
  }
}
