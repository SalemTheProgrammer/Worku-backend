export interface ApiResponseData<T> {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}