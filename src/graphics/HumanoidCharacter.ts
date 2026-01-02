import * as THREE from 'three';

export type AnimationType = 'IDLE' | 'SERVE_STANDARD' | 'SERVE_UNDER' | 'RETURN_FORE' | 'RETURN_BACK' | 'VOLLEY' | 'WALK';

export class HumanoidCharacter {
    public group: THREE.Group;

    // Joint references
    private torso: THREE.Mesh;
    private head: THREE.Mesh;
    private armL: THREE.Group;
    private armR: THREE.Group;
    private legL: THREE.Group;
    private legR: THREE.Group;
    private racketGroup: THREE.Group;

    private upperArmL: THREE.Mesh;
    private lowerArmL: THREE.Mesh;
    private upperArmR: THREE.Mesh;
    private lowerArmR: THREE.Mesh;

    constructor(color: number = 0xcccccc) {
        this.group = new THREE.Group();

        // Standard proportions (approx 1.8m tall)
        const skinMaterial = new THREE.MeshStandardMaterial({ color });
        const racketMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });

        // Torso
        const torsoGeom = new THREE.BoxGeometry(0.4, 0.6, 0.2);
        this.torso = new THREE.Mesh(torsoGeom, skinMaterial);
        this.torso.position.y = 0.9 + 0.3; // Center of torso
        this.group.add(this.torso);

        // Head
        const headGeom = new THREE.SphereGeometry(0.15, 16, 16);
        this.head = new THREE.Mesh(headGeom, skinMaterial);
        this.head.position.y = 0.45; // Relative to torso
        this.torso.add(this.head);

        // Arms
        this.armL = this.createArm(skinMaterial);
        this.armL.position.set(-0.25, 0.25, 0);
        this.torso.add(this.armL);

        this.armR = this.createArm(skinMaterial);
        this.armR.position.set(0.25, 0.25, 0);
        this.torso.add(this.armR);

        // Racket (attached to Right Hand by default)
        this.racketGroup = this.createRacket(racketMaterial);
        // Position it at the end of the lower arm
        this.racketGroup.position.y = -0.4;
        this.racketGroup.rotation.x = Math.PI / 2;
        // Find lower arm R
        this.lowerArmR = this.armR.children[0].children[0] as THREE.Mesh;
        this.lowerArmR.add(this.racketGroup);

        // Legs
        this.legL = this.createLeg(skinMaterial);
        this.legL.position.set(-0.15, -0.3, 0);
        this.torso.add(this.legL);

        this.legR = this.createLeg(skinMaterial);
        this.legR.position.set(0.15, -0.3, 0);
        this.torso.add(this.legR);

        // Helper references for easier animation
        this.upperArmL = this.armL.children[0] as THREE.Mesh;
        this.lowerArmL = this.upperArmL.children[0] as THREE.Mesh;
        this.upperArmR = this.armR.children[0] as THREE.Mesh;
        this.lowerArmR = this.upperArmR.children[0] as THREE.Mesh;
    }

    private createArm(material: THREE.Material): THREE.Group {
        const armGroup = new THREE.Group();

        // Upper arm
        const upperGeom = new THREE.BoxGeometry(0.1, 0.35, 0.1);
        const upper = new THREE.Mesh(upperGeom, material);
        upper.position.y = -0.175;
        armGroup.add(upper);

        // Lower arm group (hinge at elbow)
        const lowerGroup = new THREE.Group();
        lowerGroup.position.y = -0.175;
        upper.add(lowerGroup);

        const lowerGeom = new THREE.BoxGeometry(0.08, 0.35, 0.08);
        const lower = new THREE.Mesh(lowerGeom, material);
        lower.position.y = -0.175;
        lowerGroup.add(lower);

        return armGroup;
    }

    private createLeg(material: THREE.Material): THREE.Group {
        const legGroup = new THREE.Group();

        // Upper leg
        const upperGeom = new THREE.BoxGeometry(0.15, 0.45, 0.15);
        const upper = new THREE.Mesh(upperGeom, material);
        upper.position.y = -0.225;
        legGroup.add(upper);

        // Lower leg
        const lowerGroup = new THREE.Group();
        lowerGroup.position.y = -0.225;
        upper.add(lowerGroup);

        const lowerGeom = new THREE.BoxGeometry(0.12, 0.45, 0.12);
        const lower = new THREE.Mesh(lowerGeom, material);
        lower.position.y = -0.225;
        lowerGroup.add(lower);

        return legGroup;
    }

    private createRacket(material: THREE.Material): THREE.Group {
        const group = new THREE.Group();

        // Handle
        const handleGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.4);
        const handle = new THREE.Mesh(handleGeom, material);
        group.add(handle);

        // Frame (Ring-like)
        const frameGeom = new THREE.TorusGeometry(0.15, 0.015, 8, 24);
        const frame = new THREE.Mesh(frameGeom, material);
        frame.position.y = 0.35;
        frame.rotation.x = Math.PI / 2;
        group.add(frame);

        return group;
    }

    /**
     * Set a specific pose or transition based on progress (0 to 1)
     */
    public updateAnimation(type: AnimationType, progress: number): void {
        this.resetPose();

        switch (type) {
            case 'SERVE_STANDARD':
                this.animateServeStandard(progress);
                break;
            case 'SERVE_UNDER':
                this.animateServeUnder(progress);
                break;
            case 'RETURN_FORE':
                this.animateReturn(progress, true);
                break;
            case 'RETURN_BACK':
                this.animateReturn(progress, false);
                break;
            case 'VOLLEY':
                this.animateVolley(progress);
                break;
            case 'WALK':
                this.animateWalk(progress);
                break;
            default:
                this.animateIdle();
                break;
        }
    }

    private resetPose(): void {
        // Reset rotations
        this.armL.rotation.set(0, 0, 0);
        this.armR.rotation.set(0, 0, 0);
        this.upperArmL.rotation.set(0, 0, 0);
        this.lowerArmL.rotation.set(0, 0, 0);
        this.upperArmR.rotation.set(0, 0, 0);
        this.lowerArmR.rotation.set(0, 0, 0);
        this.legL.rotation.set(0, 0, 0);
        this.legR.rotation.set(0, 0, 0);
        this.torso.rotation.set(0, 0, 0);
    }

    private animateIdle(): void {
        const breath = Math.sin(Date.now() * 0.002) * 0.02;
        this.torso.scale.set(1, 1 + breath, 1);
        this.armL.rotation.z = 0.2;
        this.armR.rotation.z = -0.2;
    }

    private animateServeStandard(progress: number): void {
        // Simple serve: Toss -> Backswing -> Impact -> Follow-through
        if (progress < 0.3) {
            // Toss phase
            const p = progress / 0.3;
            this.armL.rotation.x = -Math.PI * p; // Left arm up for toss
            this.armR.rotation.x = Math.PI * 0.5 * p; // Right arm back
        } else if (progress < 0.5) {
            // Backswing
            const p = (progress - 0.3) / 0.2;
            this.armL.rotation.x = -Math.PI;
            this.armR.rotation.x = Math.PI * 0.5 + Math.PI * 0.3 * p;
            this.lowerArmR.rotation.x = -Math.PI * 0.5 * p;
        } else if (progress < 0.7) {
            // Impact
            const p = (progress - 0.5) / 0.2;
            this.armR.rotation.x = Math.PI * 0.8 - Math.PI * 1.5 * p;
            this.lowerArmR.rotation.x = -Math.PI * 0.5 * (1 - p);
        } else {
            // Follow-through
            const p = (progress - 0.7) / 0.3;
            this.armR.rotation.x = -Math.PI * 0.7 - Math.PI * 0.3 * p;
            this.armR.rotation.z = -Math.PI * 0.2 * p;
        }
    }

    private animateServeUnder(progress: number): void {
        // Underhand serve
        if (progress < 0.5) {
            // Backswing
            const p = progress / 0.5;
            this.armR.rotation.x = Math.PI * 0.5 * p;
        } else {
            // Swing
            const p = (progress - 0.5) / 0.5;
            this.armR.rotation.x = Math.PI * 0.5 - Math.PI * 1.2 * p;
        }
    }

    private animateReturn(progress: number, isForehand: boolean): void {
        const side = isForehand ? 1 : -1;
        if (progress < 0.4) {
            // Backswing
            const p = progress / 0.4;
            this.torso.rotation.y = side * Math.PI * 0.4 * p;
            this.armR.rotation.y = side * Math.PI * 0.3 * p;
            this.armR.rotation.z = -side * Math.PI * 0.2 * p;
        } else if (progress < 0.7) {
            // Swing
            const p = (progress - 0.4) / 0.3;
            this.torso.rotation.y = side * (Math.PI * 0.4 - Math.PI * 0.8 * p);
            this.armR.rotation.y = side * (Math.PI * 0.3 - Math.PI * 0.6 * p);
            this.armR.rotation.x = -Math.PI * 0.2 * p; // Slight additive motion
        } else {
            // Follow-through
            const p = (progress - 0.7) / 0.3;
            this.torso.rotation.y = side * (-Math.PI * 0.4 - Math.PI * 0.2 * p);
        }
    }

    private animateVolley(progress: number): void {
        // High impact, quick punch motion
        if (progress < 0.3) {
            // Preparation
            const p = progress / 0.3;
            this.armR.rotation.x = -Math.PI * 0.4 * p;
            this.armR.rotation.z = -Math.PI * 0.1 * p;
            this.lowerArmR.rotation.x = -Math.PI * 0.3 * p;
        } else if (progress < 0.6) {
            // Punch
            const p = (progress - 0.3) / 0.3;
            this.armR.rotation.x = -Math.PI * 0.4 + Math.PI * 0.6 * p;
            this.lowerArmR.rotation.x = -Math.PI * 0.3 + Math.PI * 0.4 * p;
        } else {
            // Follow-through
            const p = (progress - 0.6) / 0.4;
            this.armR.rotation.x = Math.PI * 0.2 - Math.PI * 0.1 * p;
        }
    }

    private animateWalk(progress: number): void {
        const cycle = progress * Math.PI * 4; // Multiple steps
        this.legL.rotation.x = Math.sin(cycle) * 0.4;
        this.legR.rotation.x = -Math.sin(cycle) * 0.4;
        this.armL.rotation.x = -Math.sin(cycle) * 0.3;
        this.armR.rotation.x = Math.sin(cycle) * 0.3;
        // Bobbing torso
        this.torso.position.y = 1.2 + Math.abs(Math.sin(cycle)) * 0.05;
    }

    public setPosition(x: number, y: number, z: number): void {
        this.group.position.set(x, y, z);
    }

    public setRotationY(angle: number): void {
        this.group.rotation.y = angle;
    }
}
