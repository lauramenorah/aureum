// Paxos API TypeScript types

// ─── Type Unions ───────────────────────────────────────────────────────────────

export type Asset = 'BTC' | 'ETH' | 'USD' | 'USDP' | 'PYUSD' | 'USDG' | 'USDL' | 'PAXG';

export type Network = 'BITCOIN' | 'ETHEREUM' | 'SOLANA' | 'STELLAR' | 'INK' | 'XLAYER';

export type OrderSide = 'BUY' | 'SELL';

export type OrderType = 'MARKET' | 'LIMIT' | 'STOP';

export type IdentityType = 'PERSON' | 'INSTITUTION';

export type IdentityStatus = 'PENDING' | 'APPROVED' | 'DENIED' | 'DISABLED';

export type TransferStatus = 'PENDING' | 'APPROVED' | 'COMPLETED' | 'FAILED';

// ─── Identity & KYC ───────────────────────────────────────────────────────────

export interface PersonDetails {
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth: string;
  email: string;
  phone?: string;
  nationality?: string;
}

export interface InstitutionDetails {
  name: string;
  entity_type: string;
  registration_number: string;
  country_of_incorporation: string;
  description?: string;
  website?: string;
}

export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface TaxDetails {
  tax_id_type: 'SSN' | 'ITIN' | 'EIN' | 'FOREIGN_TIN' | 'NONE';
  tax_id: string;
  tax_country: string;
}

export interface Identity {
  id: string;
  type: IdentityType;
  status: IdentityStatus;
  person_details?: PersonDetails;
  institution_details?: InstitutionDetails;
  tax_details?: TaxDetails;
  address?: Address;
}

// ─── Accounts & Profiles ──────────────────────────────────────────────────────

export interface Account {
  id: string;
  identity_id: string;
  type: string;
  created_at: string;
}

export interface Profile {
  id: string;
  account_id: string;
  nickname: string;
  type: string;
  created_at: string;
}

// ─── Balances ─────────────────────────────────────────────────────────────────

export interface Balance {
  asset: Asset;
  available: string;
  trading: string;
}

// ─── Transfers ────────────────────────────────────────────────────────────────

export interface Transfer {
  id: string;
  profile_id: string;
  type: string;
  direction: string;
  asset: Asset;
  amount: string;
  status: TransferStatus;
  created_at: string;
  updated_at: string;
  destination_address?: string;
  fee?: string;
}

// ─── Orders & Executions ──────────────────────────────────────────────────────

export interface Order {
  id: string;
  profile_id: string;
  market: string;
  side: OrderSide;
  type: OrderType;
  price?: string;
  amount: string;
  base_amount?: string;
  quote_amount?: string;
  status: 'OPEN' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED' | 'EXPIRED';
  time_in_force?: string;
  created_at: string;
}

export interface Execution {
  id: string;
  order_id: string;
  market: string;
  side: OrderSide;
  price: string;
  amount: string;
  created_at: string;
}

// ─── Quotes ───────────────────────────────────────────────────────────────────

export interface Quote {
  id: string;
  market: string;
  side: OrderSide;
  price: string;
  amount: string;
  expires_at: string;
}

export interface QuoteExecution {
  id: string;
  quote_id: string;
  market: string;
  side: OrderSide;
  price: string;
  amount: string;
  created_at: string;
}

// ─── Stablecoin Conversions ───────────────────────────────────────────────────

export interface StablecoinConversion {
  id: string;
  profile_id: string;
  from_asset: Asset;
  to_asset: Asset;
  amount: string;
  status: string;
  created_at: string;
}

// ─── Crypto Deposits & Withdrawals ───────────────────────────────────────────

export interface DepositAddress {
  id: string;
  profile_id: string;
  asset: Asset;
  network: Network;
  address: string;
  memo?: string;
  created_at: string;
}

export interface CryptoWithdrawal {
  id: string;
  profile_id: string;
  asset: Asset;
  amount: string;
  destination_address: string;
  network: Network;
  fee?: string;
  status: TransferStatus;
  created_at: string;
}

export interface CryptoWithdrawalFee {
  asset: Asset;
  network: Network;
  fee: string;
  total: string;
}

// ─── Fiat ─────────────────────────────────────────────────────────────────────

export interface FiatAccount {
  id: string;
  profile_id: string;
  bank_name: string;
  beneficiary_name: string;
  account_number: string;
  routing_number: string;
  account_type: 'CHECKING' | 'SAVINGS';
  address?: Address;
}

export interface FiatWithdrawal {
  id: string;
  profile_id: string;
  fiat_account_id: string;
  amount: string;
  status: TransferStatus;
  created_at: string;
}

export interface FiatDepositInstruction {
  id: string;
  profile_id: string;
  bank_name: string;
  routing_number: string;
  account_number: string;
  memo: string;
}

// ─── Market Data ──────────────────────────────────────────────────────────────

export interface MarketTicker {
  market: string;
  last_price: string;
  open: string;
  high: string;
  low: string;
  volume: string;
  change_24h: string;
}

export interface HistoricalPrice {
  timestamp: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

// ─── Monitoring ───────────────────────────────────────────────────────────────

export interface MonitoringAddress {
  id: string;
  address: string;
  network: Network;
  nickname: string;
  created_at: string;
}

// ─── Orchestration ────────────────────────────────────────────────────────────

export interface Orchestration {
  id: string;
  profile_id: string;
  type: string;
  status: string;
  source_asset: Asset;
  destination_asset: Asset;
  amount: string;
  created_at: string;
}

export interface OrchestrationRule {
  id: string;
  profile_id: string;
  status: 'ACTIVE' | 'DELETED';
  description: string;
  created_at: string;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export interface PaxosEvent {
  id: string;
  type: string;
  data: unknown;
  created_at: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  next_page_cursor?: string;
}
