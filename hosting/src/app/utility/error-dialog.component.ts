import {ChangeDetectionStrategy, Component, Inject,} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
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
  constructor(@Inject(MAT_DIALOG_DATA) public data: string) {
  }
}
