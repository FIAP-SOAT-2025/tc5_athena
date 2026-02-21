import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

@Injectable()
export class HashService {
  hashPassword(password: string): string {
    console.log("[HashService.hashPassword] Hashing password:", password);
    return createHash('sha256').update(password).digest('hex');
  }

  compare(password: string, hash: string): boolean {
    const passwordHash = this.hashPassword(password);
    console.log("[HashService.compare] Comparing password hash:", passwordHash, "with hash:", hash);
    return passwordHash === hash;
  }

  
}