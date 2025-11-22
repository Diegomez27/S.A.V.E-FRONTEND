import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonRefresher,
  IonRefresherContent,
  IonFab,
  IonFabButton,
  IonSpinner,
  IonText,
  IonModal,
  IonInput,
  IonButtons,
  IonBadge,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonSegment,
  IonSegmentButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add,
  phonePortrait,
  trash,
  card,
  checkmarkCircle,
  closeCircle,
  refresh,
  close,
  arrowUndo,
  trashBin,
  alertCircle,
  copy,
  informationCircle
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
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonRefresher,
    IonRefresherContent,
    IonFab,
    IonFabButton,
    IonSpinner,
    IonText,
    IonModal,
    IonInput,
    IonButtons,
    IonBadge,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonSegment,
    IonSegmentButton,
    CommonModule,
    FormsModule
  ]
})
export class TarjetasPage implements OnInit {
  // Listas de tarjetas
  activeCards: Card[] = [];
  deletedCards: Card[] = [];

  // Vista actual
  currentView: 'active' | 'deleted' = 'active';

  // Estados
  isLoading = false;
  isNfcScanning = false;
  isAddingCard = false;

  // Modal para agregar tarjeta manualmente
  isModalOpen = false;
  newCardName = '';
  newCardUid = '';
  uidValid = false;
  uidError = '';

  // Modal para mostrar UID leído
  isNfcModalOpen = false;
  readUid = '';

  // Estados
  nfcAvailable = false;
  errorMessage = '';

  isAdmin: boolean = false;

  constructor(
    private cardService: CardService,
    private nfcService: NfcService,
    private alertService: AlertService,
    private authService: AuthService
  ) {
    // Registrar iconos
    addIcons({
      add,
      phonePortrait,
      trash,
      card,
      checkmarkCircle,
      closeCircle,
      refresh,
      close,
      arrowUndo,
      trashBin,
      alertCircle,
      copy,
      informationCircle
    });

    this.checkNfcAvailability();
    this.isAdmin = this.authService.isAdmin();
  }

  ngOnInit() {
    this.isAdmin = this.authService.isAdmin();
    this.loadCards();
  }

  // Verificar disponibilidad de NFC
  async checkNfcAvailability() {
    try {
      this.nfcAvailable = await this.nfcService.isAvailable();
    } catch (error) {
      console.error('Error checking NFC availability:', error);
      this.nfcAvailable = false;
    }
  }

  // ==================== CARGAR TARJETAS ====================
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
        console.error('Error loading cards:', error);
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
        console.error('Error loading deleted cards:', error);
        this.errorMessage = 'Error al cargar tarjetas eliminadas';
        this.isLoading = false;
        this.alertService.showError('Error de carga', 'No se pudieron cargar las tarjetas eliminadas');
      }
    });
  }

  // ==================== CAMBIO DE VISTA ====================
  onViewChange(event: any) {
    this.currentView = event.detail.value;
    this.loadCards();
  }

  get currentCards(): Card[] {
    return this.currentView === 'active' ? this.activeCards : this.deletedCards;
  }

  // Refrescar tarjetas
  async doRefresh(event: any) {
    await this.loadCards(true);
    event.target.complete();
  }

  // ==================== VALIDACIÓN DE UID ====================
  isValidUid(uid: string): boolean {
    // Cualquier caracter, longitud 1-50
    const trimmed = uid.trim();
    return trimmed.length >= 1 && trimmed.length <= 50;
  }

  validateUidInput(event: any) {
    const input = event.target.value || '';
    // Trim y limitar longitud
    this.newCardUid = input.trim();

    // Validar
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

  // Leer UID de tarjeta NFC (solo mostrar)
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

  // Abrir modal para agregar tarjeta manualmente
  openAddCardModal(prefilledUid?: string) {
    this.newCardName = '';
    this.newCardUid = prefilledUid || '';

    // Validar el UID prellenado si existe
    if (prefilledUid) {
      this.uidValid = this.isValidUid(prefilledUid);
      this.uidError = this.uidValid ? '' : 'UID inválido';
    } else {
      this.uidValid = false;
      this.uidError = '';
    }

    this.isModalOpen = true;
  }



  // Cerrar modal de agregar tarjeta
  closeModal() {
    this.isModalOpen = false;
    this.newCardName = '';
    this.newCardUid = '';
    this.uidValid = false;
    this.uidError = '';
  }

  // Cerrar modal NFC
  closeNfcModal() {
    this.isNfcModalOpen = false;
    this.readUid = '';
  }

  // Copiar UID al portapapeles
  async copyUid(uid: string) {
    try {
      await navigator.clipboard.writeText(uid);
      this.alertService.showToast('UID copiado al portapapeles', 'success');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      this.alertService.showToast('No se pudo copiar el UID', 'warning');
    }
  }

  // Guardar nueva tarjeta
  async saveCard() {
    if (!this.isAdmin) {
      this.alertService.showError('Acceso denegado', 'No tienes permisos para crear tarjetas');
      return;
    }

    if (!this.newCardName.trim()) {
      this.alertService.showToast('Por favor ingresa un nombre', 'warning');
      return;
    }

    if (!this.newCardUid.trim()) {
      this.alertService.showToast('Por favor ingresa el UID', 'warning');
      return;
    }

    if (!this.uidValid) {
      this.alertService.showToast('UID inválido. Debe tener entre 1 y 50 caracteres', 'warning');
      return;
    }

    this.isAddingCard = true;

    const cardData: CreateCardRequest = {
      uid: this.newCardUid.trim(),
      name: this.newCardName.trim()
    };

    this.cardService.createCard(cardData).subscribe({
      next: async (response) => {
        console.log('Card created successfully:', response);
        await this.alertService.showSuccess('Tarjeta agregada correctamente');
        this.loadActiveCards(true); // Recargar lista
        this.closeModal();
        this.isAddingCard = false;
      },
      error: (error) => {
        console.error('Error creating card:', error);

        let errorMessage = 'Error al agregar la tarjeta';

        if (error.status === 409) {
          errorMessage = 'Esta tarjeta ya está registrada (puede estar en papelera)';
        } else if (error.status === 400) {
          const msg = error.error?.message;
          if (Array.isArray(msg)) {
            errorMessage = msg.join(', ');
          } else if (msg) {
            errorMessage = msg;
          } else {
            errorMessage = 'UID inválido';
          }
        } else if (error.status === 0) {
          errorMessage = 'No se puede conectar al servidor';
        }

        this.alertService.showError('Error al crear tarjeta', errorMessage);
        this.isAddingCard = false;
      }
    });
  }

  // Eliminar tarjeta
  async deleteCard(card: Card) {
    if (!this.isAdmin) {
      this.alertService.showError('Acceso denegado', 'No tienes permisos para eliminar tarjetas');
      return;
    }

    const confirmed = await this.alertService.showConfirmation(
      '¿Eliminar tarjeta?',
      `¿Estás seguro de eliminar "${card.name}"?`,
      'Sí, eliminar',
      'Cancelar'
    );

    if (confirmed) {
      this.confirmDeleteCard(card.id);
    }
  }

  // Confirmar eliminación
  confirmDeleteCard(cardId: number) {
    if (!this.isAdmin) {
      this.alertService.showError('Acceso denegado', 'No tienes permisos para eliminar tarjetas');
      return;
    }

    this.cardService.deleteCard(cardId).subscribe({
      next: (response) => {
        this.alertService.showSuccess('Tarjeta movida a papelera');
        this.loadActiveCards(true); // Recargar lista activas
      },
      error: (error) => {
        console.error('Error deleting card:', error);
        this.alertService.showError('Error', 'No se pudo eliminar la tarjeta');
      }
    });
  }

  // ==================== RESTAURAR TARJETA ====================
  async restoreCard(card: Card) {
    const confirmed = await this.alertService.showConfirmation(
      '¿Restaurar tarjeta?',
      `¿Restaurar "${card.name}"?`,
      'Sí, restaurar',
      'Cancelar'
    );

    if (confirmed) {
      this.confirmRestoreCard(card.id);
    }
  }

  confirmRestoreCard(cardId: number) {
    if (!this.isAdmin) {
      this.alertService.showError('Acceso denegado', 'No tienes permisos para restaurar tarjetas');
      return;
    }

    this.cardService.restoreCard(cardId).subscribe({
      next: (response) => {
        this.alertService.showSuccess('Tarjeta restaurada correctamente');
        this.loadDeletedCards(true); // Recargar papelera
        this.loadActiveCards(true); // Recargar activas
      },
      error: (error) => {
        console.error('Error restoring card:', error);
        this.alertService.showError('Error', 'No se pudo restaurar la tarjeta');
      }
    });
  }

  // ==================== ELIMINAR PERMANENTEMENTE ====================
  async permanentDeleteCard(card: Card) {
    const confirmed = await this.alertService.showConfirmation(
      'Eliminar permanentemente',
      `Esta acción no se puede deshacer.\n\n¿Eliminar "${card.name}"?`,
      'SÍ, ELIMINAR',
      'Cancelar'
    );

    if (confirmed) {
      this.confirmPermanentDelete(card.id);
    }
  }

  confirmPermanentDelete(cardId: number) {
    if (!this.isAdmin) {
      this.alertService.showError('Acceso denegado', 'No tienes permisos para eliminar tarjetas');
      return;
    }

    this.cardService.permanentDeleteCard(cardId).subscribe({
      next: (response) => {
        this.alertService.showSuccess('Tarjeta eliminada permanentemente');
        this.loadDeletedCards(true); // Recargar papelera
      },
      error: (error) => {
        console.error('Error permanently deleting card:', error);
        this.alertService.showError('Error', 'No se pudo eliminar permanentemente');
      }
    });
  }

  // Formatear fecha
  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  // TrackBy para optimizar el *ngFor
  trackByCardId(index: number, card: Card): number {
    return card.id;
  }
}
