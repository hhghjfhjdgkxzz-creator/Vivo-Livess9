
export enum UserLevel {
  NEW = 'جديد',
  BRONZE = 'برونزي',
  SILVER = 'فضي',
  GOLD = 'ذهبي',
  DIAMOND = 'ماسي',
  VIP = 'VIP'
}

export type ItemType = 'frame' | 'bubble' | 'entry' | 'badge' | 'extra';

export interface StoreItem {
  id: string;
  name: string;
  type: ItemType;
  price: number;
  url: string;
}

export interface User {
  id: string;
  customId: any; 
  name: string;
  avatar: string;
  level: UserLevel;
  wealthLevel?: number;
  rechargeLevel?: number;
  rechargePoints?: number;
  frame?: string;
  activeBubble?: string;
  badge?: string;
  achievements?: string[];
  cover?: string;
  coins: any;
  diamonds: any; 
  wealth: any;
  charm: any;
  isVip: boolean;
  vipLevel?: number;
  nameStyle?: string;
  idColor?: string; 
  bio?: string;
  location?: string;
  gender?: 'male' | 'female';
  stats?: {
    likes: number;
    visitors: number;
    following: number;
    followers: number;
  };
  ownedItems?: string[];
  isFollowing?: boolean;
  isMuted?: boolean;
  isSpecialId?: boolean;
  isAdmin?: boolean;
  isAgency?: boolean;
  agencyBalance?: number;
  isBanned?: boolean;
  banUntil?: string;
  seatIndex?: number;
  status?: string;
  activeEmoji?: string; 
}

export interface LuckyBag {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  roomId: string;
  roomTitle: string;
  totalAmount: number;
  remainingAmount: number;
  recipientsLimit: number;
  claimedBy: string[]; 
  createdAt: any;
  expiresAt: any;
}

export interface GlobalAnnouncement {
  id: string;
  senderName: string;
  recipientName: string;
  giftName: string;
  giftIcon: string;
  roomTitle: string;
  roomId: string;
  type: 'gift' | 'lucky_win' | 'lucky_bag';
  amount: number;
  timestamp: any;
}

export type GiftAnimationType = 'pop' | 'fly' | 'full-screen' | 'shake' | 'glow' | 'bounce' | 'rotate' | 'slide-up';

export interface Gift {
  id: string;
  name: string;
  icon: string;
  cost: number;
  animationType: GiftAnimationType;
  isLucky?: boolean;
  category?: 'popular' | 'exclusive' | 'lucky' | 'celebrity' | 'trend';
}

export interface VIPPackage {
  level: number;
  name: string;
  cost: number;
  frameUrl: string;
  color: string;
  nameStyle: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userLevel: UserLevel;
  userNameStyle?: string;
  content: string;
  type: 'text' | 'gift' | 'system';
  giftData?: Gift;
  bubbleUrl?: string;
  isLuckyWin?: boolean;
  winAmount?: number;
}

export interface Room {
  id: string;
  title: string;
  category: 'ترفيه' | 'ألعاب' | 'شعر' | 'تعارف';
  hostId: string;
  listeners: number;
  thumbnail: string;
  speakers: User[];
  background: string;
  isLocked?: boolean;
  password?: string;
  micCount?: number; 
  moderators?: string[]; // مصفوفة لآيديات المشرفين
  kickedUsers?: string[]; // مصفوفة للمستخدمين المطرودين
}

export interface LuckyMultiplier {
  label: string;
  value: number;
  chance: number; 
}

export interface GameSettings {
  slotsWinRate: number;
  wheelWinRate: number;
  luckyGiftWinRate: number;
  luckyGiftRefundPercent: number;
  luckyXEnabled: boolean;
  luckyMultipliers: LuckyMultiplier[];
  wheelJackpotX: number; 
  wheelNormalX: number;   
  slotsSevenX: number;    
  slotsFruitX: number;    
  availableEmojis?: string[]; 
  emojiDuration?: number; 
}

export interface WheelItem {
  id: string;
  label: string;
  color: string;
  icon: string;
  multiplier: number;
  probability: number;
}

export interface SlotItem {
  id: string;
  icon: string;
  multiplier: number;
}

export interface Contributor {
  id: string;
  name: string;
  avatar: string;
  amount: number;
  rank: number;
}
