import {ChangeDetectionStrategy, Component, HostListener, Inject, inject, SecurityContext,} from '@angular/core';
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
import {DomSanitizer} from '@angular/platform-browser';
import {marked} from 'marked';

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
  readonly domSanitizer = inject(DomSanitizer);
  readonly dialogRef = inject(MatDialogRef<NotesDialog>);

  unitName: string;
  notesMarkdown: string;
  renderedMarkdown: string;

  constructor(@Inject(MAT_DIALOG_DATA) public data: NotesDialogData) {
    this.unitName = data.unitName;
    this.notesMarkdown = data.notesMarkdown;

    const parsedMarkdown = marked.parse(data.notesMarkdown);
    this.renderedMarkdown = this.domSanitizer.sanitize(SecurityContext.HTML, parsedMarkdown) || "";
  }

  @HostListener('window:keyup.Enter', ['$event'])
  onKeyPress(_event: KeyboardEvent): void {
    this.dialogRef.close()
  }
}
