export interface Contract {
  organizationId: string;
  fightsTotal: number;
  fightsCompleted: number;
  showMoney: number;
  winBonus: number;
  signedOn: string;
  exclusive: boolean;
}

export interface ContractOffer {
  id: string;
  organizationId: string;
  fights: number;
  showMoney: number;
  winBonus: number;
  guaranteed?: number; // pour les contrats "guaranteed" (ex: KSW-like)
  prestigeStars: number; // 1-5
  oppositionStars: number; // 1-5
}
