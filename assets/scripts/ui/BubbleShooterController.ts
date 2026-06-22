import {
  _decorator,
  BlockInputEvents,
  Button,
  Color,
  Component,
  director,
  EventMouse,
  EventTouch,
  Graphics,
  input,
  Input,
  Label,
  Layers,
  Node,
  resources,
  Sprite,
  SpriteFrame,
  tween,
  Tween,
  UIOpacity,
  UITransform,
  Vec3,
  Widget,
} from 'cc';
import { BubbleStageConfig, BubbleStageSelection, getBubbleStageConfig } from '../data/BubbleStageData';
import { SaveManager } from '../core/SaveManager';
import { BubblePearl } from '../minigames/bubble_shooter/BubblePearl';
import { BubblePearlBoardPreview } from '../minigames/bubble_shooter/PearlBoardPreview';
import {
  getPearlColorName,
  getPearlFallbackColor,
  getPearlSpriteAssetName,
  PearlColor,
} from '../minigames/bubble_shooter/PearlColorSystem';

const { ccclass, property } = _decorator;

const DESIGN_WIDTH = 1440;
const DESIGN_HEIGHT = 3200;
const RESOURCE_ROOT = 'bubble-shooter';
const CURRENT_PEARL_FINAL_SIZE = 154;
const NEXT_PEARL_FINAL_SIZE = 118;
const AIM_DOT_COUNT = 20;
const AIM_DOT_START_OFFSET = 200;
const AIM_DOT_START_SIZE = 22;
const AIM_DOT_END_SIZE = 10;
const AIM_DOT_START_ALPHA = 238;
const AIM_DOT_END_ALPHA = 70;
const AIM_DOT_HALO_START_ALPHA = 86;
const AIM_DOT_HALO_END_ALPHA = 18;
const AIM_DOT_SPACING = 70;
const MIN_SHOOT_ANGLE_DEGREES = 15;
const MAX_SHOOT_ANGLE_DEGREES = 165;
const SWAP_ANIMATION_DURATION = 0.18;
const PEARL_BOARD_Y = 600;
const PROJECTILE_MAX_STEP_DISTANCE = 120;
const SCORE_STAR_FIXED_PROGRESS_THRESHOLDS = [0.3, 0.6, 0.9];
const SCORE_STAR_EDGE_PADDING_RATIO = 0.3;

enum BubbleShooterGameState {
  Ready = 'Ready',
  Aiming = 'Aiming',
  Shooting = 'Shooting',
  Resolving = 'Resolving',
  Paused = 'Paused',
  Win = 'Win',
  Lose = 'Lose',
}

@ccclass('BubbleShooterController')
export class BubbleShooterController extends Component {
  @property
  public shootSpeed = 3200;

  private safeArea!: Node;
  private topHud!: Node;
  private scoreSection?: Node;
  private targetSection?: Node;
  private boardBackdrop?: Node;
  private pearlBoard?: Node;
  private pearlBoardController?: BubblePearlBoardPreview;
  private shooterArea!: Node;
  private nextPearlGroup?: Node;
  private hmeeLek?: Node;
  private currentPearl?: Node;
  private nextPearl?: Node;
  private aimGuide?: Node;
  private currentPearlSprite?: Sprite;
  private nextPearlSprite?: Sprite;
  private currentPearlFallback?: Node;
  private nextPearlFallback?: Node;
  private backButton!: Node;
  private pauseButton!: Node;
  private scoreFill!: Node;
  private targetValueLabel?: Label;
  private scoreValueLabel?: Label;
  private nextBallsLeftLabel?: Label;
  private nextBallsShadowLabel?: Label;
  private resultOverlay?: Node;
  private resultPanel?: Node;
  private resultTitleLabel?: Label;
  private resultScoreLabel?: Label;
  private resultBestScoreLabel?: Label;
  private resultRemainingBallsLabel?: Label;
  private resultRewardLabel?: Label;
  private resultHeartLabel?: Label;
  private resultEconomyIconNode?: Node;
  private resultEconomyIcon?: Sprite;
  private resultStarsLabel?: Label;
  private resultNextButton?: Node;
  private pausePanel?: Node;
  private readonly scoreBarWidth = 480;
  private readonly scoreBarHeight = 38;
  private readonly scoreStarSize = 72;
  private scoreStarNodes: Node[] = [];
  private scoreStarSprites: Sprite[] = [];
  private scoreStarFallbackLabels: Label[] = [];
  private scoreStarRenderedFilledStates = [false, false, false];
  private scoreStarFilledSpriteFrame?: SpriteFrame;
  private scoreStarEmptySpriteFrame?: SpriteFrame;
  private canvasWidth = DESIGN_WIDTH;
  private canvasHeight = DESIGN_HEIGHT;
  private isAiming = false;
  private isShooting = false;
  private aimDirection = new Vec3(0, 1, 0);
  private activeProjectile?: Node;
  private projectileVelocity = new Vec3();
  private aimDots: Node[] = [];
  private currentPearlColor: PearlColor = PearlColor.Blue;
  private nextPearlColor: PearlColor = PearlColor.Pink;
  private canSwapThisTurn = true;
  private isSwapping = false;
  private gameState = BubbleShooterGameState.Ready;
  private previousGameState = BubbleShooterGameState.Ready;
  private score = 0;
  private displayedScore = 0;
  private readonly scoreTweenState = { value: 0 };
  private scoreStarFilledStates = [false, false, false];
  private clearedCount = 0;
  private initialBoardPearlCount = 0;
  private targetLeft = 0;
  private ballsLeft = 0;
  private lastResultCoinReward = 0;

  private get currentStageConfig() {
    return getBubbleStageConfig(BubbleStageSelection.selectedStage) ?? getBubbleStageConfig(1);
  }

  protected onLoad(): void {
    this.node.layer = Layers.Enum.UI_2D;
    this.ensureCanvasSize();
    this.clearPreviousLayout();
    this.initializeStageState();
    this.preloadScoreStarSpriteFrames();

    this.setupBackground();
    this.setupSafeArea();
    this.setupTopHUD();
    this.setupScoreBar();
    this.bindScenePearlBoard();
    this.bindPearlBoardController();
    this.applyStageConfigToBoard();
    this.setupBoardAreaFrame();
    this.setupShooterArea();
    this.setupResultPanel();
    this.setupPausePanel();
    this.applyLayoutZOrder();
    this.bindButtons();
    this.bindAimInput();
    this.refreshStageHud();
  }

  protected start(): void {
    this.ensurePearlBoardVisible();
    this.aimGuide?.setSiblingIndex(this.node.children.length - 1);
    this.resultPanel?.setSiblingIndex(this.node.children.length - 1);
    this.pausePanel?.setSiblingIndex(this.node.children.length - 1);
  }

  protected onDestroy(): void {
    input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
    input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
    input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    input.off(Input.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    input.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
    input.off(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
    input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);
    Tween.stopAllByTarget(this.scoreTweenState);
  }

  protected update(deltaTime: number): void {
    this.updateProjectile(deltaTime);
  }

  public backToStageSelect(): void {
    console.log('[BubbleShooterController] Back clicked. Loading StageSelect.');
    director.loadScene('StageSelect');
  }

  private onPauseClicked(): void {
    if (!this.canPauseGame()) {
      console.log('[BubbleShooter] pause ignored:', this.gameState);
      return;
    }

    this.previousGameState = this.gameState;
    if (this.isAiming || this.gameState === BubbleShooterGameState.Aiming) {
      this.cancelAim();
    }
    this.hideAimLine();

    this.gameState = BubbleShooterGameState.Paused;
    if (this.pausePanel) {
      this.pausePanel.active = true;
      this.pausePanel.setSiblingIndex(this.node.children.length - 1);
    }

    console.log('[BubbleShooter] paused from', this.previousGameState);
  }

  private initializeStageState(): void {
    const stageConfig = this.getResolvedStageConfig();
    this.score = 0;
    this.displayedScore = 0;
    this.scoreTweenState.value = 0;
    this.scoreStarFilledStates = [false, false, false];
    this.clearedCount = 0;
    this.lastResultCoinReward = 0;
    this.targetLeft = stageConfig.clearTarget;
    this.ballsLeft = stageConfig.moveLimit;
    this.gameState = BubbleShooterGameState.Ready;
    this.canSwapThisTurn = true;
    this.isSwapping = false;

    console.log('[BubbleShooter] start stage', {
      stageId: stageConfig.stageId,
      target: stageConfig.clearTarget,
      ballsLeft: stageConfig.moveLimit,
      allowedColors: stageConfig.allowedColors.map((color) => getPearlColorName(color)),
    });
  }

  private getResolvedStageConfig(): BubbleStageConfig {
    return this.currentStageConfig ?? {
      stageId: 1,
      rowCount: 4,
      columnCount: 6,
      allowedColors: [PearlColor.Blue, PearlColor.Pink, PearlColor.Green],
      clearTarget: 12,
      moveLimit: 25,
      scorePerPearl: 100,
      floatingBonus: 150,
      remainingShotBonus: 500,
      clearBonus: 1000,
      starScoreThresholds: [1500, 3000, 5000],
      targetPearls: 12,
      maxShots: 25,
      unlocked: true,
    };
  }

  private ensureCanvasSize(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    if (transform.width <= 0 || transform.height <= 0) {
      transform.setContentSize(DESIGN_WIDTH, DESIGN_HEIGHT);
    }

    this.canvasWidth = transform.width > 0 ? transform.width : DESIGN_WIDTH;
    this.canvasHeight = transform.height > 0 ? transform.height : DESIGN_HEIGHT;
  }

  private clearPreviousLayout(): void {
    const generatedNodeNames = [
      'Background',
      'SafeArea',
      'TopHUD',
      'StageLabel',
      'ComingSoonLabel',
      'BackButton',
      'PauseButton',
      'BoardBackdrop',
      'ShooterArea',
      'AimGuide',
      'BottomHUD',
      'ResultPanel',
      'PausePanel',
    ];

    for (const child of [...this.node.children]) {
      if (generatedNodeNames.indexOf(child.name) >= 0) {
        child.removeFromParent();
        child.destroy();
      }
    }
  }

  private setupBackground(): void {
    const background = this.createNode('Background', this.node);
    background.setSiblingIndex(0);
    background.setPosition(Vec3.ZERO);
    this.setSize(background, this.canvasWidth, this.canvasHeight);
    this.addFullStretchWidget(background);

    const sprite = background.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.type = Sprite.Type.SIMPLE;

    // Placeholder fallback while the imported Bubble Shooter background is unavailable.
    this.drawRoundedRect(background, this.canvasWidth, this.canvasHeight, new Color(92, 203, 255, 255), 0);
    this.loadSpriteFrame('bubble_background', (spriteFrame) => {
      sprite.spriteFrame = spriteFrame;
    });
  }

  private setupSafeArea(): void {
    this.safeArea = this.createNode('SafeArea', this.node);
    this.safeArea.setPosition(Vec3.ZERO);
    this.setSize(this.safeArea, this.canvasWidth, this.canvasHeight);
    this.addSafeAreaWidget(this.safeArea);
  }

  private setupTopHUD(): void {
    this.topHud = this.createNode('TopHUD', this.safeArea);
    this.topHud.setPosition(0, this.canvasHeight / 2 - 360);
    this.setSize(this.topHud, DESIGN_WIDTH, 650);

    const headerRibbon = this.createNode('TopHudRibbon', this.topHud);
    headerRibbon.setPosition(0, 225);
    this.setSize(headerRibbon, 1210, 174);
    this.decorateRoundedPanel(
      headerRibbon,
      1210,
      174,
      64,
      new Color(40, 129, 183, 154),
      new Color(8, 38, 72, 58),
      new Color(255, 255, 255, 42),
    );

    this.backButton = this.createIconButton('BackButton', this.topHud, -602, 235, 'icon_back', 'Back');

    const stagePill = this.createNode('StagePill', this.topHud);
    stagePill.setPosition(0, 235);
    this.setSize(stagePill, 520, 124);
    this.decorateRoundedPanel(
      stagePill,
      520,
      124,
      54,
      new Color(255, 255, 255, 246),
      new Color(15, 68, 107, 84),
      new Color(255, 238, 163, 58),
    );
    this.createLabel(
      'StageLabel',
      stagePill,
      `Stage ${BubbleStageSelection.selectedStage}`,
      0,
      0,
      64,
      new Color(29, 102, 150, 255),
      460,
      96,
    );

    this.pauseButton = this.createIconButton('PauseButton', this.topHud, 602, 235, 'icon_pause', 'Pause');

    this.targetSection = this.createNode('TargetSection', this.topHud);
    this.targetSection.setPosition(410, 24);
    this.setSize(this.targetSection, 430, 166);
    this.decorateRoundedPanel(
      this.targetSection,
      430,
      166,
      48,
      new Color(255, 255, 255, 240),
      new Color(12, 68, 107, 78),
      new Color(255, 244, 178, 50),
    );
    this.createLabel('TargetTitleLabel', this.targetSection, 'เป้าหมาย', 0, 42, 34, new Color(49, 133, 181, 235), 360, 52);
    this.targetValueLabel = this.createLabel(
      'TargetValueLabel',
      this.targetSection,
      `เหลือ ${this.targetLeft} ลูก`,
      0,
      -18,
      42,
      new Color(26, 86, 126, 255),
      390,
      72,
    );

    console.log('[BubbleShooter] setupTopHUD complete');
  }

  private setupScoreBar(): void {
    this.scoreSection = this.createNode('ScoreSection', this.topHud);
    this.scoreSection.setPosition(-410, 24);
    this.setSize(this.scoreSection, 640, 184);
    this.decorateRoundedPanel(
      this.scoreSection,
      640,
      184,
      52,
      new Color(255, 255, 255, 242),
      new Color(12, 68, 107, 82),
      new Color(255, 245, 188, 48),
    );

    const scoreTrackShadow = this.createBar(
      'ScoreBarTrackShadow',
      this.scoreSection,
      0,
      -34,
      this.scoreBarWidth + 34,
      this.scoreBarHeight + 28,
      new Color(21, 95, 139, 58),
      32,
    );
    const scoreBarBackground = this.createBar(
      'ScoreBarBackground',
      this.scoreSection,
      0,
      -34,
      this.scoreBarWidth,
      this.scoreBarHeight,
      new Color(79, 168, 213, 174),
      19,
    );
    this.scoreFill = this.createBar(
      'ScoreBarFill',
      this.scoreSection,
      -this.scoreBarWidth / 2,
      -34,
      0,
      this.scoreBarHeight,
      new Color(255, 220, 78, 248),
      19,
    );
    scoreTrackShadow.setSiblingIndex(3);
    scoreBarBackground.setSiblingIndex(4);
    this.scoreFill.setSiblingIndex(5);

    this.scoreStarNodes = [];
    this.scoreStarSprites = [];
    this.scoreStarFallbackLabels = [];
    this.scoreStarRenderedFilledStates = [false, false, false];
    const starPositions = this.getScoreStarPositions();
    starPositions.forEach((x, index) => {
      const star = this.createNode(`Star${index + 1}`, this.scoreSection);
      star.setPosition(x, -34);
      star.setScale(1, 1, 1);
      this.setSize(star, this.scoreStarSize, this.scoreStarSize);

      const visual = this.createNode(`Star${index + 1}Icon`, star);
      visual.setPosition(Vec3.ZERO);
      this.setSize(visual, this.scoreStarSize, this.scoreStarSize);

      const sprite = visual.addComponent(Sprite);
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
      sprite.type = Sprite.Type.SIMPLE;

      const fallbackLabel = this.createLabel(
        `Star${index + 1}FallbackLabel`,
        star,
        '☆',
        0,
        0,
        56,
        new Color(255, 255, 255, 255),
        72,
        72,
      );

      this.scoreStarNodes.push(star);
      this.scoreStarSprites.push(sprite);
      this.scoreStarFallbackLabels.push(fallbackLabel);
      star.setSiblingIndex(this.scoreSection?.children.length ?? 2 + index);
      this.applyScoreStarSprite(index, false);

      const starTransform = star.getComponent(UITransform);
      const starPosition = star.position;
      const starScale = star.scale;
      console.log('[BubbleShooter] score star created', {
        name: star.name,
        position: { x: starPosition.x, y: starPosition.y, z: starPosition.z },
        contentSize: starTransform ? { width: starTransform.width, height: starTransform.height } : null,
        scale: { x: starScale.x, y: starScale.y, z: starScale.z },
        siblingIndex: star.getSiblingIndex(),
      });
    });

    this.scoreValueLabel = this.createLabel('ScoreValueLabel', this.scoreSection, 'คะแนน 0', 0, 50, 44, new Color(30, 92, 132, 255), 560, 72);
    this.ensureScoreStarsOnTop();
    this.logTopHudLayout();

    console.log('[BubbleShooter] setupScoreBar complete');
  }

  private logTopHudLayout(): void {
    const scoreBarBackground = this.scoreSection?.getChildByName('ScoreBarBackground');
    const scoreLabelNode = this.scoreValueLabel?.node;
    const targetLabelNode = this.targetValueLabel?.node;

    console.log('[BubbleShooter] TopHUD layout', {
      topHud: this.getNodeLayoutDebug(this.topHud),
      scoreSection: this.scoreSection ? this.getNodeLayoutDebug(this.scoreSection) : null,
      targetSection: this.targetSection ? this.getNodeLayoutDebug(this.targetSection) : null,
      scoreBar: scoreBarBackground
        ? {
            position: this.getPositionDebug(scoreBarBackground),
            width: this.scoreBarWidth,
            height: this.scoreBarHeight,
          }
        : null,
      stars: this.scoreStarNodes.map((star) => this.getNodeLayoutDebug(star)),
      scoreLabel: scoreLabelNode ? this.getNodeLayoutDebug(scoreLabelNode) : null,
      targetLabel: targetLabelNode ? this.getNodeLayoutDebug(targetLabelNode) : null,
    });
  }

  private getNodeLayoutDebug(node: Node): {
    name: string;
    position: { x: number; y: number; z: number };
    contentSize: { width: number; height: number } | null;
    scale: { x: number; y: number; z: number };
    siblingIndex: number;
  } {
    const transform = node.getComponent(UITransform);
    const scale = node.scale;

    return {
      name: node.name,
      position: this.getPositionDebug(node),
      contentSize: transform ? { width: transform.width, height: transform.height } : null,
      scale: { x: scale.x, y: scale.y, z: scale.z },
      siblingIndex: node.getSiblingIndex(),
    };
  }

  private getPositionDebug(node: Node): { x: number; y: number; z: number } {
    const position = node.position;
    return { x: position.x, y: position.y, z: position.z };
  }

  private bindScenePearlBoard(): void {
    this.pearlBoard = this.node.getChildByName('PearlBoard') ?? undefined;
    if (!this.pearlBoard) {
      console.warn('[BubbleShooterController] PearlBoard is not found in the scene.');
      return;
    }

    this.pearlBoard.active = true;
    this.pearlBoard.setPosition(0, PEARL_BOARD_Y, 0);
  }

  private bindPearlBoardController(): void {
    const controllerNode = this.node.getChildByName('PearlBoardController');
    this.pearlBoardController = controllerNode?.getComponent(BubblePearlBoardPreview) ?? undefined;

    if (!this.pearlBoardController) {
      console.warn('[BubbleShooterController] BubblePearlBoardPreview is not found on PearlBoardController.');
    }
  }

  private applyStageConfigToBoard(): void {
    if (!this.pearlBoardController) {
      return;
    }

    const stageConfig = this.getResolvedStageConfig();
    this.pearlBoardController.configureStage(stageConfig.rowCount, stageConfig.columnCount, stageConfig.allowedColors, stageConfig.clearTarget);
    this.initialBoardPearlCount = this.pearlBoardController.getPearlCount();
    this.targetLeft = this.initialBoardPearlCount;
    console.log('[BubbleShooter] target synced with board', {
      targetLeft: this.targetLeft,
      boardPearls: this.pearlBoardController.getPearlCount(),
    });
  }

  private setupBoardAreaFrame(): void {
    this.boardBackdrop = this.createNode('BoardBackdrop', this.node);
    this.boardBackdrop.setPosition(0, 640);
    this.setSize(this.boardBackdrop, 1110, 1088);
    this.decorateRoundedPanel(
      this.boardBackdrop,
      1110,
      1088,
      84,
      new Color(255, 255, 255, 24),
      new Color(38, 128, 183, 18),
      new Color(255, 255, 255, 18),
    );

    const boardWindow = this.createNode('BoardWindow', this.boardBackdrop);
    boardWindow.setPosition(0, 8);
    this.setSize(boardWindow, 1000, 948);
    this.drawRoundedRect(boardWindow, 1000, 948, new Color(178, 232, 255, 20), 72);

    const topRail = this.createNode('BoardTopRail', this.boardBackdrop);
    topRail.setPosition(0, 502);
    this.setSize(topRail, 760, 34);
    this.drawRoundedRect(topRail, 760, 34, new Color(255, 255, 255, 48), 17);

    const bottomGlow = this.createNode('BoardBottomGlow', this.boardBackdrop);
    bottomGlow.setPosition(0, -476);
    this.setSize(bottomGlow, 700, 58);
    this.drawRoundedRect(bottomGlow, 700, 58, new Color(255, 246, 190, 20), 29);
  }

  private setupShooterArea(): void {
    this.shooterArea = this.createNode('ShooterArea', this.safeArea);
    this.shooterArea.setPosition(0, -this.canvasHeight / 2 + 800);
    this.setSize(this.shooterArea, DESIGN_WIDTH, 780);

    const nextPearlGroup = this.createNode('NextPearlGroup', this.shooterArea);
    this.nextPearlGroup = nextPearlGroup;
    nextPearlGroup.setPosition(-462, -150);
    this.setSize(nextPearlGroup, 330, 330);

    const nextPearlStandShadow = this.createNode('NextPearlStandShadow', nextPearlGroup);
    nextPearlStandShadow.setPosition(0, -32);
    this.setSize(nextPearlStandShadow, 278, 232);
    this.drawRoundedRect(nextPearlStandShadow, 278, 232, new Color(18, 82, 132, 46), 60);

    const nextPearlStand = this.createNode('NextPearlStand', nextPearlGroup);
    nextPearlStand.setPosition(0, -20);
    this.setSize(nextPearlStand, 278, 232);
    this.drawRoundedRect(nextPearlStand, 278, 232, new Color(255, 253, 235, 224), 60);

    const nextPearlStandHighlight = this.createNode('NextPearlStandHighlight', nextPearlGroup);
    nextPearlStandHighlight.setPosition(0, 62);
    this.setSize(nextPearlStandHighlight, 220, 46);
    this.drawRoundedRect(nextPearlStandHighlight, 220, 46, new Color(180, 230, 255, 80), 23);

    const nextPearlSeat = this.createNode('NextPearlSeat', nextPearlGroup);
    nextPearlSeat.setPosition(0, 14);
    nextPearlSeat.setScale(1.34, 0.48, 1);
    this.setSize(nextPearlSeat, 142, 142);
    this.drawCircle(nextPearlSeat, 71, new Color(117, 204, 246, 78));

    const nextPearlLabelBadge = this.createNode('NextPearlLabelBadge', nextPearlGroup);
    nextPearlLabelBadge.setPosition(-70, 88);
    this.setSize(nextPearlLabelBadge, 136, 50);
    this.drawRoundedRect(nextPearlLabelBadge, 136, 50, new Color(255, 255, 255, 232), 25);
    this.createLabel('NextPearlLabel', nextPearlLabelBadge, 'Next', 0, 0, 30, new Color(34, 111, 153, 255), 122, 44);

    this.nextPearl = this.createNode('NextPearl', nextPearlGroup);
    this.nextPearl.setPosition(0, 10);
    this.setSize(this.nextPearl, NEXT_PEARL_FINAL_SIZE, NEXT_PEARL_FINAL_SIZE);
    this.logPearlNodeDebug(this.nextPearl);
    this.nextPearlSprite = this.createLauncherPearlRender(
      this.nextPearl,
      'NextPearlVisual',
      'NextPearlFallback',
      NEXT_PEARL_FINAL_SIZE,
    );
    this.bindNextPearlSwapInput();

    const nextBallsBadge = this.createNode('NextBallsBadge', nextPearlGroup);
    nextBallsBadge.setPosition(0, -122);
    this.setSize(nextBallsBadge, 170, 76);
    this.drawRoundedRect(nextBallsBadge, 170, 76, new Color(255, 255, 245, 222), 38);

    this.nextBallsShadowLabel = this.createLabel(
      'NextBallsShadowLabel',
      nextPearlGroup,
      `${this.ballsLeft}`,
      3,
      -126,
      54,
      new Color(111, 84, 24, 190),
      170,
      76,
    );

    this.nextBallsLeftLabel = this.createLabel(
      'NextBallsLeftLabel',
      nextPearlGroup,
      `${this.ballsLeft}`,
      0,
      -122,
      54,
      new Color(255, 229, 74, 255),
      170,
      76,
    );

    this.hmeeLek = this.createNode('HmeeLek', this.shooterArea);
    this.hmeeLek.setPosition(0, -126);
    this.hmeeLek.setScale(0.82, 0.82, 1);
    this.setSize(this.hmeeLek, 466, 736);
    this.createLabel('HmeeLekPlaceholderLabel', this.hmeeLek, 'Hmee Lek', 0, 0, 48, new Color(33, 91, 124, 255), 340, 100);
    this.loadSpriteFrame('hmee_lek_shooter_empty', (spriteFrame) => {
      this.hmeeLek?.removeAllChildren();
      if (this.hmeeLek) {
        this.setSprite(this.hmeeLek, spriteFrame);
      }
    });

    this.currentPearl = this.createNode('CurrentPearl', this.shooterArea);
    this.currentPearl.setPosition(0, -190);
    this.setSize(this.currentPearl, CURRENT_PEARL_FINAL_SIZE, CURRENT_PEARL_FINAL_SIZE);
    this.logPearlNodeDebug(this.currentPearl);
    this.currentPearlSprite = this.createLauncherPearlRender(
      this.currentPearl,
      'CurrentPearlVisual',
      'CurrentPearlFallback',
      CURRENT_PEARL_FINAL_SIZE,
    );
    this.prepareLauncherPearls();

    this.aimGuide = this.createNode('AimGuide', this.node);
    this.aimGuide.setPosition(Vec3.ZERO);
    this.setSize(this.aimGuide, DESIGN_WIDTH, DESIGN_HEIGHT);
    this.createAimDots();
    this.hideAimLine();

    console.log('[BubbleShooter] setupShooterArea complete');
  }

  private setupResultPanel(): void {
    const previousOverlay = this.node.getChildByName('ResultOverlay');
    if (previousOverlay) {
      previousOverlay.removeFromParent();
      previousOverlay.destroy();
    }

    this.resultOverlay = this.createNode('ResultOverlay', this.node);
    this.resultOverlay.setPosition(Vec3.ZERO);
    this.setSize(this.resultOverlay, this.canvasWidth, this.canvasHeight);
    this.addFullStretchWidget(this.resultOverlay);
    this.drawRoundedRect(this.resultOverlay, this.canvasWidth, this.canvasHeight, new Color(7, 28, 48, 150), 0);
    this.resultOverlay.addComponent(BlockInputEvents);
    this.resultOverlay.active = false;

    this.resultPanel = this.createNode('ResultPanel', this.node);
    this.resultPanel.setPosition(0, 110);
    this.setSize(this.resultPanel, 1080, 1120);
    this.decorateRoundedPanel(
      this.resultPanel,
      1080,
      1120,
      72,
      new Color(255, 255, 255, 248),
      new Color(6, 42, 74, 124),
      new Color(255, 241, 166, 42),
    );
    this.resultPanel.addComponent(BlockInputEvents);

    const titleRibbon = this.createNode('ResultTitleRibbon', this.resultPanel);
    titleRibbon.setPosition(0, 430);
    this.setSize(titleRibbon, 760, 156);
    this.decorateRoundedPanel(
      titleRibbon,
      760,
      156,
      66,
      new Color(50, 151, 207, 238),
      new Color(12, 62, 101, 70),
      new Color(255, 255, 255, 54),
    );

    const scoreBackplate = this.createNode('ResultScoreBackplate', this.resultPanel);
    scoreBackplate.setPosition(0, -36);
    this.setSize(scoreBackplate, 860, 540);
    this.decorateRoundedPanel(
      scoreBackplate,
      860,
      540,
      54,
      new Color(235, 249, 255, 244),
      new Color(14, 73, 112, 48),
      new Color(255, 255, 255, 74),
    );

    const scoreGoldPill = this.createNode('ResultScoreGoldPill', scoreBackplate);
    scoreGoldPill.setPosition(0, 164);
    this.setSize(scoreGoldPill, 620, 98);
    this.drawRoundedRect(scoreGoldPill, 620, 98, new Color(255, 224, 88, 232), 44);

    const bestScorePill = this.createNode('ResultBestScorePill', scoreBackplate);
    bestScorePill.setPosition(0, 66);
    this.setSize(bestScorePill, 660, 78);
    this.drawRoundedRect(bestScorePill, 660, 78, new Color(255, 255, 255, 212), 36);

    const remainingPill = this.createNode('ResultRemainingPill', scoreBackplate);
    remainingPill.setPosition(0, -36);
    this.setSize(remainingPill, 680, 84);
    this.drawRoundedRect(remainingPill, 680, 84, new Color(101, 182, 220, 126), 38);

    const heartPill = this.createNode('ResultHeartPill', scoreBackplate);
    heartPill.setPosition(0, -116);
    this.setSize(heartPill, 660, 76);
    this.drawRoundedRect(heartPill, 660, 76, new Color(255, 211, 225, 142), 34);
    heartPill.active = false;

    const economyPill = this.createNode('ResultEconomyPill', scoreBackplate);
    economyPill.setPosition(0, -152);
    this.setSize(economyPill, 700, 104);
    this.drawRoundedRect(economyPill, 700, 104, new Color(255, 235, 148, 178), 44);

    this.resultEconomyIconNode = this.createNode('ResultEconomyIcon', scoreBackplate);
    this.resultEconomyIconNode.setPosition(-266, -152);
    this.setSize(this.resultEconomyIconNode, 88, 88);
    this.resultEconomyIcon = this.resultEconomyIconNode.addComponent(Sprite);
    this.resultEconomyIcon.sizeMode = Sprite.SizeMode.CUSTOM;
    this.resultEconomyIcon.type = Sprite.Type.SIMPLE;

    this.resultTitleLabel = this.createLabel('ResultTitleLabel', titleRibbon, 'WIN', 0, 2, 104, new Color(255, 255, 255, 255), 680, 130);
    this.resultStarsLabel = this.createLabel('ResultStarsLabel', this.resultPanel, '☆☆☆', 0, 292, 110, new Color(255, 219, 68, 255), 690, 128);
    this.resultScoreLabel = this.createLabel('ResultScoreLabel', scoreBackplate, 'คะแนน 0', 0, 164, 60, new Color(104, 73, 10, 255), 600, 88);
    this.resultBestScoreLabel = this.createLabel('ResultBestScoreLabel', scoreBackplate, 'คะแนนสูงสุด 0', 0, 66, 48, new Color(26, 88, 128, 255), 620, 72);
    this.resultRemainingBallsLabel = this.createLabel(
      'ResultRemainingBallsLabel',
      scoreBackplate,
      'เหลือลูกบอล 0 ลูก',
      0,
      -36,
      52,
      new Color(255, 255, 255, 248),
      640,
      82,
    );
    this.resultRewardLabel = this.createLabel(
      'ResultRewardLabel',
      scoreBackplate,
      'Coin +0',
      0,
      -152,
      68,
      new Color(104, 73, 10, 255),
      640,
      96,
    );
    this.resultHeartLabel = this.createLabel(
      'ResultHeartLabel',
      scoreBackplate,
      'Heart x5',
      0,
      -116,
      48,
      new Color(132, 58, 82, 255),
      620,
      72,
    );

    const retryButton = this.createResultButton('RetryButton', this.resultPanel, -370, -462, 'เล่นใหม่');
    const stageButton = this.createResultButton('ResultStageSelectButton', this.resultPanel, 0, -462, 'เลือกด่าน');
    this.resultNextButton = this.createResultButton('NextStageButton', this.resultPanel, 370, -462, 'ด่านต่อไป');

    retryButton.on(Button.EventType.CLICK, this.retryStage, this);
    stageButton.on(Button.EventType.CLICK, this.backToStageSelect, this);
    this.resultNextButton.on(Button.EventType.CLICK, this.openNextStage, this);
    this.resultPanel.active = false;
  }

  private setupPausePanel(): void {
    this.pausePanel = this.createNode('PausePanel', this.node);
    this.pausePanel.setPosition(Vec3.ZERO);
    this.setSize(this.pausePanel, 820, 640);
    this.drawRoundedRect(this.pausePanel, 820, 640, new Color(18, 62, 92, 238), 42);
    this.pausePanel.addComponent(BlockInputEvents);

    this.createLabel('PauseTitleLabel', this.pausePanel, 'พักเกม', 0, 210, 78, new Color(255, 255, 255, 255), 520, 110);

    const resumeButton = this.createPauseButton('PauseResumeButton', this.pausePanel, 0, 70, 'เล่นต่อ');
    const retryButton = this.createPauseButton('PauseRetryButton', this.pausePanel, 0, -65, 'เล่นใหม่');
    const stageSelectButton = this.createPauseButton('PauseStageSelectButton', this.pausePanel, 0, -200, 'เลือกด่าน');

    resumeButton.on(Button.EventType.CLICK, this.resumeGame, this);
    retryButton.on(Button.EventType.CLICK, this.retryStage, this);
    stageSelectButton.on(Button.EventType.CLICK, this.backToStageSelect, this);

    this.pausePanel.active = false;
  }

  private applyLayoutZOrder(): void {
    this.node.getChildByName('Background')?.setSiblingIndex(0);
    this.boardBackdrop?.setSiblingIndex(1);
    this.ensurePearlBoardVisible();
    this.safeArea.setSiblingIndex(3);
    this.shooterArea.setSiblingIndex(1);
    this.topHud.setSiblingIndex(3);

    const hmeeLek = this.shooterArea.getChildByName('HmeeLek');
    const currentPearl = this.shooterArea.getChildByName('CurrentPearl');
    const nextPearlGroup = this.shooterArea.getChildByName('NextPearlGroup');
    hmeeLek?.setSiblingIndex(0);
    currentPearl?.setSiblingIndex(1);
    nextPearlGroup?.setSiblingIndex(2);

    const nextPearlStandShadow = nextPearlGroup?.getChildByName('NextPearlStandShadow');
    const nextPearlStand = nextPearlGroup?.getChildByName('NextPearlStand');
    const nextPearlStandHighlight = nextPearlGroup?.getChildByName('NextPearlStandHighlight');
    const nextPearlSeat = nextPearlGroup?.getChildByName('NextPearlSeat');
    const nextPearlLabelBadge = nextPearlGroup?.getChildByName('NextPearlLabelBadge');
    const nextPearl = nextPearlGroup?.getChildByName('NextPearl');
    const nextBallsBadge = nextPearlGroup?.getChildByName('NextBallsBadge');
    const nextBallsShadowLabel = nextPearlGroup?.getChildByName('NextBallsShadowLabel');
    const nextBallsLeftLabel = nextPearlGroup?.getChildByName('NextBallsLeftLabel');
    nextPearlStandShadow?.setSiblingIndex(0);
    nextPearlStand?.setSiblingIndex(1);
    nextPearlStandHighlight?.setSiblingIndex(2);
    nextPearlSeat?.setSiblingIndex(3);
    nextPearl?.setSiblingIndex(4);
    nextPearlLabelBadge?.setSiblingIndex(5);
    nextBallsBadge?.setSiblingIndex(6);
    nextBallsShadowLabel?.setSiblingIndex(7);
    nextBallsLeftLabel?.setSiblingIndex(8);
    this.aimGuide?.setSiblingIndex(this.node.children.length - 1);
    this.resultPanel?.setSiblingIndex(this.node.children.length - 1);
    this.pausePanel?.setSiblingIndex(this.node.children.length - 1);
  }

  private ensurePearlBoardVisible(): void {
    if (!this.pearlBoard) {
      return;
    }

    this.pearlBoard.active = true;
    this.pearlBoard.setSiblingIndex((this.boardBackdrop?.getSiblingIndex() ?? 0) + 1);
  }

  public updateScoreProgress(score: number): void {
    const normalizedProgress = this.getScoreProgress(score);
    const fillWidth = this.scoreBarWidth * normalizedProgress;
    this.scoreFill.setPosition(-this.scoreBarWidth / 2 + fillWidth / 2, -34);
    this.setSize(this.scoreFill, fillWidth, this.scoreBarHeight);
    this.drawRoundedRect(this.scoreFill, fillWidth, this.scoreBarHeight, new Color(255, 220, 78, 248), 19);
    this.updateStars(score);
  }

  public updateStars(score: number): void {
    const thresholds = this.getResolvedStageConfig().starScoreThresholds;
    this.scoreStarNodes.forEach((star, index) => {
      const sprite = this.scoreStarSprites[index];
      if (!sprite) {
        return;
      }

      const isFilled = score >= thresholds[index];
      const shouldBounce = isFilled && !this.scoreStarFilledStates[index];
      const shouldRefreshVisual = this.scoreStarRenderedFilledStates[index] !== isFilled || !sprite.spriteFrame;
      this.scoreStarFilledStates[index] = this.scoreStarFilledStates[index] || isFilled;
      if (shouldRefreshVisual) {
        this.applyScoreStarSprite(index, isFilled);
      }

      if (shouldBounce) {
        this.playStarBounce(star);
      }
    });
    this.ensureScoreStarsOnTop();
  }

  private applyScoreStarSprite(index: number, isFilled: boolean): void {
    const star = this.scoreStarNodes[index];
    const sprite = this.scoreStarSprites[index];
    const fallbackLabel = this.scoreStarFallbackLabels[index];
    if (!star || !sprite || !fallbackLabel) {
      return;
    }

    this.scoreStarRenderedFilledStates[index] = isFilled;
    fallbackLabel.string = isFilled ? '★' : '☆';
    fallbackLabel.color = isFilled ? new Color(255, 241, 120, 255) : new Color(255, 255, 255, 245);
    const cachedSpriteFrame = isFilled ? this.scoreStarFilledSpriteFrame : this.scoreStarEmptySpriteFrame;
    if (cachedSpriteFrame) {
      sprite.spriteFrame = cachedSpriteFrame;
      fallbackLabel.node.active = false;
      return;
    }

    sprite.spriteFrame = null;
    fallbackLabel.node.active = true;
  }

  private playStarBounce(star: Node): void {
    Tween.stopAllByTarget(star);
    star.setScale(1, 1, 1);
    tween(star)
      .to(0.1, { scale: new Vec3(1.24, 1.24, 1) }, { easing: 'quadOut' })
      .to(0.12, { scale: new Vec3(0.96, 0.96, 1) }, { easing: 'quadInOut' })
      .to(0.1, { scale: new Vec3(1, 1, 1) }, { easing: 'quadOut' })
      .start();
  }

  private getScoreProgress(score: number): number {
    const maxScore = Math.max(1, this.getResolvedStageConfig().starScoreThresholds[2]);
    return Math.max(0, Math.min(score / maxScore, 1));
  }

  private getStarScoreProgressThresholds(): number[] {
    const thresholds = this.getResolvedStageConfig().starScoreThresholds;
    return thresholds.map((_threshold, index) => {
      const fixedThreshold = SCORE_STAR_FIXED_PROGRESS_THRESHOLDS[index];
      if (fixedThreshold !== undefined) {
        return fixedThreshold;
      }

      return (index + 1) / (thresholds.length + 1);
    });
  }

  private getScoreStarPositions(): number[] {
    const progressThresholds = this.getStarScoreProgressThresholds();
    const edgePadding = this.scoreStarSize * SCORE_STAR_EDGE_PADDING_RATIO;
    const minX = -this.scoreBarWidth / 2 + edgePadding;
    const maxX = this.scoreBarWidth / 2 - edgePadding;
    const trackWidth = Math.max(0, maxX - minX);

    // Star placement uses fixed visual ratios; score thresholds are used only by updateStars().
    return progressThresholds.map((threshold) => minX + trackWidth * Math.max(0, Math.min(threshold, 1)));
  }

  private preloadScoreStarSpriteFrames(): void {
    this.loadSpriteFrame('icon_star_filled', (spriteFrame) => {
      this.scoreStarFilledSpriteFrame = spriteFrame;
      this.refreshScoreStarSprites();
    });
    this.loadSpriteFrame('icon_star_empty', (spriteFrame) => {
      this.scoreStarEmptySpriteFrame = spriteFrame;
      this.refreshScoreStarSprites();
    });
  }

  private refreshScoreStarSprites(): void {
    const thresholds = this.getResolvedStageConfig().starScoreThresholds;
    this.scoreStarNodes.forEach((_star, index) => {
      this.applyScoreStarSprite(index, this.score >= thresholds[index]);
    });
  }

  private ensureScoreStarsOnTop(): void {
    if (!this.scoreSection) {
      return;
    }

    for (const star of this.scoreStarNodes) {
      if (star.isValid) {
        star.setSiblingIndex(this.scoreSection.children.length - 1);
      }
    }
  }

  private getEarnedStars(score = this.score): number {
    const thresholds = this.getResolvedStageConfig().starScoreThresholds;
    return thresholds.reduce((starCount, threshold) => score >= threshold ? starCount + 1 : starCount, 0);
  }

  private formatStars(stars: number): string {
    const filledStars = Math.max(0, Math.min(stars, 3));
    return `${'★'.repeat(filledStars)}${'☆'.repeat(3 - filledStars)}`;
  }

  private bindButtons(): void {
    const backButton = this.backButton.getComponent(Button) ?? this.backButton.addComponent(Button);
    backButton.interactable = true;
    this.backButton.off(Button.EventType.CLICK, this.backToStageSelect, this);
    this.backButton.on(Button.EventType.CLICK, this.backToStageSelect, this);

    const pauseButton = this.pauseButton.getComponent(Button) ?? this.pauseButton.addComponent(Button);
    pauseButton.interactable = true;
    this.pauseButton.off(Button.EventType.CLICK, this.onPauseClicked, this);
    this.pauseButton.on(Button.EventType.CLICK, this.onPauseClicked, this);
  }

  private canPauseGame(): boolean {
    return (
      this.gameState === BubbleShooterGameState.Ready ||
      this.gameState === BubbleShooterGameState.Aiming ||
      this.gameState === BubbleShooterGameState.Shooting ||
      this.gameState === BubbleShooterGameState.Resolving
    );
  }

  private resumeGame(): void {
    if (this.gameState !== BubbleShooterGameState.Paused) {
      return;
    }

    if (this.pausePanel) {
      this.pausePanel.active = false;
    }

    this.isAiming = false;
    this.isShooting = false;
    this.hideAimLine();
    this.clearPausedProjectile();

    if (this.currentPearl) {
      this.currentPearl.active = true;
    }
    if (this.nextPearl) {
      this.nextPearl.active = true;
    }

    this.previousGameState = BubbleShooterGameState.Ready;
    this.gameState = BubbleShooterGameState.Ready;
    console.log('[BubbleShooter] resumed');
  }

  private clearPausedProjectile(): void {
    if (!this.activeProjectile) {
      return;
    }

    this.activeProjectile.destroy();
    this.activeProjectile = undefined;
    this.projectileVelocity.set(0, 0, 0);
  }

  private retryStage(): void {
    if (!SaveManager.canPlayStage()) {
      console.warn('[BubbleShooter] Retry blocked: no hearts left.');
      director.loadScene('StageSelect');
      return;
    }

    director.loadScene('BubbleShooter');
  }

  private openNextStage(): void {
    const nextStageId = this.getResolvedStageConfig().stageId + 1;
    if (!getBubbleStageConfig(nextStageId)) {
      return;
    }

    if (!SaveManager.canPlayStage()) {
      console.warn('[BubbleShooter] Next stage blocked: no hearts left.');
      director.loadScene('StageSelect');
      return;
    }

    BubbleStageSelection.selectedStage = nextStageId;
    director.loadScene('BubbleShooter');
  }

  private hasNextStage(): boolean {
    return getBubbleStageConfig(this.getResolvedStageConfig().stageId + 1) !== undefined;
  }

  private refreshStageHud(): void {
    this.animateDisplayedScoreTo(this.score);

    if (this.targetValueLabel) {
      this.targetValueLabel.string = `เหลือ ${this.targetLeft} ลูก`;
    }

    if (this.nextBallsLeftLabel) {
      this.nextBallsLeftLabel.string = `${this.ballsLeft}`;
    }
    if (this.nextBallsShadowLabel) {
      this.nextBallsShadowLabel.string = `${this.ballsLeft}`;
    }

    this.updateScoreProgress(this.score);
  }

  private animateDisplayedScoreTo(targetScore: number): void {
    if (!this.scoreValueLabel) {
      this.displayedScore = targetScore;
      this.scoreTweenState.value = targetScore;
      return;
    }

    if (this.displayedScore === targetScore) {
      this.updateScoreValueLabel(targetScore);
      return;
    }

    Tween.stopAllByTarget(this.scoreTweenState);
    this.scoreTweenState.value = this.displayedScore;
    tween(this.scoreTweenState)
      .to(
        0.24,
        { value: targetScore },
        {
          onUpdate: () => {
            this.displayedScore = Math.round(this.scoreTweenState.value);
            this.updateScoreValueLabel(this.displayedScore);
          },
        },
      )
      .call(() => {
        this.displayedScore = targetScore;
        this.scoreTweenState.value = targetScore;
        this.updateScoreValueLabel(targetScore);
      })
      .start();
  }

  private updateScoreValueLabel(score: number): void {
    if (this.scoreValueLabel) {
      this.scoreValueLabel.string = `คะแนน ${score}`;
    }
  }

  private reduceBallAfterRealShot(color: PearlColor): void {
    this.ballsLeft = Math.max(0, this.ballsLeft - 1);
    this.refreshStageHud();
    console.log('[BubbleShooter] shoot pearl', {
      color: getPearlColorName(color),
      ballsLeft: this.ballsLeft,
    });
  }

  private applyResolveResult(matchRemovedCount: number, floatingRemovedCount: number): void {
    const stageConfig = this.getResolvedStageConfig();
    console.log('[BubbleShooter] match removed count', matchRemovedCount);
    console.log('[BubbleShooter] floating removed count', floatingRemovedCount);

    if (matchRemovedCount > 0 || floatingRemovedCount > 0) {
      const scoreGain = matchRemovedCount * stageConfig.scorePerPearl + floatingRemovedCount * stageConfig.floatingBonus;
      this.score += scoreGain;
      this.clearedCount += matchRemovedCount + floatingRemovedCount;

      console.log('[BubbleShooter] score update', {
        score: this.score,
        scoreGain,
        matchRemovedCount,
        floatingRemovedCount,
      });
    }

    this.syncTargetLeftWithBoard();
    console.log('[BubbleShooter] target update', {
      targetLeft: this.targetLeft,
      boardPearls: this.pearlBoardController?.getPearlCount() ?? null,
      clearedCount: this.clearedCount,
    });
    this.refreshStageHud();
    this.updateAvailableShootColors();
  }

  private syncTargetLeftWithBoard(): void {
    this.targetLeft = this.pearlBoardController?.getPearlCount() ?? this.targetLeft;
  }

  private updateAvailableShootColors(): PearlColor[] {
    const colors = this.pearlBoardController?.getAvailableColorsFromBoard() ?? [];
    console.log('[BubbleShooter] available colors update', colors.map((color) => getPearlColorName(color)));
    return colors;
  }

  private rerollPearlIfColorNotAvailable(slot: 'current' | 'next', availableColors: PearlColor[]): void {
    if (availableColors.length === 0) {
      return;
    }

    const currentColor = slot === 'current' ? this.currentPearlColor : this.nextPearlColor;
    if (availableColors.indexOf(currentColor) >= 0) {
      return;
    }

    const nextColor = this.pearlBoardController?.pickLauncherPearlColor() ?? availableColors[0];
    if (slot === 'current') {
      this.currentPearlColor = nextColor;
      this.refreshCurrentPearlVisual();
    } else {
      this.nextPearlColor = nextColor;
      this.refreshNextPearlVisual();
    }

    console.log(`[BubbleShooter] reroll ${slot} pearl because color is gone`, {
      from: getPearlColorName(currentColor),
      to: getPearlColorName(nextColor),
    });
  }

  private checkWinLoseAfterResolve(): boolean {
    if (this.targetLeft <= 0 || !this.pearlBoardController?.hasPearls()) {
      this.finishGame(BubbleShooterGameState.Win);
      return true;
    }

    if (this.ballsLeft <= 0 && this.targetLeft > 0) {
      this.finishGame(BubbleShooterGameState.Lose);
      return true;
    }

    return false;
  }

  private finishGame(finalState: BubbleShooterGameState.Win | BubbleShooterGameState.Lose): void {
    if (this.gameState === BubbleShooterGameState.Win || this.gameState === BubbleShooterGameState.Lose) {
      return;
    }

    if (finalState === BubbleShooterGameState.Win) {
      this.applyWinScoreBonus();
      this.grantWinCoins();
      this.saveWinProgress();
    } else {
      SaveManager.consumeHeart();
    }

    this.gameState = finalState;
    this.isAiming = false;
    this.isShooting = false;
    this.isSwapping = false;
    this.hideAimLine();
    this.refreshStageHud();

    if (this.currentPearl) {
      this.currentPearl.active = false;
    }

    this.prepareGameplayVisualsForResult();

    this.showResultPanel(finalState);
    console.log(`[BubbleShooter] Game ${finalState}`);
  }

  private applyWinScoreBonus(): void {
    const stageConfig = this.getResolvedStageConfig();
    const bonusScore = this.ballsLeft * stageConfig.remainingShotBonus + stageConfig.clearBonus;
    this.score += bonusScore;

    console.log('[BubbleShooter] win bonus applied', {
      remainingShots: this.ballsLeft,
      remainingShotBonus: stageConfig.remainingShotBonus,
      clearBonus: stageConfig.clearBonus,
      bonusScore,
      score: this.score,
    });
  }

  private saveWinProgress(): void {
    const stageConfig = this.getResolvedStageConfig();
    const stageKey = `${stageConfig.stageId}`;
    const earnedStars = this.getEarnedStars(this.score);

    SaveManager.updateData((data) => {
      const progress = data.minigames.bubbleShooter;
      progress.cleared[stageKey] = true;
      progress.bestScore[stageKey] = Math.max(progress.bestScore[stageKey] ?? 0, this.score);
      progress.stars[stageKey] = Math.max(progress.stars[stageKey] ?? 0, earnedStars);
      progress.unlockedStage = Math.max(progress.unlockedStage, stageConfig.stageId + 1);
    });

    console.log('[BubbleShooter] progress saved', {
      stageId: stageConfig.stageId,
      score: this.score,
      stars: earnedStars,
    });
  }

  private grantWinCoins(): void {
    const stageConfig = this.getResolvedStageConfig();
    const stageKey = `${stageConfig.stageId}`;
    const wasCleared = SaveManager.getData().minigames.bubbleShooter.cleared[stageKey] ?? false;
    const reward = Math.max(0, Math.floor(stageConfig.coinReward ?? 0));
    const firstClearBonus = wasCleared ? 0 : Math.max(0, Math.floor(stageConfig.firstClearBonus ?? 0));
    const totalReward = reward + firstClearBonus;
    this.lastResultCoinReward = totalReward;

    if (totalReward > 0) {
      SaveManager.addCoins(totalReward);
    }

    console.log('[BubbleShooter] coin reward granted', {
      stageId: stageConfig.stageId,
      reward,
      firstClearBonus,
      totalReward,
    });
  }

  private showResultPanel(finalState: BubbleShooterGameState.Win | BubbleShooterGameState.Lose): void {
    if (!this.resultPanel) {
      return;
    }

    this.setGameplayHudVisibleForResult(false);
    this.prepareGameplayVisualsForResult();
    if (this.resultOverlay) {
      this.resultOverlay.active = true;
      this.resultOverlay.setSiblingIndex(this.node.children.length - 1);
    }

    this.resultPanel.active = true;
    this.resultPanel.setSiblingIndex(this.node.children.length - 1);
    this.playResultPanelOpenAnimation();

    if (this.resultTitleLabel) {
      this.resultTitleLabel.string = finalState === BubbleShooterGameState.Win ? 'WIN' : 'LOSE';
      this.resultTitleLabel.color = finalState === BubbleShooterGameState.Win ? new Color(255, 241, 120, 255) : new Color(255, 176, 176, 255);
    }

    if (this.resultScoreLabel) {
      this.resultScoreLabel.string = `คะแนน ${this.score}`;
    }

    if (this.resultBestScoreLabel) {
      const stageKey = `${this.getResolvedStageConfig().stageId}`;
      const bestScore = SaveManager.getData().minigames.bubbleShooter.bestScore[stageKey] ?? 0;
      this.resultBestScoreLabel.string = `คะแนนสูงสุด ${bestScore}`;
    }

    if (this.resultStarsLabel) {
      this.resultStarsLabel.string = this.formatStars(this.getEarnedStars(this.score));
    }

    const saveData = SaveManager.regenerateHearts();

    if (this.resultRemainingBallsLabel) {
      this.resultRemainingBallsLabel.node.active = true;
      const remainingPill = this.resultPanel?.getChildByName('ResultScoreBackplate')?.getChildByName('ResultRemainingPill');
      if (remainingPill) {
        remainingPill.active = true;
      }
      this.resultRemainingBallsLabel.string =
        finalState === BubbleShooterGameState.Win ? `เหลือลูกบอล ${this.ballsLeft} ลูก` : `Heart x${saveData.player.hearts}`;
    }

    if (this.resultRewardLabel) {
      this.resultRewardLabel.node.active = finalState === BubbleShooterGameState.Win;
      this.resultRewardLabel.string = `Coin +${this.lastResultCoinReward}`;
    }
    if (this.resultHeartLabel) {
      this.resultHeartLabel.node.active = false;
      this.resultHeartLabel.string = `Heart x${saveData.player.hearts}`;
    }
    if (finalState === BubbleShooterGameState.Win) {
      this.updateResultEconomyIcon(finalState);
    } else if (this.resultEconomyIconNode) {
      this.resultEconomyIconNode.active = false;
    }
    const economyPill = this.resultPanel?.getChildByName('ResultScoreBackplate')?.getChildByName('ResultEconomyPill');
    if (economyPill) {
      economyPill.active = finalState === BubbleShooterGameState.Win;
    }
    const heartPill = this.resultPanel?.getChildByName('ResultScoreBackplate')?.getChildByName('ResultHeartPill');
    if (heartPill) {
      heartPill.active = false;
    }

    if (this.resultNextButton) {
      const canOpenNextStage = finalState === BubbleShooterGameState.Win && this.hasNextStage();
      this.resultNextButton.active = true;
      const nextButtonComponent = this.resultNextButton.getComponent(Button);
      if (nextButtonComponent) {
        nextButtonComponent.interactable = canOpenNextStage;
      }
      this.setResultNextButtonVisualState(canOpenNextStage);
    }
  }

  private setGameplayHudVisibleForResult(visible: boolean): void {
    if (this.nextBallsLeftLabel) {
      this.nextBallsLeftLabel.node.active = visible;
    }
    if (this.nextBallsShadowLabel) {
      this.nextBallsShadowLabel.node.active = visible;
    }
  }

  private setResultNextButtonVisualState(isEnabled: boolean): void {
    if (!this.resultNextButton) {
      return;
    }

    this.setResultButtonFillColor(this.resultNextButton, isEnabled ? new Color(255, 255, 246, 255) : new Color(217, 229, 236, 255));

    const label = this.resultNextButton.getChildByName('NextStageButtonLabel')?.getComponent(Label);
    if (label) {
      label.color = isEnabled ? new Color(12, 74, 116, 255) : new Color(65, 91, 108, 255);
    }
  }

  private prepareGameplayVisualsForResult(): void {
    this.currentPearl?.setSiblingIndex(1);
    if (this.currentPearl) {
      this.currentPearl.active = false;
    }
    if (this.activeProjectile) {
      this.activeProjectile.active = false;
    }
    if (this.nextPearlGroup) {
      this.nextPearlGroup.active = false;
    } else {
      const nextPearlGroup = this.shooterArea?.getChildByName('NextPearlGroup');
      if (nextPearlGroup) {
        nextPearlGroup.active = false;
      }
    }
    if (this.hmeeLek) {
      const opacity = this.hmeeLek.getComponent(UIOpacity) ?? this.hmeeLek.addComponent(UIOpacity);
      opacity.opacity = 96;
    }
  }

  private playResultPanelOpenAnimation(): void {
    if (!this.resultPanel) {
      return;
    }

    this.resultPanel.setScale(0.85, 0.85, 1);
    tween(this.resultPanel)
      .to(0.18, { scale: new Vec3(1, 1, 1) })
      .start();
  }

  private updateResultEconomyIcon(finalState: BubbleShooterGameState.Win | BubbleShooterGameState.Lose): void {
    if (!this.resultEconomyIconNode || !this.resultEconomyIcon) {
      return;
    }

    this.resultEconomyIconNode.active = true;
    const assetName = finalState === BubbleShooterGameState.Win ? 'reward_coin_badge' : 'icon_heart';
    this.loadCommonSpriteFrame(assetName, (spriteFrame) => {
      if (!this.resultEconomyIconNode?.isValid || !this.resultEconomyIcon) {
        return;
      }

      this.resultEconomyIcon.spriteFrame = spriteFrame;
    });
  }

  private prepareLauncherPearls(): void {
    if (!this.currentPearl || !this.nextPearl) {
      return;
    }

    this.currentPearlColor = this.pickLauncherColor();
    this.nextPearlColor = this.pickLauncherColor();

    console.log('[BubbleShooter] launcher allowed colors:', this.getLauncherAvailableColorNames());
    this.refreshCurrentPearlVisual();
    this.refreshNextPearlVisual();
  }

  private advanceLauncherPearls(): void {
    this.currentPearlColor = this.nextPearlColor;
    this.nextPearlColor = this.pickLauncherColor();
    this.canSwapThisTurn = true;

    this.refreshCurrentPearlVisual();
    this.refreshNextPearlVisual();

    const availableColors = this.updateAvailableShootColors();
    this.rerollPearlIfColorNotAvailable('current', availableColors);
    this.rerollPearlIfColorNotAvailable('next', availableColors);
  }

  private bindNextPearlSwapInput(): void {
    if (!this.nextPearl) {
      return;
    }

    const button = this.nextPearl.getComponent(Button) ?? this.nextPearl.addComponent(Button);
    button.interactable = true;
    this.nextPearl.off(Button.EventType.CLICK, this.onNextPearlClicked, this);
    this.nextPearl.on(Button.EventType.CLICK, this.onNextPearlClicked, this);
  }

  private onNextPearlClicked(): void {
    this.swapCurrentAndNextPearls();
  }

  private swapCurrentAndNextPearls(): void {
    if (this.gameState === BubbleShooterGameState.Paused) {
      console.log('[BubbleShooter] swap ignored: game is paused');
      return;
    }

    if (this.gameState !== BubbleShooterGameState.Ready) {
      console.log('[BubbleShooter] swap ignored: game state is not Ready', this.gameState);
      return;
    }

    if (this.isShooting || this.isSwapping) {
      console.log('[BubbleShooter] swap ignored: projectile is moving');
      return;
    }

    if (!this.currentPearl || !this.nextPearl) {
      return;
    }

    this.isSwapping = true;
    const currentHome = this.currentPearl.position.clone();
    const nextHome = this.nextPearl.position.clone();
    const currentTarget = this.worldToNodeParentLocal(this.currentPearl, this.nodeLocalToWorld(this.nextPearl));
    const nextTarget = this.worldToNodeParentLocal(this.nextPearl, this.nodeLocalToWorld(this.currentPearl));
    const previousCurrent = this.currentPearlColor;

    console.log('[BubbleShooter] swap start', {
      current: getPearlColorName(this.currentPearlColor),
      next: getPearlColorName(this.nextPearlColor),
    });

    tween(this.currentPearl).to(SWAP_ANIMATION_DURATION, { position: currentTarget }).start();
    tween(this.nextPearl)
      .to(SWAP_ANIMATION_DURATION, { position: nextTarget })
      .call(() => {
        if (!this.currentPearl || !this.nextPearl) {
          this.isSwapping = false;
          return;
        }

        this.currentPearl.setPosition(currentHome);
        this.nextPearl.setPosition(nextHome);
        this.currentPearlColor = this.nextPearlColor;
        this.nextPearlColor = previousCurrent;
        this.isSwapping = false;

        this.refreshCurrentPearlVisual();
        this.refreshNextPearlVisual();

        console.log('[BubbleShooter] swap end', {
          current: getPearlColorName(this.currentPearlColor),
          next: getPearlColorName(this.nextPearlColor),
        });
      })
      .start();
  }

  private refreshCurrentPearlVisual(): void {
    if (!this.currentPearl || !this.currentPearlSprite) {
      return;
    }

    this.applyLauncherPearlColor(this.currentPearl, this.currentPearlSprite, this.currentPearlFallback, this.currentPearlColor, 'current');
  }

  private refreshNextPearlVisual(): void {
    if (!this.nextPearl || !this.nextPearlSprite) {
      return;
    }

    this.applyLauncherPearlColor(this.nextPearl, this.nextPearlSprite, this.nextPearlFallback, this.nextPearlColor, 'next');
  }

  private applyLauncherPearlColor(node: Node, sprite: Sprite, fallback: Node | undefined, color: PearlColor, label: 'current' | 'next'): void {
    const pearlData = node.getComponent(BubblePearl) ?? node.addComponent(BubblePearl);
    pearlData.setData(color);

    if (fallback) {
      fallback.active = true;
      const transform = fallback.getComponent(UITransform);
      const fallbackSize = transform ? Math.min(transform.width, transform.height) : CURRENT_PEARL_FINAL_SIZE;
      this.drawCircle(fallback, fallbackSize / 2, getPearlFallbackColor(color));
    }

    const assignSprite = (spriteFrame: SpriteFrame): void => {
      if (!node.isValid) {
        return;
      }

      sprite.spriteFrame = spriteFrame;
      if (fallback) {
        fallback.active = false;
      }
    };

    if (this.pearlBoardController) {
      this.pearlBoardController.requestSpriteFrameForColor(color, assignSprite);
    } else {
      this.loadSpriteFrame(getPearlSpriteAssetName(color), assignSprite);
    }

    console.log(`[BubbleShooter] ${label} pearl color`, getPearlColorName(color));
  }

  private pickLauncherColor(): PearlColor {
    return this.pearlBoardController?.pickLauncherPearlColor() ?? PearlColor.Blue;
  }

  private getLauncherAvailableColorNames(): string[] {
    const colors = this.pearlBoardController?.getAvailableColorsFromBoard() ?? [PearlColor.Blue];
    return colors.map((color) => getPearlColorName(color));
  }

  private bindAimInput(): void {
    input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
    input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
    input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    input.off(Input.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    input.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
    input.off(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
    input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);

    input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
    input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
    input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    input.on(Input.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
    input.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
    input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);
  }

  private onTouchStart(event: EventTouch): void {
    this.beginAim(this.eventToCanvasLocal(event));
  }

  private onTouchMove(event: EventTouch): void {
    this.updateAim(this.eventToCanvasLocal(event));
  }

  private onTouchEnd(event: EventTouch): void {
    this.releaseAim(this.eventToCanvasLocal(event));
  }

  private onTouchCancel(): void {
    this.cancelAim();
  }

  private onMouseDown(event: EventMouse): void {
    if (event.getButton() !== EventMouse.BUTTON_LEFT) {
      return;
    }

    this.beginAim(this.eventToCanvasLocal(event));
  }

  private onMouseMove(event: EventMouse): void {
    this.updateAim(this.eventToCanvasLocal(event));
  }

  private onMouseUp(event: EventMouse): void {
    if (event.getButton() !== EventMouse.BUTTON_LEFT) {
      return;
    }

    this.releaseAim(this.eventToCanvasLocal(event));
  }

  private beginAim(pointerPosition: Vec3): void {
    if (this.gameState === BubbleShooterGameState.Paused) {
      return;
    }

    if (this.gameState !== BubbleShooterGameState.Ready || this.isSwapping || this.isShooting || !this.currentPearl || !this.pearlBoardController) {
      return;
    }

    if (this.nextPearl && this.isPointerInsideNode(pointerPosition, this.nextPearl)) {
      console.log('[BubbleShooter] aim skipped: pointer is on next pearl swap area');
      return;
    }

    if (!this.isPointerInsideAimArea(pointerPosition)) {
      return;
    }

    this.isAiming = true;
    this.gameState = BubbleShooterGameState.Aiming;
    this.aimGuide?.setSiblingIndex(this.node.children.length - 1);
    console.log('[BubbleShooter] aim start', {
      pointer: { x: Number(pointerPosition.x.toFixed(1)), y: Number(pointerPosition.y.toFixed(1)) },
      origin: this.getLaunchOriginDebug(),
    });
    this.updateAim(pointerPosition);
  }

  private updateAim(pointerPosition: Vec3): void {
    if (this.gameState !== BubbleShooterGameState.Aiming || !this.isAiming || this.isShooting) {
      return;
    }

    const origin = this.getLaunchOriginCanvasLocal();
    const direction = this.clampShootDirection(pointerPosition.x - origin.x, pointerPosition.y - origin.y);
    this.aimDirection = direction;
    this.updateAimLine(origin, direction);
  }

  private releaseAim(pointerPosition: Vec3): void {
    if (this.gameState === BubbleShooterGameState.Paused) {
      return;
    }

    if (this.gameState !== BubbleShooterGameState.Aiming || !this.isAiming || this.isShooting) {
      return;
    }

    this.updateAim(pointerPosition);
    this.isAiming = false;
    this.hideAimLine();
    this.shootPearl(this.aimDirection);
  }

  private cancelAim(): void {
    if (!this.isAiming) {
      return;
    }

    this.isAiming = false;
    this.hideAimLine();
    if (this.gameState === BubbleShooterGameState.Aiming) {
      this.gameState = BubbleShooterGameState.Ready;
    }
  }

  private shootPearl(direction: Vec3): void {
    if (!this.pearlBoardController || !this.currentPearl || this.isShooting || this.gameState !== BubbleShooterGameState.Aiming) {
      return;
    }

    if (this.ballsLeft <= 0) {
      this.gameState = BubbleShooterGameState.Ready;
      this.finishGame(BubbleShooterGameState.Lose);
      return;
    }

    const origin = this.getLaunchOriginCanvasLocal();
    const projectile = this.pearlBoardController.createShootingPearl(this.node, origin, this.currentPearlColor);
    if (!projectile) {
      return;
    }

    this.activeProjectile = projectile;
    this.projectileVelocity.set(direction.x * this.shootSpeed, direction.y * this.shootSpeed, 0);
    this.isShooting = true;
    this.gameState = BubbleShooterGameState.Shooting;
    this.currentPearl.active = false;
    this.playLaunchFeedback(origin, direction);
    this.reduceBallAfterRealShot(this.currentPearlColor);

    console.log('[BubbleShooter] shoot pearl', {
      color: getPearlColorName(this.currentPearlColor),
      direction: { x: Number(direction.x.toFixed(3)), y: Number(direction.y.toFixed(3)) },
      speed: this.shootSpeed,
    });
  }

  private updateProjectile(deltaTime: number): void {
    if (this.gameState === BubbleShooterGameState.Paused) {
      return;
    }

    if (this.gameState !== BubbleShooterGameState.Shooting || !this.isShooting || !this.activeProjectile || !this.pearlBoardController) {
      return;
    }

    const stepCount = Math.max(1, Math.min(3, Math.ceil((this.shootSpeed * deltaTime) / PROJECTILE_MAX_STEP_DISTANCE)));
    const stepDeltaTime = deltaTime / stepCount;

    for (let step = 0; step < stepCount; step += 1) {
      if (!this.activeProjectile || this.gameState !== BubbleShooterGameState.Shooting) {
        return;
      }

      const position = this.activeProjectile.position.clone();
      position.x += this.projectileVelocity.x * stepDeltaTime;
      position.y += this.projectileVelocity.y * stepDeltaTime;

      const bounds = this.getBoardBoundsCanvasLocal();
      const radius = this.pearlBoardController.getProjectileRadius();

      if (position.x - radius <= bounds.left) {
        position.x = bounds.left + radius;
        this.projectileVelocity.x = Math.abs(this.projectileVelocity.x);
        console.log('[BubbleShooter] projectile hit left wall');
      } else if (position.x + radius >= bounds.right) {
        position.x = bounds.right - radius;
        this.projectileVelocity.x = -Math.abs(this.projectileVelocity.x);
        console.log('[BubbleShooter] projectile hit right wall');
      }

      this.activeProjectile.setPosition(position);

      const worldPosition = this.canvasLocalToWorld(position);
      if (worldPosition.y >= this.pearlBoardController.getTopBoundaryWorldY()) {
        console.log('[BubbleShooter] projectile hit top wall');
        this.snapProjectileToBoard(worldPosition);
        return;
      }

      const collision = this.findProjectileCollision(worldPosition);
      if (collision) {
        console.log('[BubbleShooter] projectile hit pearl', {
          row: collision.row,
          col: collision.col,
          color: getPearlColorName(collision.color),
          distance: Number(collision.distance.toFixed(2)),
        });
        this.snapProjectileToBoard(worldPosition);
        return;
      }
    }
  }

  private snapProjectileToBoard(worldPosition: Vec3): void {
    if (!this.activeProjectile || !this.pearlBoardController) {
      return;
    }

    this.gameState = BubbleShooterGameState.Resolving;
    this.isShooting = false;
    const projectileColor = this.activeProjectile.getComponent(BubblePearl)?.color ?? this.currentPearlColor;
    const grid = this.pearlBoardController.attachPearlFromWorld(this.activeProjectile, worldPosition);
    let matchRemovedCount = 0;
    let floatingRemovedCount = 0;

    if (grid) {
      const snapFeedbackPosition = this.nodeLocalToCanvasLocal(this.activeProjectile);
      this.playSnapFeedback(snapFeedbackPosition);

      console.log('[BubbleShooter] snapped projectile', {
        row: grid.row,
        col: grid.col,
        color: getPearlColorName(projectileColor),
        boardPearls: this.pearlBoardController.getPearlCount(),
      });

      const matchResult = this.pearlBoardController.checkMatch(grid.row, grid.col);
      matchRemovedCount = matchResult.removedCount;
      floatingRemovedCount = matchResult.floatingRemovedCount;
      console.log('[BubbleShooter] match check after snap', {
        row: grid.row,
        col: grid.col,
        color: matchResult.color !== null ? getPearlColorName(matchResult.color) : null,
        matched: matchResult.matched,
        groupSize: matchResult.groupSize,
        removedCount: matchResult.removedCount,
        floatingRemovedCount: matchResult.floatingRemovedCount,
        boardPearls: this.pearlBoardController.getPearlCount(),
      });
    }

    this.activeProjectile = undefined;
    this.projectileVelocity.set(0, 0, 0);
    this.applyResolveResult(matchRemovedCount, floatingRemovedCount);

    if (this.checkWinLoseAfterResolve()) {
      return;
    }

    this.advanceLauncherPearls();
    if (this.currentPearl) {
      this.currentPearl.active = true;
    }
    this.gameState = BubbleShooterGameState.Ready;
  }

  private findProjectileCollision(worldPosition: Vec3): { row: number; col: number; color: PearlColor; distance: number } | null {
    if (!this.pearlBoardController) {
      return null;
    }

    const threshold = this.pearlBoardController.getCollisionDistance();
    let nearestCollision: { row: number; col: number; color: PearlColor; distance: number } | null = null;

    for (const pearl of this.pearlBoardController.getPearlWorldPositions()) {
      const distance = Vec3.distance(worldPosition, pearl.worldPosition);
      if (distance <= threshold && (!nearestCollision || distance < nearestCollision.distance)) {
        nearestCollision = { row: pearl.row, col: pearl.col, color: pearl.color, distance };
      }
    }

    return nearestCollision;
  }

  private playLaunchFeedback(origin: Vec3, direction: Vec3): void {
    const effect = this.createNode('LaunchFeedback', this.node);
    effect.setPosition(origin);
    effect.setScale(0.35, 0.35, 1);
    effect.setSiblingIndex(this.node.children.length - 1);
    this.setSize(effect, 112, 112);
    this.drawCircle(effect, 56, new Color(255, 237, 150, 96));

    const opacity = effect.addComponent(UIOpacity);
    opacity.opacity = 230;

    const core = this.createNode('LaunchFeedbackCore', effect);
    core.setPosition(direction.x * 22, direction.y * 22, 0);
    this.setSize(core, 46, 46);
    this.drawCircle(core, 23, new Color(255, 255, 248, 178));

    const sideX = -direction.y;
    const sideY = direction.x;
    const sparkleOffsets = [-18, 0, 18];
    sparkleOffsets.forEach((offset, index) => {
      const sparkle = this.createNode(`LaunchSparkle_${index + 1}`, effect);
      sparkle.setPosition(direction.x * 30 + sideX * offset, direction.y * 30 + sideY * offset, 0);
      this.setSize(sparkle, 14, 14);
      this.drawCircle(sparkle, 7, new Color(255, 255, 224, 214));

      const sparkleOpacity = sparkle.addComponent(UIOpacity);
      sparkleOpacity.opacity = 220;
      const targetPosition = new Vec3(direction.x * 78 + sideX * offset * 1.55, direction.y * 78 + sideY * offset * 1.55, 0);
      tween(sparkle)
        .to(0.18, { position: targetPosition, scale: new Vec3(0.45, 0.45, 1) })
        .start();
      tween(sparkleOpacity)
        .to(0.18, { opacity: 0 })
        .start();
    });

    tween(opacity)
      .to(0.2, { opacity: 0 })
      .start();
    tween(effect)
      .to(0.2, { scale: new Vec3(1.12, 1.12, 1) })
      .call(() => effect.destroy())
      .start();
  }

  private playSnapFeedback(position: Vec3): void {
    const effect = this.createNode('SnapFeedback', this.node);
    effect.setPosition(position);
    effect.setScale(0.55, 0.55, 1);
    effect.setSiblingIndex(this.node.children.length - 1);
    this.setSize(effect, 132, 132);
    this.drawCircle(effect, 46, new Color(145, 224, 255, 42));

    const opacity = effect.addComponent(UIOpacity);
    opacity.opacity = 210;

    const ring = this.createNode('SnapFeedbackRing', effect);
    ring.setPosition(Vec3.ZERO);
    this.setSize(ring, 112, 112);
    this.drawCircleOutline(ring, 50, new Color(255, 255, 248, 176), 6);

    for (let index = 0; index < 6; index += 1) {
      const angle = (Math.PI * 2 * index) / 6;
      const sparkle = this.createNode(`SnapSparkle_${index + 1}`, effect);
      const startRadius = 38;
      const endRadius = 62;
      sparkle.setPosition(Math.cos(angle) * startRadius, Math.sin(angle) * startRadius, 0);
      this.setSize(sparkle, 10, 10);
      this.drawCircle(sparkle, 5, new Color(255, 244, 178, 196));

      const sparkleOpacity = sparkle.addComponent(UIOpacity);
      sparkleOpacity.opacity = 205;
      tween(sparkle)
        .to(0.2, {
          position: new Vec3(Math.cos(angle) * endRadius, Math.sin(angle) * endRadius, 0),
          scale: new Vec3(0.35, 0.35, 1),
        })
        .start();
      tween(sparkleOpacity)
        .to(0.2, { opacity: 0 })
        .start();
    }

    tween(opacity)
      .to(0.22, { opacity: 0 })
      .start();
    tween(effect)
      .to(0.22, { scale: new Vec3(1.08, 1.08, 1) })
      .call(() => effect.destroy())
      .start();
  }

  private createAimDots(): void {
    if (!this.aimGuide) {
      return;
    }

    this.aimDots = [];
    for (let index = 0; index < AIM_DOT_COUNT; index += 1) {
      const progress = index / Math.max(1, AIM_DOT_COUNT - 1);
      const softenedProgress = progress * progress * (3 - 2 * progress);
      const dotSize = AIM_DOT_START_SIZE + (AIM_DOT_END_SIZE - AIM_DOT_START_SIZE) * softenedProgress;
      const haloSize = dotSize + 20 - progress * 6;
      const dotAlpha = Math.round(AIM_DOT_START_ALPHA + (AIM_DOT_END_ALPHA - AIM_DOT_START_ALPHA) * softenedProgress);
      const haloAlpha = Math.round(
        AIM_DOT_HALO_START_ALPHA + (AIM_DOT_HALO_END_ALPHA - AIM_DOT_HALO_START_ALPHA) * softenedProgress,
      );
      const dot = this.createNode(`AimDot_${index + 1}`, this.aimGuide);
      this.setSize(dot, haloSize, haloSize);
      this.drawCircle(dot, haloSize / 2, new Color(129, 226, 255, haloAlpha));

      const core = this.createNode('AimDotCore', dot);
      core.setPosition(Vec3.ZERO);
      this.setSize(core, dotSize, dotSize);
      this.drawCircle(core, dotSize / 2, new Color(255, 255, 248, dotAlpha));
      dot.active = false;
      this.aimDots.push(dot);
    }
  }

  private updateAimLine(origin: Vec3, direction: Vec3): void {
    if (this.aimGuide) {
      this.aimGuide.active = true;
    }

    const bounds = this.getBoardBoundsCanvasLocal();
    const radius = this.pearlBoardController?.getProjectileRadius() ?? CURRENT_PEARL_FINAL_SIZE / 2;
    const topY = this.worldToCanvasLocalY(this.pearlBoardController?.getTopBoundaryWorldY() ?? this.canvasHeight / 2);
    const simulatedPosition = origin.clone();
    const simulatedDirection = direction.clone();

    // Start dots after AIM_DOT_START_OFFSET to avoid overlapping Hmee Lek's face
    simulatedPosition.x += simulatedDirection.x * AIM_DOT_START_OFFSET;
    simulatedPosition.y += simulatedDirection.y * AIM_DOT_START_OFFSET;

    for (let index = 0; index < this.aimDots.length; index += 1) {
      simulatedPosition.x += simulatedDirection.x * AIM_DOT_SPACING;
      simulatedPosition.y += simulatedDirection.y * AIM_DOT_SPACING;

      if (simulatedPosition.x - radius <= bounds.left) {
        simulatedPosition.x = bounds.left + radius + (bounds.left + radius - simulatedPosition.x);
        simulatedDirection.x = Math.abs(simulatedDirection.x);
      } else if (simulatedPosition.x + radius >= bounds.right) {
        simulatedPosition.x = bounds.right - radius - (simulatedPosition.x + radius - bounds.right);
        simulatedDirection.x = -Math.abs(simulatedDirection.x);
      }

      const dot = this.aimDots[index];
      dot.active = simulatedPosition.y <= topY;
      dot.setPosition(simulatedPosition);
    }
  }

  private hideAimLine(): void {
    for (const dot of this.aimDots) {
      dot.active = false;
    }
  }

  private clampShootDirection(deltaX: number, deltaY: number): Vec3 {
    if (deltaY <= 0) {
      deltaY = Math.max(Math.abs(deltaX) * 0.25, 1);
    }

    const angle = Math.atan2(deltaY, deltaX);
    const minAngle = (MIN_SHOOT_ANGLE_DEGREES * Math.PI) / 180;
    const maxAngle = (MAX_SHOOT_ANGLE_DEGREES * Math.PI) / 180;
    const clampedAngle = Math.max(minAngle, Math.min(maxAngle, angle));
    const direction = new Vec3(Math.cos(clampedAngle), Math.sin(clampedAngle), 0);

    console.log('[BubbleShooter] aim direction', {
      x: Number(direction.x.toFixed(3)),
      y: Number(direction.y.toFixed(3)),
      angle: Number(((clampedAngle * 180) / Math.PI).toFixed(1)),
    });

    return direction;
  }

  private eventToCanvasLocal(event: EventTouch | EventMouse): Vec3 {
    const location = event.getUILocation();
    return new Vec3(location.x - this.canvasWidth / 2, location.y - this.canvasHeight / 2, 0);
  }

  private getLaunchOriginCanvasLocal(): Vec3 {
    if (!this.currentPearl) {
      return new Vec3(0, -this.canvasHeight / 2 + 610, 0);
    }

    return this.nodeLocalToCanvasLocal(this.currentPearl);
  }

  private getLaunchOriginDebug(): { x: number; y: number } {
    const origin = this.getLaunchOriginCanvasLocal();
    return { x: Number(origin.x.toFixed(1)), y: Number(origin.y.toFixed(1)) };
  }

  private isPointerInsideAimArea(pointerPosition: Vec3): boolean {
    const topHudLimit = this.canvasHeight / 2 - 760;
    return pointerPosition.y < topHudLimit;
  }

  private isPointerInsideNode(pointerPosition: Vec3, node: Node): boolean {
    const transform = node.getComponent(UITransform);
    if (!transform) {
      return false;
    }

    const center = this.nodeLocalToCanvasLocal(node);
    return (
      pointerPosition.x >= center.x - transform.width / 2 &&
      pointerPosition.x <= center.x + transform.width / 2 &&
      pointerPosition.y >= center.y - transform.height / 2 &&
      pointerPosition.y <= center.y + transform.height / 2
    );
  }

  private getBoardBoundsCanvasLocal(): { left: number; right: number } {
    if (!this.pearlBoardController) {
      return { left: -this.canvasWidth / 2, right: this.canvasWidth / 2 };
    }

    const bounds = this.pearlBoardController.getHorizontalBoundsWorld();
    const left = this.worldToCanvasLocalX(bounds.left);
    const right = this.worldToCanvasLocalX(bounds.right);
    return { left, right };
  }

  private nodeLocalToCanvasLocal(node: Node): Vec3 {
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    const worldPosition = transform.convertToWorldSpaceAR(Vec3.ZERO);
    const canvasTransform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    return canvasTransform.convertToNodeSpaceAR(worldPosition);
  }

  private nodeLocalToWorld(node: Node): Vec3 {
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    return transform.convertToWorldSpaceAR(Vec3.ZERO);
  }

  private worldToNodeParentLocal(node: Node, worldPosition: Vec3): Vec3 {
    const parent = node.parent;
    const parentTransform = parent?.getComponent(UITransform);
    return parentTransform ? parentTransform.convertToNodeSpaceAR(worldPosition) : worldPosition.clone();
  }

  private canvasLocalToWorld(position: Vec3): Vec3 {
    const canvasTransform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    return canvasTransform.convertToWorldSpaceAR(position);
  }

  private worldToCanvasLocalX(worldX: number): number {
    const canvasTransform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    return canvasTransform.convertToNodeSpaceAR(new Vec3(worldX, 0, 0)).x;
  }

  private worldToCanvasLocalY(worldY: number): number {
    const canvasTransform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    return canvasTransform.convertToNodeSpaceAR(new Vec3(0, worldY, 0)).y;
  }

  private createIconButton(nodeName: string, parent: Node, x: number, y: number, assetName: string, fallbackText: string): Node {
    const button = this.createNode(nodeName, parent);
    button.setPosition(x, y);
    this.setSize(button, 150, 150);
    this.decorateRoundedPanel(
      button,
      150,
      150,
      56,
      new Color(255, 255, 255, 246),
      new Color(9, 58, 96, 90),
      new Color(255, 237, 170, 64),
    );
    const fallbackLabel = this.createLabel(`${nodeName}FallbackLabel`, button, fallbackText, 0, 0, 32, new Color(30, 90, 130, 255), 132, 72);
    this.loadSpriteFrame(assetName, (spriteFrame) => {
      fallbackLabel.node.active = false;
      this.createSpriteVisual(`${nodeName}Icon`, button, 114, 114, spriteFrame);
    });
    return button;
  }

  private createResultButton(nodeName: string, parent: Node, x: number, y: number, text: string): Node {
    const button = this.createNode(nodeName, parent);
    button.setPosition(x, y);
    this.setSize(button, 350, 148);
    const shadow = this.createNode(`${nodeName}Shadow`, button);
    shadow.setPosition(0, -8);
    this.setSize(shadow, 350, 148);
    this.drawRoundedRect(shadow, 350, 148, new Color(11, 68, 106, 58), 42);

    const fill = this.createNode(`${nodeName}Fill`, button);
    fill.setPosition(Vec3.ZERO);
    this.setSize(fill, 350, 148);
    this.drawRoundedRect(fill, 350, 148, new Color(255, 255, 246, 255), 42);

    const border = this.createNode(`${nodeName}Border`, button);
    border.setPosition(Vec3.ZERO);
    this.setSize(border, 350, 148);
    this.drawRoundedRectOutline(border, 350, 148, new Color(255, 219, 102, 190), 42, 5);

    const shine = this.createNode(`${nodeName}Shine`, button);
    shine.setPosition(0, 40);
    this.setSize(shine, 292, 36);
    this.drawRoundedRect(shine, 292, 36, new Color(255, 233, 128, 118), 18);
    this.createLabel(`${nodeName}Label`, button, text, 0, 0, 56, new Color(12, 74, 116, 255), 326, 124);

    const buttonComponent = button.addComponent(Button);
    buttonComponent.interactable = true;
    return button;
  }

  private setResultButtonFillColor(button: Node, color: Color): void {
    const fill = button.getChildByName(`${button.name}Fill`);
    if (fill) {
      this.drawRoundedRect(fill, 350, 148, color, 42);
    }
  }

  private createPauseButton(nodeName: string, parent: Node, x: number, y: number, text: string): Node {
    const button = this.createNode(nodeName, parent);
    button.setPosition(x, y);
    this.setSize(button, 520, 100);
    this.drawRoundedRect(button, 520, 100, new Color(255, 255, 255, 244), 34);
    this.createLabel(`${nodeName}Label`, button, text, 0, 0, 42, new Color(24, 82, 122, 255), 460, 82);

    const buttonComponent = button.addComponent(Button);
    buttonComponent.interactable = true;
    return button;
  }

  private createBar(nodeName: string, parent: Node, x: number, y: number, width: number, height: number, color: Color, radius: number): Node {
    const bar = this.createNode(nodeName, parent);
    bar.setPosition(x, y);
    this.setSize(bar, width, height);
    this.drawRoundedRect(bar, width, height, color, radius);
    return bar;
  }

  private createLabel(
    nodeName: string,
    parent: Node,
    text: string,
    x: number,
    y: number,
    fontSize: number,
    color: Color,
    width: number,
    height: number,
  ): Label {
    const labelNode = this.createNode(nodeName, parent);
    labelNode.setPosition(x, y);
    this.setSize(labelNode, width, height);

    const label = labelNode.addComponent(Label);
    label.string = text;
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 10;
    label.color = color;
    label.horizontalAlign = Label.HorizontalAlign.CENTER;
    label.verticalAlign = Label.VerticalAlign.CENTER;
    return label;
  }

  private createNode(nodeName: string, parent: Node): Node {
    const node = new Node(nodeName);
    node.layer = Layers.Enum.UI_2D;
    node.setParent(parent);
    return node;
  }

  private setSize(node: Node, width: number, height: number): UITransform {
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
    return transform;
  }

  private setSprite(node: Node, spriteFrame: SpriteFrame): void {
    const graphics = node.getComponent(Graphics);
    if (graphics) {
      graphics.clear();
    }

    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    const width = transform.width;
    const height = transform.height;
    const sprite = node.getComponent(Sprite) ?? node.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.type = Sprite.Type.SIMPLE;
    sprite.spriteFrame = spriteFrame;
    transform.setContentSize(width, height);
  }

  private createLauncherPearlRender(
    container: Node,
    visualName: string,
    fallbackName: string,
    visualSize: number,
  ): Sprite {
    const fallback = this.createNode(fallbackName, container);
    fallback.setPosition(Vec3.ZERO);
    this.setSize(fallback, visualSize, visualSize);
    this.drawCircle(fallback, visualSize / 2, getPearlFallbackColor(PearlColor.Blue));

    const visual = this.createNode(visualName, container);
    visual.setPosition(Vec3.ZERO);
    this.setSize(visual, visualSize, visualSize);

    const sprite = visual.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.type = Sprite.Type.SIMPLE;

    if (container.name === 'CurrentPearl') {
      this.currentPearlFallback = fallback;
    } else if (container.name === 'NextPearl') {
      this.nextPearlFallback = fallback;
    }

    return sprite;
  }

  private createPearlRender(
    container: Node,
    visualName: string,
    fallbackName: string,
    visualSize: number,
    assetName: string,
    fallbackColor: Color,
  ): void {
    const fallback = this.createNode(fallbackName, container);
    fallback.setPosition(Vec3.ZERO);
    this.setSize(fallback, visualSize, visualSize);
    this.drawCircle(fallback, visualSize / 2, fallbackColor);

    const visual = this.createNode(visualName, container);
    visual.setPosition(Vec3.ZERO);
    this.setSize(visual, visualSize, visualSize);

    const sprite = visual.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.type = Sprite.Type.SIMPLE;

    const resourcePath = `${RESOURCE_ROOT}/${assetName}/spriteFrame`;
    this.loadSpriteFrame(assetName, (spriteFrame) => {
      sprite.spriteFrame = spriteFrame;
      fallback.active = false;
      console.log(`[BubbleShooter] ${visualName} SpriteFrame loaded: ${resourcePath}`, {
        visualSize: { width: visualSize, height: visualSize },
        fallbackActive: fallback.active,
      });
      this.logPearlNodeDebug(visual);
    });
  }

  private logPearlNodeDebug(node: Node): void {
    const transform = node.getComponent(UITransform);
    const position = node.position;
    const scale = node.scale;
    console.log(`[BubbleShooter] ${node.name} debug`, {
      active: node.active,
      parentName: node.parent?.name ?? null,
      position: { x: position.x, y: position.y, z: position.z },
      scale: { x: scale.x, y: scale.y, z: scale.z },
      contentSize: transform ? { width: transform.width, height: transform.height } : null,
      siblingIndex: node.getSiblingIndex(),
    });
  }

  private createSpriteVisual(nodeName: string, parent: Node, width: number, height: number, spriteFrame: SpriteFrame): Sprite {
    const visual = this.createNode(nodeName, parent);
    visual.setPosition(Vec3.ZERO);
    this.setSize(visual, width, height);

    const sprite = visual.addComponent(Sprite);
    sprite.spriteFrame = spriteFrame;
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.type = Sprite.Type.SIMPLE;
    return sprite;
  }

  private loadSpriteFrame(assetName: string, onLoaded: (spriteFrame: SpriteFrame) => void, onFailed?: () => void): void {
    const resourcePath = `${RESOURCE_ROOT}/${assetName}/spriteFrame`;
    resources.load(resourcePath, SpriteFrame, (error, spriteFrame) => {
      if (error || !spriteFrame) {
        console.error(`[BubbleShooterController] SpriteFrame not found: ${resourcePath}`, error);
        onFailed?.();
        return;
      }

      onLoaded(spriteFrame);
    });
  }

  private loadCommonSpriteFrame(assetName: string, onLoaded: (spriteFrame: SpriteFrame) => void, onFailed?: () => void): void {
    const resourcePath = `ui/common/${assetName}/spriteFrame`;
    resources.load(resourcePath, SpriteFrame, (error, spriteFrame) => {
      if (error || !spriteFrame) {
        console.error(`[BubbleShooterController] SpriteFrame not found: ${resourcePath}`, error);
        onFailed?.();
        return;
      }

      onLoaded(spriteFrame);
    });
  }

  private addFullStretchWidget(node: Node): void {
    const widget = node.getComponent(Widget) ?? node.addComponent(Widget);
    widget.isAlignTop = true;
    widget.isAlignBottom = true;
    widget.isAlignLeft = true;
    widget.isAlignRight = true;
    widget.top = 0;
    widget.bottom = 0;
    widget.left = 0;
    widget.right = 0;
  }

  private addSafeAreaWidget(node: Node): void {
    const widget = node.getComponent(Widget) ?? node.addComponent(Widget);
    widget.isAlignTop = true;
    widget.isAlignBottom = true;
    widget.isAlignLeft = true;
    widget.isAlignRight = true;
    widget.top = 120;
    widget.bottom = 96;
    widget.left = 64;
    widget.right = 64;
  }

  private decorateRoundedPanel(
    node: Node,
    width: number,
    height: number,
    radius: number,
    fillColor: Color,
    shadowColor: Color,
    highlightColor: Color,
  ): void {
    const shadow = this.createNode(`${node.name}Shadow`, node);
    shadow.setPosition(0, -14);
    this.setSize(shadow, width, height);
    this.drawRoundedRect(shadow, width, height, shadowColor, radius);

    const fill = this.createNode(`${node.name}Fill`, node);
    fill.setPosition(Vec3.ZERO);
    this.setSize(fill, width, height);
    this.drawRoundedRect(fill, width, height, fillColor, radius);

    const highlight = this.createNode(`${node.name}Highlight`, node);
    highlight.setPosition(0, height * 0.24);
    this.setSize(highlight, width * 0.86, height * 0.2);
    this.drawRoundedRect(highlight, width * 0.86, height * 0.2, highlightColor, Math.min(radius, height * 0.1));
  }

  private drawRoundedRect(node: Node, width: number, height: number, color: Color, radius: number): void {
    const graphics = node.getComponent(Graphics) ?? node.addComponent(Graphics);
    graphics.clear();
    if (width <= 0 || height <= 0) {
      return;
    }

    graphics.fillColor = color;
    const resolvedRadius = Math.min(radius, width / 2, height / 2);
    if (resolvedRadius > 0) {
      graphics.roundRect(-width / 2, -height / 2, width, height, resolvedRadius);
    } else {
      graphics.rect(-width / 2, -height / 2, width, height);
    }
    graphics.fill();
  }

  private drawRoundedRectOutline(node: Node, width: number, height: number, color: Color, radius: number, lineWidth: number): void {
    const graphics = node.getComponent(Graphics) ?? node.addComponent(Graphics);
    graphics.clear();
    if (width <= 0 || height <= 0) {
      return;
    }

    graphics.strokeColor = color;
    graphics.lineWidth = lineWidth;
    const inset = lineWidth / 2;
    const resolvedRadius = Math.min(radius, width / 2, height / 2);
    graphics.roundRect(-width / 2 + inset, -height / 2 + inset, width - lineWidth, height - lineWidth, resolvedRadius);
    graphics.stroke();
  }

  private drawCircle(node: Node, radius: number, color: Color): void {
    const graphics = node.getComponent(Graphics) ?? node.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = color;
    graphics.circle(0, 0, radius);
    graphics.fill();
  }

  private drawCircleOutline(node: Node, radius: number, color: Color, lineWidth: number): void {
    const graphics = node.getComponent(Graphics) ?? node.addComponent(Graphics);
    graphics.clear();
    graphics.strokeColor = color;
    graphics.lineWidth = lineWidth;
    graphics.circle(0, 0, Math.max(0, radius - lineWidth / 2));
    graphics.stroke();
  }

}
