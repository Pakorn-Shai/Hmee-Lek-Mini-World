export interface BubbleStageConfig {
  stageId: number;
  targetPearls: number;
  maxShots: number;
  unlocked: boolean;
}

export const BUBBLE_STAGE_CONFIGS: BubbleStageConfig[] = [
  {
    stageId: 1,
    targetPearls: 12,
    maxShots: 25,
    unlocked: true,
  },
  {
    stageId: 2,
    targetPearls: 16,
    maxShots: 28,
    unlocked: false,
  },
  {
    stageId: 3,
    targetPearls: 20,
    maxShots: 30,
    unlocked: false,
  },
];

export class BubbleStageSelection {
  public static selectedStage = 1;
}

export function getBubbleStageConfig(stageId: number): BubbleStageConfig | undefined {
  return BUBBLE_STAGE_CONFIGS.find((stageConfig) => stageConfig.stageId === stageId);
}
