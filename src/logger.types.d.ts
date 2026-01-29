export interface ApiError {
  id?: string;
  message?: string;
  fields?: Record<string, string>;
}
