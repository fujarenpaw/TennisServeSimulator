import React, { useEffect, useRef, useState } from 'react';
import { SceneController } from '../../graphics/SceneController';
import { CourtVisualizer } from '../../graphics/CourtVisualizer';
import { TrajectoryVisualizer } from '../../graphics/TrajectoryVisualizer';
import { BallVisualizer } from '../../graphics/BallVisualizer';
import { PhysicsEngine } from '../../core/PhysicsEngine';
import { COURT_CONSTANTS } from '../../core/CourtConstants';
import type { ServeConfig, AnalysisResult } from '../../types';
import { ControlPanel } from '../../components/ControlPanel';
import { AnalysisPanel } from '../../components/AnalysisPanel';
import { Vector3 } from 'three';

const ServeScene: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneControllerRef = useRef<SceneController | null>(null);
    const courtVisualizerRef = useRef<CourtVisualizer | null>(null);
    const trajectoryVisualizerRef = useRef<TrajectoryVisualizer | null>(null);
    const ballVisualizerRef = useRef<BallVisualizer | null>(null);

    const [config, setConfig] = useState<ServeConfig>({
        serveSpeed: 70,
        trajectoryHeight: 2.0,
        trajectoryPeakPosition: 0,
        bounceDepth: 1.0,
        bounceDirection: 'center',
        bounceVelocityRetention: 0.5,
        reactionDelay: 0.3,
        serverPositionX: 0,
        showDimensions: false
    });

    const [results, setResults] = useState<AnalysisResult | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);

    // Initialize Scene
    useEffect(() => {
        if (!containerRef.current) return;

        const controller = new SceneController(containerRef.current);
        const court = new CourtVisualizer();
        const trajectory = new TrajectoryVisualizer(controller.scene);
        const ball = new BallVisualizer(controller.scene);

        court.addToScene(controller.scene);

        sceneControllerRef.current = controller;
        courtVisualizerRef.current = court;
        trajectoryVisualizerRef.current = trajectory;
        ballVisualizerRef.current = ball;

        return () => {
            controller.dispose();
        };
    }, []);

    // Calculation & Updates
    useEffect(() => {
        if (!sceneControllerRef.current || !trajectoryVisualizerRef.current || !ballVisualizerRef.current) return;

        const trajectoryData = PhysicsEngine.calculateTrajectory(config);
        const analysis = PhysicsEngine.calculateReceiverAnalysis(trajectoryData, config);

        setResults(analysis);

        // Update Visuals
        trajectoryVisualizerRef.current.updateTrajectory(trajectoryData.points, sceneControllerRef.current.scene);

        const serverPos = new Vector3(config.serverPositionX, 0.3, -COURT_CONSTANTS.length / 2);
        const receiverPos = new Vector3(analysis.receiverStart.x, 0.3, analysis.receiverStart.z);
        const targetPos = new Vector3(analysis.receiverTarget.x, 0.2, analysis.receiverTarget.z);

        trajectoryVisualizerRef.current.updateMarkers(serverPos, receiverPos, targetPos);
        trajectoryVisualizerRef.current.updateDimensions(config.showDimensions, sceneControllerRef.current.scene, COURT_CONSTANTS);

        // Initial Ball Position
        if (!isAnimating) {
            ballVisualizerRef.current.setPosition(new Vector3(config.serverPositionX, 1, -COURT_CONSTANTS.length / 2));
        }

    }, [config, isAnimating]);

    const handlePlayAnimation = () => {
        if (isAnimating || !sceneControllerRef.current || !ballVisualizerRef.current) return;

        const trajectoryData = PhysicsEngine.calculateTrajectory(config);
        const points = trajectoryData.points;
        let index = 0;

        setIsAnimating(true);

        const updateBall = () => {
            if (index < points.length && ballVisualizerRef.current) {
                ballVisualizerRef.current.setPosition(points[index]);
                index++;
            } else {
                // End animation
                setIsAnimating(false);
                if (ballVisualizerRef.current) {
                    ballVisualizerRef.current.setPosition(new Vector3(config.serverPositionX, 1, -COURT_CONSTANTS.length / 2));
                }
                if (sceneControllerRef.current) {
                    sceneControllerRef.current.removeUpdatable(updateBall);
                }
            }
        };

        // We can hook into the SceneController loop for smoother animation 
        // OR use setTimeout like original. Hooking into loop is better for 60fps.
        // However, original code used setTimeout(20).
        // Let's use the SceneController loop.
        sceneControllerRef.current.addUpdatable(updateBall);
    };

    return (
        <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div ref={containerRef} style={{ flex: 1, position: 'relative' }} />

            <div style={{ maxHeight: '400px', backgroundColor: '#f5f5f5' }}>
                <ControlPanel
                    config={config}
                    onConfigChange={setConfig}
                    onPlayAnimation={handlePlayAnimation}
                    isAnimating={isAnimating}
                />
                <AnalysisPanel results={results} />
            </div>
        </div>
    );
};

export default ServeScene;
