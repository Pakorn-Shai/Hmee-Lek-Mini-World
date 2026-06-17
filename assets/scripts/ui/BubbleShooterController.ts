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
const AIM_DOT_COUNT = 28;
const AIM_DOT_SIZE = 18;
const AIM_DOT_SPACING = 70;
const MIN_SHOOT_ANGLE_DEGREES = 15;
const MAX_SHOOT_ANGLE_DEGREES = 165;
const SWAP_ANIMATION_DURATION = 0.18;
const PEARL_BOARD_Y = 600;
const PROJECTILE_MAX_STEP_DISTANCE = 120;

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
  private pearlBoard?: Node;
  private pearlBoardController?: BubblePearlBoardPreview;
  private shooterArea!: Node;
  private currentPearl?: Node;
  private nextPearl?: Node;
  private aimGuide?: Node;
  private currentPearlSprite?: Sprite;
  private nextPearlSprite?: Sprite;
  private currentPearlFallback?: Node;
  private nextPearlFallback?: Node;
  private bottomHud!: Node;
  private backButton!: Node;
  private pauseButton!: Node;
  private scoreFill!: Node;
  private targetValueLabel?: Label;
  private scoreValueLabel?: Label;
  private shotsRemainingLabel?: Label;
  private resultPanel?: Node;
  private resultTitleLabel?: Label;
  private resultScoreLabel?: Label;
  private resultBestScoreLabel?: Label;
  private resultStarsLabel?: Label;
  private resultNextButton?: Node;
  private pausePanel?: Node;
  private readonly scoreBarWidth = 430;
  private readonly scoreBarHeight = 36;
  private readonly scoreStarSize = 18;
  private scoreStarNodes: Node[] = [];
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

  private get currentStageConfig() {
    return getBubbleStageConfig(BubbleStageSelection.selectedStage) ?? getBubbleStageConfig(1);
  }

  protected onLoad(): void {
    this.node.layer = Layers.Enum.UI_2D;
    this.ensureCanvasSize();
    this.clearPreviousLayout();
    this.initializeStageState();

    this.setupBackground();
    this.setupSafeArea();
    this.setupTopHUD();
    this.setupScoreBar();
    this.bindScenePearlBoard();
    this.bindPearlBoardController();
    this.applyStageConfigToBoard();
    this.setupShooterArea();
    this.setupBottomHUD();
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
      'ShooterArea',
      'AimGuide',
      'BottomHUD',
      'ResultPanel',
      'PausePanel',
    ];

    for (const child of [...this.node.children]) {
      if (generatedNodeNames.includes(child.name)) {
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
    this.topHud.setPosition(0, this.canvasHeight / 2 - 350);
    this.setSize(this.topHud, DESIGN_WIDTH, 620);

    this.backButton = this.createIconButton('BackButton', this.topHud, -600, 230, 'icon_back', 'Back');
    this.createLabel('StageLabel', this.topHud, `Stage ${BubbleStageSelection.selectedStage}`, 0, 230, 76, new Color(255, 255, 255, 255), 520, 112);
    this.pauseButton = this.createIconButton('PauseButton', this.topHud, 600, 230, 'icon_pause', 'Pause');

    const targetSection = this.createNode('TargetSection', this.topHud);
    targetSection.setPosition(350, 70);
    this.setSize(targetSection, 360, 130);
    this.createLabel('TargetTitleLabel', targetSection, 'เป้าหมาย', 0, 26, 34, new Color(255, 255, 255, 225), 340, 58);
    this.targetValueLabel = this.createLabel('TargetValueLabel', targetSection, `เหลือ ${this.targetLeft} ลูก`, 0, -24, 44, new Color(255, 255, 255, 255), 340, 68);

    console.log('[BubbleShooter] setupTopHUD complete');
  }

  private setupScoreBar(): void {
    const scoreSection = this.createNode('ScoreSection', this.topHud);
    scoreSection.setPosition(-350, 70);
    this.setSize(scoreSection, 480, 150);

    this.createBar('ScoreBarBackground', scoreSection, 0, -12, this.scoreBarWidth, this.scoreBarHeight, new Color(255, 255, 255, 115), 18);
    this.scoreFill = this.createBar('ScoreBarFill', scoreSection, -this.scoreBarWidth / 2, -12, 0, this.scoreBarHeight, new Color(255, 222, 91, 245), 18);
    this.scoreFill.setSiblingIndex(1);

    this.scoreStarNodes = [];
    this.getStarScoreProgressThresholds().forEach((threshold, index) => {
      const x = -this.scoreBarWidth / 2 + this.scoreBarWidth * threshold;
      const star = this.createNode(`Star${index + 1}`, scoreSection);
      star.setPosition(x, -14);
      star.setScale(0.75, 0.75, 1);
      this.setSize(star, this.scoreStarSize, this.scoreStarSize);
      this.scoreStarNodes.push(star);
    });

    this.scoreValueLabel = this.createLabel('ScoreValueLabel', scoreSection, 'คะแนน 0', 0, 84, 66, new Color(255, 255, 255, 250), 560, 96);

    console.log('[BubbleShooter] setupScoreBar complete');
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

  private setupShooterArea(): void {
    this.shooterArea = this.createNode('ShooterArea', this.safeArea);
    this.shooterArea.setPosition(0, -this.canvasHeight / 2 + 800);
    this.setSize(this.shooterArea, DESIGN_WIDTH, 780);

    const bottomDeck = this.createNode('BottomDeck', this.shooterArea);
    bottomDeck.setPosition(0, -120);
    this.setSize(bottomDeck, 1440, 620);
    this.loadSpriteFrame('bubble_shooter_bottom_deck', (spriteFrame) => {
      this.setSprite(bottomDeck, spriteFrame);
    });

    const shooterBase = this.createNode('ShooterAreaBase', this.shooterArea);
    shooterBase.setPosition(0, -218);
    this.setSize(shooterBase, 520, 170);
    this.drawRoundedRect(shooterBase, 520, 170, new Color(21, 89, 125, 48), 72);

    const nextPearlGroup = this.createNode('NextPearlGroup', this.shooterArea);
    nextPearlGroup.setPosition(-430, -155);
    this.setSize(nextPearlGroup, 270, 290);

    const nextPearlBackground = this.createNode('NextPearlBackground', nextPearlGroup);
    nextPearlBackground.setPosition(Vec3.ZERO);
    this.setSize(nextPearlBackground, 270, 270);
    this.loadSpriteFrame('next_pearl_panel', (spriteFrame) => {
      this.setSprite(nextPearlBackground, spriteFrame);
    });

    this.createLabel('NextPearlLabel', nextPearlGroup, 'Next', 0, 112, 34, new Color(255, 255, 255, 245), 170, 56);

    this.nextPearl = this.createNode('NextPearl', nextPearlGroup);
    this.nextPearl.setPosition(0, -10);
    this.setSize(this.nextPearl, NEXT_PEARL_FINAL_SIZE, NEXT_PEARL_FINAL_SIZE);
    this.logPearlNodeDebug(this.nextPearl);
    this.nextPearlSprite = this.createLauncherPearlRender(
      this.nextPearl,
      'NextPearlVisual',
      'NextPearlFallback',
      NEXT_PEARL_FINAL_SIZE,
    );
    this.bindNextPearlSwapInput();

    const hmeeLek = this.createNode('HmeeLek', this.shooterArea);
    hmeeLek.setPosition(0, -120);
    this.setSize(hmeeLek, 440, 710);
    this.createLabel('HmeeLekPlaceholderLabel', hmeeLek, 'Hmee Lek', 0, 0, 48, new Color(33, 91, 124, 255), 340, 100);
    this.loadSpriteFrame('hmee_lek_shooter_empty', (spriteFrame) => {
      hmeeLek.removeAllChildren();
      this.setSprite(hmeeLek, spriteFrame);
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

  private setupBottomHUD(): void {
    this.bottomHud = this.createNode('BottomHUD', this.safeArea);
    this.bottomHud.setPosition(0, -this.canvasHeight / 2 + 1130);
    this.setSize(this.bottomHud, DESIGN_WIDTH, 150);
    this.createBar('ShotsRemainingBackground', this.bottomHud, 0, 0, 480, 64, new Color(30, 93, 130, 135), 28);
    this.shotsRemainingLabel = this.createLabel('ShotsRemainingLabel', this.bottomHud, `บอลคงเหลือ ${this.ballsLeft} ลูก`, 0, 0, 44, new Color(255, 255, 255, 255), 680, 78);

    console.log('[BubbleShooter] setupBottomHUD complete');
  }

  private setupResultPanel(): void {
    this.resultPanel = this.createNode('ResultPanel', this.node);
    this.resultPanel.setPosition(Vec3.ZERO);
    this.setSize(this.resultPanel, 1040, 760);
    this.drawRoundedRect(this.resultPanel, 1040, 760, new Color(20, 83, 120, 238), 42);

    this.resultTitleLabel = this.createLabel('ResultTitleLabel', this.resultPanel, 'WIN', 0, 260, 100, new Color(255, 255, 255, 255), 700, 130);
    this.resultStarsLabel = this.createLabel('ResultStarsLabel', this.resultPanel, '☆☆☆', 0, 135, 105, new Color(255, 241, 120, 255), 640, 120);
    this.resultScoreLabel = this.createLabel('ResultScoreLabel', this.resultPanel, 'คะแนน 0', 0, 30, 58, new Color(255, 235, 123, 255), 720, 88);
    this.resultBestScoreLabel = this.createLabel('ResultBestScoreLabel', this.resultPanel, 'คะแนนสูงสุด 0', 0, -55, 50, new Color(255, 255, 255, 230), 720, 78);

    const retryButton = this.createResultButton('RetryButton', this.resultPanel, -350, -270, 'เล่นใหม่');
    const stageButton = this.createResultButton('ResultStageSelectButton', this.resultPanel, 0, -270, 'เลือกด่าน');
    this.resultNextButton = this.createResultButton('NextStageButton', this.resultPanel, 350, -270, 'ด่านต่อไป');

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
    this.safeArea.setSiblingIndex(1);
    this.ensurePearlBoardVisible();
    this.shooterArea.setSiblingIndex(1);
    this.bottomHud.setSiblingIndex(2);
    this.topHud.setSiblingIndex(3);

    const bottomDeck = this.shooterArea.getChildByName('BottomDeck');
    const shooterBase = this.shooterArea.getChildByName('ShooterAreaBase');
    const hmeeLek = this.shooterArea.getChildByName('HmeeLek');
    const currentPearl = this.shooterArea.getChildByName('CurrentPearl');
    const nextPearlGroup = this.shooterArea.getChildByName('NextPearlGroup');
    bottomDeck?.setSiblingIndex(0);
    shooterBase?.setSiblingIndex(1);
    hmeeLek?.setSiblingIndex(2);
    currentPearl?.setSiblingIndex(3);
    nextPearlGroup?.setSiblingIndex(4);

    const nextPearlBackground = nextPearlGroup?.getChildByName('NextPearlBackground');
    const nextPearl = nextPearlGroup?.getChildByName('NextPearl');
    const nextPearlLabel = nextPearlGroup?.getChildByName('NextPearlLabel');
    nextPearlBackground?.setSiblingIndex(0);
    nextPearl?.setSiblingIndex(1);
    nextPearlLabel?.setSiblingIndex(2);
    this.aimGuide?.setSiblingIndex(this.node.children.length - 1);
    this.resultPanel?.setSiblingIndex(this.node.children.length - 1);
    this.pausePanel?.setSiblingIndex(this.node.children.length - 1);
  }

  private ensurePearlBoardVisible(): void {
    if (!this.pearlBoard) {
      return;
    }

    this.pearlBoard.active = true;
    this.pearlBoard.setSiblingIndex(this.node.children.length - 1);
  }

  public updateScoreProgress(score: number): void {
    const normalizedProgress = this.getScoreProgress(score);
    const fillWidth = this.scoreBarWidth * normalizedProgress;
    this.scoreFill.setPosition(-this.scoreBarWidth / 2 + fillWidth / 2, -12);
    this.setSize(this.scoreFill, fillWidth, this.scoreBarHeight);
    this.drawRoundedRect(this.scoreFill, fillWidth, this.scoreBarHeight, new Color(255, 222, 91, 245), 18);
    this.updateStars(score);
  }

  public updateStars(score: number): void {
    const thresholds = this.getResolvedStageConfig().starScoreThresholds;
    this.scoreStarNodes.forEach((star, index) => {
      const isFilled = score >= thresholds[index];
      const shouldBounce = isFilled && !this.scoreStarFilledStates[index];
      this.scoreStarFilledStates[index] = this.scoreStarFilledStates[index] || isFilled;
      star.removeAllChildren();
      this.createLabel(
        `Star${index + 1}FallbackLabel`,
        star,
        isFilled ? '★' : '☆',
        0,
        0,
        18,
        new Color(255, 255, 255, 255),
        24,
        24,
      );
      this.loadSpriteFrame(isFilled ? 'icon_star_filled' : 'icon_star_empty', (spriteFrame) => {
        star.removeAllChildren();
        this.createSpriteVisual(`Star${index + 1}Icon`, star, this.scoreStarSize, this.scoreStarSize, spriteFrame);
      });

      if (shouldBounce) {
        this.playStarBounce(star);
      }
    });
  }

  private playStarBounce(star: Node): void {
    star.setScale(0.75, 0.75, 1);
    tween(star)
      .to(0.1, { scale: new Vec3(0.9, 0.9, 1) })
      .to(0.12, { scale: new Vec3(0.75, 0.75, 1) })
      .start();
  }

  private getScoreProgress(score: number): number {
    const maxScore = Math.max(1, this.getResolvedStageConfig().starScoreThresholds[2]);
    return Math.max(0, Math.min(score / maxScore, 1));
  }

  private getStarScoreProgressThresholds(): number[] {
    const thresholds = this.getResolvedStageConfig().starScoreThresholds;
    const maxScore = Math.max(1, thresholds[2]);
    return thresholds.map((threshold) => Math.max(0, Math.min(threshold / maxScore, 1)));
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
    director.loadScene('BubbleShooter');
  }

  private openNextStage(): void {
    const nextStageId = this.getResolvedStageConfig().stageId + 1;
    if (!getBubbleStageConfig(nextStageId)) {
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

    if (this.shotsRemainingLabel) {
      this.shotsRemainingLabel.string = `บอลคงเหลือ ${this.ballsLeft} ลูก`;
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
    if (availableColors.includes(currentColor)) {
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
      this.saveWinProgress();
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

    if (this.nextPearl) {
      this.nextPearl.active = false;
    }

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

  private showResultPanel(finalState: BubbleShooterGameState.Win | BubbleShooterGameState.Lose): void {
    if (!this.resultPanel) {
      return;
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

    if (this.resultNextButton) {
      const canOpenNextStage = finalState === BubbleShooterGameState.Win && this.hasNextStage();
      this.resultNextButton.active = canOpenNextStage;
      const nextButtonComponent = this.resultNextButton.getComponent(Button);
      if (nextButtonComponent) {
        nextButtonComponent.interactable = canOpenNextStage;
      }
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

  private createAimDots(): void {
    if (!this.aimGuide) {
      return;
    }

    this.aimDots = [];
    for (let index = 0; index < AIM_DOT_COUNT; index += 1) {
      const dot = this.createNode(`AimDot_${index + 1}`, this.aimGuide);
      this.setSize(dot, AIM_DOT_SIZE, AIM_DOT_SIZE);
      this.drawCircle(dot, AIM_DOT_SIZE / 2, new Color(255, 255, 255, Math.max(80, 230 - index * 5)));
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
    this.setSize(button, 148, 148);
    this.drawRoundedRect(button, 148, 148, new Color(255, 255, 255, 235), 36);
    this.createLabel(`${nodeName}FallbackLabel`, button, fallbackText, 0, 0, 34, new Color(30, 90, 130, 255), 148, 72);
    this.loadSpriteFrame(assetName, (spriteFrame) => {
      button.removeAllChildren();
      this.createSpriteVisual(`${nodeName}Icon`, button, 138, 138, spriteFrame);
    });
    return button;
  }

  private createResultButton(nodeName: string, parent: Node, x: number, y: number, text: string): Node {
    const button = this.createNode(nodeName, parent);
    button.setPosition(x, y);
    this.setSize(button, 300, 104);
    this.drawRoundedRect(button, 300, 104, new Color(255, 255, 255, 238), 30);
    this.createLabel(`${nodeName}Label`, button, text, 0, 0, 40, new Color(25, 83, 122, 255), 270, 86);

    const buttonComponent = button.addComponent(Button);
    buttonComponent.interactable = true;
    return button;
  }

  private createPauseButton(nodeName: string, parent: Node, x: number, y: number, text: string): Node {
    const button = this.createNode(nodeName, parent);
    button.setPosition(x, y);
    this.setSize(button, 520, 100);
    this.drawRoundedRect(button, 520, 100, new Color(255, 255, 255, 240), 30);
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

  private loadSpriteFrame(assetName: string, onLoaded: (spriteFrame: SpriteFrame) => void): void {
    const resourcePath = `${RESOURCE_ROOT}/${assetName}/spriteFrame`;
    resources.load(resourcePath, SpriteFrame, (error, spriteFrame) => {
      if (error || !spriteFrame) {
        console.error(`[BubbleShooterController] SpriteFrame not found: ${resourcePath}`, error);
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

  private drawCircle(node: Node, radius: number, color: Color): void {
    const graphics = node.getComponent(Graphics) ?? node.addComponent(Graphics);
    graphics.clear();
    graphics.fillColor = color;
    graphics.circle(0, 0, radius);
    graphics.fill();
  }

}
