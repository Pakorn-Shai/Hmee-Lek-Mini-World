import { PearlColor } from '../minigames/bubble_shooter/PearlColorSystem';

export interface BubbleStageConfig {
  stageId: number;
  rowCount: number;
  columnCount: number;
  allowedColors: PearlColor[];
  clearTarget: number;
  moveLimit: number;
  scorePerPearl: number;
  floatingBonus: number;
  remainingShotBonus: number;
  clearBonus: number;
  starScoreThresholds: [number, number, number];
  targetPearls: number;
  maxShots: number;
  unlocked: boolean;
}

export const BUBBLE_STAGE_CONFIGS: BubbleStageConfig[] = [
  {
    stageId: 1,
    rowCount: 5,
    columnCount: 8,
    allowedColors: [PearlColor.Blue, PearlColor.Pink, PearlColor.Green],
    clearTarget: 34,
    moveLimit: 35,
    scorePerPearl: 100,
    floatingBonus: 150,
    remainingShotBonus: 500,
    clearBonus: 1000,
    starScoreThresholds: [5000, 9000, 13000],
    targetPearls: 34,
    maxShots: 35,
    unlocked: true,
  },
  {
    stageId: 2,
    rowCount: 5,
    columnCount: 6,
    allowedColors: [PearlColor.Blue, PearlColor.Pink, PearlColor.Green],
    clearTarget: 16,
    moveLimit: 24,
    scorePerPearl: 100,
    floatingBonus: 150,
    remainingShotBonus: 500,
    clearBonus: 1000,
    starScoreThresholds: [2200, 4200, 6500],
    targetPearls: 16,
    maxShots: 24,
    unlocked: true,
  },
  {
    stageId: 3,
    rowCount: 5,
    columnCount: 6,
    allowedColors: [PearlColor.Blue, PearlColor.Pink, PearlColor.Green, PearlColor.Purple],
    clearTarget: 18,
    moveLimit: 24,
    scorePerPearl: 100,
    floatingBonus: 150,
    remainingShotBonus: 500,
    clearBonus: 1000,
    starScoreThresholds: [2600, 5000, 7800],
    targetPearls: 18,
    maxShots: 24,
    unlocked: true,
  },
  {
    stageId: 4,
    rowCount: 6,
    columnCount: 6,
    allowedColors: [PearlColor.Blue, PearlColor.Pink, PearlColor.Green, PearlColor.Purple],
    clearTarget: 22,
    moveLimit: 22,
    scorePerPearl: 100,
    floatingBonus: 150,
    remainingShotBonus: 500,
    clearBonus: 1000,
    starScoreThresholds: [3200, 6500, 9500],
    targetPearls: 22,
    maxShots: 22,
    unlocked: true,
  },
  {
    stageId: 5,
    rowCount: 6,
    columnCount: 6,
    allowedColors: [PearlColor.Blue, PearlColor.Pink, PearlColor.Green, PearlColor.Purple, PearlColor.Gold],
    clearTarget: 25,
    moveLimit: 22,
    scorePerPearl: 100,
    floatingBonus: 150,
    remainingShotBonus: 500,
    clearBonus: 1000,
    starScoreThresholds: [3800, 7600, 11000],
    targetPearls: 25,
    maxShots: 22,
    unlocked: true,
  },
];

export class BubbleStageSelection {
  public static selectedStage = 1;
}

export function getBubbleStageConfig(stageId: number): BubbleStageConfig | undefined {
  return BUBBLE_STAGE_CONFIGS.find((stageConfig) => stageConfig.stageId === stageId);
}
