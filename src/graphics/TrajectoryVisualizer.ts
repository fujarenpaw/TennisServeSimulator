import * as THREE from 'three';

export class TrajectoryVisualizer {
    line: THREE.Line | null = null;
    serverMarker: THREE.Mesh;
    receiverMarker: THREE.Mesh;
    targetMarker: THREE.Mesh;
    dimensionsGroup: THREE.Group | null = null;

    constructor(scene: THREE.Scene) {
        // Server Marker (Red)
        const serverGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const serverMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        this.serverMarker = new THREE.Mesh(serverGeometry, serverMaterial);
        scene.add(this.serverMarker);

        // Receiver Marker (Blue)
        const receiverGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const receiverMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
        this.receiverMarker = new THREE.Mesh(receiverGeometry, receiverMaterial);
        scene.add(this.receiverMarker);

        // Target Marker (Green Ghost)
        const targetGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const targetMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.5
        });
        this.targetMarker = new THREE.Mesh(targetGeometry, targetMaterial);
        scene.add(this.targetMarker);
    }

    updateTrajectory(points: THREE.Vector3[], scene: THREE.Scene) {
        if (this.line) {
            scene.remove(this.line);
        }
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff00ff, linewidth: 3 });
        this.line = new THREE.Line(lineGeometry, lineMaterial);
        scene.add(this.line);
    }

    updateMarkers(serverPos: THREE.Vector3, receiverPos: THREE.Vector3, targetPos: THREE.Vector3) {
        this.serverMarker.position.copy(serverPos);
        this.receiverMarker.position.copy(receiverPos);
        this.targetMarker.position.copy(targetPos);
    }

    // Ported from app.js updateDimensions
    updateDimensions(show: boolean, scene: THREE.Scene, courtConstants: any) {
        if (this.dimensionsGroup) {
            scene.remove(this.dimensionsGroup);
            this.dimensionsGroup = null;
        }

        if (!show) return;

        this.dimensionsGroup = new THREE.Group();

        const createDimensionLine = (start: THREE.Vector3, end: THREE.Vector3) => {
            const points = [start, end];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 });
            const line = new THREE.Line(geometry, material);
            this.dimensionsGroup!.add(line);

            const arrowGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
            const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
            const arrow1 = new THREE.Mesh(arrowGeometry, arrowMaterial);
            arrow1.position.copy(start);
            arrow1.position.y += 0.5;
            this.dimensionsGroup!.add(arrow1);

            const arrow2 = new THREE.Mesh(arrowGeometry, arrowMaterial);
            arrow2.position.copy(end);
            arrow2.position.y += 0.5;
            this.dimensionsGroup!.add(arrow2);
        };

        // Use constants to draw
        const singlesX = courtConstants.centerToSinglesLine;
        const doublesX = courtConstants.centerToDoublesLine;
        const halfLength = courtConstants.length / 2;
        // const serviceLineZ = halfLength - courtConstants.baselineToServiceLine;

        // Width
        createDimensionLine(
            new THREE.Vector3(-singlesX, 0.02, 0),
            new THREE.Vector3(singlesX, 0.02, 0)
        );

        // Length
        createDimensionLine(
            new THREE.Vector3(doublesX + 0.5, 0.02, -halfLength),
            new THREE.Vector3(doublesX + 0.5, 0.02, halfLength)
        );

        // Service Box
        createDimensionLine(
            new THREE.Vector3(-doublesX - 0.5, 0.02, -halfLength),
            new THREE.Vector3(-doublesX - 0.5, 0.02, -halfLength + courtConstants.baselineToServiceLine)
        );

        scene.add(this.dimensionsGroup);
    }
}
