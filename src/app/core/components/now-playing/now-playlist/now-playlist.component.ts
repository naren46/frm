import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  ViewEncapsulation,
  AfterViewChecked,
  NgZone,
  SimpleChanges
} from '@angular/core';
import * as NowPlaylist from '@store/now-playlist';
import { flyOut } from '@shared/animations/fade-in.animation';
import { isNewChange } from '@shared/utils/data.utils';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'now-playlist',
  animations: [flyOut],
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./now-playlist.scss'],
  template: `
  <section class="now-playlist ux-maker">
    <div *ngIf="isPlaylistEmpty" class="empty-list text-center" [@flyOut]>
      <icon name="music" class="bg-primary ux-maker"></icon>
      <article>
        <h3 class="text-primary">Playlist Is Empty</h3>
        <p class="text-primary">Queue Media From Results</p>
      </article>
    </div>
    <ul class="nav nav-list ux-maker nicer-ux" cdkDropList 
      (cdkDropListDropped)="onTrackDrop($event)"
      [cdkDropListLockAxis]="'y'">
      <li class="now-playlist-track" #playlistTrack cdkDrag
        *ngFor="let video of playlist.videos | search:playlist.filter; let index = index"
        [class.active]="isActiveMedia(video.id, playlistTrack)"
        [@flyOut]>
        <now-playlist-track
          [video]="video" [index]="index"
          (remove)="removeVideo($event)"
          (select)="selectVideo(video)"
          (selectTrack)="selectTrackInVideo($event)"
        ></now-playlist-track>
      </li>
    </ul>
  </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NowPlaylistComponent implements OnChanges, AfterViewChecked {
  @Input() playlist: NowPlaylist.INowPlaylist;
  @Output() select = new EventEmitter<GoogleApiYouTubeVideoResource>();
  @Output()
  selectTrack = new EventEmitter<{
    time: string;
    media: GoogleApiYouTubeVideoResource;
  }>();
  @Output() remove = new EventEmitter<GoogleApiYouTubeVideoResource>();
  @Output() sort = new EventEmitter<GoogleApiYouTubeVideoResource[]>();

  public activeTrackElement: HTMLUListElement;
  public hasActiveChanged = false;

  constructor(public zone: NgZone) {}

  ngAfterViewChecked() {
    if (this.hasActiveChanged && this.activeTrackElement) {
      this.zone.runOutsideAngular(() => this.scrollToActiveTrack());
    }
  }

  ngOnChanges({ activeId }: SimpleChanges) {
    if (activeId) {
      this.hasActiveChanged = isNewChange(activeId);
    }
  }

  scrollToActiveTrack() {
    if (this.activeTrackElement) {
      this.activeTrackElement.scrollIntoView();
    }
  }

  selectVideo(media: GoogleApiYouTubeVideoResource) {
    this.select.emit(media);
  }

  removeVideo(media: GoogleApiYouTubeVideoResource) {
    this.remove.emit(media);
  }

  isActiveMedia(mediaId: string, trackElement: HTMLUListElement) {
    const isActive = this.playlist.selectedId === mediaId;
    if (isActive) {
      this.activeTrackElement = trackElement;
    }
    return isActive;
  }

  selectTrackInVideo(trackEvent: { time; media }) {
    this.selectTrack.emit(trackEvent);
  }

  onTrackDrop({
    currentIndex,
    previousIndex
  }: CdkDragDrop<GoogleApiYouTubeVideoResource>) {
    const videos = [...this.playlist.videos];
    moveItemInArray(videos, previousIndex, currentIndex);
    this.sort.emit(videos);
  }

  get isPlaylistEmpty() {
    return this.playlist.videos.length === 0;
  }
}
