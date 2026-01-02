import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// @ts-ignore: OrbitControls types might be missing in some setups
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { SceneController } from '../../graphics/SceneController';
import { CourtVisualizer } from '../../graphics/CourtVisualizer';
import { TrajectoryVisualizer } from '../../graphics/TrajectoryVisualizer';
import { BallVisualizer } from '../../graphics/BallVisualizer';
import { ReceiverVisualizer } from '../../graphics/ReceiverVisualizer';
import { ServerVisualizer } from '../../graphics/ServerVisualizer';
import { PhysicsEngine } from '../../core/PhysicsEngine';
import { COURT_CONSTANTS } from '../../core/CourtConstants';
import type { ServeConfig, AnalysisResult } from '../../types';
import { ControlPanel } from '../../components/ControlPanel';
import { AnalysisPanel } from '../../components/AnalysisPanel';

const ServeScene: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneControllerRef = useRef<SceneController | null>(null);
    const courtVisualizerRef = useRef<CourtVisualizer | null>(null);
    const trajectoryVisualizerRef = useRef<TrajectoryVisualizer | null>(null);
    const ballVisualizerRef = useRef<BallVisualizer | null>(null);
    const receiverVisualizerRef = useRef<ReceiverVisualizer | null>(null);
    const serverVisualizerRef = useRef<ServerVisualizer | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);

    const isDraggingRef = useRef(false);

    const [config, setConfig] = useState<ServeConfig>({
        serveSpeed: 150,
        launchAngleV: -5,
        launchAngleH: 0,
        targetX: 0,
        targetZ: 4.0,
        serverHeight: 1.0,           // Default 100cm (UNDER)
        bounceVelocityRetention: 0.7,
        reactionDelay: 0.3,
        serverPositionX: 1.5,
        showDimensions: false,
        receiverPositionX: 4.115,
        receiverPositionZ: COURT_CONSTANTS.length / 2,
        receiverSpeed: 5.0  // Default receiver speed: 5 m/s
    });

    const [results, setResults] = useState<AnalysisResult | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);

    // Keep latest config in ref for event listeners
    const configRef = useRef(config);
    useEffect(() => {
        configRef.current = config;
    }, [config]);

    // Initialize Scene
    useEffect(() => {
        if (!containerRef.current) return;

        const controller = new SceneController(containerRef.current);
        const court = new CourtVisualizer();
        const trajectory = new TrajectoryVisualizer(controller.scene);
        const ball = new BallVisualizer(controller.scene);
        const receiver = new ReceiverVisualizer(controller.scene);
        const server = new ServerVisualizer(controller.scene);

        court.addToScene(controller.scene);

        // OrbitControls
        const controls = new OrbitControls(controller.camera, controller.renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        // Limit camera rotation to prevent viewing from behind the court
        controls.minAzimuthAngle = 0;
        controls.maxAzimuthAngle = Math.PI; // 180 degrees (horizontal rotation)
        controls.maxPolarAngle = Math.PI / 2; // Limit vertical angle to prevent seeing court back
        controller.addUpdatable(() => controls.update());

        sceneControllerRef.current = controller;
        courtVisualizerRef.current = court;
        trajectoryVisualizerRef.current = trajectory;
        ballVisualizerRef.current = ball;
        receiverVisualizerRef.current = receiver;
        serverVisualizerRef.current = server;
        controlsRef.current = controls;

        // Interaction Setup
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        let dragType: 'target' | 'receiver' | null = null;

        const onPointerDown = (event: PointerEvent) => {
            const rect = controller.renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, controller.camera);

            // Check intersection with Target Marker
            const targetMarker = trajectory.targetMarker;
            const intersects = raycaster.intersectObject(targetMarker);

            if (intersects.length > 0) {
                isDraggingRef.current = true;
                dragType = 'target';
                controls.enabled = false;
                document.body.style.cursor = 'grabbing';
                return;
            }

            // Check intersection with Receiver Marker
            if (receiverVisualizerRef.current) {
                // Accessing private property for raycasting - in a real app we might add a getter or use a group
                // @ts-ignore
                const receiverMesh = receiverVisualizerRef.current.receiverMesh;
                const intersectsReceiver = raycaster.intersectObject(receiverMesh);
                if (intersectsReceiver.length > 0) {
                    isDraggingRef.current = true;
                    dragType = 'receiver';
                    controls.enabled = false;
                    document.body.style.cursor = 'grabbing';
                }
            }
        };

        const onPointerMove = (event: PointerEvent) => {
            if (!isDraggingRef.current) return;

            const rect = controller.renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, controller.camera);
            const targetPoint = new THREE.Vector3();
            raycaster.ray.intersectPlane(groundPlane, targetPoint);

            if (targetPoint) {
                if (dragType === 'target') {
                    // Clamp coords
                    const x = Math.max(-4.115, Math.min(4.115, targetPoint.x));
                    const z = Math.max(0.5, Math.min(6.4, targetPoint.z)); // Keep within service box logic roughly

                    const serverX = configRef.current.serverPositionX;
                    const serverHeight = configRef.current.serverHeight;
                    const optimized = PhysicsEngine.optimizeServe(x, z, serverX, serverHeight);

                    // Update state
                    setConfig(prev => ({
                        ...prev,
                        targetX: x,
                        targetZ: z,
                        serveSpeed: optimized.speed,
                        launchAngleV: optimized.launchAngleV,
                        launchAngleH: optimized.launchAngleH
                    }));
                } else if (dragType === 'receiver') {
                    const x = Math.max(-COURT_CONSTANTS.width / 2 - 2, Math.min(COURT_CONSTANTS.width / 2 + 2, targetPoint.x));
                    const z = Math.max(COURT_CONSTANTS.length / 2, Math.min(COURT_CONSTANTS.length / 2 + 5, targetPoint.z));

                    setConfig(prev => ({
                        ...prev,
                        receiverPositionX: x,
                        receiverPositionZ: z
                    }));
                }
            }
        };

        const onPointerUp = () => {
            if (isDraggingRef.current) {
                isDraggingRef.current = false;
                dragType = null;
                controls.enabled = true;
                document.body.style.cursor = 'auto';
            }
        };

        const canvas = controller.renderer.domElement;
        canvas.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);

        return () => {
            controller.dispose();
            canvas.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        };
    }, []); // Run once

    // Calculation & Updates
    useEffect(() => {
        if (!sceneControllerRef.current || !trajectoryVisualizerRef.current || !ballVisualizerRef.current || !courtVisualizerRef.current) return;

        const trajectoryData = PhysicsEngine.calculateTrajectory(config);
        const analysis = PhysicsEngine.calculateReceiverAnalysis(trajectoryData, config);

        setResults(analysis);

        // Update Visuals
        trajectoryVisualizerRef.current.updateTrajectory(trajectoryData.points, sceneControllerRef.current.scene);

        // Update markers positions
        // Server
        const serverPos = new THREE.Vector3(config.serverPositionX, config.serverHeight, -COURT_CONSTANTS.length / 2);
        // Receiver
        const receiverPos = new THREE.Vector3(analysis.receiverStart.x, 0, analysis.receiverStart.z);
        // Target (Where the ball actually lands based on physics)
        const landingPos = trajectoryData.bouncePoint.clone();
        landingPos.y = 0.1;

        trajectoryVisualizerRef.current.updateMarkers(serverPos, receiverPos, landingPos);
        courtVisualizerRef.current.updateDimensions(config.showDimensions);

        // Initial Ball Position
        if (!isAnimating) {
            ballVisualizerRef.current.setPosition(serverPos);
        }

        // Update receiver markers
        if (receiverVisualizerRef.current) {
            receiverVisualizerRef.current.updateMarkers(receiverPos, landingPos);
        }

        // Update server
        if (serverVisualizerRef.current) {
            serverVisualizerRef.current.update(config.serverPositionX, config.serverHeight, 0, false);
        }

    }, [config, isAnimating]);

    const handlePlayAnimation = () => {
        if (isAnimating || !sceneControllerRef.current || !ballVisualizerRef.current || !receiverVisualizerRef.current || !serverVisualizerRef.current) return;

        const trajectoryData = PhysicsEngine.calculateTrajectory(config);
        const analysis = PhysicsEngine.calculateReceiverAnalysis(trajectoryData, config);
        const points = trajectoryData.points;
        let frameCount = 0;

        setIsAnimating(true);

        const finishAnimation = () => {
            setIsAnimating(false);
            if (ballVisualizerRef.current) {
                ballVisualizerRef.current.setPosition(new THREE.Vector3(config.serverPositionX, config.serverHeight, -COURT_CONSTANTS.length / 2));
            }
            if (receiverVisualizerRef.current) {
                receiverVisualizerRef.current.reset(analysis.receiverMovement);
            }
            if (serverVisualizerRef.current) {
                serverVisualizerRef.current.update(config.serverPositionX, config.serverHeight, 0, false);
            }
            if (sceneControllerRef.current) {
                sceneControllerRef.current.removeUpdatable(updateFrame);
            }
        };

        const updateFrame = () => {
            const dt = 0.01;
            const currentTime = frameCount * dt;
            const isUnderhand = config.serverHeight < 2.0;
            const PREP_TIME = isUnderhand ? 0.2 : 0.6; // Underhand is much faster, no toss

            if (serverVisualizerRef.current && ballVisualizerRef.current && receiverVisualizerRef.current) {
                // Determine server progress. Impact is at 0.5.
                let serverProgress = 0;
                if (currentTime < PREP_TIME) {
                    serverProgress = (currentTime / PREP_TIME) * 0.5;
                } else {
                    // Post-impact follow through (0.5 to 1.0)
                    // Let's make follow through take about 0.5s regardless of prep time
                    serverProgress = 0.5 + Math.min(0.5, (currentTime - PREP_TIME) / 0.5);
                }

                serverVisualizerRef.current.update(config.serverPositionX, config.serverHeight, serverProgress, true);

                if (currentTime < PREP_TIME) {
                    // Prep Phase
                    const serverX = config.serverPositionX;
                    const serverHeight = config.serverHeight;
                    const startZ = -COURT_CONSTANTS.length / 2;
                    let ballPos: THREE.Vector3;

                    if (!isUnderhand) {
                        // Toss Phase (Standard only)
                        const tossP = currentTime / PREP_TIME;
                        const tossPeak = Math.max(serverHeight + 1.2, 3.8);
                        let ballY = 0;
                        if (tossP < 0.5) {
                            ballY = 1.0 + (tossPeak - 1.0) * (tossP / 0.5);
                        } else {
                            ballY = tossPeak - (tossPeak - serverHeight) * ((tossP - 0.5) / 0.5);
                        }
                        ballPos = new THREE.Vector3(serverX - 0.2, ballY, startZ);
                    } else {
                        // Underhand: Ball held at hip height (approx 1.0m) until hit
                        ballPos = new THREE.Vector3(serverX + 0.1, 1.0, startZ);
                    }

                    ballVisualizerRef.current.setPosition(ballPos);
                    receiverVisualizerRef.current.updateReceiverAnimation(analysis.receiverMovement, 0, ballPos);
                } else {
                    // Flight Phase
                    const flightTime = currentTime - PREP_TIME;
                    const flightIndex = Math.floor(flightTime / dt);

                    if (flightIndex < points.length) {
                        const currentBallPos = points[flightIndex];
                        ballVisualizerRef.current.setPosition(currentBallPos);

                        const progress = flightTime / analysis.receiveTime;
                        receiverVisualizerRef.current.updateReceiverAnimation(analysis.receiverMovement, progress, currentBallPos);
                    } else {
                        finishAnimation();
                    }
                }
                frameCount++;
            } else {
                finishAnimation();
            }
        };

        sceneControllerRef.current.addUpdatable(updateFrame);
    };

    return (
        <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* 上部エリア: シミュレーター(2/3) + 分析結果(1/3) */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <div ref={containerRef} style={{ flex: 2, position: 'relative', borderRight: '1px solid #ddd' }} />

                <div style={{ flex: 1, backgroundColor: '#f9f9f9', overflowY: 'auto', padding: '10px' }}>
                    <AnalysisPanel results={results} />
                </div>
            </div>

            {/* 下部エリア: コントロールパネル */}
            <div style={{ height: '300px', backgroundColor: '#f5f5f5', borderTop: '2px solid #ccc', overflowY: 'auto' }}>
                <ControlPanel
                    config={config}
                    onConfigChange={setConfig}
                    onPlayAnimation={handlePlayAnimation}
                    isAnimating={isAnimating}
                />
            </div>
        </div>
    );
};

export default ServeScene;
