import React from 'react';
import type { ServeConfig } from '../types';
import { COURT_CONSTANTS } from '../core/CourtConstants';
import { PhysicsEngine } from '../core/PhysicsEngine';

interface Props {
    config: ServeConfig;
    onConfigChange: (newConfig: ServeConfig) => void;
    onPlayAnimation: () => void;
    isAnimating: boolean;
}

export const ControlPanel: React.FC<Props> = ({ config, onConfigChange, onPlayAnimation, isAnimating }) => {

    const updateConfig = (updates: Partial<ServeConfig>) => {
        onConfigChange({
            ...config,
            ...updates
        });
    };

    const handleChange = (key: keyof ServeConfig, value: number | string | boolean) => {
        // Only use optimizeServe when user drags target position
        if (key === 'targetX' || key === 'targetZ') {
            // Target changed -> Optimize Speed/Angle
            const targetX = key === 'targetX' ? value as number : config.targetX;
            const targetZ = key === 'targetZ' ? value as number : config.targetZ;

            const optimized = PhysicsEngine.optimizeServe(targetX, targetZ, config.serverPositionX, config.serverHeight);

            updateConfig({
                [key]: value,
                serveSpeed: optimized.speed,
                trajectoryPeakHeight: optimized.trajectoryPeakHeight,
                peakPosition: optimized.peakPosition
            });
        } else {
            // For all other parameters, just update directly
            // The trajectory will be recalculated automatically in ServeScene
            updateConfig({ [key]: value });
        }
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
                {/* === Target Settings === */}
                <fieldset style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '15px', borderRadius: '5px' }}>
                    <legend style={{ fontWeight: 'bold' }}>Target Settings</legend>

                    {/* Target X */}
                    <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                            着弾点 X (横): {config.targetX.toFixed(2)} m
                        </label>
                        <input
                            type="range"
                            min={-4.115}
                            max={4.115}
                            step="0.05"
                            value={config.targetX}
                            onChange={(e) => handleChange('targetX', Number(e.target.value))}
                            style={{ width: '100%' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
                            <span>L</span>
                            <span>C</span>
                            <span>R</span>
                        </div>
                    </div>

                    {/* Target Z */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                            着弾点 Z (深さ): {config.targetZ.toFixed(2)} m
                        </label>
                        <input
                            type="range"
                            min={0.5}
                            max={6.4}
                            step="0.05"
                            value={config.targetZ}
                            onChange={(e) => handleChange('targetZ', Number(e.target.value))}
                            style={{ width: '100%' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
                            <span>Net</span>
                            <span>Base</span>
                        </div>
                    </div>
                </fieldset>

                {/* === Physics Parameters === */}
                <fieldset style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '15px', borderRadius: '5px' }}>
                    <legend style={{ fontWeight: 'bold' }}>Physics Parameters</legend>

                    {/* Serve Speed */}
                    <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                            サーブ速度: {config.serveSpeed.toFixed(1)} km/h
                        </label>
                        <input
                            type="range"
                            min="40"
                            max="220"
                            step="1"
                            value={config.serveSpeed}
                            onChange={(e) => handleChange('serveSpeed', Number(e.target.value))}
                            style={{ width: '100%' }}
                        />
                    </div>

                    {/* Trajectory Peak Height */}
                    <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                            軌道の最高点の高さ: {config.trajectoryPeakHeight.toFixed(2)} m
                        </label>
                        <input
                            type="range"
                            min="0.5"
                            max="10"
                            step="0.1"
                            value={config.trajectoryPeakHeight}
                            onChange={(e) => handleChange('trajectoryPeakHeight', Number(e.target.value))}
                            style={{ width: '100%' }}
                        />
                    </div>

                    {/* Peak Position */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                            最高点の位置 (ネット基準): {config.peakPosition.toFixed(2)} m
                        </label>
                        <input
                            type="range"
                            min={-6}
                            max={12}
                            step="0.1"
                            value={config.peakPosition}
                            onChange={(e) => handleChange('peakPosition', Number(e.target.value))}
                            style={{ width: '100%' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
                            <span>サーバー側</span>
                            <span>ネット</span>
                            <span>相手コート</span>
                        </div>
                    </div>
                </fieldset>

                {/* === Server Settings === */}
                <fieldset style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '15px', borderRadius: '5px' }}>
                    <legend style={{ fontWeight: 'bold' }}>Server Settings</legend>

                    {/* Server Position */}
                    <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                            立ち位置 (X): {config.serverPositionX.toFixed(2)} m
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
                    </div>

                    {/* Server Height */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                            打点高さ: {(config.serverHeight * 100).toFixed(0)} cm
                        </label>
                        <input
                            type="range"
                            min={0.5}
                            max={2.5}
                            step="0.05"
                            value={config.serverHeight}
                            onChange={(e) => handleChange('serverHeight', Number(e.target.value))}
                            style={{ width: '100%' }}
                        />
                    </div>
                </fieldset>

                {/* === Receiver Settings === */}
                <fieldset style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '15px', borderRadius: '5px' }}>
                    <legend style={{ fontWeight: 'bold' }}>Receiver Settings</legend>

                    <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                            移動速度: {config.receiverSpeed.toFixed(1)} m/s
                        </label>
                        <input
                            type="range"
                            min="2.0"
                            max="8.0"
                            step="0.1"
                            value={config.receiverSpeed}
                            onChange={(e) => handleChange('receiverSpeed', Number(e.target.value))}
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                            反応時間: {config.reactionDelay.toFixed(2)} 秒
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
                </fieldset>

                {/* Bounce Velocity Retention or other specific settings can be collapsed or kept if needed */}
                <div style={{ marginTop: '10px' }}>
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

                {/* Dimensions Toggle */}
                <div style={{ marginTop: '15px' }}>
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
