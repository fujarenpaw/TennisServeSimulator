// app.js
const { useState, useEffect, useRef } = React;

const TennisServeSimulator = () => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const ballRef = useRef(null);
  const trajectoryLineRef = useRef(null);
  const receiverRef = useRef(null);
  const animationIdRef = useRef(null);
  
  const [serveSpeed, setServeSpeed] = useState(70);
  const [trajectoryHeight, setTrajectoryHeight] = useState(2.0);
  const [trajectoryPeakPosition, setTrajectoryPeakPosition] = useState(0);
  const [bounceDepth, setBounceDepth] = useState(1.0);
  const [bounceDirection, setBounceDirection] = useState('center');
  const [bounceVelocityRetention, setBounceVelocityRetention] = useState(0.5);
  const [reactionDelay, setReactionDelay] = useState(0.3);
  const [serverPositionX, setServerPositionX] = useState(0);
  const [showDimensions, setShowDimensions] = useState(false);
  const [results, setResults] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const COURT = {
    length: 23.77,
    width: 10.97,
    singlesWidth: 8.23,
    serviceLineDistance: 6.4,
    baselineToServiceLine: 5.5,
    centerToSinglesLine: 4.115,
    centerToDoublesLine: 5.485,
    netHeight: 0.914
  };

  const calculateTrajectory = () => {
    const speedMs = serveSpeed / 3.6;
    const trajectoryPoints = [];
    const bounceY = COURT.baselineToServiceLine - bounceDepth;
    
    let targetX = 0;
    let angleToTarget = 0;
    
    if (bounceDirection === 'wide') {
      targetX = COURT.centerToSinglesLine;
      angleToTarget = Math.atan2(targetX - serverPositionX, bounceY + COURT.length / 2);
    } else if (bounceDirection === 'body') {
      targetX = COURT.centerToSinglesLine * 0.5;
      angleToTarget = Math.atan2(targetX - serverPositionX, bounceY + COURT.length / 2);
    } else {
      targetX = 0;
      angleToTarget = Math.atan2(targetX - serverPositionX, bounceY + COURT.length / 2);
    }
    
    const startX = serverPositionX;
    const startY = 1.0;
    const startZ = -COURT.length / 2;
    
    const distance = Math.sqrt(Math.pow(targetX - startX, 2) + Math.pow(bounceY - startZ, 2));
    const timeToFirstBounce = distance / speedMs;
    const maxHeight = trajectoryHeight;
    const steps = 50;
    
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const x = startX + (targetX - startX) * progress;
      const z = startZ + (bounceY - startZ) * progress;
      
      const netZ = 0;
      const peakZ = netZ + trajectoryPeakPosition;
      
      let peakProgress = 0.5;
      if (Math.abs(bounceY - startZ) > 0.001) {
        peakProgress = (peakZ - startZ) / (bounceY - startZ);
        peakProgress = Math.max(0.1, Math.min(0.9, peakProgress));
      }
      
      let y;
      if (progress <= peakProgress) {
        const localProgress = progress / peakProgress;
        y = startY + maxHeight * Math.sin((Math.PI / 2) * localProgress);
      } else {
        const localProgress = (progress - peakProgress) / (1 - peakProgress);
        y = startY + maxHeight * Math.cos((Math.PI / 2) * localProgress);
      }
      
      trajectoryPoints.push(new THREE.Vector3(x, Math.max(0, y), z));
    }
    
    const bouncePoint = trajectoryPoints[trajectoryPoints.length - 1];
    const bounceSpeedMs = speedMs * bounceVelocityRetention;
    
    const vectorX = targetX - startX;
    const vectorZ = bounceY - startZ;
    const vectorLength = Math.sqrt(vectorX * vectorX + vectorZ * vectorZ);
    
    const normalizedVectorX = vectorX / vectorLength;
    const normalizedVectorZ = vectorZ / vectorLength;
    
    const bounceVelocityZ = bounceSpeedMs * normalizedVectorZ;
    const bounceVelocityX = bounceSpeedMs * normalizedVectorX;
    
    const bounceFlightTime = 0.5;
    const bounceDistanceZ = bounceVelocityZ * bounceFlightTime;
    const bounceDistanceX = bounceVelocityX * bounceFlightTime;
    
    const secondBounceZ = bounceY + bounceDistanceZ;
    const secondBounceX = targetX + bounceDistanceX;
    
    const bounceSteps = 30;
    const maxBounceHeight = maxHeight * 0.3;
    
    for (let i = 1; i <= bounceSteps; i++) {
      const progress = i / bounceSteps;
      const x = targetX + (secondBounceX - targetX) * progress;
      const z = bounceY + (secondBounceZ - bounceY) * progress;
      const y = maxBounceHeight * Math.sin(Math.PI * progress);
      
      trajectoryPoints.push(new THREE.Vector3(x, Math.max(0, y), z));
    }
    
    return {
      points: trajectoryPoints,
      bouncePoint: bouncePoint,
      secondBounceZ: secondBounceZ,
      secondBounceX: secondBounceX,
      bounceDistanceY: bounceDistanceZ,
      bounceDistanceX: bounceDistanceX,
      bounceVelocityY: bounceVelocityZ,
      bounceVelocityX: bounceVelocityX,
      timeToFirstBounce: timeToFirstBounce,
      targetX: targetX
    };
  };

  const calculateReceiverAnalysis = (trajectory) => {
    const receiverX = COURT.centerToSinglesLine;
    const receiverZ = 0;
    
    const bouncePoint = trajectory.bouncePoint;
    const secondBounceZ = trajectory.secondBounceZ;
    const bounceDistanceY = trajectory.bounceDistanceY;
    
    let targetZ;
    if (bounceDistanceY < 0.5) {
      targetZ = bouncePoint.z + 0.3;
    } else {
      targetZ = secondBounceZ + 1.5;
    }
    
    const moveX = Math.abs(trajectory.targetX - receiverX);
    const moveZ = Math.abs(targetZ - receiverZ);
    const totalDistance = Math.sqrt(moveX * moveX + moveZ * moveZ);
    
    const bounceAirTime = trajectoryHeight * 0.15;
    const receiveTime = trajectory.timeToFirstBounce + bounceAirTime;
    const effectiveTime = receiveTime - reactionDelay;
    
    const requiredSpeed = effectiveTime > 0 ? totalDistance / effectiveTime : Infinity;
    
    let difficulty = '比較的容易';
    if (requiredSpeed > 8) difficulty = '非常に困難';
    else if (requiredSpeed > 6) difficulty = '困難';
    else if (requiredSpeed > 4) difficulty = 'やや困難';
    
    return {
      receiverStart: { x: receiverX, z: receiverZ },
      receiverTarget: { x: trajectory.targetX, z: targetZ },
      moveX: moveX,
      moveZ: moveZ,
      totalDistance: totalDistance,
      receiveTime: receiveTime,
      effectiveTime: effectiveTime,
      requiredSpeed: requiredSpeed,
      difficulty: difficulty,
      bounceDistanceY: bounceDistanceY,
      bounceDistanceX: trajectory.bounceDistanceX,
      bounceVelocityY: trajectory.bounceVelocityY,
      bounceVelocityX: trajectory.bounceVelocityX
    };
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(15, 12, 8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    const courtGeometry = new THREE.PlaneGeometry(COURT.width, COURT.length);
    const courtMaterial = new THREE.MeshStandardMaterial({ color: 0x2d8659, side: THREE.DoubleSide });
    const court = new THREE.Mesh(courtGeometry, courtMaterial);
    court.rotation.x = -Math.PI / 2;
    scene.add(court);

    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    
    const baselineGeometry1 = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-COURT.width/2, 0.01, -COURT.length/2),
      new THREE.Vector3(COURT.width/2, 0.01, -COURT.length/2)
    ]);
    scene.add(new THREE.Line(baselineGeometry1, lineMaterial));
    
    const baselineGeometry2 = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-COURT.width/2, 0.01, COURT.length/2),
      new THREE.Vector3(COURT.width/2, 0.01, COURT.length/2)
    ]);
    scene.add(new THREE.Line(baselineGeometry2, lineMaterial));

    const serviceLineZ = COURT.length/2 - COURT.baselineToServiceLine;
    const serviceLineGeometry1 = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-COURT.width/2, 0.01, -serviceLineZ),
      new THREE.Vector3(COURT.width/2, 0.01, -serviceLineZ)
    ]);
    scene.add(new THREE.Line(serviceLineGeometry1, lineMaterial));
    
    const serviceLineGeometry2 = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-COURT.width/2, 0.01, serviceLineZ),
      new THREE.Vector3(COURT.width/2, 0.01, serviceLineZ)
    ]);
    scene.add(new THREE.Line(serviceLineGeometry2, lineMaterial));

    const centerLineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.01, -serviceLineZ),
      new THREE.Vector3(0, 0.01, serviceLineZ)
    ]);
    scene.add(new THREE.Line(centerLineGeometry, lineMaterial));

    const singlesX = COURT.centerToSinglesLine;
    const singlesLineGeometry1 = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-singlesX, 0.01, -COURT.length/2),
      new THREE.Vector3(-singlesX, 0.01, COURT.length/2)
    ]);
    scene.add(new THREE.Line(singlesLineGeometry1, lineMaterial));
    
    const singlesLineGeometry2 = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(singlesX, 0.01, -COURT.length/2),
      new THREE.Vector3(singlesX, 0.01, COURT.length/2)
    ]);
    scene.add(new THREE.Line(singlesLineGeometry2, lineMaterial));

    const doublesX = COURT.centerToDoublesLine;
    const doublesLineGeometry1 = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-doublesX, 0.01, -COURT.length/2),
      new THREE.Vector3(-doublesX, 0.01, COURT.length/2)
    ]);
    scene.add(new THREE.Line(doublesLineGeometry1, lineMaterial));
    
    const doublesLineGeometry2 = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(doublesX, 0.01, -COURT.length/2),
      new THREE.Vector3(doublesX, 0.01, COURT.length/2)
    ]);
    scene.add(new THREE.Line(doublesLineGeometry2, lineMaterial));

    const netGeometry = new THREE.PlaneGeometry(COURT.width, COURT.netHeight);
    const netMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff, 
      transparent: true, 
      opacity: 0.5,
      side: THREE.DoubleSide 
    });
    const net = new THREE.Mesh(netGeometry, netMaterial);
    net.position.y = COURT.netHeight / 2;
    scene.add(net);

    const serverGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const serverMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const server = new THREE.Mesh(serverGeometry, serverMaterial);
    server.position.set(serverPositionX, 0.3, -COURT.length/2);
    server.name = 'server';
    scene.add(server);

    const receiverGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const receiverMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
    const receiver = new THREE.Mesh(receiverGeometry, receiverMaterial);
    receiver.position.set(COURT.centerToSinglesLine, 0.3, 0);
    scene.add(receiver);
    receiverRef.current = receiver;

    const ballGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    const ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.position.set(serverPositionX, 1, -COURT.length/2);
    ball.name = 'ball';
    scene.add(ball);
    ballRef.current = ball;

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;

    const trajectory = calculateTrajectory();
    const analysis = calculateReceiverAnalysis(trajectory);
    setResults(analysis);

    if (trajectoryLineRef.current) {
      sceneRef.current.remove(trajectoryLineRef.current);
    }

    const lineGeometry = new THREE.BufferGeometry().setFromPoints(trajectory.points);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff00ff, linewidth: 3 });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    sceneRef.current.add(line);
    trajectoryLineRef.current = line;

    if (receiverRef.current) {
      const targetGeometry = new THREE.SphereGeometry(0.2, 16, 16);
      const targetMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x00ff00, 
        transparent: true, 
        opacity: 0.5 
      });
      const existingTarget = sceneRef.current.getObjectByName('receiverTarget');
      if (existingTarget) sceneRef.current.remove(existingTarget);
      
      const target = new THREE.Mesh(targetGeometry, targetMaterial);
      target.name = 'receiverTarget';
      target.position.set(analysis.receiverTarget.x, 0.2, analysis.receiverTarget.z);
      sceneRef.current.add(target);
    }
    
    const server = sceneRef.current.getObjectByName('server');
    if (server) {
      server.position.x = serverPositionX;
    }
    
    const ball = sceneRef.current.getObjectByName('ball');
    if (ball && !isAnimating) {
      ball.position.set(serverPositionX, 1, -COURT.length/2);
    }
    
    updateDimensions();

  }, [serveSpeed, trajectoryHeight, trajectoryPeakPosition, bounceDepth, bounceDirection, bounceVelocityRetention, reactionDelay, serverPositionX, showDimensions]);

  const updateDimensions = () => {
    if (!sceneRef.current) return;
    
    const existingDimensions = sceneRef.current.getObjectByName('dimensions');
    if (existingDimensions) {
      sceneRef.current.remove(existingDimensions);
    }
    
    if (!showDimensions) return;
    
    const dimensionsGroup = new THREE.Group();
    dimensionsGroup.name = 'dimensions';
    
    const createDimensionLine = (start, end) => {
      const points = [start, end];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 });
      const line = new THREE.Line(geometry, material);
      dimensionsGroup.add(line);
      
      const arrowGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
      const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
      const arrow1 = new THREE.Mesh(arrowGeometry, arrowMaterial);
      arrow1.position.copy(start);
      arrow1.position.y += 0.5;
      dimensionsGroup.add(arrow1);
      
      const arrow2 = new THREE.Mesh(arrowGeometry, arrowMaterial);
      arrow2.position.copy(end);
      arrow2.position.y += 0.5;
      dimensionsGroup.add(arrow2);
    };
    
    createDimensionLine(
      new THREE.Vector3(-COURT.centerToSinglesLine, 0.02, 0),
      new THREE.Vector3(COURT.centerToSinglesLine, 0.02, 0)
    );
    
    createDimensionLine(
      new THREE.Vector3(COURT.centerToDoublesLine + 0.5, 0.02, -COURT.length/2),
      new THREE.Vector3(COURT.centerToDoublesLine + 0.5, 0.02, COURT.length/2)
    );
    
    createDimensionLine(
      new THREE.Vector3(-COURT.centerToDoublesLine - 0.5, 0.02, -COURT.length/2),
      new THREE.Vector3(-COURT.centerToDoublesLine - 0.5, 0.02, -COURT.length/2 + COURT.baselineToServiceLine)
    );
    
    sceneRef.current.add(dimensionsGroup);
  };

  const playAnimation = () => {
    if (!ballRef.current || !trajectoryLineRef.current || isAnimating) return;
    
    setIsAnimating(true);
    const trajectory = calculateTrajectory();
    const points = trajectory.points;
    let index = 0;
    
    const animateServe = () => {
      if (index < points.length) {
        ballRef.current.position.copy(points[index]);
        index++;
        setTimeout(animateServe, 20);
      } else {
        setIsAnimating(false);
        ballRef.current.position.set(serverPositionX, 1, -COURT.length/2);
      }
    };
    
    animateServe();
  };

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div ref={containerRef} style={{ flex: 1, position: 'relative' }} />
      
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#f5f5f5', 
        overflowY: 'auto',
        maxHeight: '400px'
      }}>
        <h2 style={{ margin: '0 0 15px 0' }}>アンダーサーブシミュレーター</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              サーバー位置(X): {serverPositionX.toFixed(2)} m
            </label>
            <input 
              type="range" 
              min={0} 
              max={COURT.centerToDoublesLine} 
              step="0.1"
              value={serverPositionX}
              onChange={(e) => setServerPositionX(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
              センターマーク(0m) → ダブルスライン({COURT.centerToDoublesLine.toFixed(2)}m)
            </div>
          </div>
          
          <div>
            <label style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', cursor: 'pointer' }}>
              <input 
                type="checkbox"
                checked={showDimensions}
                onChange={(e) => setShowDimensions(e.target.checked)}
                style={{ marginRight: '8px', cursor: 'pointer' }}
              />
              コート寸法を表示
            </label>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              コート上に黄色の寸法線を表示
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              サーブ速度: {serveSpeed} km/h
            </label>
            <input 
              type="range" 
              min="40" 
              max="110" 
              value={serveSpeed}
              onChange={(e) => setServeSpeed(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              軌道の高さ: {trajectoryHeight.toFixed(1)} m
            </label>
            <input 
              type="range" 
              min="0.5" 
              max="5.0" 
              step="0.1"
              value={trajectoryHeight}
              onChange={(e) => setTrajectoryHeight(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
              軌道の最高点の高さ（地面から）
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              最高点の位置: {trajectoryPeakPosition.toFixed(1)} m
            </label>
            <input 
              type="range" 
              min="-2.0" 
              max="2.0" 
              step="0.1"
              value={trajectoryPeakPosition}
              onChange={(e) => setTrajectoryPeakPosition(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
              ネット(0m)を基準に、前後どこで最高点になるか
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              バウンド深さ: {bounceDepth.toFixed(1)} m (サービスラインから手前)
            </label>
            <input 
              type="range" 
              min="0.2" 
              max="3.0" 
              step="0.1"
              value={bounceDepth}
              onChange={(e) => setBounceDepth(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              バウンド後速度保持率: {(bounceVelocityRetention * 100).toFixed(0)}%
            </label>
            <input 
              type="range" 
              min="0.2" 
              max="0.8" 
              step="0.05"
              value={bounceVelocityRetention}
              onChange={(e) => setBounceVelocityRetention(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              コース
            </label>
            <select 
              value={bounceDirection}
              onChange={(e) => setBounceDirection(e.target.value)}
              style={{ width: '100%', padding: '5px' }}
            >
              <option value="center">センター</option>
              <option value="wide">ワイド</option>
              <option value="body">ボディ</option>
            </select>
          </div>
          
<div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              反応遅延: {reactionDelay.toFixed(2)} 秒
            </label>
            <input 
              type="range" 
              min="0.1" 
              max="0.6" 
              step="0.05"
              value={reactionDelay}
              onChange={(e) => setReactionDelay(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        
        <button 
          onClick={playAnimation}
          disabled={isAnimating}
          style={{
            marginTop: '15px',
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: isAnimating ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isAnimating ? 'not-allowed' : 'pointer'
          }}
        >
          {isAnimating ? 'アニメーション中...' : 'アニメーション再生'}
        </button>
        
        {results && (
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
        )}
        
        <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
          <p style={{ margin: '5px 0' }}>🔴 赤: サーバー位置</p>
          <p style={{ margin: '5px 0' }}>🔵 青: レシーバー初期位置</p>
          <p style={{ margin: '5px 0' }}>🟢 緑: レシーバー目標位置</p>
          <p style={{ margin: '5px 0' }}>🟣 紫線: ボール軌道</p>
        </div>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<TennisServeSimulator />);