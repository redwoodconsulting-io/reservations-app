import {MatDialog, MatDialogConfig, MatDialogRef} from '@angular/material/dialog';
import {ComponentType} from '@angular/cdk/overlay';
import {Injectable, TemplateRef} from '@angular/core';

// Adapted from Abhinav Kumar: https://stackoverflow.com/a/79210442/211771
@Injectable({
  providedIn: 'root',
})
export class DialogService extends MatDialog {
  override open<T, D = any, R = any>(component: ComponentType<T> | TemplateRef<T>, config?: MatDialogConfig<D>): MatDialogRef<T, R> {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement) {
      activeElement.blur();
    }

    return super.open(component, config);
  }
}
