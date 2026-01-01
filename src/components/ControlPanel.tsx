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
        // Direct update first
        const newConfig = { ...config, [key]: value } as ServeConfig;

        if (key === 'targetX' || key === 'targetZ') {
            // Target changed -> Optimize Speed/Angle
            const targetX = key === 'targetX' ? value as number : config.targetX;
            const targetZ = key === 'targetZ' ? value as number : config.targetZ;

            const optimized = PhysicsEngine.optimizeServe(targetX, targetZ, config.serverPositionX, config.serverHeight);

            updateConfig({
                [key]: value,
                serveSpeed: optimized.speed,
                launchAngle: optimized.angle
            });
        }
        else if (key === 'serveSpeed' || key === 'launchAngle' || key === 'serverPositionX') {
            // Physics changed -> Update TargetX/Z
            // We need to recalculate where it lands.
            const trajectory = PhysicsEngine.calculateTrajectory(newConfig);

            // Only update target if it's a valid bounce
            if (trajectory.bouncePoint) {
                updateConfig({
                    [key]: value,
                    targetX: trajectory.targetX, // This is the actual landing X
                    targetZ: trajectory.bouncePoint.z // Actual landing Z (relative to net? No, global Z)
                    // Wait, config.targetZ is "Depth".
                    // PhysicsEngine returns bouncePoint.z.
                    // If my slider is "Depth", is it distance from Net?
                    // In UI: "0.5m to 6.4m" (Net to Service Line).
                    // So targetZ should be positive Z.
                    // trajectory.bouncePoint.z is the Z coordinate.
                });
            } else {
                updateConfig({ [key]: value });
            }
        }
        else {
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

                    {/* Launch Angle */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                            打ち出し角度: {config.launchAngle.toFixed(1)}°
                        </label>
                        <input
                            type="range"
                            min="-15"
                            max="40"
                            step="0.5"
                            value={config.launchAngle}
                            onChange={(e) => handleChange('launchAngle', Number(e.target.value))}
                            style={{ width: '100%' }}
                        />
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
