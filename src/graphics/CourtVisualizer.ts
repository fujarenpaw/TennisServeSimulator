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

    // Future: ability to toggle dimensions
    updateDimensions(_show: boolean) {
        // TODO: Implement dimension lines if needed
    }
}
