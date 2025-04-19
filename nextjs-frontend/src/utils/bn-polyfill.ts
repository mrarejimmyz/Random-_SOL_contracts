/**
 * Enhanced polyfill and safety wrapper for BN.js to handle bigint binding issues in Docker
 */

import BN from 'bn.js';
import * as bigintBufferModule from 'bigint-buffer';
import { PublicKey } from '@solana/web3.js';

// Define proper types for bigint-buffer methods
interface BigIntBuffer {
  toBigIntLE?: (buffer: Buffer) => bigint;
  toBufferLE?: (value: bigint, length: number) => Buffer;
  toBigIntBE?: (buffer: Buffer) => bigint;
  toBufferBE?: (value: bigint, length: number) => Buffer;
}

// Global BN safety - ensure BN is always available
if (typeof global !== 'undefined') {
  (global as any).BN = BN;
}

// Ensure BN prototype methods exist
function ensureBNPrototype() {
  if (typeof BN !== 'undefined' && BN.prototype) {
    if (!BN.prototype.toString) {
      BN.prototype.toString = function(base?: number) {
        return '0';
      };
    }
    if (!BN.prototype.toNumber) {
      BN.prototype.toNumber = function() {
        return 0;
      };
    }
    if (!BN.prototype.toJSON) {
      BN.prototype.toJSON = function() {
        return '0';
      };
    }
  }
}

/**
 * Safely creates a PublicKey instance with error handling
 */
export function safePublicKey(value: string | Buffer | Uint8Array | number[] | PublicKey | null | undefined): PublicKey | null {
  if (!value) {
    console.warn('Attempted to create PublicKey from null or undefined value');
    return null;
  }
  
  try {
    return new PublicKey(value);
  } catch (error) {
    console.error('Error creating PublicKey:', error);
    return null;
  }
}

/**
 * Safely creates a BN instance with error handling
 */
export function safeBN(value: string | number | BN | Buffer | null | undefined, base?: number): BN | null {
  try {
    if (value === null || value === undefined) {
      console.warn('Attempted to create BN from null or undefined value');
      return new BN(0); // Return BN(0) instead of null for better safety
    }
    
    return new BN(value, base);
  } catch (error) {
    console.error('Error creating BN instance:', error);
    return new BN(0); // Return BN(0) instead of null for better safety
  }
}

/**
 * Safe wrapper for BN operations that handles null values
 */
export class SafeBN {
  private _bn: BN;

  constructor(value: string | number | BN | Buffer | null | undefined, base?: number) {
    this._bn = safeBN(value, base) || new BN(0);
  }

  /**
   * Get the underlying BN instance
   */
  get bn(): BN {
    return this._bn;
  }

  /**
   * Convert to BN safely
   */
  toBN(): BN {
    return this._bn;
  }

  /**
   * Safe add operation
   */
  add(value: SafeBN | BN | number | string): SafeBN {
    try {
      if (value instanceof SafeBN) {
        return new SafeBN(this._bn.add(value.toBN()));
      } else {
        const bnValue = value instanceof BN ? value : new BN(value);
        return new SafeBN(this._bn.add(bnValue));
      }
    } catch (error) {
      console.error('Error in SafeBN.add:', error);
      return new SafeBN(this._bn);
    }
  }

  /**
   * Safe subtract operation
   */
  sub(value: SafeBN | BN | number | string): SafeBN {
    try {
      if (value instanceof SafeBN) {
        return new SafeBN(this._bn.sub(value.toBN()));
      } else {
        const bnValue = value instanceof BN ? value : new BN(value);
        return new SafeBN(this._bn.sub(bnValue));
      }
    } catch (error) {
      console.error('Error in SafeBN.sub:', error);
      return new SafeBN(this._bn);
    }
  }

  /**
   * Safe multiply operation
   */
  mul(value: SafeBN | BN | number | string): SafeBN {
    try {
      if (value instanceof SafeBN) {
        return new SafeBN(this._bn.mul(value.toBN()));
      } else {
        const bnValue = value instanceof BN ? value : new BN(value);
        return new SafeBN(this._bn.mul(bnValue));
      }
    } catch (error) {
      console.error('Error in SafeBN.mul:', error);
      return new SafeBN(this._bn);
    }
  }

  /**
   * Safe divide operation
   */
  div(value: SafeBN | BN | number | string): SafeBN {
    try {
      if (value instanceof SafeBN) {
        if (value.bn.isZero()) {
          console.error('Division by zero attempted');
          return new SafeBN(this._bn);
        }
        return new SafeBN(this._bn.div(value.toBN()));
      } else {
        const bnValue = value instanceof BN ? value : new BN(value);
        if (bnValue.isZero()) {
          console.error('Division by zero attempted');
          return new SafeBN(this._bn);
        }
        return new SafeBN(this._bn.div(bnValue));
      }
    } catch (error) {
      console.error('Error in SafeBN.div:', error);
      return new SafeBN(this._bn);
    }
  }

  /**
   * Convert to string
   */
  toString(base?: number): string {
    try {
      return this._bn.toString(base);
    } catch (error) {
      console.error('Error in SafeBN.toString:', error);
      return '0';
    }
  }

  /**
   * Convert to number
   */
  toNumber(): number {
    try {
      return this._bn.toNumber();
    } catch (error) {
      console.error('Error in SafeBN.toNumber:', error);
      return 0;
    }
  }

  /**
   * Check if equal to another value
   */
  eq(value: SafeBN | BN | number | string): boolean {
    try {
      if (value instanceof SafeBN) {
        return this._bn.eq(value.bn);
      } else {
        const bnValue = value instanceof BN ? value : new BN(value);
        return this._bn.eq(bnValue);
      }
    } catch (error) {
      console.error('Error in SafeBN.eq:', error);
      return false;
    }
  }

  /**
   * Check if greater than another value
   */
  gt(value: SafeBN | BN | number | string): boolean {
    try {
      if (value instanceof SafeBN) {
        return this._bn.gt(value.bn);
      } else {
        const bnValue = value instanceof BN ? value : new BN(value);
        return this._bn.gt(bnValue);
      }
    } catch (error) {
      console.error('Error in SafeBN.gt:', error);
      return false;
    }
  }

  /**
   * Check if less than another value
   */
  lt(value: SafeBN | BN | number | string): boolean {
    try {
      if (value instanceof SafeBN) {
        return this._bn.lt(value.bn);
      } else {
        const bnValue = value instanceof BN ? value : new BN(value);
        return this._bn.lt(bnValue);
      }
    } catch (error) {
      console.error('Error in SafeBN.lt:', error);
      return false;
    }
  }

  /**
   * Check if zero
   */
  isZero(): boolean {
    return this._bn.isZero();
  }
}

/**
 * Enhanced patch for bigint-buffer to handle missing native bindings in Docker
 */
export function patchBigintBuffer() {
  try {
    // Ensure BN prototype methods exist
    ensureBNPrototype();
    
    // Use the imported module with proper typing
    const bigintBuffer = bigintBufferModule as BigIntBuffer;
    
    // Check if the module has the expected methods
    if (!bigintBuffer.toBigIntLE || !bigintBuffer.toBufferLE) {
      console.warn('bigint-buffer methods missing, applying polyfill');
      
      // Simple polyfill for toBigIntLE if missing
      if (!bigintBuffer.toBigIntLE) {
        bigintBuffer.toBigIntLE = function(buffer: Buffer): bigint {
          try {
            // Simple implementation for little-endian conversion
            let result = 0n;
            for (let i = buffer.length - 1; i >= 0; i--) {
              result = (result << 8n) + BigInt(buffer[i]);
            }
            return result;
          } catch (error) {
            console.error('Error in toBigIntLE polyfill:', error);
            return 0n;
          }
        };
      }
      
      // Simple polyfill for toBufferLE if missing
      if (!bigintBuffer.toBufferLE) {
        bigintBuffer.toBufferLE = function(value: bigint, length: number): Buffer {
          try {
            const buffer = Buffer.alloc(length);
            let tempValue = value;
            for (let i = 0; i < length; i++) {
              buffer[i] = Number(tempValue & 0xffn);
              tempValue = tempValue >> 8n;
            }
            return buffer;
          } catch (error) {
            console.error('Error in toBufferLE polyfill:', error);
            return Buffer.alloc(length);
          }
        };
      }
      
      // Add BE methods if missing
      if (!bigintBuffer.toBigIntBE) {
        bigintBuffer.toBigIntBE = function(buffer: Buffer): bigint {
          try {
            let result = 0n;
            for (let i = 0; i < buffer.length; i++) {
              result = (result << 8n) + BigInt(buffer[i]);
            }
            return result;
          } catch (error) {
            console.error('Error in toBigIntBE polyfill:', error);
            return 0n;
          }
        };
      }
      
      if (!bigintBuffer.toBufferBE) {
        bigintBuffer.toBufferBE = function(value: bigint, length: number): Buffer {
          try {
            const buffer = Buffer.alloc(length);
            let tempValue = value;
            for (let i = length - 1; i >= 0; i--) {
              buffer[i] = Number(tempValue & 0xffn);
              tempValue = tempValue >> 8n;
            }
            return buffer;
          } catch (error) {
            console.error('Error in toBufferBE polyfill:', error);
            return Buffer.alloc(length);
          }
        };
      }
    }
    
    // Patch global objects if they exist
    if (typeof window !== 'undefined') {
      // Apply patches to any existing instances in the window object
      patchExistingInstances(window);
    }
    
    console.log('bigint-buffer patched successfully');
    return true;
  } catch (error) {
    console.error('Failed to patch bigint-buffer:', error);
    return false;
  }
}

/**
 * Recursively patch existing instances that might be using BN
 */
function patchExistingInstances(obj: any, depth = 0, visited = new Set()) {
  // Prevent infinite recursion
  if (depth > 3 || visited.has(obj)) return;
  visited.add(obj);
  
  try {
    // Check if this object has a _bn property that's undefined
    if (obj && obj._bn === undefined && typeof obj.toBN === 'function') {
      // Fix the object by setting a default _bn
      obj._bn = new BN(0);
      console.log('Fixed undefined _bn property on object');
    }
    
    // Recursively check properties
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        try {
          const value = obj[key];
          if (value && typeof value === 'object') {
            patchExistingInstances(value, depth + 1, visited);
          }
        } catch (e) {
          // Ignore errors on individual properties
        }
      });
    }
  } catch (e) {
    // Ignore errors
  }
}

// Apply the patch immediately when this module is imported
patchBigintBuffer();

// Set environment variable to indicate we're in Docker
if (typeof process !== 'undefined' && process.env) {
  process.env.DOCKER_ENVIRONMENT = 'true';
}

export default SafeBN;
