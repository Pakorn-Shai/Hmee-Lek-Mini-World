import {
  _decorator,
  Button,
  Color,
  Component,
  director,
  Graphics,
  Label,
  Layers,
  Node,
  resources,
  Sprite,
  SpriteFrame,
  UITransform,
  Vec3,
  Widget,
} from 'cc';
import { BubbleStageSelection, getBubbleStageConfig } from '../data/BubbleStageData';

const { ccclass } = _decorator;

const DESIGN_WIDTH = 1440;
const DESIGN_HEIGHT = 3200;
const RESOURCE_ROOT = 'bubble-shooter';
const TEST_SCORE_PROGRESS = 0.4;
const STAR_THRESHOLDS = [0.33, 0.66, 1.0];
const CURRENT_PEARL_FINAL_SIZE = 136;
const NEXT_PEARL_FINAL_SIZE = 118;

@ccclass('BubbleShooterController')
export class BubbleShooterController extends Component {
  private safeArea!: Node;
  private topHud!: Node;
  private pearlBoard?: Node;
  private shooterArea!: Node;
  private bottomHud!: Node;
  private backButton!: Node;
  private pauseButton!: Node;
  private scoreFill!: Node;
  private readonly scoreBarWidth = 820;
  private readonly scoreBarHeight = 54;
  private scoreStarNodes: Node[] = [];
  private canvasWidth = DESIGN_WIDTH;
  private canvasHeight = DESIGN_HEIGHT;

  private get currentStageConfig() {
    return getBubbleStageConfig(BubbleStageSelection.selectedStage) ?? getBubbleStageConfig(1);
  }

  protected onLoad(): void {
    this.node.layer = Layers.Enum.UI_2D;
    this.ensureCanvasSize();
    this.clearPreviousLayout();

    this.setupBackground();
    this.setupSafeArea();
    this.setupTopHUD();
    this.setupScoreBar();
    this.bindScenePearlBoard();
    this.setupShooterArea();
    this.setupBottomHUD();
    this.applyLayoutZOrder();
    this.bindButtons();
    this.updateScoreProgress(TEST_SCORE_PROGRESS);
  }

  protected start(): void {
    this.ensurePearlBoardVisible();
  }

  public backToStageSelect(): void {
    console.log('[BubbleShooterController] Back clicked. Loading StageSelect.');
    director.loadScene('StageSelect');
  }

  private onPauseClicked(): void {
    console.log('Pause clicked');
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
      'BottomHUD',
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

    this.backButton = this.createIconButton('BackButton', this.topHud, -575, 188, 'icon_back', 'Back');
    this.createLabel('StageLabel', this.topHud, `Stage ${BubbleStageSelection.selectedStage}`, 0, 180, 74, new Color(255, 255, 255, 255), 520, 112);
    this.pauseButton = this.createIconButton('PauseButton', this.topHud, 575, 188, 'icon_pause', 'Pause');
    const targetPearls = this.currentStageConfig?.targetPearls ?? 12;
    this.createLabel('TargetLabel', this.topHud, `เป้าหมาย: เหลือ ${targetPearls} ลูก`, 0, 62, 44, new Color(255, 255, 255, 255), 900, 78);

    console.log('[BubbleShooter] setupTopHUD complete');
  }

  private setupScoreBar(): void {
    const scoreSection = this.createNode('ScoreSection', this.topHud);
    scoreSection.setPosition(0, -92);
    this.setSize(scoreSection, 960, 220);

    this.createBar('ScoreBarBackground', scoreSection, 0, 0, this.scoreBarWidth, this.scoreBarHeight, new Color(255, 255, 255, 115), 27);
    this.scoreFill = this.createBar('ScoreBarFill', scoreSection, -this.scoreBarWidth / 2, 0, 0, this.scoreBarHeight, new Color(255, 222, 91, 245), 27);
    this.scoreFill.setSiblingIndex(1);

    this.scoreStarNodes = [];
    STAR_THRESHOLDS.forEach((threshold, index) => {
      const x = -this.scoreBarWidth / 2 + this.scoreBarWidth * threshold;
      const star = this.createNode(`Star${index + 1}`, scoreSection);
      star.setPosition(x, 8);
      this.setSize(star, 78, 78);
      this.scoreStarNodes.push(star);
    });

    this.createLabel('ScoreValueLabel', scoreSection, '0', 0, -68, 32, new Color(255, 255, 255, 220), 220, 54);

    console.log('[BubbleShooter] setupScoreBar complete');
  }

  private bindScenePearlBoard(): void {
    this.pearlBoard = this.node.getChildByName('PearlBoard') ?? undefined;
    if (!this.pearlBoard) {
      console.warn('[BubbleShooterController] PearlBoard is not found in the scene.');
      return;
    }

    this.pearlBoard.active = true;
  }

  private setupShooterArea(): void {
    this.shooterArea = this.createNode('ShooterArea', this.safeArea);
    this.shooterArea.setPosition(0, -this.canvasHeight / 2 + 600);
    this.setSize(this.shooterArea, DESIGN_WIDTH, 780);

    const shooterBase = this.createNode('ShooterAreaBase', this.shooterArea);
    shooterBase.setPosition(0, -218);
    this.setSize(shooterBase, 520, 170);
    this.drawRoundedRect(shooterBase, 520, 170, new Color(21, 89, 125, 48), 72);

    const nextPearlGroup = this.createNode('NextPearlGroup', this.shooterArea);
    nextPearlGroup.setPosition(-430, -280);
    this.setSize(nextPearlGroup, 250, 260);

    const nextPearlBackground = this.createNode('NextPearlBackground', nextPearlGroup);
    nextPearlBackground.setPosition(Vec3.ZERO);
    this.setSize(nextPearlBackground, 250, 260);
    this.drawRoundedRect(nextPearlBackground, 250, 260, new Color(21, 89, 125, 90), 44);

    this.createLabel('NextPearlLabel', nextPearlGroup, 'Next', 0, 105, 34, new Color(255, 255, 255, 245), 170, 56);

    const nextPearl = this.createNode('NextPearl', nextPearlGroup);
    nextPearl.setPosition(0, -10);
    this.setSize(nextPearl, NEXT_PEARL_FINAL_SIZE, NEXT_PEARL_FINAL_SIZE);
    this.logPearlNodeDebug(nextPearl);
    this.createPearlRender(
      nextPearl,
      'NextPearlVisual',
      'NextPearlFallback',
      NEXT_PEARL_FINAL_SIZE,
      'pearl_gold',
      new Color(255, 206, 75, 255),
    );

    const hmeeLek = this.createNode('HmeeLek', this.shooterArea);
    hmeeLek.setPosition(0, -285);
    this.setSize(hmeeLek, 330, 520);
    this.createLabel('HmeeLekPlaceholderLabel', hmeeLek, 'Hmee Lek', 0, 0, 48, new Color(33, 91, 124, 255), 340, 100);
    this.loadSpriteFrame('hmee_lek_shooter_empty', (spriteFrame) => {
      hmeeLek.removeAllChildren();
      this.setSprite(hmeeLek, spriteFrame);
    });

    const currentPearl = this.createNode('CurrentPearl', this.shooterArea);
    currentPearl.setPosition(0, -330);
    this.setSize(currentPearl, CURRENT_PEARL_FINAL_SIZE, CURRENT_PEARL_FINAL_SIZE);
    this.logPearlNodeDebug(currentPearl);
    this.createPearlRender(
      currentPearl,
      'CurrentPearlVisual',
      'CurrentPearlFallback',
      CURRENT_PEARL_FINAL_SIZE,
      'pearl_purple',
      new Color(168, 99, 255, 255),
    );

    console.log('[BubbleShooter] setupShooterArea complete');
  }

  private setupBottomHUD(): void {
    this.bottomHud = this.createNode('BottomHUD', this.safeArea);
    this.bottomHud.setPosition(0, -this.canvasHeight / 2 + 860);
    this.setSize(this.bottomHud, DESIGN_WIDTH, 150);
    this.createBar('ShotsRemainingBackground', this.bottomHud, 0, 0, 480, 64, new Color(30, 93, 130, 135), 28);
    const maxShots = this.currentStageConfig?.maxShots ?? 25;
    this.createLabel('ShotsRemainingLabel', this.bottomHud, `บอลคงเหลือ ${maxShots} ลูก`, 0, 0, 34, new Color(255, 255, 255, 255), 580, 68);

    console.log('[BubbleShooter] setupBottomHUD complete');
  }

  private applyLayoutZOrder(): void {
    this.node.getChildByName('Background')?.setSiblingIndex(0);
    this.safeArea.setSiblingIndex(1);
    this.ensurePearlBoardVisible();
    this.shooterArea.setSiblingIndex(1);
    this.bottomHud.setSiblingIndex(2);
    this.topHud.setSiblingIndex(3);

    const shooterBase = this.shooterArea.getChildByName('ShooterAreaBase');
    const hmeeLek = this.shooterArea.getChildByName('HmeeLek');
    const currentPearl = this.shooterArea.getChildByName('CurrentPearl');
    const nextPearlGroup = this.shooterArea.getChildByName('NextPearlGroup');
    shooterBase?.setSiblingIndex(0);
    hmeeLek?.setSiblingIndex(1);
    currentPearl?.setSiblingIndex(2);
    nextPearlGroup?.setSiblingIndex(3);

    const nextPearlBackground = nextPearlGroup?.getChildByName('NextPearlBackground');
    const nextPearl = nextPearlGroup?.getChildByName('NextPearl');
    const nextPearlLabel = nextPearlGroup?.getChildByName('NextPearlLabel');
    nextPearlBackground?.setSiblingIndex(0);
    nextPearl?.setSiblingIndex(1);
    nextPearlLabel?.setSiblingIndex(2);
  }

  private ensurePearlBoardVisible(): void {
    if (!this.pearlBoard) {
      return;
    }

    this.pearlBoard.active = true;
    this.pearlBoard.setSiblingIndex(this.node.children.length - 1);
  }

  public updateScoreProgress(progress: number): void {
    const normalizedProgress = Math.max(0, Math.min(progress, 1));
    const fillWidth = this.scoreBarWidth * normalizedProgress;
    this.scoreFill.setPosition(-this.scoreBarWidth / 2 + fillWidth / 2, 0);
    this.setSize(this.scoreFill, fillWidth, this.scoreBarHeight);
    this.drawRoundedRect(this.scoreFill, fillWidth, this.scoreBarHeight, new Color(255, 222, 91, 245), 27);
    this.updateStars(normalizedProgress);
  }

  public updateStars(progress: number): void {
    this.scoreStarNodes.forEach((star, index) => {
      const isFilled = progress >= STAR_THRESHOLDS[index];
      star.removeAllChildren();
      this.createLabel(
        `Star${index + 1}FallbackLabel`,
        star,
        isFilled ? '★' : '☆',
        0,
        0,
        70,
        new Color(255, 255, 255, 255),
        92,
        92,
      );
      this.loadSpriteFrame(isFilled ? 'icon_star_filled' : 'icon_star_empty', (spriteFrame) => {
        star.removeAllChildren();
        this.createSpriteVisual(`Star${index + 1}Icon`, star, 78, 78, spriteFrame);
      });
    });
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
