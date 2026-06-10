# Hmee Lek Mini World
## แผนพัฒนาเกมฉบับ Cocos Creator + TypeScript

> เอกสารฉบับนี้แทนแผนเดิมที่อิง Godot  
> แนวทางหลัก: **ทำแอปรวมมินิเกมหนึ่งแอป แต่เริ่มปล่อยจาก Bubble Shooter เพียงเกมเดียวก่อน**  
> จากนั้นจึงเติมเกมใหม่เข้าไปทีละเกม โดยไม่ทำให้โครงสร้างโปรเจกต์กลายเป็นป่าดงดิบของโค้ด 🧸🫧

---

## 1. ภาพรวมโปรเจกต์

| หัวข้อ | รายละเอียด |
|---|---|
| ชื่อเกม | **Hmee Lek Mini World** |
| ประเภท | แอปรวมมินิเกม Casual สำหรับมือถือแนวตั้ง |
| Engine | **Cocos Creator 3.8.8** |
| ภาษาโปรแกรม | **TypeScript** |
| แพลตฟอร์มเป้าหมายแรก | Android |
| แพลตฟอร์มทดสอบระหว่างพัฒนา | Web Mobile Preview และ Android Device |
| รูปแบบหน้าจอ | Portrait รองรับหลายอัตราส่วน ไม่ล็อกเฉพาะ 9:16 |
| เกมแรก | Bubble Shooter ธีมชานมไข่มุก |
| แนวทางปล่อยเกม | เปิดตัวด้วยเกมแรกที่เล่นจบได้จริง แล้วเพิ่มมินิเกมใหม่ภายหลัง |
| เป้าหมายระยะยาว | ขยายเป็นโลกของหมีเล็กที่มีมินิเกมหลายแบบ โดยยังใช้ Common UI, ระบบเซฟ และระบบเศรษฐกิจร่วมกัน |

---

## 2. หลักคิดของโปรเจกต์

### 2.1 เริ่มจากแกนเล็ก แต่ทำให้ครบวงจร

เวอร์ชันแรกไม่ควรมีโครงสร้างขนาดเมืองทั้งเมืองแต่ยังไม่มีร้านไหนเปิด ให้สร้างเส้นทางผู้เล่นที่สมบูรณ์ก่อน:

```text
เปิดเกม
  → Title
  → Main Menu
  → เลือก Bubble Shooter
  → เลือกด่าน
  → เล่นเกม
  → ชนะหรือแพ้
  → ดูผลลัพธ์
  → กลับไปเลือกด่าน
  → เซฟความคืบหน้า
```

เมื่อเส้นทางนี้ใช้งานได้ดี จึงค่อยเพิ่ม Shop, Daily Reward, Ranking, Login และเกมถัดไป

### 2.2 แยก Common Core ออกจาก Mini Game

ระบบที่ทุกเกมต้องใช้ควรอยู่ส่วนกลาง เช่น:

- ระบบเปลี่ยน Scene
- ระบบเสียง
- ระบบเซฟ
- ระบบตั้งค่า
- ระบบภาษา
- ระบบเหรียญ
- Common UI
- Popup และ Loading
- ข้อมูลด่านและผลลัพธ์

ส่วน Logic เฉพาะเกม เช่น การยิงไข่มุก การตรวจจับกลุ่มสี หรือการตกของไข่มุก ให้อยู่ภายในโฟลเดอร์ Bubble Shooter เท่านั้น

### 2.3 อย่ารีบสร้างระบบออนไลน์ก่อนเกมสนุก

เวอร์ชันแรกใช้ Local Save ก่อน  
Login, Cloud Save, Ranking Online, Analytics, Ads และ In-App Purchase ให้ต่อเพิ่มเมื่อ Core Loop เล่นสนุกและเสถียรแล้ว

---

## 3. Scope ของเวอร์ชันแรก

## 3.1 MVP: Bubble Shooter เล่นได้ครบ

### ต้องมี

- Title Screen
- Main Menu
- Game Card สำหรับ Bubble Shooter
- Stage Select
- Bubble Shooter Gameplay
- Pause Menu
- Result Panel แบบผ่านด่านและไม่ผ่าน
- ระบบดาว 1–3 ดาว
- ระบบคะแนน
- คะแนนจากจำนวนไข่มุกที่เหลือหรือจำนวนครั้งยิงที่เหลือ
- ระบบปลดล็อกด่านถัดไป
- Local Save
- Settings เบื้องต้น
- เสียงเพลงและเสียงเอฟเฟกต์
- Responsive UI สำหรับมือถือแนวตั้งหลายขนาด
- Build ทดสอบบน Android เครื่องจริง

### ยังไม่ทำใน MVP

- Login Google หรือ Facebook
- Cloud Save
- Ranking Online
- Shop ที่ซื้อของด้วยเงินจริง
- Ads
- Daily Reward
- Mail
- Event
- Hot Update
- Mini Game อื่น
- Backend Server

---

## 3.2 Roadmap ของมินิเกมในแอป

| ลำดับ | Mini Game | ธีมหลัก | สถานะ |
|---:|---|---|---|
| 1 | Bubble Shooter | ยิงไข่มุกจากแก้วชานม | ทำก่อน |
| 2 | Match-3 Swap | หัวสัตว์น่ารัก | เพิ่มหลัง Bubble Shooter เสถียร |
| 3 | Zuma / Yarn Loop | หมีเล็กยิงลูกไหมพรม | เพิ่มภายหลัง |
| 4 | Match-3 Tiles | จับคู่ Tile หัวสัตว์ | เพิ่มภายหลัง |
| 5 | Endless Dodger | หมีเล็กวิ่งหลบสิ่งกีดขวาง | เพิ่มภายหลัง |

หน้า Main Menu ใช้ช่องเกมจำนวนไม่มากเกินไปในแต่ละหน้า เพื่อให้ผู้เล่นไม่รู้สึกเหมือนเดินเข้าซูเปอร์มาร์เก็ตที่ป้ายราคาเต็มเพดาน

---

## 4. เครื่องมือและ Environment

## 4.1 เครื่องมือหลัก

| เครื่องมือ | ใช้ทำอะไร |
|---|---|
| Cocos Dashboard | ติดตั้งและจัดการ Cocos Creator หลายเวอร์ชัน |
| Cocos Creator 3.8.8 | Editor และ Engine |
| TypeScript | เขียน Logic ของเกม |
| VS Code | แก้ไขโค้ด |
| Git + GitHub | เก็บ Version Control |
| Android Studio | Build และทดสอบ Android |
| JDK 17 | ใช้กับ Native Android Build |
| Android SDK / NDK | ใช้ Build Android |

## 4.2 หลักการล็อกเวอร์ชัน

- ใช้ **Cocos Creator 3.8.8** ตลอดช่วงสร้าง MVP
- ไม่อัปเกรด Engine กลางทางถ้าไม่มีเหตุผลจำเป็น
- หากต้องทดลองรุ่นใหม่ ให้สร้าง Branch แยกก่อน
- Commit ก่อนเปลี่ยน Engine ทุกครั้ง

## 4.3 ชื่อโปรเจกต์

```text
hmee_lek_mini_world
```

ตัวอย่างตำแหน่งโปรเจกต์บน Windows:

```text
D:\GameProjects\hmee_lek_mini_world
```

เมื่ออัปโหลดขึ้น GitHub ให้เลือก **โฟลเดอร์โปรเจกต์จริงที่สร้างเอง** ไม่ใช่โฟลเดอร์ Cache หรือ Project Data Folder ของ Engine

---

## 5. โครงสร้างโปรเจกต์

โครงสร้างด้านล่างออกแบบให้เพิ่มมินิเกมได้ทีละเกม โดยไม่ต้องย้ายบ้านทั้งหลังทุกครั้งที่เพิ่มห้องใหม่

```text
hmee_lek_mini_world/
├─ assets/
│  ├─ scenes/
│  │  ├─ Boot.scene
│  │  ├─ Title.scene
│  │  ├─ MainMenu.scene
│  │  ├─ StageSelect.scene
│  │  ├─ Settings.scene
│  │  └─ bubble_shooter/
│  │     └─ BubbleShooterGame.scene
│  │
│  ├─ scripts/
│  │  ├─ core/
│  │  │  ├─ GameApp.ts
│  │  │  ├─ SceneRouter.ts
│  │  │  ├─ SaveManager.ts
│  │  │  ├─ AudioManager.ts
│  │  │  ├─ SettingsManager.ts
│  │  │  ├─ LocalizationManager.ts
│  │  │  ├─ EconomyManager.ts
│  │  │  └─ EventBus.ts
│  │  │
│  │  ├─ data/
│  │  │  ├─ GameConfig.ts
│  │  │  ├─ SaveData.ts
│  │  │  ├─ StageConfig.ts
│  │  │  └─ MiniGameId.ts
│  │  │
│  │  ├─ ui/
│  │  │  ├─ BasePanel.ts
│  │  │  ├─ LoadingPanel.ts
│  │  │  ├─ PausePanel.ts
│  │  │  ├─ ResultPanel.ts
│  │  │  ├─ CoinDisplay.ts
│  │  │  └─ ResponsiveCanvas.ts
│  │  │
│  │  └─ minigames/
│  │     └─ bubble_shooter/
│  │        ├─ BubbleShooterController.ts
│  │        ├─ BubbleBoard.ts
│  │        ├─ BubbleLauncher.ts
│  │        ├─ BubbleNode.ts
│  │        ├─ BubbleFactory.ts
│  │        ├─ BubbleCollision.ts
│  │        ├─ BubbleMatchResolver.ts
│  │        ├─ BubbleDropResolver.ts
│  │        ├─ BubbleAimGuide.ts
│  │        ├─ BubbleStageLoader.ts
│  │        ├─ BubbleScoreCalculator.ts
│  │        └─ BubbleGameState.ts
│  │
│  ├─ prefabs/
│  │  ├─ common/
│  │  │  ├─ ButtonPrimary.prefab
│  │  │  ├─ ButtonSecondary.prefab
│  │  │  ├─ PausePanel.prefab
│  │  │  ├─ ResultPanel.prefab
│  │  │  ├─ CoinDisplay.prefab
│  │  │  └─ LoadingPanel.prefab
│  │  └─ bubble_shooter/
│  │     ├─ Bubble.prefab
│  │     ├─ FrozenBubble.prefab
│  │     ├─ StoneBubble.prefab
│  │     ├─ LockedBubble.prefab
│  │     ├─ ShellBubble.prefab
│  │     └─ AimGuideDot.prefab
│  │
│  ├─ resources/
│  │  ├─ configs/
│  │  │  ├─ bubble_stages/
│  │  │  │  ├─ stage_001.json
│  │  │  │  ├─ stage_002.json
│  │  │  │  └─ stage_003.json
│  │  │  └─ app_config.json
│  │  └─ localization/
│  │     ├─ th.json
│  │     ├─ en.json
│  │     ├─ zh_TW.json
│  │     └─ zh_CN.json
│  │
│  ├─ art/
│  │  ├─ common/
│  │  ├─ title/
│  │  ├─ menu/
│  │  └─ bubble_shooter/
│  │
│  ├─ audio/
│  │  ├─ bgm/
│  │  └─ sfx/
│  │
│  └─ bundles/
│     ├─ bubble_shooter/
│     ├─ match3/
│     ├─ yarn_loop/
│     ├─ tiles/
│     └─ dodger/
│
├─ docs/
│  ├─ GAME_DESIGN.md
│  ├─ ASSET_LIST.md
│  ├─ SAVE_DATA.md
│  ├─ BUBBLE_SHOOTER_RULES.md
│  └─ ROADMAP.md
│
├─ .gitignore
├─ README.md
└─ package.json
```

### หมายเหตุเรื่อง `resources` และ `bundles`

- ไฟล์ที่โหลดด้วย Script แบบ Dynamic และต้องใช้เร็วใน MVP สามารถวางใต้ `assets/resources/`
- เมื่อต้องเพิ่มมินิเกมหลายเกม ให้แยก Asset Bundle ตามมินิเกม
- Common UI และ Asset ที่ใช้ตั้งแต่เปิดเกมควรอยู่ใน Main Package
- Asset ของเกมที่ยังไม่เปิดเล่นไม่ควรถูกโหลดเข้าหน่วยความจำตั้งแต่เริ่มแอป

---

## 6. Scene Flow

```text
Boot
  ↓
Title
  ↓
Main Menu
  ├─ Bubble Shooter Card
  │    ↓
  │  Stage Select
  │    ↓
  │  Bubble Shooter Game
  │    ├─ Pause
  │    ├─ Clear Result
  │    └─ Fail Result
  │
  ├─ Settings
  ├─ Shop          [เพิ่มภายหลัง]
  ├─ Daily Reward  [เพิ่มภายหลัง]
  ├─ Ranking       [เพิ่มภายหลัง]
  └─ Mail          [เพิ่มภายหลัง]
```

## 6.1 หน้าที่ของแต่ละ Scene

### `Boot.scene`

- สร้าง Singleton หรือ Persistent Manager
- โหลด Save Data
- โหลด Settings
- ตั้งค่าภาษา
- ตั้งค่าเสียง
- ตรวจสอบ Asset ที่จำเป็น
- เปลี่ยนไป `Title.scene`

### `Title.scene`

- แสดง Logo
- แสดงหมีเล็ก
- ปุ่มเริ่มเกม
- ปุ่ม Settings
- เปลี่ยนไป `MainMenu.scene`

### `MainMenu.scene`

- แสดง Game Card
- Bubble Shooter เปิดให้เล่น
- เกมอื่นแสดงเป็น Coming Soon หรือ Locked
- แสดงเหรียญ
- มีปุ่ม Settings
- ภายหลังเพิ่ม Shop, Daily, Rank และ Mail

### `StageSelect.scene`

- แสดง Stage Button
- สถานะ Locked, Unlocked และ Cleared
- แสดงจำนวนดาวของแต่ละด่าน
- เลือกด่านแล้วส่ง Stage ID ไปยัง Bubble Shooter Scene

### `BubbleShooterGame.scene`

- โหลดข้อมูลด่าน
- สร้าง Board
- สร้าง Shooter
- จัดการ Input
- คำนวณคะแนน
- ตรวจสอบ Win / Lose
- เปิด Result Panel
- บันทึกผลลัพธ์

---

## 7. สถาปัตยกรรมโค้ด

## 7.1 Core Manager

| Manager | หน้าที่ |
|---|---|
| `GameApp` | จุดเริ่มระบบและเชื่อม Manager หลัก |
| `SceneRouter` | เปลี่ยน Scene และส่ง Parameter |
| `SaveManager` | โหลด เซฟ และ Migration ของ Save Data |
| `AudioManager` | BGM, SFX, Volume, Mute |
| `SettingsManager` | ภาษา เสียง และการตั้งค่าทั่วไป |
| `LocalizationManager` | อ่านข้อความตาม Key |
| `EconomyManager` | เหรียญและ Item ในอนาคต |
| `EventBus` | ส่ง Event ระหว่างระบบแบบไม่ผูกกันแน่นเกินไป |

## 7.2 หลักการเขียน TypeScript

- ใช้ Type และ Interface ให้ชัดเจน
- แยก `data`, `logic`, `ui` และ `service`
- หลีกเลี่ยง Script ขนาดยักษ์ที่ทำทุกอย่างตั้งแต่ยิงไข่มุกจนเปิดเพลง
- ให้ Component ใน Scene ทำหน้าที่เชื่อม UI กับ Logic
- เขียน Function สั้นและทดสอบได้
- ใช้ Enum หรือ String Union สำหรับสถานะที่สำคัญ
- ใช้ Event เพื่อแจ้ง UI เมื่อคะแนนหรือจำนวนลูกเปลี่ยน

ตัวอย่าง Game State:

```ts
export enum BubbleGameState {
  Loading = 'loading',
  Ready = 'ready',
  Aiming = 'aiming',
  Shooting = 'shooting',
  Resolving = 'resolving',
  Cleared = 'cleared',
  Failed = 'failed',
  Paused = 'paused',
}
```

---

## 8. ระบบ Bubble Shooter

## 8.1 Core Loop

```text
ผู้เล่นเล็ง
  → ยิงไข่มุก
  → ตรวจการชน
  → Snap เข้าช่อง Grid
  → ตรวจกลุ่มสีที่ติดกัน
  → ลบกลุ่มที่ผ่านเงื่อนไข
  → ตรวจไข่มุกที่ไม่มีจุดยึดและให้ตก
  → เพิ่มคะแนน
  → ตรวจเป้าหมายด่าน
  → เติมไข่มุกลูกถัดไป
```

## 8.2 ระบบ Grid

ใช้ Grid แบบ Offset Row สำหรับไข่มุกทรงหกเหลี่ยม

ข้อมูลที่แต่ละ Cell ต้องมี:

```ts
export interface BubbleCell {
  row: number;
  col: number;
  bubbleId?: string;
  type?: BubbleType;
  color?: BubbleColor;
  isOccupied: boolean;
}
```

## 8.3 ประเภทไข่มุก

| ประเภท | ใช้ทำอะไร |
|---|---|
| Normal Pearl | ไข่มุกสีปกติ |
| Frozen Pearl | ต้องทำลายน้ำแข็งก่อน |
| Stone Pearl | ไม่จับคู่สี อาจต้องเคลียร์ด้วยเงื่อนไขพิเศษ |
| Locked Pearl | ถูกล็อก ต้องปลดล็อก |
| Shell Pearl | ไข่มุกในเปลือก |
| Rainbow Pearl | Power-up ใช้แทนสีได้ |
| Bomb Pearl | Power-up ระเบิดพื้นที่ |
| Precision Aim | ช่วยเล็ง |
| Extra Moves | เพิ่มจำนวนครั้งยิง |

MVP เริ่มจาก Normal Pearl ก่อน แล้วค่อยเพิ่ม Obstacle และ Power-up ตามลำดับ เพื่อให้ Debug ง่าย

## 8.4 เงื่อนไขด่าน

รองรับหลายรูปแบบตั้งแต่โครงสร้างข้อมูลรอบแรก:

```ts
export type StageGoalType =
  | 'clear_all'
  | 'clear_target_count'
  | 'rescue_item'
  | 'reach_score';

export interface BubbleStageConfig {
  stageId: string;
  rows: number;
  columns: number;
  moveLimit: number;
  goalType: StageGoalType;
  targetCount?: number;
  starScoreThresholds: [number, number, number];
  board: BubbleStageRow[];
}
```

แม้ MVP จะเริ่มจาก `clear_all` แต่เผื่อโครงสร้างไว้สำหรับเป้าหมายหลายแบบในอนาคต

---

## 9. ระบบคะแนนและดาว

ปัญหาที่ต้องแก้ตั้งแต่ต้นคือ คะแนนและจำนวนดาวต้องสะท้อนฝีมือของผู้เล่นจริง ไม่ใช่ผ่านด่านแบบสวยงามแต่ได้ดาวน้อยจนรู้สึกเหมือนโดนหักคะแนนความน่ารัก

## 9.1 สูตรคะแนนแนะนำ

```text
คะแนนรวม =
  คะแนนจากไข่มุกที่ทำลาย
  + คะแนน Combo
  + คะแนนไข่มุกที่ตก
  + โบนัสจำนวนครั้งยิงที่เหลือ
  + โบนัสเป้าหมายด่าน
```

ตัวอย่าง:

| รายการ | คะแนน |
|---|---:|
| ทำลายไข่มุกปกติ 1 ลูก | 100 |
| ไข่มุกตก 1 ลูก | 150 |
| Combo ต่อเนื่อง | เพิ่มตัวคูณ |
| จำนวนครั้งยิงเหลือ 1 ครั้ง | 500 |
| เคลียร์ด่าน | 1,000 |

## 9.2 การคำนวณดาว

แต่ละด่านกำหนด Threshold เอง:

```json
{
  "starScoreThresholds": [5000, 9000, 13000]
}
```

| คะแนน | ดาว |
|---|---|
| ต่ำกว่า 5,000 | ผ่านด่านแต่ยังไม่ได้ดาว หรือ 1 ดาวตามดีไซน์ที่เลือก |
| 5,000 ขึ้นไป | 1 ดาว |
| 9,000 ขึ้นไป | 2 ดาว |
| 13,000 ขึ้นไป | 3 ดาว |

แนะนำให้ด่านแรกออกแบบให้ผู้เล่นทั่วไปได้อย่างน้อย 2 ดาว และผู้เล่นที่ทำได้ดีได้ 3 ดาว เพื่อให้ช่วง Tutorial รู้สึกอบอุ่นมากกว่าถูกสอบสัมภาษณ์งาน

## 9.3 Score Bar

ในหน้าจอเล่น:

- วาง Score Bar ด้านบน
- ใส่ตำแหน่งดาว 1, 2 และ 3 บนหลอดคะแนน
- ดาวเริ่มจาก `icon_star_empty`
- เมื่อคะแนนวิ่งผ่าน Threshold ให้ Tween เป็น `icon_star_filled`
- เพิ่ม Animation เด้งเล็กน้อยและเสียง Sparkle
- Result Panel แสดงดาวที่ได้อีกครั้ง

---

## 10. ระบบ Save Data

## 10.1 Local Save สำหรับ MVP

ใช้ Save Data แบบ JSON และเก็บผ่าน `sys.localStorage`

```ts
export interface SaveData {
  schemaVersion: number;
  player: {
    coins: number;
  };
  settings: {
    language: 'th' | 'en' | 'zh_TW' | 'zh_CN';
    bgmVolume: number;
    sfxVolume: number;
    isBgmEnabled: boolean;
    isSfxEnabled: boolean;
  };
  miniGames: {
    bubbleShooter: {
      unlockedStage: number;
      stages: Record<string, BubbleStageProgress>;
    };
  };
}

export interface BubbleStageProgress {
  cleared: boolean;
  bestScore: number;
  stars: number;
}
```

## 10.2 กฎของ Save Manager

- สร้าง Default Save หากยังไม่มีข้อมูล
- เซฟเมื่อผ่านด่าน
- เซฟเมื่อเปลี่ยน Settings
- เซฟเมื่อจำนวนเหรียญเปลี่ยน
- ใส่ `schemaVersion`
- เตรียม Migration เมื่อ Schema เปลี่ยน
- ห้ามให้ UI เขียน Local Storage โดยตรง
- ทุกระบบเรียกผ่าน `SaveManager` เท่านั้น

## 10.3 Cloud Save ภายหลัง

เมื่อเกมเริ่มมีผู้เล่นจริง ค่อยเพิ่ม:

- Guest ID
- Google Login
- Cloud Save
- Merge Save ระหว่าง Local และ Cloud
- Recovery Flow เมื่อผู้เล่นเปลี่ยนเครื่อง

---

## 11. Responsive UI สำหรับมือถือแนวตั้ง

## 11.1 Design Resolution

ใช้ Design Resolution เป็นฐาน:

```text
1440 × 3200 px
```

Art Asset ที่สร้างไว้แล้วจำนวนมากใช้สัดส่วนนี้ จึงเหมาะกับการวางองค์ประกอบภาพ

## 11.2 แนวทาง UI

- ใช้ Canvas และ UITransform
- ใช้ Widget ยึดตำแหน่ง UI สำคัญกับขอบจอ
- ใช้ SafeArea กับพื้นที่กดด้านบนและล่าง
- Background ใช้ Cover Screen
- Gameplay Board อยู่พื้นที่กึ่งกลาง
- UI ด้านบนและล่างต้องไม่ทับ Notch หรือ Navigation Bar
- ทดสอบอย่างน้อย 9:16, 9:19.5, 9:20 และ Tablet แนวตั้ง

## 11.3 Layout Zones

```text
┌──────────────────────────┐
│ Safe Area Top            │
│ Score / Goal / Pause     │
├──────────────────────────┤
│                          │
│ Gameplay Board           │
│                          │
├──────────────────────────┤
│ Shooter / Next Pearl     │
│ Power-up                 │
│ Safe Area Bottom         │
└──────────────────────────┘
```

---

## 12. Asset ที่มีอยู่แล้วและต้องใช้กับ Bubble Shooter

## 12.1 Common UI

```text
button_primary.png
button_secondary.png
panel_round.png
panel_header.png
icon_settings.png
icon_shop.png
icon_daily.png
icon_rank.png
icon_mail.png
icon_lock.png
icon_star_empty.png
icon_star_filled.png
icon_coin.png
icon_pause.png
icon_back.png
icon_home.png
```

## 12.2 Main Menu และ Result

```text
result_panel.png
result_ribbon_clear.png
result_ribbon_fail.png
stage_button_unlocked.png
stage_button_locked.png
stage_button_cleared.png
settings_panel.png
shop_panel.png
shop_item_frame.png
```

## 12.3 Bubble Shooter

```text
pearl_frozen.png
pearl_stone.png
pearl_locked.png
pearl_shell.png
powerup_rainbow_pearl.png
powerup_bomb_pearl.png
powerup_precision_aim.png
powerup_extra_moves.png
```

## 12.4 ตัวละคร

```text
hmee_lek_idle.png
hmee_lek_wave.png
hmee_lek_happy.png
hmee_lek_sad.png
hmee_lek_hold_pearl.png
```

## 12.5 งาน Asset ที่ควรตรวจสอบก่อนเริ่ม Coding Gameplay

- Pearl สีปกติครบทุกสี
- Background Bubble Shooter ขนาด 1440 × 3200
- Shooter แก้วชานมไข่มุก
- Next Pearl Frame
- Aim Guide Dot
- Score Bar
- Goal Panel
- Pause Panel
- เอฟเฟกต์ดาว
- เอฟเฟกต์ไข่มุกแตก
- เอฟเฟกต์ไข่มุกตก
- เสียงยิง
- เสียงชน
- เสียงแตก
- เสียงผ่านด่าน
- เสียงแพ้

---

## 13. Asset Bundle Strategy

## 13.1 MVP

ช่วง MVP ไม่ต้องทำ Remote Bundle หรือ Hot Update  
ให้ทำ Local Bundle ก่อน และเน้นให้เกมทำงานครบวงจร

## 13.2 เมื่อเพิ่มมินิเกม

แยก Bundle ตาม Mini Game:

```text
main
bubble_shooter
match3
yarn_loop
tiles
dodger
```

### `main`

- Boot
- Title
- Main Menu
- Common UI
- Common Audio
- Common Character Asset ที่ใช้บ่อย
- Save และ Settings

### `bubble_shooter`

- Scene
- Prefab
- Gameplay Script
- Pearl Asset
- Stage Config
- Audio เฉพาะเกม

### ประโยชน์

- ลด Resource ที่โหลดตอนเปิดเกม
- แยกมินิเกมออกจากกัน
- Debug ง่าย
- เตรียมพร้อมสำหรับ Remote Asset หรือ Hot Update ในอนาคต
- เพิ่มเกมใหม่ได้โดยไม่ทำให้หน้าเปิดเกมหนักเหมือนกระเป๋าเดินทางหลังช้อปวันสุดท้าย

---

## 14. Localization

รองรับตั้งแต่โครงสร้างแรก:

```text
th
en
zh_TW
zh_CN
```

## 14.1 หลักการ

- UI Text ทุกจุดใช้ Key
- หลีกเลี่ยงข้อความฝังตรงใน Script
- ระวังข้อความยาวไม่เท่ากันแต่ละภาษา
- ปุ่มต้องเผื่อพื้นที่
- ฟอนต์ต้องรองรับไทย จีน และอังกฤษ
- ภาพที่มีข้อความควรแยกข้อความออกจากภาพ ถ้าเป็นไปได้

ตัวอย่าง Key:

```text
title_play
title_settings
menu_bubble_shooter
stage_locked
goal_remaining
goal_remaining_bubbles
result_clear
result_fail
result_score
result_best_score
result_next_stage
result_retry
```

---

## 15. Audio

## 15.1 Channel

```text
BGM
SFX
UI
```

## 15.2 เสียงพื้นฐานสำหรับ MVP

| หมวด | เสียง |
|---|---|
| UI | Click, Back, Popup Open, Popup Close |
| Gameplay | Aim, Shoot, Hit, Match, Drop, Combo |
| Result | Clear, Fail, Star Fill |
| BGM | Title, Menu, Bubble Shooter |

## 15.3 Audio Manager

- เล่น BGM แบบ Loop
- เปลี่ยนเพลงเมื่อเปลี่ยน Scene
- ปรับ Volume
- เปิดปิดเสียง
- ใช้ Settings เดิมหลังเปิดเกมใหม่
- ป้องกัน BGM เล่นซ้อนกัน

---

## 16. Android Build Plan

## 16.1 เป้าหมายระหว่างพัฒนา

| ช่วง | Build Target |
|---|---|
| เริ่มต้น | Web Mobile Preview |
| Core Gameplay เริ่มเล่นได้ | Android Debug Build |
| ก่อนจบ MVP | Android Device Test หลายขนาดจอ |
| ก่อนปล่อยจริง | Android Release Build และ Google Play Internal Testing |

## 16.2 Checklist Android

- ติดตั้ง Android Studio
- ติดตั้ง JDK 17
- ตั้ง `JAVA_HOME`
- ตั้งค่า Android SDK
- ตั้งค่า Android NDK
- ตั้ง Package Name
- สร้าง App Icon
- สร้าง Splash Screen
- ตั้ง Version Code และ Version Name
- สร้าง Signing Key
- เก็บ Signing Key สำรองไว้อย่างปลอดภัย
- ทดสอบ Build บนมือถือจริง
- เตรียม AAB สำหรับ Google Play
- ทดสอบ Internal Testing ก่อน Production

---

## 17. Git Workflow

## 17.1 Branch

```text
main
develop
feature/*
fix/*
```

ตัวอย่าง:

```text
feature/project-bootstrap
feature/title-scene
feature/main-menu
feature/bubble-grid
feature/bubble-shooting
feature/scoring-and-stars
fix/stage-one-star-threshold
```

## 17.2 Commit Message

```text
feat: add bubble board grid
feat: add stage select scene
fix: include remaining shots in score
fix: update filled stars when score reaches threshold
docs: update bubble shooter rules
```

## 17.3 ไฟล์ที่ควร Commit

- `assets/`
- `settings/`
- `package.json`
- `tsconfig.json`
- `docs/`
- ไฟล์ Config ที่จำเป็น

## 17.4 ไฟล์ที่ไม่ควร Commit

- Build Output
- Cache
- Temp
- Local Editor State
- Generated Native Project ที่สร้างใหม่ได้ หากยังไม่แก้ Native Code
- Secret
- Signing Key

---

## 18. ลำดับการพัฒนาแบบ Milestone

## Milestone 0: เตรียมเครื่องมือ

### เป้าหมาย

เปิดโปรเจกต์ Cocos Creator ได้ และ Preview Hello World ได้

### งาน

- [ ] ติดตั้ง Cocos Dashboard
- [ ] ติดตั้ง Cocos Creator 3.8.8
- [ ] สร้างโปรเจกต์ `hmee_lek_mini_world`
- [ ] ตั้ง Git Repository
- [ ] สร้าง Branch `develop`
- [ ] เปิดโปรเจกต์ใน VS Code
- [ ] สร้าง `README.md`
- [ ] สร้างโฟลเดอร์พื้นฐาน
- [ ] Commit แรก

### Definition of Done

- [ ] เปิดโปรเจกต์ได้
- [ ] Preview บน Browser ได้
- [ ] Git Status สะอาดหลัง Commit

---

## Milestone 1: Foundation

### เป้าหมาย

สร้างกระดูกสันหลังของแอปให้พร้อมใช้งาน

### งาน

- [ ] สร้าง `Boot.scene`
- [ ] สร้าง `GameApp.ts`
- [ ] สร้าง `SceneRouter.ts`
- [ ] สร้าง `SaveManager.ts`
- [ ] สร้าง `SettingsManager.ts`
- [ ] สร้าง `AudioManager.ts`
- [ ] ตั้ง Design Resolution
- [ ] ตั้ง SafeArea
- [ ] สร้าง Responsive UI Base
- [ ] โหลด Save Default ได้
- [ ] เซฟและโหลด Settings ได้

### Definition of Done

- [ ] เปิดเกมแล้วเข้าสู่ Title ได้
- [ ] ปิดเกมแล้วเปิดใหม่ Settings ยังคงเดิม
- [ ] UI ไม่ชนขอบจอหลัก

---

## Milestone 2: Title และ Main Menu

### เป้าหมาย

ผู้เล่นเข้าเกมและเลือก Bubble Shooter ได้

### งาน

- [ ] สร้าง `Title.scene`
- [ ] ใส่ Background
- [ ] ใส่ Logo
- [ ] ใส่หมีเล็ก
- [ ] ใส่ปุ่ม Play
- [ ] ใส่ปุ่ม Settings
- [ ] สร้าง `MainMenu.scene`
- [ ] ใส่ Game Card Bubble Shooter
- [ ] ใส่ Placeholder สำหรับเกมอื่น
- [ ] ใส่ Coin Display
- [ ] เชื่อม Scene Flow

### Definition of Done

- [ ] เปิดเกมแล้วกด Play ได้
- [ ] Main Menu แสดง Bubble Shooter
- [ ] กด Bubble Shooter แล้วไป Stage Select ได้

---

## Milestone 3: Stage Select

### เป้าหมาย

เลือกด่านและแสดงสถานะความคืบหน้าได้

### งาน

- [ ] สร้าง `StageSelect.scene`
- [ ] สร้าง Stage Button Prefab
- [ ] รองรับ Locked
- [ ] รองรับ Unlocked
- [ ] รองรับ Cleared
- [ ] แสดงดาวของด่าน
- [ ] โหลดข้อมูลจาก Save
- [ ] ส่ง Stage ID เข้า Gameplay Scene

### Definition of Done

- [ ] ด่านแรกเล่นได้
- [ ] ด่านที่ยังไม่ปลดล็อกกดไม่ได้
- [ ] ด่านที่ผ่านแล้วแสดงดาวถูกต้อง

---

## Milestone 4: Bubble Shooter Core

### เป้าหมาย

ยิงไข่มุกและเคลียร์กลุ่มสีได้

### งาน

- [ ] สร้าง Bubble Prefab
- [ ] สร้าง Bubble Grid
- [ ] โหลด Board จาก JSON
- [ ] สร้าง Launcher
- [ ] สร้าง Aim Guide
- [ ] ยิงไข่มุกได้
- [ ] ชนขอบแล้วเด้งได้
- [ ] ชน Board แล้ว Snap เข้าช่องได้
- [ ] ตรวจกลุ่มสี
- [ ] ลบกลุ่มที่ตรงเงื่อนไข
- [ ] ตรวจไข่มุกที่ตก
- [ ] สร้างลูกถัดไป

### Definition of Done

- [ ] เล่นเกมพื้นฐานได้บน Browser
- [ ] ไม่มีไข่มุกซ้อน Cell
- [ ] การเด้งกำแพงไม่ผิดทิศ
- [ ] Board ไม่ค้างหลังลบกลุ่ม

---

## Milestone 5: Goal, Score และ Stars

### เป้าหมาย

ทำให้เล่นเป็นด่านจริงและรู้สึกคุ้มกับฝีมือของผู้เล่น

### งาน

- [ ] เพิ่ม Move Limit
- [ ] เพิ่ม Goal Panel
- [ ] เพิ่มข้อความ `เหลือ X ลูก`
- [ ] เพิ่ม Score
- [ ] เพิ่มคะแนนจากไข่มุกแตก
- [ ] เพิ่มคะแนนจากไข่มุกตก
- [ ] เพิ่ม Combo
- [ ] เพิ่มโบนัสจำนวนครั้งยิงที่เหลือ
- [ ] เพิ่ม Score Bar
- [ ] ใส่จุดดาวบน Score Bar
- [ ] Tween ดาวเมื่อคะแนนถึง Threshold
- [ ] ตรวจ Win
- [ ] ตรวจ Lose

### Definition of Done

- [ ] ผ่านด่านเร็วแล้วได้โบนัสจริง
- [ ] คะแนนกับดาวสัมพันธ์กัน
- [ ] ดาวด้านบนเปลี่ยนจากโปร่งเป็นทึบได้
- [ ] ข้อความเป้าหมายอ่านเข้าใจง่าย

---

## Milestone 6: Result และ Save Progress

### เป้าหมาย

จบหนึ่งด่านได้ครบวงจร

### งาน

- [ ] สร้าง Result Panel
- [ ] ใส่ Ribbon Clear
- [ ] ใส่ Ribbon Fail
- [ ] แสดงคะแนน
- [ ] แสดง Best Score
- [ ] แสดงดาว
- [ ] ปุ่ม Retry
- [ ] ปุ่ม Next Stage
- [ ] ปุ่ม Home
- [ ] บันทึก Best Score
- [ ] บันทึก Stars สูงสุด
- [ ] ปลดล็อกด่านถัดไป

### Definition of Done

- [ ] ปิดเกมแล้วเปิดใหม่ Progress ยังอยู่
- [ ] ดาวไม่ลดลงเมื่อเล่นรอบใหม่ได้คะแนนต่ำกว่าเดิม
- [ ] Next Stage เปิดถูกต้อง

---

## Milestone 7: Polish

### เป้าหมาย

เกมดูมีชีวิต ไม่ใช่ตารางคำนวณที่สวมหมวกปาร์ตี้

### งาน

- [ ] เอฟเฟกต์ไข่มุกแตก
- [ ] เอฟเฟกต์ไข่มุกตก
- [ ] Animation หมีเล็ก
- [ ] Tween Score
- [ ] Tween Star
- [ ] Screen Shake เบา ๆ ตอนระเบิด
- [ ] เสียง UI
- [ ] เสียงยิง
- [ ] เสียง Match
- [ ] เสียง Clear
- [ ] เสียง Fail
- [ ] BGM
- [ ] Loading Panel
- [ ] Pause Panel
- [ ] Responsive Test

### Definition of Done

- [ ] เล่นแล้วมี Feedback ทุก Action สำคัญ
- [ ] ไม่เกิดเสียงซ้อนผิดปกติ
- [ ] UI ใช้งานได้บนมือถือหลายขนาด

---

## Milestone 8: Android Internal Test

### เป้าหมาย

ได้ไฟล์ทดสอบบน Android และเตรียมพร้อมสำหรับ Google Play Internal Testing

### งาน

- [ ] ติดตั้ง Android Toolchain
- [ ] Build Android Debug
- [ ] ทดสอบบนมือถือจริง
- [ ] ตรวจ FPS
- [ ] ตรวจ Memory
- [ ] ตรวจ Touch Input
- [ ] ตรวจ SafeArea
- [ ] ตรวจ Back Button
- [ ] สร้าง Release Signing Key
- [ ] Build Release
- [ ] สร้าง AAB
- [ ] Upload Internal Testing

### Definition of Done

- [ ] เล่นได้ครบ Flow บน Android
- [ ] ไม่มี Crash สำคัญ
- [ ] Save ทำงานหลังปิดแอป
- [ ] UI ไม่ล้นจอ

---

## 19. แผนหลังจบ MVP

## Phase 2: เพิ่มเนื้อหา Bubble Shooter

- เพิ่มด่าน 30–50 ด่าน
- เพิ่ม Frozen Pearl
- เพิ่ม Stone Pearl
- เพิ่ม Locked Pearl
- เพิ่ม Shell Pearl
- เพิ่ม Rainbow Pearl
- เพิ่ม Bomb Pearl
- เพิ่ม Aim Assist
- เพิ่ม Extra Moves
- เพิ่ม Shop แบบใช้เหรียญในเกม
- เพิ่ม Daily Reward

## Phase 3: ระบบบัญชีและรายได้

- Guest Profile
- Google Login
- Cloud Save
- Analytics
- Crash Reporting
- Ads แบบ Rewarded
- In-App Purchase
- Consent Flow
- Privacy Policy
- Terms of Service

## Phase 4: เพิ่ม Match-3 Swap

- แยก Asset Bundle
- ใช้ Save และ Common UI เดิม
- ใช้ Coin และ Settings เดิม
- เพิ่ม Game Card ใน Main Menu
- ทดสอบ Memory หลังโหลดสลับเกม

## Phase 5: เพิ่ม Mini Game ต่อเนื่อง

- Yarn Loop
- Match-3 Tiles
- Endless Dodger
- Event
- Ranking
- Collection
- Achievement
- Limited Theme

---

## 20. Testing Checklist

## 20.1 Gameplay

- [ ] ยิงตรงได้
- [ ] ยิงเด้งกำแพงได้
- [ ] Aim Guide ตรงกับเส้นทางยิง
- [ ] Snap Grid ถูก Cell
- [ ] Match สีถูกต้อง
- [ ] ไข่มุกตกถูกต้อง
- [ ] Board ไม่ค้าง
- [ ] Move Limit ลดถูกต้อง
- [ ] Win ถูกต้อง
- [ ] Lose ถูกต้อง

## 20.2 Score และ Stars

- [ ] Score เพิ่มเมื่อ Match
- [ ] Score เพิ่มเมื่อ Drop
- [ ] Combo เพิ่มคะแนน
- [ ] โบนัสลูกยิงที่เหลือทำงาน
- [ ] ดาว 1, 2 และ 3 ตรง Threshold
- [ ] Score Bar วิ่งถูกต้อง
- [ ] Filled Star แสดงถูกต้อง
- [ ] Result Stars ตรงกับ Gameplay Stars

## 20.3 Save

- [ ] เปิดเกมครั้งแรกสร้าง Default Save
- [ ] ผ่านด่านแล้วเซฟ
- [ ] Unlock Stage ถูกต้อง
- [ ] Best Score ไม่ลดลง
- [ ] Stars ไม่ลดลง
- [ ] Settings ไม่หาย
- [ ] Save เสียแล้วมี Fallback

## 20.4 UI

- [ ] ทดสอบ 9:16
- [ ] ทดสอบ 9:19.5
- [ ] ทดสอบ 9:20
- [ ] ทดสอบ Tablet แนวตั้ง
- [ ] Notch ไม่ทับปุ่ม
- [ ] Navigation Bar ไม่ทับ UI
- [ ] ปุ่มกดง่าย
- [ ] ตัวหนังสืออ่านง่าย
- [ ] ภาษาไทย จีน และอังกฤษไม่ล้นกรอบ

## 20.5 Android

- [ ] เปิดแอปได้
- [ ] Resume หลังสลับแอปได้
- [ ] Pause เมื่อ App Background
- [ ] เสียงไม่เล่นซ้อน
- [ ] ปุ่ม Back ทำงานตามที่กำหนด
- [ ] Save หลังปิดแอป
- [ ] FPS เหมาะสม
- [ ] Memory ไม่เพิ่มต่อเนื่องเมื่อเล่นหลายด่าน

---

## 21. Definition of MVP Release

MVP พร้อมปล่อย Internal Test เมื่อ:

- [ ] Bubble Shooter มีอย่างน้อย 10 ด่าน
- [ ] Title → Menu → Stage Select → Gameplay → Result ทำงานครบ
- [ ] Score และ Stars สมเหตุสมผล
- [ ] โบนัสจำนวนครั้งยิงที่เหลือทำงาน
- [ ] Save Progress ทำงาน
- [ ] Settings เสียงทำงาน
- [ ] UI รองรับมือถือหลายขนาด
- [ ] Android Release Build ทำงานบนเครื่องจริง
- [ ] ไม่มี Crash ระดับ Blocker
- [ ] มี Privacy Policy เบื้องต้นก่อนขึ้น Store
- [ ] มี Icon, Screenshot และ Store Description เบื้องต้น

---

## 22. งานที่ควรเริ่มทันที

ลำดับแรกที่แนะนำ:

1. ติดตั้ง Cocos Dashboard และ Cocos Creator 3.8.8
2. สร้างโปรเจกต์ `hmee_lek_mini_world`
3. ตั้ง Git Repository
4. สร้างโครงสร้างโฟลเดอร์ตามแผน
5. สร้าง `Boot.scene`
6. สร้าง `Title.scene`
7. สร้าง `MainMenu.scene`
8. สร้าง `StageSelect.scene`
9. เตรียม Bubble Shooter Scene เปล่า
10. Commit จุดเริ่มต้น
11. เริ่มระบบ Bubble Grid
12. เพิ่มการยิงและ Snap Cell
13. เพิ่ม Match Resolver
14. เพิ่ม Score และโบนัสจำนวนลูกยิงที่เหลือ
15. เพิ่ม Score Bar และ Filled Stars

---

## 23. Prompt สำหรับใช้กับ AI Coding Agent ในรอบแรก

```text
ช่วยสร้างโครงสร้างเริ่มต้นของโปรเจกต์ Cocos Creator 3.8.8 ชื่อ hmee_lek_mini_world
โดยใช้ TypeScript และเน้นเกมมือถือ Portrait

เป้าหมายรอบนี้:
1. สร้างโฟลเดอร์ scripts/core, scripts/data, scripts/ui และ scripts/minigames/bubble_shooter
2. สร้าง GameApp.ts, SceneRouter.ts, SaveManager.ts, SettingsManager.ts และ AudioManager.ts
3. สร้าง Interface SaveData สำหรับ coins, settings และ bubbleShooter stage progress
4. ใช้ sys.localStorage สำหรับ Local Save
5. เตรียมเมธอด load, save, reset และ migration ด้วย schemaVersion
6. เขียนโค้ดให้แยกหน้าที่ชัดเจนและมี Type ครบ
7. ยังไม่ต้องสร้าง Gameplay Bubble Shooter
8. อธิบายว่าต้องนำ Script แต่ละไฟล์ไปผูกกับ Node ใดใน Cocos Creator Editor
9. ห้ามแก้ Asset ภาพ
10. สรุปรายชื่อไฟล์ที่สร้างหรือแก้ไขท้ายงาน
```

---

## 24. เอกสารทางการที่ควรอ่านประกอบ

- Cocos Creator 3.8 User Manual  
  https://docs.cocos.com/creator/3.8/manual/en/

- Cocos Creator Download และ Release Notes  
  https://www.cocos.com/en/creator-download

- Install and Launch  
  https://docs.cocos.com/creator/3.8/manual/en/getting-started/install/

- Asset Bundle Overview  
  https://docs.cocos.com/creator/3.8/manual/en/asset/bundle.html

- Prefab  
  https://docs.cocos.com/creator/3.8/manual/en/asset/prefab.html

- User Data Storage  
  https://docs.cocos.com/creator/3.8/manual/en/advanced-topics/data-storage.html

- SafeArea  
  https://docs.cocos.com/creator/3.8/manual/en/ui-system/components/editor/safearea.html

- Localization  
  https://docs.cocos.com/creator/3.8/manual/en/editor/l10n/overview.html

- Android Native Setup  
  https://docs.cocos.com/creator/3.8/manual/en/editor/publish/setup-native-development.html

- Android Publish Example  
  https://docs.cocos.com/creator/3.8/manual/en/editor/publish/android/build-example-android.html

---

## 25. สรุปแนวทาง

Hmee Lek Mini World เวอร์ชัน Cocos Creator จะไม่เริ่มจากการสร้างทุกระบบพร้อมกัน แต่จะสร้าง Bubble Shooter ให้เป็นเกมเล็กที่จบครบวงจรก่อน จากนั้นค่อยต่อโลกของหมีเล็กออกไปทีละห้อง

แกนสำคัญมี 4 อย่าง:

1. **Common Core ใช้ร่วมกันทุกเกม**
2. **แยก Mini Game ออกจากกัน**
3. **Local Save ก่อน Online System**
4. **ทำ Bubble Shooter ให้สนุกและเสถียรก่อนเพิ่มเกมถัดไป**

เมื่อ Bubble Shooter แข็งแรงแล้ว เกมใหม่แต่ละเกมจะไม่ใช่การสร้างแอปใหม่จากศูนย์ แต่เป็นการเสียบ “ดาวเคราะห์ดวงใหม่” เข้าไปในจักรวาลเดิมของหมีเล็ก 🧸✨
