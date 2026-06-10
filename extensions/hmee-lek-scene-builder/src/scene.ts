type AssetReport = {
  found: string[];
  missing: string[];
};

type AssetSpec = {
  path: string;
  url: string;
};

type SpriteFrameInfo = {
  path: string;
  uuid: string;
};

type BuildResult = {
  ok: boolean;
  warning?: string;
  createdNodes: number;
  foundAssets: string[];
  missingAssets: string[];
};

type Cocos = Record<string, any>;

export {};

const ASSETS = {
  background: asset('assets/art/title/title_background.png'),
  unlockedStageButton: asset('assets/art/common/stage_button_unlocked.png'),
  lockedStageButton: asset('assets/art/common/stage_button_locked.png'),
  backButton: asset('assets/art/common/icon_back.png'),
};

let createdNodes = 0;

function asset(path: string): AssetSpec {
  return {
    path,
    url: `db://${path}`,
  };
}

function log(message: string): void {
  console.log(`[Hmee Lek Scene Builder] ${message}`);
}

function warn(message: string): void {
  console.warn(`[Hmee Lek Scene Builder] ${message}`);
}

function getCc(): Cocos {
  return require('cc') as Cocos;
}

function createNode(cc: Cocos, name: string, parent?: any): any {
  const node = new cc.Node(name);
  createdNodes += 1;
  if (parent) {
    node.setParent(parent);
  }
  node.layer = cc.Layers.Enum.UI_2D;
  return node;
}

function getOrCreateChild(cc: Cocos, parent: any, name: string): any {
  const existing = parent.children.find((child: any) => child.name === name);
  if (existing) {
    existing.layer = cc.Layers.Enum.UI_2D;
    return existing;
  }
  return createNode(cc, name, parent);
}

function ensureComponent(node: any, componentType: any): any {
  return node.getComponent(componentType) ?? node.addComponent(componentType);
}

function setSize(cc: Cocos, node: any, width: number, height: number): any {
  const transform = ensureComponent(node, cc.UITransform);
  transform.setContentSize(width, height);
  return transform;
}

function setPosition(cc: Cocos, node: any, x: number, y: number, z = 0): void {
  node.setPosition(new cc.Vec3(x, y, z));
}

async function queryAssetInfo(url: string): Promise<any | null> {
  try {
    return await Editor.Message.request('asset-db', 'query-asset-info', url);
  } catch (error) {
    warn(`Asset query failed for ${url}: ${(error as Error).message}`);
    return null;
  }
}

function extractSpriteFrameUuid(assetInfo: any): string | null {
  const subAssets = assetInfo?.subAssets;
  if (Array.isArray(subAssets)) {
    const spriteFrame = subAssets.find(
      (assetInfoItem: any) => assetInfoItem.type === 'cc.SpriteFrame' || assetInfoItem.name === 'spriteFrame',
    );
    return spriteFrame?.uuid ?? null;
  }

  if (subAssets && typeof subAssets === 'object') {
    for (const subAsset of Object.values(subAssets) as any[]) {
      if (
        subAsset?.type === 'cc.SpriteFrame' ||
        subAsset?.name === 'spriteFrame' ||
        subAsset?.importer === 'sprite-frame'
      ) {
        return subAsset.uuid ?? null;
      }
    }
  }

  return assetInfo?.uuid && String(assetInfo.uuid).includes('@') ? assetInfo.uuid : null;
}

async function querySpriteFrameAsset(spec: AssetSpec): Promise<string | null> {
  const directSpriteFrameInfo = await queryAssetInfo(`${spec.url}/spriteFrame`);
  if (directSpriteFrameInfo?.uuid) {
    return directSpriteFrameInfo.uuid;
  }

  const assetInfo = await queryAssetInfo(spec.url);
  return extractSpriteFrameUuid(assetInfo);
}

async function findSpriteFrameUuid(spec: AssetSpec, report: AssetReport): Promise<SpriteFrameInfo | null> {
  const uuid = await querySpriteFrameAsset(spec);
  if (uuid) {
    report.found.push(spec.path);
    return { path: spec.path, uuid };
  }

  report.missing.push(spec.path);
  return null;
}

async function loadSpriteFrame(cc: Cocos, uuid: string): Promise<any | null> {
  return await new Promise((resolve) => {
    cc.assetManager.loadAny({ uuid }, (error: Error | null, loadedAsset: any) => {
      if (error) {
        warn(`Failed to load SpriteFrame ${uuid}: ${error.message}`);
        resolve(null);
        return;
      }
      resolve(loadedAsset);
    });
  });
}

async function setSpriteFrame(cc: Cocos, sprite: any, spriteInfo: SpriteFrameInfo | null): Promise<void> {
  if (!spriteInfo) {
    sprite.spriteFrame = null;
    return;
  }

  sprite.spriteFrame = await loadSpriteFrame(cc, spriteInfo.uuid);
}

function findFirstCameraInTree(node: any, cameraType: any): any | null {
  const camera = node.getComponent?.(cameraType);
  if (camera) {
    return camera;
  }

  for (const child of node.children ?? []) {
    const childCamera = findFirstCameraInTree(child, cameraType);
    if (childCamera) {
      return childCamera;
    }
  }

  return null;
}

function buildSceneCamera(cc: Cocos, scene: any, canvasNode: any): void {
  const canvasCamera = canvasNode.children
    .find((child: any) => child.name === 'Camera')
    ?.getComponent(cc.Camera);
  const existingCamera = canvasCamera ?? findFirstCameraInTree(scene, cc.Camera);

  if (existingCamera) {
    const cameraNode = existingCamera.node;
    cameraNode.layer = cameraNode.parent === canvasNode ? cc.Layers.Enum.UI_2D : cc.Layers.Enum.DEFAULT;
    existingCamera.projection = cc.Camera.ProjectionType.ORTHO;
    existingCamera.orthoHeight = 1600;
    setPosition(cc, cameraNode, 0, 0, 1000);
    log(`Using existing camera: ${cameraNode.name}`);
    return;
  }

  const cameraNode = createNode(cc, 'Camera', canvasNode);
  const newCamera = ensureComponent(cameraNode, cc.Camera);
  cameraNode.layer = cc.Layers.Enum.UI_2D;
  newCamera.projection = cc.Camera.ProjectionType.ORTHO;
  newCamera.orthoHeight = 1600;
  setPosition(cc, cameraNode, 0, 0, 1000);
  log('Created Camera because no Camera component exists in StageSelect.');
}

function getDesignResolution(cc: Cocos): { width: number; height: number } {
  const size = cc.view?.getDesignResolutionSize?.();
  return {
    width: size?.width ?? 1440,
    height: size?.height ?? 3200,
  };
}

function buildCanvas(cc: Cocos, scene: any): any {
  const canvasNode = getOrCreateChild(cc, scene, 'Canvas');
  ensureComponent(canvasNode, cc.Canvas);
  const designResolution = getDesignResolution(cc);
  setSize(cc, canvasNode, designResolution.width, designResolution.height);
  canvasNode.layer = cc.Layers.Enum.UI_2D;
  return canvasNode;
}

async function buildBackground(cc: Cocos, canvasNode: any, spriteInfo: SpriteFrameInfo | null): Promise<void> {
  const background = getOrCreateChild(cc, canvasNode, 'Background');
  background.setSiblingIndex(0);
  const canvasTransform = ensureComponent(canvasNode, cc.UITransform);
  setSize(cc, background, canvasTransform.width, canvasTransform.height);

  const sprite = ensureComponent(background, cc.Sprite);
  sprite.type = cc.Sprite.Type.SIMPLE;
  sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
  await setSpriteFrame(cc, sprite, spriteInfo);

  const widget = ensureComponent(background, cc.Widget);
  widget.isAlignTop = true;
  widget.isAlignBottom = true;
  widget.isAlignLeft = true;
  widget.isAlignRight = true;
  widget.top = 0;
  widget.bottom = 0;
  widget.left = 0;
  widget.right = 0;
  widget.updateAlignment?.();
}

function buildSafeArea(cc: Cocos, canvasNode: any): any {
  const safeArea = getOrCreateChild(cc, canvasNode, 'SafeArea');
  const canvasTransform = ensureComponent(canvasNode, cc.UITransform);
  setSize(cc, safeArea, canvasTransform.width, canvasTransform.height);
  ensureComponent(safeArea, cc.SafeArea);
  return safeArea;
}

function buildPageTitle(cc: Cocos, safeArea: any): void {
  const title = getOrCreateChild(cc, safeArea, 'PageTitle');
  setPosition(cc, title, 0, 1350, 0);
  setSize(cc, title, 1000, 160);

  const label = ensureComponent(title, cc.Label);
  label.string = 'Select Stage';
  label.fontSize = 100;
  label.lineHeight = 110;
  label.overflow = cc.Label.Overflow.CLAMP;
  label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  label.verticalAlign = cc.Label.VerticalAlign.CENTER;
}

function buildStageGrid(cc: Cocos, safeArea: any): any {
  const grid = getOrCreateChild(cc, safeArea, 'StageGrid');
  setPosition(cc, grid, 0, 150, 0);
  setSize(cc, grid, 1100, 1600);

  const layout = ensureComponent(grid, cc.Layout);
  layout.type = cc.Layout.Type.GRID;
  layout.startAxis = cc.Layout.AxisDirection.HORIZONTAL;
  layout.horizontalDirection = cc.Layout.HorizontalDirection.LEFT_TO_RIGHT;
  layout.verticalDirection = cc.Layout.VerticalDirection.TOP_TO_BOTTOM;
  layout.cellSize = new cc.Size(260, 260);
  layout.spacingX = 70;
  layout.spacingY = 70;
  layout.resizeMode = cc.Layout.ResizeMode.NONE;

  return grid;
}

async function buildStageButton(
  cc: Cocos,
  parent: any,
  index: number,
  spriteInfo: SpriteFrameInfo | null,
  interactable: boolean,
): Promise<void> {
  const stageNode = getOrCreateChild(cc, parent, `Stage${String(index).padStart(2, '0')}`);
  stageNode.setSiblingIndex(index - 1);
  setSize(cc, stageNode, 260, 260);

  const sprite = ensureComponent(stageNode, cc.Sprite);
  sprite.type = cc.Sprite.Type.SIMPLE;
  sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
  await setSpriteFrame(cc, sprite, spriteInfo);

  const button = ensureComponent(stageNode, cc.Button);
  button.interactable = interactable;

  const labelNode = getOrCreateChild(cc, stageNode, 'Label');
  setSize(cc, labelNode, 260, 260);
  setPosition(cc, labelNode, 0, 0, 0);
  const label = ensureComponent(labelNode, cc.Label);
  label.string = String(index);
  label.fontSize = 90;
  label.lineHeight = 100;
  label.overflow = cc.Label.Overflow.CLAMP;
  label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
  label.verticalAlign = cc.Label.VerticalAlign.CENTER;
}

async function buildBackButton(cc: Cocos, safeArea: any, spriteInfo: SpriteFrameInfo | null): Promise<void> {
  const backButton = getOrCreateChild(cc, safeArea, 'BackButton');
  setPosition(cc, backButton, -560, -1350, 0);
  setSize(cc, backButton, 150, 150);

  const sprite = ensureComponent(backButton, cc.Sprite);
  sprite.type = cc.Sprite.Type.SIMPLE;
  sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
  await setSpriteFrame(cc, sprite, spriteInfo);

  ensureComponent(backButton, cc.Button);
}

async function markSceneDirty(): Promise<void> {
  try {
    await Editor.Message.request('scene', 'snapshot');
  } catch {
    Editor.Message.send('scene', 'dirty');
  }
}

async function buildBubbleStageSelect(): Promise<BuildResult> {
  console.log('[Hmee Lek Tools] Building StageSelect scene');
  const cc = getCc();
  createdNodes = 0;

  const scene = cc.director.getScene();
  if (!scene || scene.name !== 'StageSelect') {
    const sceneName = scene?.name ?? '(no scene)';
    warn(`Open StageSelect.scene before running this command. Current scene: ${sceneName}`);
    return {
      ok: false,
      warning: `Open StageSelect.scene before running this command. Current scene: ${sceneName}`,
      createdNodes: 0,
      foundAssets: [],
      missingAssets: [],
    };
  }

  const assetReport: AssetReport = { found: [], missing: [] };
  const background = await findSpriteFrameUuid(ASSETS.background, assetReport);
  const unlockedStageButton = await findSpriteFrameUuid(ASSETS.unlockedStageButton, assetReport);
  const lockedStageButton = await findSpriteFrameUuid(ASSETS.lockedStageButton, assetReport);
  const backButton = await findSpriteFrameUuid(ASSETS.backButton, assetReport);

  const canvasNode = buildCanvas(cc, scene);
  buildSceneCamera(cc, scene, canvasNode);
  await buildBackground(cc, canvasNode, background);
  const safeArea = buildSafeArea(cc, canvasNode);
  buildPageTitle(cc, safeArea);
  const stageGrid = buildStageGrid(cc, safeArea);

  for (let index = 1; index <= 10; index += 1) {
    await buildStageButton(
      cc,
      stageGrid,
      index,
      index === 1 ? unlockedStageButton : lockedStageButton,
      index === 1,
    );
  }

  await buildBackButton(cc, safeArea, backButton);
  await markSceneDirty();

  log(`Created ${createdNodes} nodes.`);
  log(`Found assets: ${assetReport.found.length ? assetReport.found.join(', ') : '(none)'}`);
  log(`Missing assets: ${assetReport.missing.length ? assetReport.missing.join(', ') : '(none)'}`);
  log('StageSelect generated UI complete. Press Ctrl + S to save the scene.');
  console.log('[Hmee Lek Tools] StageSelect scene build completed');

  return {
    ok: true,
    createdNodes,
    foundAssets: assetReport.found,
    missingAssets: assetReport.missing,
  };
}

export const methods = {
  buildBubbleStageSelect,
};
