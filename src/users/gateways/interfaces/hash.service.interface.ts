export interface HashServiceInterface {
  hashPassword(password: string): string;
  compare(password: string, hash: string): boolean;
}

