import {Component, inject} from '@angular/core';
import {DataService} from '../data-service';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {MatCard, MatCardContent, MatCardHeader} from '@angular/material/card';
import {ANIMATION_SETTINGS} from '../app.config';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ErrorDialog} from "../utility/error-dialog.component";
import {MatDialog} from "@angular/material/dialog";
import {Booker} from '../types';
import {PasswordDialog} from './password-dialog.component';
import {Functions, httpsCallable} from '@angular/fire/functions';

@Component({
  selector: 'passwords',
  standalone: true,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardContent,
    MatIconButton,
    MatIcon,
  ],
  templateUrl: './passwords.component.html',
})
export class PasswordsComponent {
  private readonly dataService = inject(DataService);
  private readonly dialog = inject(MatDialog);
  private readonly functions = inject(Functions);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly bookers = this.dataService.bookers;

  constructor() {
  }

  editPassword(booker: Booker) {
    const dialogRef = this.dialog.open(PasswordDialog, {
      data: booker.name,
      ...ANIMATION_SETTINGS,
    })

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return;
      }

      const callable = httpsCallable(this.functions, 'setUserPassword');
      callable({userId: booker.userId, password: result}).then(() => {
        this.snackBar.open('Password updated successfully', 'Ok', {duration: 3000});
      }).catch((error: any) => {
        this.dialog.open(ErrorDialog, {
          data: error.message,
          ...ANIMATION_SETTINGS,
        });
      });
    });
  }
}
