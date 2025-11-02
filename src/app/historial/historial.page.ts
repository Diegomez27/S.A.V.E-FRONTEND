import { Component, OnInit } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonDatetimeButton,
  IonModal,
  IonDatetime,
  IonButton,
  IonButtons,
  IonRow,
  IonCol,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonLoading
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeCircleOutline,
  calendarOutline,
  documentOutline
} from 'ionicons/icons';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { AccessService, AccessRecord, AccessFilters } from '../services/access.service';// Registrar iconos
addIcons({
  closeCircleOutline,
  calendarOutline,
  documentOutline
});

@Component({
  selector: 'app-historial',
  templateUrl: 'historial.page.html',
  styleUrls: ['historial.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonDatetimeButton,
    IonModal,
    IonDatetime,
    IonButton,
    IonButtons,
    IonRow,
    IonCol,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonLoading,
    DatePipe,
    NgFor,
    NgIf
  ],
  standalone: true
})
export class HistorialPage implements OnInit {
  accessRecords: AccessRecord[] = [];
  filteredRecords: AccessRecord[] = [];
  filters: AccessFilters = {};
  searchTerm: string = '';
  isLoading: boolean = false;
  currentPage: number = 1;
  itemsPerPage: number = 20;
  hasMoreData: boolean = true;

  constructor(private accessService: AccessService) {}

  ngOnInit() {
    this.loadAccessRecords();
  }

  loadAccessRecords(refresh: boolean = false) {
    if (refresh) {
      this.currentPage = 1;
      this.hasMoreData = true;
    }

    if (!this.hasMoreData && !refresh) return;

    this.isLoading = true;
    console.log('Loading records with filters:', this.filters);

    const filters: AccessFilters = {
      ...this.filters,
      page: this.currentPage,
      limit: this.itemsPerPage,
      search: this.searchTerm
    };

    this.accessService.getAccessHistory(filters).subscribe({
      next: (records) => {
        console.log('Records received:', records);

        if (records) {
          if (refresh) {
            this.accessRecords = records;
          } else {
            this.accessRecords = [...this.accessRecords, ...records];
          }

          this.hasMoreData = records.length === this.itemsPerPage;
          this.filterRecords();
          console.log('Filtered records:', this.filteredRecords);
        }
      },
      error: (error) => {
        console.error('Error fetching records:', error);
      },
      complete: () => {
        this.isLoading = false;
        console.log('Records loading completed');
      }
    });
  }

  async doRefresh(event: any) {
    await this.loadAccessRecords(true);
    event.target.complete();
  }

  handleSearch(event: any) {
    this.searchTerm = event.detail.value?.toLowerCase() || '';
    this.loadAccessRecords(true);
  }

  async loadMore(event: any) {
    if (!this.isLoading && this.hasMoreData) {
      this.currentPage++;
      await this.loadAccessRecords();
    }
    event.target.complete();
  }

  private filterRecords() {
    this.filteredRecords = this.accessRecords;
  }

  // Filtros avanzados
  handleDateFilter(event: any) {
    const { startDate, endDate } = event.detail.value;
    this.filters = {
      ...this.filters,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    };
    this.loadAccessRecords(true);
  }

  handleTypeFilter(event: any) {
    this.filters = {
      ...this.filters,
      accessType: event.detail.value
    };
    this.loadAccessRecords(true);
  }



  clearFilters() {
    this.filters = {};
    this.searchTerm = '';
    this.loadAccessRecords(true);
  }
}
