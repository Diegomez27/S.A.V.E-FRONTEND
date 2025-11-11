

// ==================== CARDS ====================

export interface CardResponse {
  id: number;
  uid: string;
  name: string;
  isEnabled: boolean;
  createdAt: string;       // ISO 8601 string
  deletedAt: string | null; // ISO 8601 string o null
}

export interface CreateCardRequest {
  uid: string;
  name: string;
}

export interface DeleteCardResponse {
  message: string;
}

export interface RestoreCardResponse {
  message: string;
  card: CardResponse;
}

// ==================== ACCESS ====================

export interface AccessRecordBackend {
  id: number;
  cardUid: string;
  cardName: string;
  wasAuthorized: boolean;
  type: 'RFID' | 'REMOTE';
  timestamp: string;       // ISO 8601 string
}

export interface AccessHistoryResponse {
  data: AccessRecordBackend[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface RemoteOpenRequest {

}

export interface RemoteOpenResponse {
  message: string;
}

// ==================== AUTH ====================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
  user: {
    id: number;
    username: string;
  };
}

// ==================== ERROR ====================

export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}
