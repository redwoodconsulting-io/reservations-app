import {ChangeDetectionStrategy, Component, HostListener, Inject, inject,} from '@angular/core';
import {MatButton} from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import {FormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';

export interface NotesDialogData {
  notesMarkdown: string;
  unitName: string;
}

@Component({
  selector: 'notes-dialog',
  templateUrl: 'notes-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatButton,
    MatDialogTitle,
    FormsModule,
    MatInputModule,

  ]
})
export class NotesDialog {
  readonly dialogRef = inject(MatDialogRef<NotesDialog>);

  unitName: string;
  notesMarkdown: string;

  constructor(@Inject(MAT_DIALOG_DATA) public data: NotesDialogData) {
    this.unitName = data.unitName;
    this.notesMarkdown = data.notesMarkdown;
  }

  @HostListener('window:keyup.Enter', ['$event'])
  onKeyPress(_event: KeyboardEvent): void {
    this.dialogRef.close()
  }
}
