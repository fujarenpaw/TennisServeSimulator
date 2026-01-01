# 実装計画

## 目標
テニスサーブシミュレーターにおける挙動の違和感（軌道落下、ネット突き抜け）の修正と、コート寸法表示機能の実装を行います。

## ユーザーレビューが必要な事項
特になし。

## 変更内容

### Core Logic

#### [MODIFY] [PhysicsEngine.ts](file:///c:/Users/hoge/Documents/GitHub/TennisServeSimulator/src/core/PhysicsEngine.ts)
- **軌道の修正**: 
  - 現在の降下フェーズの計算式 `y = startY + maxHeight * cos(...)` は、終了地点で `y = startY` (1.0m) となっており、これがバウンド地点(y=0)への垂直落下の原因です。
  - これを `y = (startY + maxHeight) * cos(...)` に修正し、y=0 で着地するようにします。
- **ネット衝突処理**:
  - 軌道生成ループ内で `z` が `0` (ネット位置) をまたぐ瞬間を検出し、その時の `y` がネットの高さ以下であれば、軌道をそこで打ち切ります。

### Graphics

#### [MODIFY] [CourtVisualizer.ts](file:///c:/Users/hoge/Documents/GitHub/TennisServeSimulator/src/graphics/CourtVisualizer.ts)
- **寸法表示の実装**:
  - `updateDimensions(show: boolean)` を実装し、チェックボックスの状態に応じて寸法ラベルの表示/非表示を切り替えます。
  - 外部フォントファイルの読み込みを避けるため、Canvas APIを使って動的にテキストテクスチャを生成し、それを平面メッシュ（PlaneMesh）に貼り付けて床面に配置する方法を採用します。
  - 表示する寸法:
    - ベースライン〜ネット: 11.89m
    - ネット〜サービスライン: 6.40m
    - サービスライン〜ベースライン: 5.49m
    - シングルスコート幅: 8.23m
    - ダブルスコート幅: 10.97m

## 検証計画

### 手動検証
- **軌道**: サーブを打ち、バウンド直前の軌道が滑らかに着地することを目視確認。
- **ネット**: `trajectoryHeight` を低く設定（例: 0.5m）し、ボールがネット位置で止まることを確認。
- **寸法**: UIのチェックボックスをONにし、コート上に正しい数値が表示されることを確認。
