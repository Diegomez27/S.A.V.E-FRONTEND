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
  close
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
    CommonModule,
    FormsModule
  ]
})
export class TarjetasPage implements OnInit {
  cards: Card[] = [];
  isLoading = false;
  isNfcScanning = false;
  isAddingCard = false;

  // Modal para agregar tarjeta
  isModalOpen = false;
  newCardName = '';
  scannedUid = '';

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
      close
    });

    this.nfcAvailable = this.nfcService.isAvailable;
  }

  ngOnInit() {
    this.loadCards();
  }

  // Cargar tarjetas
  loadCards(refresh = false) {
    this.isLoading = true;
    this.errorMessage = '';

    this.cardService.getCards(!refresh).subscribe({
      next: (cards) => {
        this.cards = cards;
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

  // Refrescar tarjetas
  async doRefresh(event: any) {
    await this.loadCards(true);
    event.target.complete();
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
          placeholder: 'UID de la tarjeta (ej: 1A2B3C4D)'
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
              this.scannedUid = data.uid;
              this.newCardName = data.name;
              this.saveCard();
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
    if (!this.newCardName.trim() || !this.scannedUid) {
      this.showToast('Por favor completa todos los campos', 'warning');
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
        this.loadCards(true); // Recargar lista
        this.closeModal();
        this.isAddingCard = false;
      },
      error: (error) => {
        console.error('Error creating card:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error
        });

        let errorMessage = 'Error al agregar la tarjeta';

        if (error.status === 409) {
          errorMessage = 'Esta tarjeta ya está registrada';
        } else if (error.status === 400) {
          errorMessage = 'Datos de tarjeta inválidos';
        } else if (error.status === 0) {
          errorMessage = 'No se puede conectar al servidor';
        } else if (error.message && error.message.includes('Cannot read properties')) {
          errorMessage = 'Error en el formato de respuesta del servidor';
          // Si el error es de formato pero la tarjeta se creó, recargar la lista
          this.loadCards(true);
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
        this.showToast('Tarjeta eliminada correctamente', 'success');
        this.loadCards(true); // Recargar lista
      },
      error: (error) => {
        console.error('Error deleting card:', error);
        this.showToast('Error al eliminar la tarjeta', 'danger');
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
