export type ListStatus = 'open' | 'locked' | 'shopping' | 'closed';
export type ItemStatus = 'pending' | 'purchased' | 'not_found' | 'rolled_over';
export type ApprovalStatus = 'not_required' | 'pending' | 'approved' | 'rejected';
export type UserRole = 'admin' | 'member';

export interface AppUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  householdId: string | null;
  role: UserRole;
  joinedAt: Date;
}

export interface Household {
  id: string;
  name: string;
  adminUid: string;
  inviteToken: string;
  memberUids: string[];
  createdAt: Date;
}

export interface WeekList {
  id: string;
  householdId: string;
  weekLabel: string;
  weekStart: Date;
  weekEnd: Date;
  status: ListStatus;
  createdAt: Date;
  closedAt: Date | null;
}

export interface ListItem {
  id: string;
  listId: string;
  householdId: string;
  name: string;
  quantity: number;
  notes: string;
  urgent: boolean;
  addedByUid: string;
  addedByName: string;
  status: ItemStatus;
  approvalStatus: ApprovalStatus;
  notFoundResolved: boolean;
  createdAt: Date;
}

export interface Purchase {
  id: string;
  listId: string;
  householdId: string;
  weekLabel: string;
  total: number;
  receiptUrl: string | null;
  receiptProcessed: boolean;
  createdAt: Date;
}

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ToastMsg {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
