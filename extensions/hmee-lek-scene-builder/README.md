# Hmee Lek Scene Builder

Project-local Cocos Creator 3.8.8 editor extension for assembling generated UI in `StageSelect.scene`.

## Install

1. Keep this folder at `extensions/hmee-lek-scene-builder/`.
2. Run `npm install` in this folder.
3. Run `npm run build` in this folder.
4. Open or reload the project in Cocos Creator 3.8.8.

## Build Extension

```powershell
cd extensions/hmee-lek-scene-builder
npm install
npm run build
```

TypeScript sources live in `src/`. The compiled entry files are written to `dist/main.js` and `dist/scene.js`.

## Reload Extension

In Cocos Creator:

1. Open **Extension Manager**.
2. Find the local extension named `hmee-lek-scene-builder`.
3. Disable and enable it again, or use the reload option if available.
4. Reopen the project if the menu still does not refresh.

## Use The Menu

1. Open `assets/scenes/StageSelect.scene`.
2. Choose **Hmee Lek Tools/Build Bubble Stage Select**.
3. Check the Console for the created node count and asset report.
4. Press **Ctrl + S** to save the scene.

The command only runs when the currently open scene is named `StageSelect`.

## If The Menu Does Not Appear

1. Confirm the folder is exactly `extensions/hmee-lek-scene-builder/`.
2. Confirm `package.json` contains the `contributions.menu` entry.
3. Run `npm run build` and check for TypeScript errors.
4. Reload the extension from Extension Manager.
5. Restart Cocos Creator 3.8.8 if the editor cache still shows the old menu list.

## Asset Notes

The builder searches SpriteFrames through Asset Database paths and does not hardcode asset UUIDs.

Current expected assets:

- `assets/art/title/title_background.png`
- `assets/art/common/stage_button_unlocked.png`
- `assets/art/common/stage_button_locked.png`
- `assets/art/common/icon_back.png`

If an asset is missing, the command logs the missing path and still builds the scene nodes with empty Sprite components.

## Generated Hierarchy

The menu command creates or updates only the Stage Select nodes it owns by name:

- `Main Camera`
- `Canvas/Background`
- `Canvas/SafeArea/PageTitle`
- `Canvas/SafeArea/StageGrid/Stage01` through `Stage10`
- `Canvas/SafeArea/StageGrid/StageXX/Label`
- `Canvas/SafeArea/BackButton`

Running the menu again updates these nodes instead of creating duplicates.
