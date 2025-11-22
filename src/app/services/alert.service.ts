import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon } from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  // Toast minimalista (esquina superior derecha)
  showToast(title: string, icon: SweetAlertIcon = 'success') {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      backdrop: false,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });

    return Toast.fire({
      icon: icon,
      title: title
    });
  }

  // Alerta simple
  showAlert(title: string, text: string, icon: SweetAlertIcon = 'info') {
    return Swal.fire({
      title: title,
      text: text,
      icon: icon,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#3880ff',
      heightAuto: false,
      backdrop: true
    });
  }

  // Confirmación con botones
  async showConfirmation(
    title: string,
    text: string,
    confirmText: string = 'Sí',
    cancelText: string = 'Cancelar'
  ) {
    const result = await Swal.fire({
      title: title,
      text: text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3880ff',
      cancelButtonColor: '#d33',
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      heightAuto: false,
      backdrop: true
    });

    return result.isConfirmed;
  }

  // Éxito con auto-cierre
  showSuccess(title: string, timer: number = 2000) {
    return Swal.fire({
      icon: 'success',
      title: title,
      showConfirmButton: false,
      timer: timer,
      heightAuto: false,
      backdrop: true
    });
  }

  // Error
  showError(title: string, text?: string) {
    return Swal.fire({
      icon: 'error',
      title: title,
      text: text,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#3880ff',
      heightAuto: false,
      backdrop: true
    });
  }

  // Loading (para operaciones largas)
  showLoading(title: string = 'Cargando...') {
    Swal.fire({
      title: title,
      allowOutsideClick: false,
      heightAuto: false,
      backdrop: true,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  // Cerrar cualquier alerta
  close() {
    Swal.close();
  }
}
