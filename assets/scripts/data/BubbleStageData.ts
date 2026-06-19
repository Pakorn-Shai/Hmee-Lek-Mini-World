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
  difficulty?: number;
  coinReward?: number;
  firstClearBonus?: number;
  availablePowerups?: string[];
  obstacles?: string[];
  goalType?: string;
  boardDropEnabled?: boolean;
  shotsPerDrop?: number;
  addNewRowOnDrop?: boolean;
  dangerLineY?: number;
}

const DEFAULT_SCORE_PER_PEARL = 100;
const DEFAULT_FLOATING_BONUS = 150;
const DEFAULT_REMAINING_SHOT_BONUS = 500;
const DEFAULT_CLEAR_BONUS = 1000;
const DEFAULT_GOAL_TYPE = 'clear_target_count';

function createBubbleStageConfig(config: {
  stageId: number;
  rowCount: number;
  columnCount: number;
  allowedColors: PearlColor[];
  targetPearls: number;
  moveLimit: number;
  starScoreThresholds: [number, number, number];
  unlocked?: boolean;
  difficulty?: number;
  coinReward?: number;
  firstClearBonus?: number;
  availablePowerups?: string[];
  obstacles?: string[];
  goalType?: string;
  boardDropEnabled?: boolean;
  shotsPerDrop?: number;
  addNewRowOnDrop?: boolean;
  dangerLineY?: number;
}): BubbleStageConfig {
  return {
    stageId: config.stageId,
    rowCount: config.rowCount,
    columnCount: config.columnCount,
    allowedColors: config.allowedColors,
    clearTarget: config.targetPearls,
    moveLimit: config.moveLimit,
    scorePerPearl: DEFAULT_SCORE_PER_PEARL,
    floatingBonus: DEFAULT_FLOATING_BONUS,
    remainingShotBonus: DEFAULT_REMAINING_SHOT_BONUS,
    clearBonus: DEFAULT_CLEAR_BONUS,
    starScoreThresholds: config.starScoreThresholds,
    targetPearls: config.targetPearls,
    maxShots: config.moveLimit,
    unlocked: config.unlocked ?? true,
    difficulty: config.difficulty,
    coinReward: config.coinReward,
    firstClearBonus: config.firstClearBonus,
    availablePowerups: config.availablePowerups,
    obstacles: config.obstacles,
    goalType: config.goalType ?? DEFAULT_GOAL_TYPE,
    boardDropEnabled: config.boardDropEnabled,
    shotsPerDrop: config.shotsPerDrop,
    addNewRowOnDrop: config.addNewRowOnDrop,
    dangerLineY: config.dangerLineY,
  };
}

export const BUBBLE_STAGE_CONFIGS: BubbleStageConfig[] = [
  createBubbleStageConfig({
    stageId: 1,
    rowCount: 4,
    columnCount: 6,
    allowedColors: [PearlColor.Blue, PearlColor.Pink, PearlColor.Green],
    targetPearls: 14,
    moveLimit: 28,
    starScoreThresholds: [1800, 3400, 5200],
    difficulty: 1,
    coinReward: 20,
    firstClearBonus: 30,
  }),
  createBubbleStageConfig({
    stageId: 2,
    rowCount: 4,
    columnCount: 6,
    allowedColors: [PearlColor.Blue, PearlColor.Pink, PearlColor.Green],
    targetPearls: 18,
    moveLimit: 27,
    starScoreThresholds: [2200, 4200, 6400],
    difficulty: 1,
    coinReward: 22,
    firstClearBonus: 32,
  }),
  createBubbleStageConfig({
    stageId: 3,
    rowCount: 5,
    columnCount: 6,
    allowedColors: [PearlColor.Blue, PearlColor.Pink, PearlColor.Green, PearlColor.Purple],
    targetPearls: 22,
    moveLimit: 27,
    starScoreThresholds: [2800, 5200, 7800],
    difficulty: 2,
    coinReward: 24,
    firstClearBonus: 36,
    availablePowerups: ['x2_score'],
  }),
  createBubbleStageConfig({
    stageId: 4,
    rowCount: 5,
    columnCount: 6,
    allowedColors: [PearlColor.Blue, PearlColor.Pink, PearlColor.Green, PearlColor.Purple],
    targetPearls: 26,
    moveLimit: 26,
    starScoreThresholds: [3400, 6200, 9200],
    difficulty: 2,
    coinReward: 26,
    firstClearBonus: 38,
    availablePowerups: ['x2_score'],
  }),
  createBubbleStageConfig({
    stageId: 5,
    rowCount: 6,
    columnCount: 6,
    allowedColors: [PearlColor.Blue, PearlColor.Pink, PearlColor.Green, PearlColor.Purple, PearlColor.Gold],
    targetPearls: 30,
    moveLimit: 26,
    starScoreThresholds: [4200, 7600, 10800],
    difficulty: 3,
    coinReward: 28,
    firstClearBonus: 42,
    availablePowerups: ['x2_score'],
    obstacles: ['bomb_pearl'],
  }),
  createBubbleStageConfig({
    stageId: 6,
    rowCount: 6,
    columnCount: 7,
    allowedColors: [PearlColor.Blue, PearlColor.Pink, PearlColor.Green, PearlColor.Purple],
    targetPearls: 34,
    moveLimit: 28,
    starScoreThresholds: [4800, 8600, 12200],
    difficulty: 3,
    coinReward: 30,
    firstClearBonus: 45,
    availablePowerups: ['x2_score'],
    obstacles: ['bomb_pearl'],
  }),
  createBubbleStageConfig({
    stageId: 7,
    rowCount: 7,
    columnCount: 7,
    allowedColors: [PearlColor.Blue, PearlColor.Pink, PearlColor.Green, PearlColor.Purple, PearlColor.Gold],
    targetPearls: 38,
    moveLimit: 29,
    starScoreThresholds: [5600, 9800, 13600],
    difficulty: 4,
    coinReward: 32,
    firstClearBonus: 48,
    availablePowerups: ['x2_score', 'bomb_item'],
    obstacles: ['bomb_pearl'],
  }),
  createBubbleStageConfig({
    stageId: 8,
    rowCount: 7,
    columnCount: 8,
    allowedColors: [PearlColor.Blue, PearlColor.Pink, PearlColor.Green, PearlColor.Purple, PearlColor.Gold],
    targetPearls: 44,
    moveLimit: 30,
    starScoreThresholds: [6600, 11200, 15600],
    difficulty: 4,
    coinReward: 34,
    firstClearBonus: 50,
    availablePowerups: ['x2_score', 'bomb_item'],
    obstacles: ['bomb_pearl'],
  }),
  createBubbleStageConfig({
    stageId: 9,
    rowCount: 8,
    columnCount: 8,
    allowedColors: [PearlColor.Blue, PearlColor.Pink, PearlColor.Green, PearlColor.Purple, PearlColor.Gold, PearlColor.Black],
    targetPearls: 50,
    moveLimit: 31,
    starScoreThresholds: [7600, 12800, 18000],
    difficulty: 5,
    coinReward: 36,
    firstClearBonus: 54,
    availablePowerups: ['x2_score', 'bomb_item'],
    obstacles: ['bomb_pearl', 'stone_pearl'],
  }),
  createBubbleStageConfig({
    stageId: 10,
    rowCount: 8,
    columnCount: 8,
    allowedColors: [PearlColor.Blue, PearlColor.Pink, PearlColor.Green, PearlColor.Purple, PearlColor.Gold, PearlColor.Black, PearlColor.Milk],
    targetPearls: 54,
    moveLimit: 32,
    starScoreThresholds: [8400, 14400, 20200],
    difficulty: 5,
    coinReward: 40,
    firstClearBonus: 60,
    availablePowerups: ['x2_score', 'bomb_item', 'fish_helper'],
    obstacles: ['bomb_pearl', 'stone_pearl'],
  }),
];

export class BubbleStageSelection {
  public static selectedStage = 1;
}

export function getBubbleStageConfig(stageId: number): BubbleStageConfig | undefined {
  return BUBBLE_STAGE_CONFIGS.find((stageConfig) => stageConfig.stageId === stageId);
}
