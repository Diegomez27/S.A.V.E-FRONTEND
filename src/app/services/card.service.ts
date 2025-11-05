import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Api } from './api.service';

// Interfaces para las tarjetas
export interface Card {
  id: number;
  uid: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCardRequest {
  uid: string;
  name: string;
}

export interface CreateCardResponse {
  message: string;
  card: Card;
}

export interface DeleteCardResponse {
  message: string;
}

// Interface para la respuesta del backend
interface CardResponse {
  id: number;
  uid: string;
  name: string;
  isEnabled: boolean;  // El backend usa isEnabled, no isActive
  createdAt: string;
  // updatedAt no está presente en la respuesta del backend
}

@Injectable({
  providedIn: 'root'
})
export class CardService {
  private readonly CACHE_KEY = 'cards_cache';
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutos

  constructor(private api: Api) { }

  // Obtener todas las tarjetas
  getCards(useCache: boolean = true): Observable<Card[]> {
    // Verificar caché primero si está habilitado
    if (useCache) {
      const cachedCards = this.getCachedCards();
      if (cachedCards) {
        return of(cachedCards);
      }
    }

    return this.api.get('/cards').pipe(
      map((response: CardResponse[]) => {
        if (!Array.isArray(response)) {
          console.error('Unexpected response format for cards:', response);
          return [];
        }

        const cards = this.transformCards(response);
        this.cacheCards(cards);
        return cards;
      }),
      catchError(error => {
        console.error('Error fetching cards:', error);
        // Si hay error de red, intentar usar caché
        const cachedCards = this.getCachedCards();
        if (cachedCards && error.status === 0) {
          console.log('Using cached cards due to network error');
          return of(cachedCards);
        }
        return of([]);
      })
    );
  }

  // Crear nueva tarjeta
  createCard(cardData: CreateCardRequest): Observable<CreateCardResponse> {
    return this.api.post('/cards', cardData).pipe(
      map((response: any) => {
        // Limpiar caché al agregar nueva tarjeta
        this.clearCache();

        // El backend devuelve directamente la tarjeta
        const transformedCard = this.transformCard(response);

        return {
          message: 'Tarjeta creada correctamente',
          card: transformedCard
        };
      }),
      catchError(error => {
        console.error('Error creating card:', error);
        throw error;
      })
    );
  }

  // Eliminar tarjeta
  deleteCard(cardId: number): Observable<DeleteCardResponse> {
    return this.api.delete(`/cards/${cardId}`).pipe(
      map((response: any) => {
        // Limpiar caché al eliminar tarjeta
        this.clearCache();
        return {
          message: response.message || 'Tarjeta eliminada correctamente'
        };
      }),
      catchError(error => {
        console.error('Error deleting card:', error);
        throw error;
      })
    );
  }

  // Actualizar tarjeta (opcional para futuras funcionalidades)
  updateCard(cardId: number, cardData: Partial<CreateCardRequest>): Observable<Card> {
    return this.api.put(`/cards/${cardId}`, cardData).pipe(
      map((response: CardResponse) => {
        this.clearCache();
        return this.transformCard(response);
      }),
      catchError(error => {
        console.error('Error updating card:', error);
        throw error;
      })
    );
  }

  // Verificar si un UID ya está registrado
  isUidRegistered(uid: string): Observable<boolean> {
    return this.getCards().pipe(
      map(cards => cards.some(card => card.uid.toLowerCase() === uid.toLowerCase()))
    );
  }

  // Métodos privados para transformación y caché
  private transformCards(cardsResponse: CardResponse[]): Card[] {
    return cardsResponse.map(card => this.transformCard(card));
  }

  private transformCard(cardResponse: CardResponse): Card {
    if (!cardResponse) {
      throw new Error('Card response is null or undefined');
    }

    return {
      id: cardResponse.id,
      uid: cardResponse.uid,
      name: cardResponse.name,
      isActive: cardResponse.isEnabled, // Backend usa isEnabled
      createdAt: new Date(cardResponse.createdAt),
      updatedAt: new Date(cardResponse.createdAt) // Backend no tiene updatedAt, usar createdAt
    };
  }

  private getCachedCards(): Card[] | null {
    const cached = localStorage.getItem(this.CACHE_KEY);
    if (!cached) return null;

    try {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > this.CACHE_DURATION) {
        localStorage.removeItem(this.CACHE_KEY);
        return null;
      }

      // Convertir strings de fecha de vuelta a Date objects
      return data.map((card: any) => ({
        ...card,
        createdAt: new Date(card.createdAt),
        updatedAt: new Date(card.updatedAt)
      }));
    } catch (error) {
      console.error('Error parsing cached cards:', error);
      localStorage.removeItem(this.CACHE_KEY);
      return null;
    }
  }

  private cacheCards(cards: Card[]): void {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify({
        data: cards,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error caching cards:', error);
    }
  }

  private clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY);
  }
}
