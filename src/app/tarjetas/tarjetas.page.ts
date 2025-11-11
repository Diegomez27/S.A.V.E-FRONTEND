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
  IonSegmentButton,
  AlertController,
  ToastController
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
  alertCircle
} from 'ionicons/icons';
import { CardService, Card, CreateCardRequest } from '../services/card.service';
import { NfcService } from '../services/nfc.service';

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

  // Modal para agregar tarjeta
  isModalOpen = false;
  newCardName = '';
  scannedUid = '';
  uidValid = false;
  uidError = '';

  // Estados
  nfcAvailable = false;
  errorMessage = '';

  constructor(
    private cardService: CardService,
    private nfcService: NfcService,
    private alertController: AlertController,
    private toastController: ToastController
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
      alertCircle
    });

    this.nfcAvailable = this.nfcService.isAvailable;
  }

  ngOnInit() {
    this.loadCards();
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
        this.showToast('Error al cargar las tarjetas', 'danger');
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
        this.showToast('Error al cargar tarjetas eliminadas', 'danger');
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
    this.scannedUid = input.trim();

    // Validar
    if (this.scannedUid.length === 0) {
      this.uidValid = false;
      this.uidError = '';
    } else if (this.scannedUid.length > 50) {
      this.uidValid = false;
      this.uidError = 'Máximo 50 caracteres';
      this.scannedUid = this.scannedUid.substring(0, 50);
    } else {
      this.uidValid = true;
      this.uidError = '';
    }
  }

  // Escanear tarjeta NFC
  async scanNfcCard() {
    if (!this.nfcAvailable) {
      this.showToast('NFC no está disponible en este dispositivo', 'warning');
      return;
    }

    this.isNfcScanning = true;
    this.errorMessage = '';

    try {
      const uid = await this.nfcService.readTag();

      if (uid) {
        // Verificar si la tarjeta ya está registrada
        this.cardService.isUidRegistered(uid).subscribe({
          next: (isRegistered) => {
            if (isRegistered) {
              this.showToast('Esta tarjeta ya está registrada', 'warning');
            } else {
              this.scannedUid = uid;
              this.openAddCardModal();
            }
            this.isNfcScanning = false;
          },
          error: (error) => {
            console.error('Error checking UID:', error);
            this.isNfcScanning = false;
            this.showToast('Error al verificar la tarjeta', 'danger');
          }
        });
      } else {
        this.isNfcScanning = false;
        this.showToast('No se pudo leer la tarjeta NFC', 'danger');
      }
    } catch (error) {
      this.isNfcScanning = false;
      this.errorMessage = 'Error al escanear NFC';
      this.showToast('Error al escanear la tarjeta NFC', 'danger');
    }
  }

  // Agregar tarjeta manualmente (para testing)
  async addManualCard() {
    const alert = await this.alertController.create({
      header: 'Agregar Tarjeta Manual',
      message: 'Para pruebas solamente',
      inputs: [
        {
          name: 'uid',
          type: 'text',
          placeholder: 'UID (Ej: A3B4C5D6, 1124, CARD-001)'
        },
        {
          name: 'name',
          type: 'text',
          placeholder: 'Nombre de la tarjeta'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Agregar',
          handler: (data) => {
            if (data.uid && data.name) {
              this.scannedUid = data.uid.trim();
              this.newCardName = data.name;

              // Validar antes de guardar
              if (this.isValidUid(this.scannedUid)) {
                this.uidValid = true;
                this.saveCard();
              } else {
                this.showToast('UID inválido. Debe tener entre 1 y 50 caracteres', 'warning');
              }
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Abrir modal para agregar tarjeta
  openAddCardModal() {
    this.newCardName = '';
    this.isModalOpen = true;
  }

  // Cerrar modal
  closeModal() {
    this.isModalOpen = false;
    this.newCardName = '';
    this.scannedUid = '';
  }

  // Guardar nueva tarjeta
  saveCard() {
    if (!this.newCardName.trim()) {
      this.showToast('Por favor ingresa un nombre', 'warning');
      return;
    }

    if (!this.scannedUid) {
      this.showToast('Por favor ingresa el UID', 'warning');
      return;
    }

    if (!this.uidValid) {
      this.showToast('UID inválido. Debe tener entre 1 y 50 caracteres', 'warning');
      return;
    }

    this.isAddingCard = true;

    const cardData: CreateCardRequest = {
      uid: this.scannedUid,
      name: this.newCardName.trim()
    };

    this.cardService.createCard(cardData).subscribe({
      next: (response) => {
        console.log('Card created successfully:', response);
        this.showToast('Tarjeta agregada correctamente', 'success');
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

        this.showToast(errorMessage, 'danger');
        this.isAddingCard = false;
      }
    });
  }

  // Eliminar tarjeta
  async deleteCard(card: Card) {
    const alert = await this.alertController.create({
      header: 'Eliminar Tarjeta',
      message: `¿Estás seguro de eliminar la tarjeta "${card.name}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.confirmDeleteCard(card.id);
          }
        }
      ]
    });

    await alert.present();
  }

  // Confirmar eliminación
  confirmDeleteCard(cardId: number) {
    this.cardService.deleteCard(cardId).subscribe({
      next: (response) => {
        this.showToast('Tarjeta movida a papelera', 'success');
        this.loadActiveCards(true); // Recargar lista activas
      },
      error: (error) => {
        console.error('Error deleting card:', error);
        this.showToast('Error al eliminar la tarjeta', 'danger');
      }
    });
  }

  // ==================== RESTAURAR TARJETA ====================
  async restoreCard(card: Card) {
    const alert = await this.alertController.create({
      header: 'Restaurar Tarjeta',
      message: `¿Restaurar la tarjeta "${card.name}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Restaurar',
          handler: () => {
            this.confirmRestoreCard(card.id);
          }
        }
      ]
    });

    await alert.present();
  }

  confirmRestoreCard(cardId: number) {
    this.cardService.restoreCard(cardId).subscribe({
      next: (response) => {
        this.showToast('Tarjeta restaurada correctamente', 'success');
        this.loadDeletedCards(true); // Recargar papelera
        this.loadActiveCards(true); // Recargar activas
      },
      error: (error) => {
        console.error('Error restoring card:', error);
        this.showToast('Error al restaurar la tarjeta', 'danger');
      }
    });
  }

  // ==================== ELIMINAR PERMANENTEMENTE ====================
  async permanentDeleteCard(card: Card) {
    const alert = await this.alertController.create({
      header: '⚠️ Eliminar Permanentemente',
      message: `Esta acción NO SE PUEDE DESHACER.\n\n¿Eliminar "${card.name}" para siempre?`,
      cssClass: 'danger-alert',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'ELIMINAR',
          role: 'destructive',
          handler: () => {
            this.confirmPermanentDelete(card.id);
          }
        }
      ]
    });

    await alert.present();
  }

  confirmPermanentDelete(cardId: number) {
    this.cardService.permanentDeleteCard(cardId).subscribe({
      next: (response) => {
        this.showToast('Tarjeta eliminada permanentemente', 'warning');
        this.loadDeletedCards(true); // Recargar papelera
      },
      error: (error) => {
        console.error('Error permanently deleting card:', error);
        this.showToast('Error al eliminar permanentemente', 'danger');
      }
    });
  }

  // Mostrar toast
  async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'bottom'
    });
    toast.present();
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
