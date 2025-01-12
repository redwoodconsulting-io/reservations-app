import {Component, computed, inject, signal, Signal} from '@angular/core';
import {DataService} from '../data-service';
import {MatList, MatListItem, MatListItemIcon} from '@angular/material/list';
import {MatIcon} from '@angular/material/icon';
import {MatIconAnchor, MatIconButton} from '@angular/material/button';
import {MatCard, MatCardContent, MatCardHeader} from '@angular/material/card';
import {from, Observable} from 'rxjs';
import {getDownloadURL, ref, Storage} from '@angular/fire/storage';
import {FLOOR_PLANS_FOLDER} from '../app.config';
import {AsyncPipe} from '@angular/common';

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
    MatIconAnchor
  ],
  templateUrl: './floor-plans.component.html',
})
export class FloorPlanComponent {
  private readonly storage = inject(Storage);
  protected readonly floorPlanFilenames: Signal<string[]> = signal([]);
  protected readonly floorPlanDownloadUrls: Signal<{ [key: string]: Observable<string> }> = computed(() => {
    return this.getDownloadUrls(this.floorPlanFilenames());
  });

  constructor(dataService: DataService) {
    this.floorPlanFilenames = dataService.floorPlanFilenames;
  }

  getDownloadUrls(filenames: string[]): { [key: string]: Observable<string> } {
    const downloadUrls = {} as { [key: string]: Observable<string> };
    const rootRef = ref(this.storage, FLOOR_PLANS_FOLDER);
    this.floorPlanFilenames().forEach(filename => {
      downloadUrls[filename] = from(getDownloadURL(ref(rootRef, filename)));
    });
    return downloadUrls;
  }

  protected readonly alert = alert;
}
