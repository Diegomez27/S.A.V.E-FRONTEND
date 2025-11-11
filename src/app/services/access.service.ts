import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Api } from './api.service';
import {
  AccessHistoryResponse,
  AccessRecordBackend,
  RemoteOpenResponse
} from './dto/backend.dto';

// Interfaz que usamos en el frontend
export interface AccessRecord {
  id: number;
  cardId: string;
  cardName: string;
  accessType: string;
  timestamp: Date;
  isAuthorized: boolean;
}

export interface AccessFilters {
  startDate?: Date;
  endDate?: Date;
  type?: 'REMOTE' | 'RFID';
  search?: string;
  page?: number;
  limit?: number;
}

// Respuesta paginada para el frontend
export interface PaginatedAccessHistory {
  records: AccessRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AccessService {
  private readonly CACHE_KEY = 'access_records_cache';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  constructor(private api: Api) {}

  // ==================== GET ACCESS HISTORY (PAGINADO) ====================
  getAccessHistory(filters: AccessFilters = {}): Observable<PaginatedAccessHistory> {
    // Construir query params
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
    if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
    if (filters.type) params.append('type', filters.type);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const endpoint = `/access/history${params.toString() ? '?' + params.toString() : ''}`;

    return this.api.get(endpoint).pipe(
      map(response => {
        // El backend devuelve la estructura paginada completa
        if (response && typeof response === 'object' && 'data' in response) {
          // Respuesta paginada
          const paginatedResponse = response as AccessHistoryResponse;
          return {
            records: this.transformAccessRecords(paginatedResponse.data),
            total: paginatedResponse.total,
            page: paginatedResponse.page,
            limit: paginatedResponse.limit,
            totalPages: paginatedResponse.totalPages,
            hasNextPage: paginatedResponse.hasNextPage,
            hasPrevPage: paginatedResponse.hasPrevPage
          };
        } else if (Array.isArray(response)) {
          // Si el backend devuelve array directo (sin paginación)
          const records = this.transformAccessRecords(response);
          return {
            records,
            total: records.length,
            page: 1,
            limit: records.length,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false
          };
        } else {
          console.error('Unexpected response format:', response);
          return this.getEmptyPaginatedResponse();
        }
      }),
      catchError(error => {
        console.error('Error fetching access history:', error);
        // Si hay datos en caché y es un error de red, usar caché
        const cachedData = this.getCachedData();
        if (cachedData && error.status === 0) {
          console.log('Using cached data due to network error');
          return of({
            records: cachedData,
            total: cachedData.length,
            page: 1,
            limit: cachedData.length,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false
          });
        }
        return of(this.getEmptyPaginatedResponse());
      })
    );
  }

  // ==================== REMOTE OPEN ====================
  openDoorRemotely(): Observable<RemoteOpenResponse> {
    return this.api.post('/access/open', {}).pipe(
      map((response: RemoteOpenResponse) => response),
      catchError(error => {
        console.error('Error opening door remotely:', error);
        throw error;
      })
    );
  }

  // ==================== PRIVATE METHODS ====================

  private transformAccessRecords(records: AccessRecordBackend[]): AccessRecord[] {
    return records.map(record => {
      // El timestamp viene en formato "2025-11-01T07:11:00.796Z"
      let timestamp;
      try {
        timestamp = new Date(record.timestamp);
      } catch (e) {
        console.error('Error parsing timestamp:', record.timestamp);
        timestamp = new Date(); // Usar fecha actual como fallback
      }

      return {
        id: record.id,
        cardId: record.cardUid,      // ← FIX: Backend usa cardUid
        cardName: record.cardName,
        accessType: record.type,
        timestamp: timestamp,
        isAuthorized: record.wasAuthorized
      };
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Ordenar por fecha desc
  }

  private getCachedData(): AccessRecord[] | null {
    const cached = localStorage.getItem(this.CACHE_KEY);
    if (!cached) return null;

    try {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > this.CACHE_DURATION) {
        localStorage.removeItem(this.CACHE_KEY);
        return null;
      }

      // Convertir timestamps de string a Date
      return data.map((record: any) => ({
        ...record,
        timestamp: new Date(record.timestamp)
      }));
    } catch {
      return null;
    }
  }

  private cacheData(data: AccessRecord[]): void {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error caching access records:', error);
    }
  }

  private getEmptyPaginatedResponse(): PaginatedAccessHistory {
    return {
      records: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false
    };
  }
}
