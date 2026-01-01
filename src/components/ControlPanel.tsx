import React from 'react';
import type { ServeConfig } from '../types';
import { COURT_CONSTANTS } from '../core/CourtConstants';

interface Props {
    config: ServeConfig;
    onConfigChange: (newConfig: ServeConfig) => void;
    onPlayAnimation: () => void;
    isAnimating: boolean;
}

export const ControlPanel: React.FC<Props> = ({ config, onConfigChange, onPlayAnimation, isAnimating }) => {
    const handleChange = (key: keyof ServeConfig, value: number | string | boolean) => {
        onConfigChange({
            ...config,
            [key]: value
        });
    };

    return (
        <div style={{
            padding: '20px',
            backgroundColor: '#f5f5f5',
            overflowY: 'auto',
            maxHeight: '400px'
        }}>
            <h2 style={{ margin: '0 0 15px 0' }}>Control Panel</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                {/* Server Position */}
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        サーバー位置(X): {config.serverPositionX.toFixed(2)} m
                    </label>
                    <input
                        type="range"
                        min={0}
                        max={COURT_CONSTANTS.centerToDoublesLine}
                        step="0.1"
                        value={config.serverPositionX}
                        onChange={(e) => handleChange('serverPositionX', Number(e.target.value))}
                        style={{ width: '100%' }}
                    />
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                        0m → {COURT_CONSTANTS.centerToDoublesLine.toFixed(2)}m
                    </div>
                </div>

                {/* Dimensions Toggle */}
                <div>
                    <label style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={config.showDimensions}
                            onChange={(e) => handleChange('showDimensions', e.target.checked)}
                            style={{ marginRight: '8px', cursor: 'pointer' }}
                        />
                        コート寸法を表示
                    </label>
                </div>

                {/* Serve Speed */}
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        サーブ速度: {config.serveSpeed} km/h
                    </label>
                    <input
                        type="range"
                        min="40"
                        max="110"
                        value={config.serveSpeed}
                        onChange={(e) => handleChange('serveSpeed', Number(e.target.value))}
                        style={{ width: '100%' }}
                    />
                </div>

                {/* Trajectory Height */}
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        軌道の高さ: {config.trajectoryHeight.toFixed(1)} m
                    </label>
                    <input
                        type="range"
                        min="0.5"
                        max="5.0"
                        step="0.1"
                        value={config.trajectoryHeight}
                        onChange={(e) => handleChange('trajectoryHeight', Number(e.target.value))}
                        style={{ width: '100%' }}
                    />
                </div>

                {/* Peak Position */}
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        最高点の位置: {config.trajectoryPeakPosition.toFixed(1)} m
                    </label>
                    <input
                        type="range"
                        min="-2.0"
                        max="2.0"
                        step="0.1"
                        value={config.trajectoryPeakPosition}
                        onChange={(e) => handleChange('trajectoryPeakPosition', Number(e.target.value))}
                        style={{ width: '100%' }}
                    />
                </div>

                {/* Bounce Depth */}
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        バウンド深さ: {config.bounceDepth.toFixed(1)} m
                    </label>
                    <input
                        type="range"
                        min="0.2"
                        max="3.0"
                        step="0.1"
                        value={config.bounceDepth}
                        onChange={(e) => handleChange('bounceDepth', Number(e.target.value))}
                        style={{ width: '100%' }}
                    />
                </div>

                {/* Velocity Retention */}
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        バウンド後速度保持率: {(config.bounceVelocityRetention * 100).toFixed(0)}%
                    </label>
                    <input
                        type="range"
                        min="0.2"
                        max="0.8"
                        step="0.05"
                        value={config.bounceVelocityRetention}
                        onChange={(e) => handleChange('bounceVelocityRetention', Number(e.target.value))}
                        style={{ width: '100%' }}
                    />
                </div>

                {/* Direction */}
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        コース
                    </label>
                    <select
                        value={config.bounceDirection}
                        onChange={(e) => handleChange('bounceDirection', e.target.value as any)}
                        style={{ width: '100%', padding: '5px' }}
                    >
                        <option value="center">センター</option>
                        <option value="wide">ワイド</option>
                        <option value="body">ボディ</option>
                    </select>
                </div>

                {/* Reaction Delay */}
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        反応遅延: {config.reactionDelay.toFixed(2)} 秒
                    </label>
                    <input
                        type="range"
                        min="0.1"
                        max="0.6"
                        step="0.05"
                        value={config.reactionDelay}
                        onChange={(e) => handleChange('reactionDelay', Number(e.target.value))}
                        style={{ width: '100%' }}
                    />
                </div>
            </div>

            <button
                onClick={onPlayAnimation}
                disabled={isAnimating}
                style={{
                    marginTop: '15px',
                    padding: '10px 20px',
                    fontSize: '16px',
                    backgroundColor: isAnimating ? '#ccc' : '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: isAnimating ? 'not-allowed' : 'pointer',
                    width: '100%'
                }}
            >
                {isAnimating ? 'アニメーション中...' : 'アニメーション再生'}
            </button>
        </div>
    );
};
