import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { HashServiceInterface } from '../interfaces/hash.service.interface';

@Injectable()
export class HashService implements HashServiceInterface {
  
  hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
  }

  compare(password: string, hash: string): boolean {
    const passwordHash = this.hashPassword(password);
    return passwordHash === hash;
  }

  
}