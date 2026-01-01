import * as THREE from 'three';
import { COURT_CONSTANTS } from '../core/CourtConstants';

export class CourtVisualizer {
    group: THREE.Group;

    constructor() {
        this.group = new THREE.Group();
        this.initCourt();
    }

    private initCourt() {
        // Floor
        const courtGeometry = new THREE.PlaneGeometry(COURT_CONSTANTS.width, COURT_CONSTANTS.length);
        const courtMaterial = new THREE.MeshStandardMaterial({ color: 0x2d8659, side: THREE.DoubleSide });
        const court = new THREE.Mesh(courtGeometry, courtMaterial);
        court.rotation.x = -Math.PI / 2;
        this.group.add(court);

        // Lines
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });

        // Helper to create line from vectors
        const createLine = (points: THREE.Vector3[]) => {
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            return new THREE.Line(geometry, lineMaterial);
        };

        const halfLength = COURT_CONSTANTS.length / 2;
        const halfWidth = COURT_CONSTANTS.width / 2;
        const y = 0.01;

        // Baselines
        this.group.add(createLine([
            new THREE.Vector3(-halfWidth, y, -halfLength),
            new THREE.Vector3(halfWidth, y, -halfLength)
        ]));
        this.group.add(createLine([
            new THREE.Vector3(-halfWidth, y, halfLength),
            new THREE.Vector3(halfWidth, y, halfLength)
        ]));

        // Service Lines
        // Service line Z: The distance from Net (0). 
        // In original code: serviceLineZ = COURT.length/2 - COURT.baselineToServiceLine
        // App.js lines 232: const serviceLineZ = COURT.length/2 - COURT.baselineToServiceLine;
        const serviceLineZ = halfLength - COURT_CONSTANTS.baselineToServiceLine; // approx 6.385

        this.group.add(createLine([
            new THREE.Vector3(-halfWidth, y, -serviceLineZ),
            new THREE.Vector3(halfWidth, y, -serviceLineZ)
        ]));
        this.group.add(createLine([
            new THREE.Vector3(-halfWidth, y, serviceLineZ),
            new THREE.Vector3(halfWidth, y, serviceLineZ)
        ]));

        // Center Line
        this.group.add(createLine([
            new THREE.Vector3(0, y, -serviceLineZ),
            new THREE.Vector3(0, y, serviceLineZ)
        ]));

        // Singles Lines
        const singlesX = COURT_CONSTANTS.centerToSinglesLine;
        this.group.add(createLine([
            new THREE.Vector3(-singlesX, y, -halfLength),
            new THREE.Vector3(-singlesX, y, halfLength)
        ]));
        this.group.add(createLine([
            new THREE.Vector3(singlesX, y, -halfLength),
            new THREE.Vector3(singlesX, y, halfLength)
        ]));

        // Doubles Lines
        const doublesX = COURT_CONSTANTS.centerToDoublesLine;
        this.group.add(createLine([
            new THREE.Vector3(-doublesX, y, -halfLength),
            new THREE.Vector3(-doublesX, y, halfLength)
        ]));
        this.group.add(createLine([
            new THREE.Vector3(doublesX, y, -halfLength),
            new THREE.Vector3(doublesX, y, halfLength)
        ]));

        // Net
        const netGeometry = new THREE.PlaneGeometry(COURT_CONSTANTS.width, COURT_CONSTANTS.netHeight);
        const netMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const net = new THREE.Mesh(netGeometry, netMaterial);
        net.position.y = COURT_CONSTANTS.netHeight / 2;
        this.group.add(net);
    }

    addToScene(scene: THREE.Scene) {
        scene.add(this.group);
    }

    // Dimensions management
    private dimensionLabels: THREE.Object3D[] = [];

    updateDimensions(show: boolean) {
        // Clear existing labels/lines
        this.dimensionLabels.forEach(obj => this.group.remove(obj));
        this.dimensionLabels = [];

        if (!show) return;

        const halfLength = COURT_CONSTANTS.length / 2;
        const halfWidth = COURT_CONSTANTS.width / 2;
        const serviceLineZ = halfLength - COURT_CONSTANTS.baselineToServiceLine;
        const singlesX = COURT_CONSTANTS.centerToSinglesLine;

        const color = 0x00ffff; // Cyan for dimensions

        // 1. Full Width (Baseline) - Near Side
        // Draw offset behind the baseline
        this.addDimension(
            new THREE.Vector3(-halfWidth, 0, halfLength),
            new THREE.Vector3(halfWidth, 0, halfLength),
            "10.97m",
            new THREE.Vector3(0, 0, 1.5), // 1.5m behind
            color
        );

        // 2. Singles Width (Service Line) - Far Side
        // Draw offset behind the far service line
        this.addDimension(
            new THREE.Vector3(-singlesX, 0, -serviceLineZ),
            new THREE.Vector3(singlesX, 0, -serviceLineZ),
            "8.23m",
            new THREE.Vector3(0, 0, -1.0), // 1m behind
            color
        );

        // 3. Net to Baseline - Left Side
        // User requested "Net to Baseline" distance
        this.addDimension(
            new THREE.Vector3(-halfWidth, 0, 0), // Net
            new THREE.Vector3(-halfWidth, 0, halfLength), // Baseline
            "11.89m",
            new THREE.Vector3(-1.5, 0, 0),
            color,
            Math.PI // Rotate 180 degrees
        );

        // 4. Segment Lengths - Right Side (Service Area)
        // Net to Service Line
        this.addDimension(
            new THREE.Vector3(halfWidth, 0, 0),
            new THREE.Vector3(halfWidth, 0, serviceLineZ),
            "6.40m",
            new THREE.Vector3(1.5, 0, 0),
            color,
            Math.PI // Rotate 180 degrees
        );

        // Service to Baseline
        this.addDimension(
            new THREE.Vector3(halfWidth, 0, serviceLineZ),
            new THREE.Vector3(halfWidth, 0, halfLength),
            "5.49m",
            new THREE.Vector3(1.5, 0, 0),
            color,
            Math.PI // Rotate 180 degrees
        );
    }

    private addDimension(start: THREE.Vector3, end: THREE.Vector3, text: string, offset: THREE.Vector3, color: number, textRotation: number = 0) {
        const y = 0.05; // Lift slightly above ground
        const p1 = start.clone().add(offset).setY(y);
        const p2 = end.clone().add(offset).setY(y);

        // 1. Dimension Line
        const lineGeom = new THREE.BufferGeometry().setFromPoints([p1, p2]);
        const lineMat = new THREE.LineBasicMaterial({ color: color });
        const line = new THREE.Line(lineGeom, lineMat);
        this.group.add(line);
        this.dimensionLabels.push(line);

        // 2. Ticks (Start and End)
        const tickSize = 0.2;
        // Determine tick direction (perpendicular to line)
        const dir = p2.clone().sub(p1).normalize();
        const perp = new THREE.Vector3(-dir.z, 0, dir.x); // Rotate 90 deg around Y

        const createTick = (p: THREE.Vector3) => {
            const t1 = p.clone().add(perp.clone().multiplyScalar(tickSize));
            const t2 = p.clone().add(perp.clone().multiplyScalar(-tickSize));
            const tickGeom = new THREE.BufferGeometry().setFromPoints([t1, t2]);
            const tick = new THREE.Line(tickGeom, lineMat);
            this.group.add(tick);
            this.dimensionLabels.push(tick);
        };
        createTick(p1);
        createTick(p2);

        // 3. Label
        const center = p1.clone().add(p2).multiplyScalar(0.5);
        // Add overlap offset for text to avoid sitting exactly on the line?
        // Actually, placing it slightly "above" (z or x) depending on orientation?
        // Simple approach: Place purely at center, maybe lift Y more.

        // Calculate rotation: align with line
        const angle = Math.atan2(dir.z, dir.x); // Angle in XZ plane
        // Text should be readable. If angle is > 90 or < -90, flip it?
        // Actually, just maintain top-down readablity. 
        // For -PI/2 (vertical), text runs bottom-to-top.

        // Offset text slightly perpendicular to line to not cross it
        const textPos = center.clone().add(perp.clone().multiplyScalar(0.4));

        const texture = this.createLabelTexture(text, color);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });

        const imageWidth = texture.image.width;
        const imageHeight = texture.image.height;
        const scale = 0.015;
        const planeGeom = new THREE.PlaneGeometry(imageWidth * scale, imageHeight * scale);
        const mesh = new THREE.Mesh(planeGeom, material);

        mesh.position.copy(textPos);
        mesh.rotation.x = -Math.PI / 2;
        mesh.rotation.z = -angle + textRotation; // Apply extra rotation

        this.group.add(mesh);
        this.dimensionLabels.push(mesh);
    }

    private createLabelTexture(text: string, colorHex: number): THREE.CanvasTexture {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not create canvas context');

        const fontSize = 48;
        ctx.font = `bold ${fontSize}px Arial`;
        const textMetrics = ctx.measureText(text);

        const padding = 10;
        canvas.width = textMetrics.width + padding * 2;
        canvas.height = fontSize + padding * 2;

        // Transparent background
        // Text
        ctx.font = `bold ${fontSize}px Arial`;
        // Convert hex to style string
        const colorStr = '#' + new THREE.Color(colorHex).getHexString();
        ctx.fillStyle = colorStr;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        return texture;
    }
}
