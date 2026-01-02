import React from 'react';
import type { AnalysisResult } from '../types';

interface Props {
    results: AnalysisResult | null;
}

export const AnalysisPanel: React.FC<Props> = ({ results }) => {
    if (!results) return null;

    return (
        <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: 'white',
            borderRadius: '5px',
            border: '1px solid #ddd'
        }}>
            <h3 style={{ margin: '0 0 10px 0' }}>分析結果</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                <div>横移動距離: {results.moveX.toFixed(2)} m</div>
                <div>前方移動距離: {results.moveZ.toFixed(2)} m</div>
                <div>総移動距離: {results.totalDistance.toFixed(2)} m</div>
                <div>レシーブ時間: {results.receiveTime.toFixed(2)} 秒</div>
                <div>有効時間: {results.effectiveTime.toFixed(2)} 秒</div>
                <div>必要速度: {results.requiredSpeed.toFixed(2)} m/s</div>
                <div style={{ color: results.timingBuffer > 0 ? 'green' : 'red' }}>
                    準備時間: {(results.timingBuffer * 1000).toFixed(0)} ms
                </div>

                <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #ddd', paddingTop: '10px', marginTop: '5px' }}>
                    <strong>バウンド後の挙動:</strong>
                </div>
                <div>Y方向進行: {results.bounceDistanceY.toFixed(2)} m</div>
                <div>X方向進行: {results.bounceDistanceX.toFixed(2)} m</div>
                <div>Y方向速度: {results.bounceVelocityY.toFixed(2)} m/s</div>
                <div>X方向速度: {results.bounceVelocityX.toFixed(2)} m/s</div>

                <div style={{ gridColumn: '1 / -1', fontWeight: 'bold', fontSize: '16px', marginTop: '10px' }}>
                    難易度: {results.difficulty}
                </div>
            </div>
        </div>
    );
};
