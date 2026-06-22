import { PearlColor } from '../minigames/bubble_shooter/PearlColorSystem';

export type BubbleStageGoalType =
  | 'clear_target_count'
  | 'clear_specific_color'
  | 'break_obstacles'
  | 'defeat_boss'
  | 'survive_turns'
  | 'reach_score';

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
  goalType?: BubbleStageGoalType;
  boardDropEnabled?: boolean;
  shotsPerDrop?: number;
  addNewRowOnDrop?: boolean;
  dangerLineY?: number;
}

const DEFAULT_SCORE_PER_PEARL = 100;
const DEFAULT_FLOATING_BONUS = 150;
const DEFAULT_REMAINING_SHOT_BONUS = 500;
const DEFAULT_CLEAR_BONUS = 1000;
const DEFAULT_GOAL_TYPE: BubbleStageGoalType = 'clear_target_count';

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
  goalType?: BubbleStageGoalType;
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
    rowCount: 3,
    columnCount: 6,
    allowedColors: [PearlColor.Blue, PearlColor.Pink, PearlColor.Green],
    targetPearls: 10,
    moveLimit: 28,
    starScoreThresholds: [1200, 2600, 5000],
    difficulty: 1,
    coinReward: 20,
    firstClearBonus: 30,
  }),
  createBubbleStageConfig({
    stageId: 2,
    rowCount: 4,
    columnCount: 6,
    allowedColors: [PearlColor.Blue, PearlColor.Pink, PearlColor.Green],
    targetPearls: 14,
    moveLimit: 29,
    starScoreThresholds: [1700, 3600, 6100],
    difficulty: 1,
    coinReward: 22,
    firstClearBonus: 32,
  }),
  createBubbleStageConfig({
    stageId: 3,
    rowCount: 5,
    columnCount: 6,
    allowedColors: [PearlColor.Blue, PearlColor.Pink, PearlColor.Green, PearlColor.Purple],
    targetPearls: 18,
    moveLimit: 30,
    starScoreThresholds: [2200, 4600, 7600],
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
    targetPearls: 22,
    moveLimit: 31,
    starScoreThresholds: [2700, 5600, 9000],
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
    targetPearls: 26,
    moveLimit: 32,
    starScoreThresholds: [3300, 6800, 10600],
    difficulty: 3,
    coinReward: 28,
    firstClearBonus: 42,
    availablePowerups: ['x2_score'],
  }),
  createBubbleStageConfig({
    stageId: 6,
    rowCount: 6,
    columnCount: 7,
    allowedColors: [PearlColor.Blue, PearlColor.Pink, PearlColor.Green, PearlColor.Purple],
    targetPearls: 30,
    moveLimit: 33,
    starScoreThresholds: [3900, 7900, 12200],
    difficulty: 3,
    coinReward: 30,
    firstClearBonus: 45,
    availablePowerups: ['x2_score'],
  }),
  createBubbleStageConfig({
    stageId: 7,
    rowCount: 7,
    columnCount: 7,
    allowedColors: [PearlColor.Blue, PearlColor.Pink, PearlColor.Green, PearlColor.Purple, PearlColor.Gold],
    targetPearls: 34,
    moveLimit: 34,
    starScoreThresholds: [4500, 9000, 13600],
    difficulty: 4,
    coinReward: 32,
    firstClearBonus: 48,
    availablePowerups: ['x2_score', 'bomb_item'],
  }),
  createBubbleStageConfig({
    stageId: 8,
    rowCount: 7,
    columnCount: 8,
    allowedColors: [PearlColor.Blue, PearlColor.Pink, PearlColor.Green, PearlColor.Purple, PearlColor.Gold],
    targetPearls: 38,
    moveLimit: 35,
    starScoreThresholds: [5200, 10100, 15000],
    difficulty: 4,
    coinReward: 34,
    firstClearBonus: 50,
    availablePowerups: ['x2_score', 'bomb_item'],
  }),
  createBubbleStageConfig({
    stageId: 9,
    rowCount: 8,
    columnCount: 8,
    allowedColors: [PearlColor.Blue, PearlColor.Pink, PearlColor.Green, PearlColor.Purple, PearlColor.Gold],
    targetPearls: 42,
    moveLimit: 36,
    starScoreThresholds: [5900, 11200, 16400],
    difficulty: 5,
    coinReward: 36,
    firstClearBonus: 54,
    availablePowerups: ['x2_score', 'bomb_item'],
  }),
  createBubbleStageConfig({
    stageId: 10,
    rowCount: 8,
    columnCount: 8,
    allowedColors: [PearlColor.Blue, PearlColor.Pink, PearlColor.Green, PearlColor.Purple, PearlColor.Gold, PearlColor.Black],
    targetPearls: 46,
    moveLimit: 37,
    starScoreThresholds: [6600, 12400, 17800],
    difficulty: 5,
    coinReward: 40,
    firstClearBonus: 60,
    availablePowerups: ['x2_score', 'bomb_item', 'fish_helper'],
  }),
];

export class BubbleStageSelection {
  public static selectedStage = 1;
}

export function getBubbleStageConfig(stageId: number): BubbleStageConfig | undefined {
  return BUBBLE_STAGE_CONFIGS.find((stageConfig) => stageConfig.stageId === stageId);
}
