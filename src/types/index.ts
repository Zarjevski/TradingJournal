// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  photoURL?: string | null;
  status?: string | null;
  createdAt: Date;
}

// Trade types
export interface Trade {
  id: string;
  exchangeID: string;
  traderID: string;
  exchangeName: string;
  createdAt: Date;
  symbol: string;
  position: string;
  margin: string;
  date: Date;
  status: string;
  size: number;
  reason: string;
  result: number;
  imageURL?: string | null;
}

// Exchange types
export interface Exchange {
  id: string;
  traderID: string;
  balance: number;
  exchangeName: string;
  image: string;
}

// Rule types
export interface Rule {
  id: string;
  content: string;
  traderID: string;
}

// User context data
export interface UserContextData {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    photoURL?: string | null;
    status?: string | null;
    trades: Trade[];
    rules: Rule[];
    exchanges: Exchange[];
  } | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

// Modal context data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComponentType = React.ComponentType<any>;

export interface ModalContextData {
  isOpen: boolean;
  Component: ComponentType | null;
  setIsOpen: (isOpen: boolean) => void;
  setComponent: (component: ComponentType | null) => void;
}

// Form data types
export interface TradeFormData {
  size: string;
  margin: string;
  date: string;
  reason: string;
  symbol?: string;
  position?: string;
  status?: string;
  result?: string;
  exchangeName?: string;
}

export interface ExchangeFormData {
  exchange: string;
  image: string;
  balance?: number;
}

export interface RuleFormData {
  text: string;
}
