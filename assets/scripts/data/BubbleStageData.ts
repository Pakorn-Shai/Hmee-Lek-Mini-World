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
  targetPearls: number;
  maxShots: number;
  unlocked: boolean;
}

export const BUBBLE_STAGE_CONFIGS: BubbleStageConfig[] = [
  {
    stageId: 1,
    rowCount: 4,
    columnCount: 6,
    allowedColors: [PearlColor.Blue, PearlColor.Pink, PearlColor.Green],
    clearTarget: 12,
    moveLimit: 25,
    scorePerPearl: 10,
    floatingBonus: 5,
    targetPearls: 12,
    maxShots: 25,
    unlocked: true,
  },
  {
    stageId: 2,
    rowCount: 5,
    columnCount: 6,
    allowedColors: [PearlColor.Blue, PearlColor.Pink, PearlColor.Green],
    clearTarget: 16,
    moveLimit: 24,
    scorePerPearl: 10,
    floatingBonus: 5,
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
    scorePerPearl: 10,
    floatingBonus: 5,
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
    scorePerPearl: 10,
    floatingBonus: 5,
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
    scorePerPearl: 10,
    floatingBonus: 5,
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
