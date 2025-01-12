import {Component, computed, inject, signal, Signal} from '@angular/core';
import {DataService} from '../data-service';
import {MatList, MatListItem, MatListItemIcon} from '@angular/material/list';
import {MatIcon} from '@angular/material/icon';
import {MatFabButton, MatIconAnchor, MatIconButton} from '@angular/material/button';
import {MatCard, MatCardContent, MatCardHeader} from '@angular/material/card';
import {from, Observable} from 'rxjs';
import {getDownloadURL, ref, Storage} from '@angular/fire/storage';
import {ANIMATION_SETTINGS, FLOOR_PLANS_FOLDER} from '../app.config';
import {AsyncPipe} from '@angular/common';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ErrorDialog} from "../utility/error-dialog.component";
import {MatDialog} from "@angular/material/dialog";

@Component({
  selector: 'floor-plans',
  standalone: true,
  imports: [
    MatList,
    MatListItem,
    MatIcon,
    MatListItemIcon,
    MatIconButton,
    MatCard,
    MatCardHeader,
    MatCardContent,
    AsyncPipe,
    MatIconAnchor,
    MatFabButton
  ],
  templateUrl: './floor-plans.component.html',
})
export class FloorPlanComponent {
  private readonly dataService = inject(DataService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly storage = inject(Storage);

  protected readonly floorPlanFilenames: Signal<string[]> = signal([]);
  protected readonly floorPlanDownloadUrls: Signal<{ [key: string]: Observable<string> }> = computed(() => {
    return this.refreshDownloadUrls();
  });

  constructor() {
    this.floorPlanFilenames = this.dataService.floorPlanFilenames;
  }

  refreshDownloadUrls(): { [key: string]: Observable<string> } {
    const downloadUrls = {} as { [key: string]: Observable<string> };
    const rootRef = ref(this.storage, FLOOR_PLANS_FOLDER);
    this.floorPlanFilenames().forEach(filename => {
      downloadUrls[filename] = from(getDownloadURL(ref(rootRef, filename)));
    });
    return downloadUrls;
  }

  upload(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files?.item(0);

    if (!file) {
      return;
    }

    if (this.floorPlanFilenames().includes(file.name)) {
      if (!confirm(`Floor plan "${file.name}" already exists. Replace?`)) {
        return;
      }
    }

    const rootRef = ref(this.storage, FLOOR_PLANS_FOLDER);
    this.dataService.uploadFloorPlan(ref(rootRef, file.name), file).then(() => {
      this.snackBar.open('Upload complete', 'OK', {
        duration: 3000
      });
    }).catch(error => {
      this.dialog.open(ErrorDialog, {data: `Couldn't delete reservation: ${error.message}`, ...ANIMATION_SETTINGS});
    });
  }

  delete(filename: string) {
    if (!confirm(`Really delete floor plan "${filename}"? This cannot be undone.`)) {
      return;
    }

    const rootRef = ref(this.storage, FLOOR_PLANS_FOLDER);
    this.dataService.deleteFloorPlan(ref(rootRef, filename)).then(() => {
      this.snackBar.open(`Floor plan deleted: ${filename}`, 'OK', {
        duration: 3000
      });
    }).catch(error => {
      this.dialog.open(ErrorDialog, {data: `Couldn't delete floor plan: ${error.message}`, ...ANIMATION_SETTINGS});
    });
  }

  protected readonly alert = alert;
}
