import {ChangeDetectionStrategy, Component, Inject, output,} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import {Reservation} from '../types';
import {MatButton} from '@angular/material/button';

@Component({
  selector: 'error-dialog',
  templateUrl: 'error-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogClose,
    MatButton,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
  ]
})
export class ErrorDialog {
  //readonly dialogRef = inject(MatDialogRef<ErrorDialog>);

  reservation = output<Reservation>();

  constructor(@Inject(MAT_DIALOG_DATA) public data: string) {
  }

}
