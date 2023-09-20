import { Group, Vector3 } from '../../libs/three137/three.module.js';
import { GLTFLoader } from '../../libs/three137/GLTFLoader.js';
import { Explosion } from './Explosion.js';

function randomSide() {
    return Math.random() < 0.5 ? -2 : 2;
  }
  function randomSidebird() {
    return Math.random() < 0.5 ? 1 : -1;
  }

  function randomPosition(min, max) {
    return Math.random() * (max - min) + min;
}

class Obstacles{
    constructor(game){
        this.assetsPath = game.assetsPath;
        this.loadingBar = game.loadingBar;
		this.game = game;
		this.scene = game.scene;
        this.loadStar();
		this.loadBomb();
        this.loadCloud();
        this.loadBird();
		this.tmpPos = new Vector3();
        this.explosions = [];
         this.circleRadius = 0.5; // The radius of the circular path
         this.circleSpeed = 0.02; // Th    this.birdInitialPositions = [];
    }

    loadStar(){
    	const loader = new GLTFLoader( ).setPath(`${this.assetsPath}plane/`);
        this.ready = false;
        
		// Load a glTF resource
		loader.load(
			// resource URL
			'star.glb',
			// called when the resource is loaded
			gltf => {

                this.star = gltf.scene.children[0];

                this.star.name = 'star';

				if (this.bomb !== undefined) this.initialize();

			},
			// called while loading is progressing
			xhr => {

                this.loadingBar.update('star', xhr.loaded, xhr.total );
			
			},
			// called when loading has errors
			err => {

				console.error( err );

			}
		);
	}	
    loadCloud(){
    	const loader = new GLTFLoader( ).setPath(`${this.assetsPath}bird/`);
        this.ready = false;
        
		// Load a glTF resource
		loader.load(
			// resource URL
			'cloud.glb',
			// called when the resource is loaded
			gltf => {

                this.cloud = gltf.scene.children[0];

                this.cloud.name = 'cloud';
                this.cloud.scale.set(10, 10, 10); // Scale the cloud object by a factor of 2 in x, y, and z axes

				if (this.bomb !== undefined) this.initialize();

			},
			// called while loading is progressing
			xhr => {

                this.loadingBar.update('cloud', xhr.loaded, xhr.total );
			
			},
			// called when loading has errors
			err => {

				console.error( err );

			}
		);
	}	

    loadBird(){
    	const loader = new GLTFLoader( ).setPath(`${this.assetsPath}bird/`);
        this.ready = false;
        
		// Load a glTF resource
		loader.load(
			// resource URL
			'bird.gltf',
			// called when the resource is loaded
			gltf => {

                this.bird = gltf.scene.children[0];

                this.bird.name = 'bird';
                this.bird.scale.set(5, 5, 5); // Scale the bird object by a factor of 2 in x, y, and z axes


				if (this.bomb !== undefined) this.initialize();

			},
			// called while loading is progressing
			xhr => {

                this.loadingBar.update('bird', xhr.loaded, xhr.total );
			
			},
			// called when loading has errors
			err => {

				console.error( err );

			}
		);
	}	

    loadBomb(){
    	const loader = new GLTFLoader( ).setPath(`${this.assetsPath}bomb/`);
        
		// Load a glTF resource
		loader.load(
			// resource URL
			'jjj.glb',
			// called when the resource is loaded
			gltf => {

                this.bomb = gltf.scene.children[0];

                if (this.star !== undefined) this.initialize();

			},
			// called while loading is progressing
			xhr => {

				this.loadingBar.update('bomb', xhr.loaded, xhr.total );
				
			},
			// called when loading has errors
			err => {

				console.error( err );

			}
		);
	}

	initialize(){
        this.obstacles = [];
        
        const obstacle = new Group();
        
        obstacle.add(this.star);
        this.cloud.position.x = 5 * randomSide(); // Set the cloud's x position based on randomSide
        obstacle.add(this.cloud);

        this.bomb.rotation.x = -Math.PI*0.5;
        this.bomb.position.y = 7.5;
        obstacle.add(this.bomb);
        this.bird.position.x = 10 * randomSidebird();
        obstacle.add(this.bird);

        let rotate=true;

        for(let y=5; y>-8; y-=2.5){
            rotate = !rotate;
            if (y==0) continue;
            const bomb = this.bomb.clone();
            bomb.rotation.x = (rotate) ? -Math.PI*0.5 : 0;
            bomb.position.y = y;
            obstacle.add(bomb);
        
        }
        this.obstacles.push(obstacle);

        this.scene.add(obstacle);

        for(let i=0; i<3; i++){
            
            const obstacle1 = obstacle.clone();
            
            this.scene.add(obstacle1);
            this.obstacles.push(obstacle1);

        }

        this.reset();

		this.ready = true;
    }

    removeExplosion( explosion ){
        const index = this.explosions.indexOf( explosion );
        if (index != -1) this.explosions.indexOf(index, 1);
    }

    reset(){
        this.obstacleSpawn = { pos: 20, offset: 5 };
        this.obstacles.forEach( obstacle => this.respawnObstacle(obstacle) );
        let count;
        while( this.explosions.length>0 && count<100){
            this.explosions[0].onComplete();
            count++;
        }
    }

    respawnObstacle( obstacle ){
        this.obstacleSpawn.pos += 30;
        const offset = (Math.random()*2 - 1) * this.obstacleSpawn.offset;
        this.obstacleSpawn.offset += 0.2;
        const cloud = obstacle.children.find(child => child.name === 'cloud');
        if (cloud) {
          cloud.position.x = 5 * randomSide(); // Update the cloud's x position
        }

        const bird = obstacle.children.find(child => child.name === 'bird');
        if (bird) {
            bird.position.x = randomPosition(-10, 10); // Update the bird's x position
            bird.position.y = randomPosition(1, 10); // Update the bird's y position
        }

        obstacle.position.set(0, offset, this.obstacleSpawn.pos );
        obstacle.children[0].rotation.y = Math.random() * Math.PI * 2;
		obstacle.userData.hit = false;
		obstacle.children.forEach( child => {
			child.visible = true;
		});
    }

	update(pos, time){
        let collisionObstacle;
        this.obstacles.forEach( obstacle =>{
            obstacle.children[0].rotateY(0.01);
            
            const bird = obstacle.children.find(child => child.name === 'bird');
            if (bird) {
            bird.rotation.y += 0.02;

            // Calculate the new position of the bird in a circular path
            bird.position.x = bird.position.x + this.circleRadius * Math.cos(time * this.circleSpeed);
            bird.position.z = bird.position.z + this.circleRadius * Math.sin(time * this.circleSpeed);
            }

            const relativePosZ = obstacle.position.z-pos.z;
            if (Math.abs(relativePosZ)<2 && !obstacle.userData.hit){
                collisionObstacle = obstacle;
            }
            if (relativePosZ<-20){
                this.respawnObstacle(obstacle); 
            }
        });

       
        if (collisionObstacle!==undefined){
			collisionObstacle.children.some( child => {
				child.getWorldPosition(this.tmpPos);
				const dist = this.tmpPos.distanceToSquared(pos);
				if (dist<5){
					collisionObstacle.userData.hit = true;
					this.hit(child);
                    return true;
                }
            })
            
        }

        this.explosions.forEach( explosion => {
            explosion.update( time );
        });
    }

	hit(obj){
		if (obj.name=='star'){
			obj.visible = false;
			this.game.incScore();
        }else{
            this.explosions.push( new Explosion(obj, this) );
			this.game.decLives();
        }
	}
}

export { Obstacles };