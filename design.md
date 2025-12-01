# サーブ3Dシミュレーター 仕様書・設計書

## 1. プロジェクト概要

### 1.1 目的
テニスのサーブ戦術の効果を視覚的に分析するための3Dシミュレーターを開発する。アマチュアレベルでのサーブの有効性を、物理的な軌道計算とレシーバーの移動分析により定量的に評価する。

### 1.2 対象ユーザー
- テニス愛好家（アマチュアプレイヤー）
- テニスコーチ
- 戦術研究者
- ソフトウェアエンジニア（テニス経験者）

### 1.3 技術スタック
- **フロントエンド**: React (Hooks)
- **3Dレンダリング**: Three.js (r128)
- **言語**: JavaScript (ES6+)
- **実行環境**: Webブラウザ

---

## 2. 機能要件

### 2.1 3D可視化機能

#### 2.1.1 コート表示
- **寸法**: 公式テニスコート規格（23.77m × 10.97m）
- **表示要素**:
  - コートサーフェス（緑色）
  - ベースライン（白線）
  - サービスライン（白線）
  - センターライン（白線）
  - シングルスライン（白線）
  - ダブルスライン（白線）
  - ネット（半透明白、高さ0.914m）

#### 2.1.2 オブジェクト表示
- **サーバーマーカー**（赤色球、半径0.3m）: X軸上を移動可能
- **レシーバーマーカー**（青色球、半径0.3m）: シングルスライン上、ベースライン位置に固定
- **レシーバー目標位置**（緑色半透明球、半径0.2m）: 計算結果に基づき表示
- **ボール**（黄色球、半径0.1m）: アニメーション可能

#### 2.1.3 軌道表示
- **サーブ軌道**（紫色線）: サーバー位置から1バウンド目、2バウンド目までの完全な軌道
- **リアルタイム更新**: パラメータ変更時に即座に再描画

#### 2.1.4 寸法表示機能（オプション）
- チェックボックスでオン/オフ切替
- 黄色の寸法線と矢印で表示:
  - コート幅（シングルス: 8.23m）
  - コート全長（23.77m）
  - ベースライン〜サービスライン（5.5m）

### 2.2 パラメータ調整機能

#### 2.2.1 サーバー設定
| パラメータ      | 範囲       | 初期値 | 単位 | 説明                                 |
| --------------- | ---------- | ------ | ---- | ------------------------------------ |
| サーバー位置(X) | 0 〜 5.485 | 0      | m    | センターマークからダブルスラインまで |

#### 2.2.2 サーブ物理パラメータ
| パラメータ           | 範囲             | 初期値 | 単位 | 説明                                        |
| -------------------- | ---------------- | ------ | ---- | ------------------------------------------- |
| サーブ速度           | 40 〜 110        | 70     | km/h | ボールの初速度                              |
| 軌道の高さ           | 0.5 〜 5.0       | 2.0    | m    | 軌道の最高点の絶対的な高さ（地面から）      |
| 最高点の位置         | -2.0 〜 +2.0     | 0      | m    | ネット(Z=0)を基準に前後どこで最高点になるか |
| バウンド深さ         | 0.2 〜 3.0       | 1.0    | m    | サービスラインから手前の距離                |
| バウンド後速度保持率 | 20 〜 80         | 50     | %    | バウンド後に元速度の何%を保持するか         |
| コース               | center/wide/body | center | -    | サーブの方向                                |

#### 2.2.3 レシーバー設定
| パラメータ   | 範囲       | 初期値 | 単位 | 説明                     |
| ------------ | ---------- | ------ | ---- | ------------------------ |
| 反応遅延時間 | 0.1 〜 0.6 | 0.3    | 秒   | サーブに気づくまでの時間 |

### 2.3 分析機能

#### 2.3.1 リアルタイム計算結果
- **横移動距離** (m): レシーバーのX方向移動
- **前方移動距離** (m): レシーバーのZ方向移動
- **総移動距離** (m): 実際の移動距離（斜め）
- **レシーブ時間** (秒): サーブから打点までの時間
- **有効時間** (秒): 反応遅延を引いた実質移動可能時間
- **必要速度** (m/s): 有効時間内に到達するための必要移動速度
- **バウンド後Y方向進行** (m): バウンド後の前方進行距離
- **バウンド後X方向進行** (m): バウンド後の横方向進行距離
- **バウンド後Y方向速度** (m/s)
- **バウンド後X方向速度** (m/s)
- **難易度評価**: 必要速度に基づく4段階評価
  - 比較的容易: < 4 m/s
  - やや困難: 4〜6 m/s
  - 困難: 6〜8 m/s
  - 非常に困難: > 8 m/s

### 2.4 アニメーション機能
- **再生ボタン**: ボールが軌道に沿って移動するアニメーション
- **フレームレート**: 20ms/frame
- **自動リセット**: アニメーション終了後、ボールは初期位置に戻る

---

## 3. 物理モデル設計

### 3.1 座標系
- **X軸**: 横方向（センターマークを0とし、右方向が正）
- **Y軸**: 高さ方向（地面を0とし、上方向が正）
- **Z軸**: 前後方向（サーバー側が負、レシーバー側が正）
- **ネット位置**: Z = 0, Y = 0.914m

### 3.2 サーブ軌道計算

#### 3.2.1 1バウンド目までの軌道

**入力値**:
- サーバー位置: `(serverPositionX, 1.0, -11.885)`
- 1バウンド目位置: `(targetX, 0, bounceY)`
  - `targetX`: コースによって決定
    - center: 0
    - wide: 4.115 (シングルスライン)
    - body: 2.058 (シングルスラインの半分)
  - `bounceY = 5.5 - bounceDepth`

**軌道方程式**:
```
distance = sqrt((targetX - startX)² + (bounceY - startZ)²)
timeToFirstBounce = distance / (serveSpeed / 3.6)

ネット基準の最高点位置:
peakZ = 0 + trajectoryPeakPosition

進行率での最高点位置:
peakProgress = (peakZ - startZ) / (bounceY - startZ)
peakProgress = clamp(peakProgress, 0.1, 0.9)

各点(progress ∈ [0, 1])での座標:
x = startX + (targetX - startX) * progress
z = startZ + (bounceY - startZ) * progress

上昇局面 (progress ≤ peakProgress):
y = startY + maxHeight * sin(π/2 * progress/peakProgress)

下降局面 (progress > peakProgress):
y = startY + maxHeight * cos(π/2 * (progress-peakProgress)/(1-peakProgress))
```

#### 3.2.2 バウンド後の軌道

**速度保持計算**:
```
サーバー位置から1バウンド目へのベクトル:
vectorX = targetX - startX
vectorZ = bounceY - startZ
vectorLength = sqrt(vectorX² + vectorZ²)

正規化ベクトル:
normalizedVectorX = vectorX / vectorLength
normalizedVectorZ = vectorZ / vectorLength

バウンド後速度:
bounceSpeedMs = (serveSpeed / 3.6) * bounceVelocityRetention

速度成分:
bounceVelocityX = bounceSpeedMs * normalizedVectorX
bounceVelocityZ = bounceSpeedMs * normalizedVectorZ

進行距離 (bounceFlightTime = 0.5秒):
bounceDistanceX = bounceVelocityX * 0.5
bounceDistanceZ = bounceVelocityZ * 0.5

2バウンド目位置:
secondBounceX = targetX + bounceDistanceX
secondBounceZ = bounceY + bounceDistanceZ
```

**軌道方程式**:
```
各点(progress ∈ [0, 1])での座標:
x = targetX + (secondBounceX - targetX) * progress
z = bounceY + (secondBounceZ - bounceY) * progress
y = maxBounceHeight * sin(π * progress)

maxBounceHeight = trajectoryHeight * 0.3
```

### 3.3 レシーバー分析計算

#### 3.3.1 レシーバー目標位置
```
初期位置:
receiverX = 4.115 (シングルスライン)
receiverZ = 0 (ベースライン)

目標Z位置の決定:
if bounceDistanceZ < 0.5:
    targetZ = bouncePoint.z + 0.3  // ボールが伸びない → 前に出る
else:
    targetZ = secondBounceZ + 1.5  // ボールが伸びる → 途中で迎え撃つ
```

#### 3.3.2 移動距離・速度計算
```
移動距離:
moveX = |targetX - receiverX|
moveZ = |targetZ - receiverZ|
totalDistance = sqrt(moveX² + moveZ²)

時間計算:
bounceAirTime = trajectoryHeight * 0.15  // 経験的係数
receiveTime = timeToFirstBounce + bounceAirTime
effectiveTime = receiveTime - reactionDelay

必要速度:
requiredSpeed = totalDistance / effectiveTime (if effectiveTime > 0)
```

---

## 4. データ構造設計

### 4.1 State管理
```javascript
// サーブパラメータ
serveSpeed: number           // 40-110 km/h
trajectoryHeight: number     // 0.5-5.0 m
trajectoryPeakPosition: number  // -2.0 to +2.0 m
bounceDepth: number          // 0.2-3.0 m
bounceDirection: string      // 'center' | 'wide' | 'body'
bounceVelocityRetention: number  // 0.2-0.8 (20-80%)
reactionDelay: number        // 0.1-0.6 sec
serverPositionX: number      // 0-5.485 m

// UI設定
showDimensions: boolean      // 寸法表示フラグ

// 計算結果
results: {
  receiverStart: {x, z}
  receiverTarget: {x, z}
  moveX: number
  moveZ: number
  totalDistance: number
  receiveTime: number
  effectiveTime: number
  requiredSpeed: number
  difficulty: string
  bounceDistanceY: number
  bounceDistanceX: number
  bounceVelocityY: number
  bounceVelocityX: number
}

// アニメーション状態
isAnimating: boolean
```

### 4.2 Three.jsオブジェクト管理
```javascript
// Refs
sceneRef: Scene
cameraRef: PerspectiveCamera
rendererRef: WebGLRenderer
ballRef: Mesh (name: 'ball')
trajectoryLineRef: Line
receiverRef: Mesh
animationIdRef: number

// Scene内オブジェクト (name属性で管理)
'server': サーバーマーカー
'ball': ボール
'receiverTarget': レシーバー目標位置
'dimensions': 寸法表示グループ
```

---

## 5. コンポーネント設計

### 5.1 コンポーネント構成
```
TennisServeSimulator (メインコンポーネント)
├── 3D Canvas (Three.js レンダリング領域)
└── Control Panel (パラメータ調整UI)
    ├── Server Settings (2列グリッド)
    ├── Serve Parameters (2列グリッド)
    ├── Animation Control (ボタン)
    └── Analysis Results (結果表示エリア)
```

### 5.2 主要関数

#### 5.2.1 calculateTrajectory()
**責務**: サーブ軌道の全点を計算
**入力**: 各種パラメータ (state)
**出力**: 
```javascript
{
  points: Vector3[],           // 軌道の全点
  bouncePoint: Vector3,        // 1バウンド位置
  secondBounceZ: number,       // 2バウンドZ座標
  secondBounceX: number,       // 2バウンドX座標
  bounceDistanceY: number,     // バウンド後Z進行距離
  bounceDistanceX: number,     // バウンド後X進行距離
  bounceVelocityY: number,     // バウンド後Z速度
  bounceVelocityX: number,     // バウンド後X速度
  timeToFirstBounce: number,   // 1バウンドまでの時間
  targetX: number              // 1バウンドX座標
}
```

#### 5.2.2 calculateReceiverAnalysis()
**責務**: レシーバーの移動分析
**入力**: trajectory (calculateTrajectory()の戻り値)
**出力**: results (state)

#### 5.2.3 updateDimensions()
**責務**: 寸法表示の更新
**入力**: showDimensions (state)
**処理**: 
- 既存の寸法オブジェクトを削除
- showDimensions=trueの場合、新規作成

#### 5.2.4 playAnimation()
**責務**: ボールアニメーション再生
**処理**:
- 軌道の各点を20msごとに順次表示
- 完了後、ボールを初期位置にリセット

---

## 6. UI設計

### 6.1 レイアウト
```
┌─────────────────────────────────────┐
│                                     │
│          3D Canvas (flex: 1)        │
│                                     │
│                                     │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  Control Panel (maxHeight: 400px)   │
│  ┌───────────┬───────────┐          │
│  │ Param 1   │ Param 2   │          │
│  ├───────────┼───────────┤          │
│  │ Param 3   │ Param 4   │          │
│  └───────────┴───────────┘          │
│  [アニメーション再生ボタン]          │
│  ┌─────────────────────┐            │
│  │  Analysis Results   │            │
│  └─────────────────────┘            │
└─────────────────────────────────────┘
```

### 6.2 カラースキーム

| 要素              | 色                     | 備考     |
| ----------------- | ---------------------- | -------- |
| 背景              | #87ceeb                | 空色     |
| コート            | #2d8659                | 緑       |
| ライン            | #ffffff                | 白       |
| ネット            | #ffffff (opacity: 0.5) | 半透明白 |
| サーバー          | #ff0000                | 赤       |
| レシーバー        | #0000ff                | 青       |
| レシーバー目標    | #00ff00 (opacity: 0.5) | 半透明緑 |
| ボール            | #ffff00                | 黄       |
| 軌道              | #ff00ff                | 紫       |
| 寸法線            | #ffff00                | 黄       |
| Control Panel背景 | #f5f5f5                | グレー   |

### 6.3 カメラ設定
- **位置**: (15, 12, 8)
- **注視点**: (0, 0, 0)
- **視野角**: 60度
- **アスペクト比**: コンテナの幅/高さ

---

## 7. 非機能要件

### 7.1 パフォーマンス
- レンダリング: 60fps維持
- パラメータ変更時の再計算: 100ms以内
- アニメーション: スムーズな動作（20ms/frame）

### 7.2 互換性
- モダンブラウザ（Chrome, Firefox, Safari, Edge）
- WebGL対応必須

### 7.3 レスポンシブ対応
- ウィンドウリサイズ時にCanvas自動調整
- Control Panelはスクロール可能（maxHeight: 400px）

---

## 8. 制約事項

### 8.1 物理モデルの簡略化
- 空気抵抗は考慮しない
- マグヌス効果（回転による変化）は簡略化
- バウンド後の跳ね方は経験的係数（0.3倍）を使用
- 重力加速度は部分的に適用（放物線の形状制御のため）

### 8.2 Three.jsの制限
- OrbitControlsは未実装（カメラ固定）
- テキストラベルは未実装（寸法は矢印のみ）

### 8.3 ブラウザストレージ
- localStorage/sessionStorageは使用不可（Claude.ai環境の制約）
- すべての状態はReact stateで管理

---

## 9. 今後の拡張可能性

### 9.1 機能追加候補
- OrbitControlsによるカメラ操作
- レシーバー位置の手動調整
- 複数パターンの比較表示
- プリセット機能（パターン保存・読込）
- 統計データの蓄積・分析
- ヒートマップ表示（コート上の有効性分布）
- PDFエクスポート機能
- 棒人間またはモーション付き3Dモデルの実装

### 9.2 物理モデル改善
- より正確な空気抵抗モデル
- 回転量の明示的な設定
- サーフェスタイプによるバウンド変化
- 風向き・風速の考慮

### 9.3 UI改善
- タッチ操作対応
- モバイルレイアウト最適化
- ダークモード対応
- 多言語対応

---

## 10. 参考資料

### 10.1 テニスコート規格
- ITF (International Tennis Federation) 公式規格
- コート全長: 23.77m (78 feet)
- シングルス幅: 8.23m (27 feet)
- ダブルス幅: 10.97m (36 feet)
- ネット高さ: 0.914m (3 feet) at center

### 10.2 物理パラメータ
- プロのサーブ速度: 180-250 km/h
- アマチュアのサーブ速度: 80-140 km/h
- アマチュアの移動速度: 3-7 m/s
- 反応時間: 0.2-0.5秒

---

## 11. 人形モーション実装（将来的拡張）

### 11.1 実装方法の選択肢

#### 11.1.1 簡易棒人間（推奨）- 難易度：中
- Three.jsの基本ジオメトリ（Cylinder, Sphere）で構成
- 各関節を親子階層で管理
- キーフレームアニメーションで動作

**実装例**:
```javascript
class StickFigure {
  constructor(scene, position) {
    this.group = new THREE.Group();
    this.head = createSphere(0.15, 0xffdbac);
    this.torso = createCylinder(0.15, 0.8, 0x333333);
    this.rightArm = createArm();
    // ... 他の部位
  }
  
  serveMotion(progress) {
    // progress: 0-1
    // 腕の回転角度を時間経過で変化
  }
}
```

#### 11.1.2 3Dモデル読込（GLTFモデル）- 難易度：中〜高
- Blenderなどで作成したリアルな人体モデル
- ボーンアニメーション（リグ）使用
- GLTFLoaderで読み込み

#### 11.1.3 スケルタルアニメーション（手動実装）- 難易度：高
- 最も自然な動き
- 実装が複雑（数百行）
- パフォーマンス考慮が必要

### 11.2 モーション設計

#### サーブモーション（簡易版）
```
t=0.0: 構え（腕を下げる）
t=0.3: テイクバック（腕を後ろに引く）
t=0.5: スイング開始（腕を振り上げ）
t=0.7: インパクト（最高点）
t=1.0: フォロースルー（腕を振り切る）
```

#### レシーブモーション（簡易版）
```
t=0.0: 待機姿勢
t=0.3: 反応開始（体を向ける）
t=0.6: 移動中（走る）
t=1.0: スイング（打つ）
```

### 11.3 実装の影響範囲
- 追加コード: 150-300行（StickFigureクラス）
- 変更箇所: `playAnimation()`、マーカー生成部分
- パフォーマンス: 棒人間ならほぼ影響なし

---

**文書バージョン**: 1.1  
**最終更新日**: 2025年11月27日  
**作成者**: Claude (Anthropic)  
**更新履歴**:
- v1.0: 初版作成
- v1.1: 人形モーション実装に関するセクション追加