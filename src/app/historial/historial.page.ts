import { Component, OnInit } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
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
  IonSpinner,
  IonText,
  IonCard,
  IonCardContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeCircleOutline,
  calendarOutline,
  documentOutline,
  checkmarkCircle,
  closeCircle,
  cardOutline,
  phonePortraitOutline
} from 'ionicons/icons';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { AccessService, AccessRecord, AccessFilters } from '../services/access.service';
import { AlertService } from '../services/alert.service';

// Registrar iconos
addIcons({
  closeCircleOutline,
  calendarOutline,
  documentOutline,
  checkmarkCircle,
  closeCircle,
  cardOutline,
  phonePortraitOutline
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
    IonSpinner,
    IonText,
    IonCard,
    IonCardContent,
    DatePipe,
    NgFor,
    NgIf
  ],
  standalone: true
})
export class HistorialPage implements OnInit, ViewWillEnter {
  // Data
  accessRecords: AccessRecord[] = [];

  // Filtros
  filters: AccessFilters = { type: undefined };
  searchTerm: string = '';

  // Paginación (metadata del backend)
  currentPage: number = 1;
  totalPages: number = 0;
  totalRecords: number = 0;
  hasNextPage: boolean = false;
  hasPrevPage: boolean = false;
  itemsPerPage: number = 20;

  // Estados
  isLoading: boolean = false;
  errorMessage: string = '';
    // Control visual del selector de fecha
    selectedDate: string | undefined = undefined;

  constructor(
    private accessService: AccessService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.loadAccessRecords();
  }

  ionViewWillEnter() {
    this.loadAccessRecords(true);
  }

  // ==================== CARGAR REGISTROS ====================
  loadAccessRecords(refresh: boolean = false) {
    if (refresh) {
      this.currentPage = 1;
      this.accessRecords = [];
    }

    // Si no hay más datos y no es refresh, no hacer nada
    if (!this.hasNextPage && !refresh && this.currentPage > 1) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const filters: AccessFilters = {
      ...this.filters,
      page: this.currentPage,
      limit: this.itemsPerPage,
      search: this.searchTerm || undefined
    };

    console.log('🔍 Loading records with filters:', filters);

    this.accessService.getAccessHistory(filters).subscribe({
      next: (response) => {
        console.log('✅ Response received:', response);

        // Usar la metadata del backend
        if (refresh) {
          this.accessRecords = response.records;
        } else {
          this.accessRecords = [...this.accessRecords, ...response.records];
        }

        // Actualizar metadata de paginación
        this.totalPages = response.totalPages;
        this.totalRecords = response.total;
        this.hasNextPage = response.hasNextPage;
        this.hasPrevPage = response.hasPrevPage;
        this.currentPage = response.page;

        console.log(`📊 Metadata: Page ${this.currentPage}/${this.totalPages}, Total: ${this.totalRecords}, HasNext: ${this.hasNextPage}`);

        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error fetching records:', error);
        this.errorMessage = this.getErrorMessage(error);
        this.alertService.showError('Error al cargar historial', this.errorMessage);
        this.isLoading = false;
      }
    });
  }

  // ==================== REFRESH ====================
  async doRefresh(event: any) {
    await this.loadAccessRecords(true);
    event.target.complete();
  }

  // ==================== BÚSQUEDA ====================
  handleSearch(event: any) {
    this.searchTerm = event.detail.value?.trim() || '';
    this.loadAccessRecords(true);
  }

  // ==================== INFINITE SCROLL ====================
  async loadMore(event: any) {
    if (this.isLoading || !this.hasNextPage) {
      event.target.complete();
      return;
    }

    console.log('📥 Loading more... Current page:', this.currentPage);
    this.currentPage++;
    await this.loadAccessRecords(false);
    event.target.complete();
  }

  // ==================== FILTROS ====================
  handleDateFilter(event: any) {
      this.selectedDate = event.detail.value;
      if (this.selectedDate) {
        const date = new Date(this.selectedDate);
      // Establecer rango del día completo
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      this.filters = {
        ...this.filters,
        startDate: startOfDay,
        endDate: endOfDay
      };
    } else {
      this.filters = {
        ...this.filters,
        startDate: undefined,
        endDate: undefined
      };
    }
    this.loadAccessRecords(true);
  }

  handleTypeFilter(event: any) {
    const type = event.detail.value;
    this.filters = {
      ...this.filters,
      type: (!type || type === 'Todos' || type === '') ? undefined : type
    };
    this.loadAccessRecords(true);
  }

  clearFilters() {
    this.filters = { type: undefined };
    this.searchTerm = '';
      this.selectedDate = undefined;
    this.loadAccessRecords(true);
  }

  // ==================== HELPERS ====================
  getDateFilterLabel(): string {
    if (this.filters.startDate) {
      return new Date(this.filters.startDate).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short'
      });
    }
    return 'Fecha';
  }

  getTypeFilterLabel(): string {
    if (this.filters.type === 'RFID') return 'Tarjeta';
    if (this.filters.type === 'REMOTE') return 'App';
    return 'Todos';
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.startDate || this.filters.endDate || this.filters.type || this.searchTerm);
  }

  getAccessIcon(record: AccessRecord): string {
    return record.accessType === 'REMOTE' ? 'phone-portrait-outline' : 'card-outline';
  }

  getAccessColor(record: AccessRecord): string {
    return record.isAuthorized ? 'success' : 'danger';
  }

  getAccessBadgeText(record: AccessRecord): string {
    if (record.accessType === 'REMOTE') {
      return record.isAuthorized ? 'App' : 'App';
    } else {
      return record.isAuthorized ? 'Tarjeta' : 'Tarjeta';
    }
  }

  private getErrorMessage(error: any): string {
    if (error.status === 0) return 'Sin conexión al servidor';
    if (error.status === 401) return 'Sesión expirada';
    if (error.status === 403) return 'No tienes permisos';
    return 'Error al cargar el historial';
  }

  // TrackBy para optimizar ngFor
  trackByRecordId(index: number, record: AccessRecord): number {
    return record.id;
  }
}
