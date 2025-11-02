import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Api } from './api.service';

// Interfaz que coincide con la respuesta del backend
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

interface AccessRecordResponse {
  id: number;
  cardUId: string;
  cardName: string;
  wasAuthorized: boolean;
  type: 'REMOTE' | 'RFID';
  timestamp: string;
}

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
  accessType?: 'REMOTE' | 'RFID';
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AccessService {
  private readonly CACHE_KEY = 'access_records_cache';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  constructor(private api: Api) {}

  getAccessHistory(filters: AccessFilters = {}): Observable<AccessRecord[]> {
    // Construir query params
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
    if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
    if (filters.accessType) params.append('type', filters.accessType);

    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    // Solo usar caché cuando no hay filtros activos
    const cachedData = this.getCachedData();
    if (cachedData && !filters.page && !filters.startDate && !filters.endDate &&
        !filters.accessType && !filters.search) {
      return of(cachedData);
    }

    return this.api.get(`/access/history?${params.toString()}`).pipe(
      map(response => {
        // Verificar si la respuesta es un array
        if (!Array.isArray(response)) {
          console.error('Unexpected response format:', response);
          return [];
        }

        const records = this.transformAccessRecords(response)
        // Ordenar por timestamp descendente (más reciente primero)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        // Si es la primera página y no hay filtros, cachear
        if ((!filters.page || filters.page === 1) && !filters.search && !filters.startDate && !filters.endDate) {
          this.cacheData(records);
        }

        return records;
      }),
      catchError(error => {
        console.error('Error fetching access history:', error);
        // Si hay datos en caché y es un error de red, usar caché
        const cachedData = this.getCachedData();
        if (cachedData && error.status === 0) {
          console.log('Using cached data due to network error');
          return of(cachedData);
        }
        return of([]);
      })
    );
  }

  private transformAccessRecords(records: AccessRecordResponse[]): AccessRecord[] {
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
        cardId: record.cardUId,
        cardName: record.cardName,
        accessType: record.type,
        timestamp: timestamp,
        isAuthorized: record.wasAuthorized
      };
    });
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
      return data;
    } catch {
      return null;
    }
  }

  private cacheData(data: AccessRecord[]): void {
    localStorage.setItem(this.CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  }

  private filterCachedData(records: AccessRecord[], filters: AccessFilters): AccessRecord[] {
    return records.filter(record => {
      if (filters.startDate && record.timestamp < filters.startDate) return false;
      if (filters.endDate && record.timestamp > filters.endDate) return false;
      if (filters.accessType && record.accessType !== filters.accessType) return false;
      if (filters.search) {
        const search = filters.search.toLowerCase();
        return record.cardName.toLowerCase().includes(search) ||
               record.cardId.toLowerCase().includes(search);
      }
      return true;
    });
  }
}
