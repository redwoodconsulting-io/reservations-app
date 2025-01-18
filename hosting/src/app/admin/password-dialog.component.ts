import {ChangeDetectionStrategy, Component, HostListener, inject, Inject, model,} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'password-dialog',
  templateUrl: 'password-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatFormField,
    MatInput,
    MatError,
    MatLabel,
    MatDialogActions,
    MatButton,
    MatDialogClose,
    FormsModule
  ]
})
export class PasswordDialog {
  readonly dialogRef = inject(MatDialogRef<PasswordDialog>);
  readonly password = model('');
  readonly passwordConfirm = model('');

  @HostListener('window:keyup.Enter', ['$event'])
  onKeyPress(_event: KeyboardEvent): void {
    this.dialogRef.close(this.password())
  }

  constructor(@Inject(MAT_DIALOG_DATA) public bookerName: string) {
  }

  isValid() {
    return this.password() === this.passwordConfirm();
  }
}
