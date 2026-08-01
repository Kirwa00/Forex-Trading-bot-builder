/**
 * Transaction + entitlement store.
 *
 * WARNING: this is an in-process Map. It is fine for local development and for
 * a single long-lived Node process, but it does NOT survive restarts and is
 * NOT shared between serverless instances. Before taking real money on Vercel,
 * replace the two implementations below with Postgres/Redis (see README).
 *
 * The IPN handler is the durable source of truth in a real deployment, so the
 * store is deliberately kept behind a narrow interface to make that swap small.
 */

import { PaymentTransaction } from '../types';

export interface Entitlement {
  email: string;
  tier: 'Free' | 'Pro';
  grantedAt: string;
  merchantReference: string;
  confirmationCode?: string;
}

export interface PaymentStore {
  putTransaction(txn: PaymentTransaction): Promise<void>;
  getTransactionByTrackingId(orderTrackingId: string): Promise<PaymentTransaction | undefined>;
  getTransactionByReference(merchantReference: string): Promise<PaymentTransaction | undefined>;
  grantEntitlement(entitlement: Entitlement): Promise<void>;
  getEntitlement(email: string): Promise<Entitlement | undefined>;
}

class InMemoryPaymentStore implements PaymentStore {
  private byTrackingId = new Map<string, PaymentTransaction>();
  private byReference = new Map<string, PaymentTransaction>();
  private entitlements = new Map<string, Entitlement>();

  async putTransaction(txn: PaymentTransaction) {
    this.byReference.set(txn.merchantReference, txn);
    if (txn.pesapalTrackingId) this.byTrackingId.set(txn.pesapalTrackingId, txn);
  }

  async getTransactionByTrackingId(orderTrackingId: string) {
    return this.byTrackingId.get(orderTrackingId);
  }

  async getTransactionByReference(merchantReference: string) {
    return this.byReference.get(merchantReference);
  }

  async grantEntitlement(entitlement: Entitlement) {
    this.entitlements.set(entitlement.email.toLowerCase(), entitlement);
  }

  async getEntitlement(email: string) {
    return this.entitlements.get(email.toLowerCase());
  }
}

export const store: PaymentStore = new InMemoryPaymentStore();
