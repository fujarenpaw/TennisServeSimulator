# 実装計画：物理ベースのサーブ軌道と着弾点指定機能の実装

## 目標
物理ベースのサーブ軌道計算と着弾点指定機能の実装、およびサーバー設定の改良を行います。

## ユーザーレビューが必要な事項
- **サーバー高さ**: 50cm～250cm（デフォルト100cm）で調整可能にします。
- **UI構成**: 設定を「Server Settings」「Target Settings」「Physics Parameters」の3グループに整理します。
- **双方向の同期**: 
  - **着弾点指定モード**: 「着弾点X/Z」を変更すると、レシーバーの準備時間が最短（＝最速）になるように「サーブ速度」と「打ち出し角度（高さ）」を自動計算してスライダーを更新します。
  - **着弾点ドラッグ操作**: 3Dビュー上のマーカーをドラッグして着弾点を指定できます。操作感はスライダーと同様にリアルタイムで物理計算と同期します。
  - **パラメータ指定モード**: 「サーブ速度」や「打ち出し角度」を変更すると、物理計算に基づいて「着弾点X/Z」のスライダーとマーカー位置が更新されます。
- **最適化ロジック**: 「準備時間を最小にする」＝「ネットを越えられる範囲で最大の速度で打つ」と定義します。物理的にその着弾点に到達不可能な場合（ネットに掛かるなど）は、速度を落として山なりの軌道（スピン/ロブ気味）を選択します。

## 変更内容

### `src/components`

#### [MODIFY] [ControlPanel.tsx](file:///c:/Users/hoge/Documents/GitHub/TennisServeSimulator/src/components/ControlPanel.tsx)
- スライダー構成の変更:
  - **Physics Parameters**:
    - `Serve Speed` (速度)
    - `Launch Angle / Vertical` (打ち出し角度-垂直) ※旧 Trajectory Height の代替
  - **Outcome Parameters (New)**:
    - `Target X` (着弾点-横)
    - `Target Z` (着弾点-深さ)
- ハンドラーの実装:
  - `handleTargetChange(x, z)`: PhysicsEngine.optimizeServe(x, z) を呼び出し、速度・角度を更新。
  - `handlePhysicsChange(speed, angle)`: PhysicsEngine.calculateTrajectory(...) を呼び出し、着弾点を更新。

### `src/features/serve`

#### [MODIFY] [ServeScene.tsx](file:///c:/Users/hoge/Documents/GitHub/TennisServeSimulator/src/features/serve/ServeScene.tsx)
- **Landing Marker**:
  - `Mesh` (球体または円盤) を追加し、現在の `targetX`, `targetZ` に配置。
  - `DragControls` または `useThree` + `Raycaster` (R3Fなら `onPointerMove` / `onPointerDown`) を使用してドラッグ操作を実装。
  - ドラッグ終了時またはドラッグ中に `onTargetChange` を発火し、`ControlPanel` と同様に最適化ロジックを走らせる。

### `src/core`

#### [MODIFY] [PhysicsEngine.ts](file:///c:/Users/hoge/Documents/GitHub/TennisServeSimulator/src/core/PhysicsEngine.ts)
- `calculateTrajectory(config)`: 
  - 物理ベース（斜方投射＋空気抵抗考慮、今回は簡易的に重力のみか要検討だが、まずは重力のみで実装）で軌道を計算。
  - 入力: 速度, 角度.
- `optimizeServe(targetX, targetZ, limitations)`:
  - 指定された着弾点に対し、ネットをクリアしつつ「着弾までの時間」が最短になる（＝速度が最大になる）パラメータを探索。
  - 探索ロジック:
    1. 設定可能な最大速度から開始。
    2. その速度でターゲットに当たる角度を計算（低弾道と高弾道の2解ある場合は低弾道）。
    3. ネットクリアを確認 (ネット高さ + マージン)。
    4. クリアNGなら速度を落として再計算。
    5. 最適な { speed, angle } を返す。

### `src/types`

#### [MODIFY] `index.ts`
- `ServeConfig` 更新: `targetX`, `targetZ`, `launchAngle` 追加。`serverHeight` を追加。

## Phase 2: Refinement (今回追加)

### `src/types`
- `ServeConfig` に `serverHeight` (number) を追加。

### `src/components`
- `ControlPanel.tsx`:
  - スライダーをグループ化 (`fieldset` または `h3` で区切る)。
  - `Server Height` スライダーを追加 (0.5m - 2.5m)。

### `src/core`
- `PhysicsEngine.ts`:
  - `calculateTrajectory` および `optimizeServe` で `serveHeight` を使用するように変更（固定値 2.8m を廃止）。

### `src/features`
- `ServeScene.tsx`:
  - 初期値の設定。
  - サーバーマーカー (`serverMarker`) のY座標を `serverHeight` に同期。

## Phase 3: Intuitive Trajectory Controls (今回追加)

### 目的
「打ち出し角度」は物理的には正確ですが、直感的ではありません。以下の2つのパラメータに置き換えます：
- **軌道の最高点の高さ** (`trajectoryPeakHeight`): ボールが到達する最大の高さ（メートル）
- **最高点の位置** (`peakPosition`): ネット（Z=0）を基準に、どこで最高点に達するか（メートル、正の値は相手コート側）

### 変更内容

#### `src/types/index.ts`
- `ServeConfig` から `launchAngle` を削除
- `trajectoryPeakHeight` (number) を追加
- `peakPosition` (number) を追加

#### `src/core/PhysicsEngine.ts`
- 新しいヘルパー関数 `calculateLaunchAngleFromPeak(startPos, peakHeight, peakPosition, speed)` を追加
  - 最高点の条件から逆算して打ち出し角度を計算
- `calculateTrajectory` で `launchAngle` の代わりに上記関数を使用
- `optimizeServe` の戻り値を `{ speed, trajectoryPeakHeight, peakPosition }` に変更

#### `src/components/ControlPanel.tsx`
- `Launch Angle` スライダーを削除
- `Trajectory Peak Height` スライダーを追加（範囲: 0.5m - 10m）
- `Peak Position` スライダーを追加（範囲: -6m (サーバー側) ～ +12m (相手コート側)）
- 双方向同期ロジックを更新

#### `src/features/serve/ServeScene.tsx`
- 初期値を `launchAngle` から `trajectoryPeakHeight`, `peakPosition` に変更


## 検証計画

### 自動テスト
- 現在ユニットテストフレームワークの設定が見当たらないため、実装しません。

### 手動検証
1. アプリケーションを起動。
2. コントロールパネルで「着弾点X」と「着弾点Z」を変更し、着弾位置が意図通り変化することを確認。
3. 「サーブ速度」を変更し、軌道（特に高さ）が物理的に自然に変化することを確認（速い＝直線的、遅い＝山なり）。
4. 極端な設定（ネット際へのドロップ、コーナーへのエース）を行い、挙動が破綻しないか確認。
5. 「不自然な落下（2mから急降下）」が発生しないことを目視確認。
