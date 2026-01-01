import * as THREE from 'three';

export class SceneController {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    container: HTMLElement;
    animationId: number | null = null;
    updatables: (() => void)[] = [];

    constructor(container: HTMLElement) {
        this.container = container;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(15, 12, 8);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(this.renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(10, 20, 10);
        this.scene.add(directionalLight);

        // Bind resize
        this.onResize = this.onResize.bind(this);
        window.addEventListener('resize', this.onResize);

        // Start loop
        this.animate = this.animate.bind(this);
        this.animate();
    }

    onResize() {
        if (!this.container) return;
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    animate() {
        this.animationId = requestAnimationFrame(this.animate);

        // Run any registered updates (e.g. ball animation)
        this.updatables.forEach(fn => fn());

        this.renderer.render(this.scene, this.camera);
    }

    addUpdatable(fn: () => void) {
        this.updatables.push(fn);
    }

    removeUpdatable(fn: () => void) {
        this.updatables = this.updatables.filter(f => f !== fn);
    }

    dispose() {
        window.removeEventListener('resize', this.onResize);
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.container && this.renderer.domElement) {
            this.container.removeChild(this.renderer.domElement);
        }
        this.renderer.dispose();
    }
}
