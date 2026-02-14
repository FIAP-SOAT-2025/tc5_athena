import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

@Injectable()
export class HashService {
  hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
  }

  compare(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }
}