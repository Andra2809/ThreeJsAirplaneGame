import * as THREE from '../../libs/three137/three.module.js';
import { RGBELoader } from '../../libs/three137/RGBELoader.js';
import { LoadingBar } from '../../libs/LoadingBar.js';
import { Plane } from './Plane.js';
import { Obstacles } from './Obstacles.js';
import { SFX } from '../../libs/SFX.js';
import { GLTFLoader } from '../../libs/three137/GLTFLoader.js';

class Game{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
        
        this.loadingBar = new LoadingBar();
        this.loadingBar.visible = false;

        this.clock = new THREE.Clock();

		this.assetsPath = '../../assets/';
        
		this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 100 );
        this.camera.position.set( -4.37, 0, -4.75 );
        this.camera.lookAt(0, 0, 6);

        this.cameraController = new THREE.Object3D();
        this.cameraController.add(this.camera);
        this.cameraTarget = new THREE.Vector3(0,0,6);
        
		this.scene = new THREE.Scene();
        this.scene.add(this.cameraController);

		const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        ambient.position.set( 0.5, 1, 0.25 );
		this.scene.add(ambient);
			
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.outputEncoding = THREE.sRGBEncoding;
		container.appendChild( this.renderer.domElement );
        this.setEnvironment();
        
        this.active = false;
        this.load();

        window.addEventListener('resize', this.resize.bind(this) );

        document.addEventListener('keydown', this.keyDown.bind(this));
        document.addEventListener('keyup', this.keyUp.bind(this));

        document.addEventListener('touchstart', this.mouseDown.bind(this) );
        document.addEventListener('touchend', this.mouseUp.bind(this) );
        document.addEventListener('mousedown', this.mouseDown.bind(this) );
        document.addEventListener('mouseup', this.mouseUp.bind(this) );
        
        this.spaceKey = false;
        this.upKey = false;
        this.downKey = false;
        this.leftKey = false;
        this.rightKey = false;

        const btn = document.getElementById('playBtn');
        btn.addEventListener('click', this.startGame.bind(this));
	}
	
    startGame(){
        const gameover = document.getElementById('gameover');
        const instructions = document.getElementById('instructions');
        const btn = document.getElementById('playBtn');

        gameover.style.display = 'none';
        instructions.style.display = 'none';
        btn.style.display = 'none';

        this.score = 0;
        this.bonusScore = 0;
        this.lives = 3;

        let elm = document.getElementById('score');
        elm.innerHTML = this.score;
        
        elm = document.getElementById('lives');
        elm.innerHTML = this.lives;

        this.plane.reset();
        this.obstacles.reset();

        this.active = true;

        this.sfx.play('engine');
    }

    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
    	this.camera.updateProjectionMatrix();
    	this.renderer.setSize( window.innerWidth, window.innerHeight ); 
    }

    keyDown(evt){
        switch(evt.keyCode){
            case 32:
                this.spaceKey = true; 
                break;
        }
    }
    
    keyUp(evt){
        switch(evt.keyCode){
            case 32:
                this.spaceKey = false;
                break;
        }
    }
    

    mouseDown(evt){
        this.spaceKey = true;
    }

    mouseUp(evt){
        this.spaceKey = false;
    }

    setEnvironment(){
        const loader = new RGBELoader().setPath(this.assetsPath);
        const pmremGenerator = new THREE.PMREMGenerator( this.renderer );
        pmremGenerator.compileEquirectangularShader();
        
        const self = this;
        
        loader.load( 'hdr/venice_sunset_1k.hdr', ( texture ) => {
          const envMap = pmremGenerator.fromEquirectangular( texture ).texture;
          pmremGenerator.dispose();

          self.scene.environment = envMap;

        }, undefined, (err)=>{
            console.error( err.message );
        } );
    }
    
	load(){
        this.loadSkybox();
        this.loading = true;
        this.loadingBar.visible = true;

        this.plane = new Plane(this);
        this.obstacles = new Obstacles(this);

        this.loadSFX();
        this.loadEnviroment();
    }

    loadEnviroment(){
        const loader = new GLTFLoader( ).setPath(`${this.assetsPath}bird/`);
        const loader2 = new GLTFLoader( ).setPath(`${this.assetsPath}sun/`);
        this.loadingBar.visible = true;
		
		// Load a glTF resource
		loader.load(
			// resource URL
			'cloud.glb',
			// called when the resource is loaded
			gltf => {

				this.scene.add( gltf.scene );
                this.cloud = gltf.scene;
				this.clouds = [];

                this.cloud.rotation.y = Math.PI / 8;
                this.cloud.position.y = -3;
                this.cloud.scale.set(10, 10, 10);
                this.scene.add(gltf.scene);

                const animate = () => {
                    if (this.cloud) {
                        this.cloud.scene.rotation.x += 0.01;
                        this.cloud.scene.rotation.y += 0.01;
                        this.cloud.scene.rotation.z += 0.01;
                    }
                    requestAnimationFrame(animate);
                  };

                
                this.renderer.setAnimationLoop( this.render.bind(this) );
			},
			// called while loading is progressing
			xhr => {

				this.loadingBar.update('environment', xhr.loaded, xhr.total);
				
			},
			// called when loading has errors
			err => {

				console.error( err );

			}
		);

        loader2.load(
			// resource URL
			'sun.glb',
			// called when the resource is loaded
			gltf => {

				this.scene.add( gltf.scene );
                this.sun = gltf.scene;
				this.suns = [];

                this.sun.rotation.y = Math.PI / 8;
                this.sun.position.z = 37;
                this.sun.position.x = -17;
                this.sun.scale.set(10, 10, 10);
                this.scene.add(gltf.scene);

                this.sun.rotation.y += Math.PI/1.5;

                const animate = () => {
                    if (this.sun) {
                        this.sun.rotation.x += 0.01;
                        this.sun.rotation.y += 0.01;
                        this.sun.rotation.z += 0.01;
                    }
                    if (this.cloud) {
                        this.cloud.rotation.x += 0.01;
                        this.cloud.rotation.y += 0.01;
                        this.cloud.rotation.z += 0.01;
                    }
                    requestAnimationFrame(animate);
                };
                
                
                this.renderer.setAnimationLoop( this.render.bind(this) );
			},
			// called while loading is progressing
			xhr => {

				this.loadingBar.update('environment', xhr.loaded, xhr.total);
				
			},
			// called when loading has errors
			err => {

				console.error( err );

			}
		);

    }

    loadSFX(){
        this.sfx = new SFX(this.camera, this.assetsPath + 'plane/');

        this.sfx.load('explosion');
        this.sfx.load('engine', true);
        this.sfx.load('gliss');
        this.sfx.load('gameover');
        this.sfx.load('bonus');
    }

    loadSkybox(){
        this.scene.background = new THREE.CubeTextureLoader()
	        .setPath( `${this.assetsPath}/plane/paintedsky/` )
            .load( [
                'px.jpg',
                'nx.jpg',
                'py.jpg',
                'ny.jpg',
                'pz.jpg',
                'nz.jpg'
            ], () => {
                this.renderer.setAnimationLoop(this.render.bind(this));
            } );
    }
    
    gameOver(){
        this.active = false;

        const gameover = document.getElementById('gameover');
        const btn = document.getElementById('playBtn');

        gameover.style.display = 'block';
        btn.style.display = 'block';

        this.plane.visible = false;

        this.sfx.stopAll();
        this.sfx.play('gameover');
    }

    incScore(){
        this.score++;

        const elm = document.getElementById('score');

        if (this.score % 3==0){
            this.bonusScore += 0;
            this.sfx.play('bonus');
        }else{
            this.sfx.play('gliss');
        }

        elm.innerHTML = this.score + this.bonusScore;
    }

    decLives(){
        this.lives--;

        const elm = document.getElementById('lives');

        elm.innerHTML = this.lives;

        if (this.lives==0) setTimeout(this.gameOver.bind(this), 600);

        this.sfx.play('explosion');
    }

    updateCamera(){
        this.cameraController.position.copy( this.plane.position );
        this.cameraController.position.y = 0;
        this.cameraTarget.copy(this.plane.position);
        this.cameraTarget.z += 6;
        this.camera.lookAt( this.cameraTarget );
    }

	render() {
        if (this.loading){
            if (this.plane.ready && this.obstacles.ready){
                this.loading = false;
                this.loadingBar.visible = false;
            }else{
                return;
            }
        }

        const dt = this.clock.getDelta();
        const time = this.clock.getElapsedTime();

        this.plane.update(time);

        if (this.active){
            this.obstacles.update(this.plane.position, dt);
        }
    
        this.updateCamera();
    
        this.renderer.render( this.scene, this.camera );

    }
}

export { Game };