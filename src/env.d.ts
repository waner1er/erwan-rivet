declare namespace App {
  interface Locals {
    user: import('./lib/auth').User | null;
    /** Counter for unique element ids of blocks rendered on the current page. */
    blockUid?: number;
  }
}
