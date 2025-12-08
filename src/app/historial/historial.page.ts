import { Component, OnInit } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel,
  IonBadge, IonIcon, IonRefresher, IonRefresherContent, IonSearchbar,
  IonSelect, IonSelectOption, IonDatetimeButton, IonModal, IonDatetime,
  IonButton, IonButtons, IonRow, IonCol, IonInfiniteScroll,
  IonInfiniteScrollContent, IonSpinner, IonText, IonCard, IonCardContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeCircleOutline, calendarOutline, documentOutline, checkmarkCircle,
  closeCircle, cardOutline, phonePortraitOutline, searchOutline, refreshOutline,
  search,
  chevronDownOutline,
  fingerPrintOutline,
  readerOutline,
  alertCircle // Para el mensaje de error
} from 'ionicons/icons';
import { DatePipe, NgFor, NgIf, NgClass } from '@angular/common';

import { AccessService, AccessRecord, AccessFilters } from '../services/access.service';
import { AlertService } from '../services/alert.service';

addIcons({
  closeCircleOutline, calendarOutline, documentOutline, checkmarkCircle,
  closeCircle, cardOutline, phonePortraitOutline, searchOutline,
  refreshOutline, search, chevronDownOutline, fingerPrintOutline, readerOutline,
  alertCircle //
});

@Component({
  selector: 'app-historial',
  templateUrl: 'historial.page.html',
  styleUrls: ['historial.page.scss'],
  imports: [
    IonHeader, IonTitle, IonContent, IonList, IonItem, IonLabel,
    IonBadge, IonIcon, IonRefresher, IonRefresherContent, IonSearchbar,
    IonSelect, IonSelectOption, IonDatetimeButton, IonModal, IonDatetime,
    IonButton, IonInfiniteScroll,
    IonInfiniteScrollContent,
    DatePipe, NgFor, NgIf,
    NgClass //
  ],
  standalone: true
})
export class HistorialPage implements OnInit, ViewWillEnter {
  // Data
  accessRecords: AccessRecord[] = [];

  // Filtros
  filters: AccessFilters = {};
  searchTerm: string = '';

  // Paginación
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
  ) {
    // 1. INICIALIZACIÓN: Configurar fecha de HOY por defecto
    this.setTodayAsDefault();
  }

  ngOnInit() {}

  ionViewWillEnter() {
    this.loadAccessRecords(true);
  }

  // ==================== LÓGICA DE FECHA INICIAL ====================
  private setTodayAsDefault() {
    const today = new Date();
    this.selectedDate = today.toISOString();
    this.updateDateFiltersInternal(today);
  }

  // ==================== CARGAR REGISTROS ====================
  loadAccessRecords(refresh: boolean = false) {
    if (refresh) {
      this.currentPage = 1;
      this.accessRecords = [];
    }

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

    this.accessService.getAccessHistory(filters).subscribe({
      next: (response) => {
        if (refresh) {
          this.accessRecords = response.records;
        } else {
          this.accessRecords = [...this.accessRecords, ...response.records];
        }
        this.totalPages = response.totalPages;
        this.totalRecords = response.total;
        this.hasNextPage = response.hasNextPage;
        this.hasPrevPage = response.hasPrevPage;
        this.currentPage = response.page;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error fetching records:', error);
        this.errorMessage = this.getErrorMessage(error);
        // Opcional: Si quieres mostrar el error en toast también
        // this.alertService.showError('Error', this.errorMessage);
        this.isLoading = false;
      }
    });
  }

  // ==================== ACCIONES ====================
  onConsultarButton() {
    this.loadAccessRecords(true);
  }

  handleDateFilter(event: any) {
    this.selectedDate = event.detail.value;
    if (this.selectedDate) {
      this.updateDateFiltersInternal(new Date(this.selectedDate));
    } else {
      this.filters.startDate = undefined;
      this.filters.endDate = undefined;
    }
  }

  handleTypeFilter(event: any) {
    const type = event.detail.value;
    this.filters = {
      ...this.filters,
      type: (!type || type === 'Todos' || type === '') ? undefined : type
    };
  }

  // Helper privado para lógica de fechas
  private updateDateFiltersInternal(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    this.filters = {
      ...this.filters,
      startDate: startOfDay,
      endDate: endOfDay
    };
  }

  // ==================== EVENTOS UI ====================

  async doRefresh(event: any) {
    await this.loadAccessRecords(true);
    event.target.complete();
  }

  handleSearch(event: any) {
    this.searchTerm = event.detail.value?.trim() || '';
    this.loadAccessRecords(true);
  }

  async loadMore(event: any) {
    if (this.isLoading || !this.hasNextPage) {
      event.target.complete();
      return;
    }
    this.currentPage++;
    await this.loadAccessRecords(false);
    event.target.complete();
  }

  clearFilters() {
    this.filters = { type: undefined };
    this.searchTerm = '';
    this.setTodayAsDefault();
    this.loadAccessRecords(true);
  }

  // ==================== UI HELPERS ====================

  hasActiveFilters(): boolean {
    return !!(this.filters.startDate || this.filters.endDate || this.filters.type);
  }

  getAccessIcon(record: AccessRecord): string {
    return record.accessType === 'REMOTE' ? 'phone-portrait-outline' : 'card-outline';
  }

  getAccessColor(record: AccessRecord): string {
    return record.isAuthorized ? 'success' : 'danger';
  }

  getAccessBadgeText(record: AccessRecord): string {
    return record.accessType === 'REMOTE' ? 'App' : 'Tarjeta';
  }

  private getErrorMessage(error: any): string {
    if (error.status === 0) return 'Sin conexión con el servidor';
    if (error.status === 401) return 'Tu sesión ha expirado';
    return 'Error al obtener datos';
  }

  trackByRecordId(index: number, record: AccessRecord): number {
    return record.id;
  }
}
