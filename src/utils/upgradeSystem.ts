// 강화 확률 (★1: 90%, ★2: 70%, ★3: 50%, ★4: 30%, ★5: 10%)
export const UPGRADE_SUCCESS_RATES: Record<number, number> = {
  0: 90, // ★1로 강화
  1: 70, // ★2로 강화
  2: 50, // ★3로 강화
  3: 30, // ★4로 강화
  4: 10, // ★5로 강화
};

// 강화 시도 결과
export interface UpgradeResult {
  success: boolean;
  fragmentsGained: number;
}

// 강화 시도
export function attemptUpgrade(currentStars: number): UpgradeResult {
  const successRate = UPGRADE_SUCCESS_RATES[currentStars] || 0;
  const random = Math.random() * 100;
  const success = random < successRate;
  
  return {
    success,
    fragmentsGained: success ? 0 : 1, // 실패 시 별 조각 1개 획득
  };
}

// 확정 강화에 필요한 별 조각
export const FRAGMENTS_FOR_GUARANTEED_UPGRADE = 20;

// 강화 비용 계산
export function getUpgradeCost(currentStars: number): number {
  return (currentStars + 1) * 100;
}
