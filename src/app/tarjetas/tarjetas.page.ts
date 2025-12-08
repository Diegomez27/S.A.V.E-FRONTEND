import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem,
  IonLabel, IonButton, IonIcon, IonRefresher, IonRefresherContent,
  IonFab, IonFabButton, IonSpinner, IonText, IonModal, IonInput,
  IonButtons, IonBadge, IonItemSliding, IonItemOptions, IonItemOption,
  IonSegment, IonSegmentButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add, close, copy, checkmarkCircle, closeCircle,
  cardOutline, trashBinOutline, fingerPrintOutline, layersOutline,
  scanOutline, trashOutline, arrowUndoOutline, closeCircleOutline
} from 'ionicons/icons';

import { CardService, Card, CreateCardRequest } from '../services/card.service';
import { NfcService } from '../services/nfc.service';
import { AuthService } from '../services/auth.service';
import { AlertService } from '../services/alert.service';

@Component({
  selector: 'app-tarjetas',
  templateUrl: 'tarjetas.page.html',
  styleUrls: ['tarjetas.page.scss'],
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonList, IonItem,
    IonLabel, IonButton, IonIcon, IonRefresher, IonRefresherContent,
    IonFab, IonFabButton, IonSpinner, IonText, IonModal, IonInput,
    IonButtons, IonBadge, IonItemSliding, IonItemOptions, IonItemOption,
    IonSegment, IonSegmentButton, CommonModule, FormsModule
  ]
})
export class TarjetasPage implements OnInit {
  activeCards: Card[] = [];
  deletedCards: Card[] = [];
  currentView: 'active' | 'deleted' = 'active';
  isLoading = false;
  isNfcScanning = false;
  isAddingCard = false;
  isModalOpen = false;
  newCardName = '';
  newCardUid = '';
  uidValid = false;
  uidError = '';
  isNfcModalOpen = false;
  readUid = '';
  nfcAvailable = false;
  errorMessage = '';
  isAdmin: boolean = false;

  constructor(
    private cardService: CardService,
    private nfcService: NfcService,
    private alertService: AlertService,
    private authService: AuthService
  ) {
    addIcons({
      add, close, copy, checkmarkCircle, closeCircle,
      cardOutline, trashBinOutline, fingerPrintOutline, layersOutline,
      scanOutline, trashOutline, arrowUndoOutline, closeCircleOutline
    });

    this.checkNfcAvailability();
    this.isAdmin = this.authService.isAdmin();
  }

  ngOnInit() {
    this.isAdmin = this.authService.isAdmin();
    this.loadCards();
  }

  async checkNfcAvailability() {
    try {
      this.nfcAvailable = await this.nfcService.isAvailable();
    } catch (error) {
      console.error('Error checking NFC availability:', error);
      this.nfcAvailable = false;
    }
  }

  loadCards(refresh = false) {
    if (this.currentView === 'active') {
      this.loadActiveCards(refresh);
    } else {
      this.loadDeletedCards(refresh);
    }
  }

  loadActiveCards(refresh = false) {
    this.isLoading = true;
    this.errorMessage = '';
    this.cardService.getCards(!refresh).subscribe({
      next: (cards) => {
        this.activeCards = cards;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar las tarjetas';
        this.isLoading = false;
        this.alertService.showError('Error de carga', 'No se pudieron cargar las tarjetas');
      }
    });
  }

  loadDeletedCards(refresh = false) {
    this.isLoading = true;
    this.errorMessage = '';
    this.cardService.getDeletedCards().subscribe({
      next: (cards) => {
        this.deletedCards = cards;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar tarjetas eliminadas';
        this.isLoading = false;
        this.alertService.showError('Error de carga', 'No se pudieron cargar las tarjetas eliminadas');
      }
    });
  }

  onViewChange(event: any) {
    this.currentView = event.detail.value;
    this.loadCards();
  }

  get currentCards(): Card[] {
    return this.currentView === 'active' ? this.activeCards : this.deletedCards;
  }

  async doRefresh(event: any) {
    await this.loadCards(true);
    event.target.complete();
  }

  isValidUid(uid: string): boolean {
    const trimmed = uid.trim();
    return trimmed.length >= 1 && trimmed.length <= 50;
  }

  validateUidInput(event: any) {
    const input = event.target.value || '';
    this.newCardUid = input.trim();
    if (this.newCardUid.length === 0) {
      this.uidValid = false;
      this.uidError = '';
    } else if (this.newCardUid.length > 50) {
      this.uidValid = false;
      this.uidError = 'Máximo 50 caracteres';
      this.newCardUid = this.newCardUid.substring(0, 50);
    } else {
      this.uidValid = true;
      this.uidError = '';
    }
  }

  async readNfcUid() {
    if (!this.nfcAvailable) {
      this.alertService.showToast('NFC no está disponible en este dispositivo', 'warning');
      return;
    }
    this.isNfcScanning = true;
    this.errorMessage = '';
    this.readUid = '';
    try {
      const uid = await this.nfcService.readTag();
      if (uid) {
        this.readUid = uid;
        this.isNfcModalOpen = true;
        this.alertService.showToast('UID leído correctamente', 'success');
      } else {
        this.alertService.showError('Error NFC', 'No se pudo leer la tarjeta');
      }
    } catch (error) {
      this.errorMessage = 'Error al escanear NFC';
      this.alertService.showError('Error NFC', 'No se pudo escanear la tarjeta');
    } finally {
      this.isNfcScanning = false;
    }
  }

  openAddCardModal(prefilledUid?: string) {
    this.newCardName = '';
    this.newCardUid = prefilledUid || '';
    if (prefilledUid) {
      this.uidValid = this.isValidUid(prefilledUid);
      this.uidError = this.uidValid ? '' : 'UID inválido';
    } else {
      this.uidValid = false;
      this.uidError = '';
    }
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.newCardName = '';
    this.newCardUid = '';
    this.uidValid = false;
    this.uidError = '';
  }

  closeNfcModal() {
    this.isNfcModalOpen = false;
    this.readUid = '';
  }

  async saveCard() {
    if (!this.isAdmin) {
      this.alertService.showError('Acceso denegado', 'No tienes permisos para crear tarjetas');
      return;
    }
    if (!this.newCardName.trim() || !this.newCardUid.trim() || !this.uidValid) {
      this.alertService.showToast('Verifica los datos', 'warning');
      return;
    }
    this.isAddingCard = true;
    const cardData: CreateCardRequest = {
      uid: this.newCardUid.trim(),
      name: this.newCardName.trim()
    };
    this.cardService.createCard(cardData).subscribe({
      next: async (response) => {
        await this.alertService.showSuccess('Tarjeta agregada correctamente');
        this.loadActiveCards(true);
        this.closeModal();
        this.isAddingCard = false;
      },
      error: (error) => {
        let errorMessage = 'Error al agregar la tarjeta';
        if (error.status === 409) errorMessage = 'Esta tarjeta ya está registrada';
        else if (error.status === 400) errorMessage = error.error?.message || 'Datos inválidos';
        else if (error.status === 0) errorMessage = 'No se puede conectar al servidor';
        this.alertService.showError('Error', errorMessage);
        this.isAddingCard = false;
      }
    });
  }

  async deleteCard(card: Card) {
    if (!this.isAdmin) {
      this.alertService.showError('Acceso denegado', 'No tienes permisos');
      return;
    }
    const confirmed = await this.alertService.showConfirmation('¿Eliminar tarjeta?', `¿Estás seguro de eliminar "${card.name}"?`, 'SÍ, ELIMINAR', 'Cancelar');
    if (confirmed) this.confirmDeleteCard(card.id);
  }

  confirmDeleteCard(cardId: number) {
    this.cardService.deleteCard(cardId).subscribe({
      next: () => {
        this.alertService.showSuccess('Tarjeta movida a papelera');
        this.loadActiveCards(true);
      },
      error: () => this.alertService.showError('Error', 'No se pudo eliminar la tarjeta')
    });
  }

  async restoreCard(card: Card) {
    const confirmed = await this.alertService.showConfirmation('¿Restaurar tarjeta?', `¿Restaurar "${card.name}"?`, 'SÍ, RESTAURAR', 'Cancelar');
    if (confirmed) this.confirmRestoreCard(card.id);
  }

  confirmRestoreCard(cardId: number) {
    if (!this.isAdmin) {
      this.alertService.showError('Acceso denegado', 'No tienes permisos');
      return;
    }
    this.cardService.restoreCard(cardId).subscribe({
      next: () => {
        this.alertService.showSuccess('Tarjeta restaurada');
        this.loadDeletedCards(true);
      },
      error: () => this.alertService.showError('Error', 'No se pudo restaurar la tarjeta')
    });
  }

  async permanentDeleteCard(card: Card) {
    const confirmed = await this.alertService.showConfirmation('Eliminar para siempre', `Esta acción no se puede deshacer.\n\n¿Eliminar "${card.name}"?`, 'ELIMINAR DEFINITIVAMENTE', 'Cancelar');
    if (confirmed) this.confirmPermanentDelete(card.id);
  }

  confirmPermanentDelete(cardId: number) {
    if (!this.isAdmin) {
      this.alertService.showError('Acceso denegado', 'No tienes permisos');
      return;
    }
    this.cardService.permanentDeleteCard(cardId).subscribe({
      next: () => {
        this.alertService.showSuccess('Eliminada permanentemente');
        this.loadDeletedCards(true);
      },
      error: () => this.alertService.showError('Error', 'No se pudo eliminar')
    });
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
  }

  trackByCardId(index: number, card: Card): number {
    return card.id;
  }
}
