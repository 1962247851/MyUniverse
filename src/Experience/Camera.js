import * as THREE from 'three'
import Experience from './Experience.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export default class Camera
{
    constructor()
    {
        //Setup
        this.experience = new Experience()
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.canvas = this.experience.canvas
        this.time = this.experience.time

        this.setInstance()  //Setup Camera

        //Animation
        this.time.on('tick', () =>{
            this.animation()
        })
    }

    //Generate Camera
    setInstance()
    {
        this.cameraGroup = new THREE.Group()
        this.instance = new THREE.PerspectiveCamera(75, this.sizes.width / this.sizes.height, 0.1, 1000)
        this.instance.position.set(2, 30, 110)
        this.cameraGroup.add(this.instance)
        this.scene.add(this.cameraGroup)
    }

    animation(){
        if(window.start == false){
            this.instance.position.set(2, 10, 110)
            // 确保 cameraGroup 位置为 0，避免切换时位置跳变
            this.cameraGroup.position.set(0, 0, 0)
        }else{
            // 确保 instance.position 是正确的值（当 start=true 时应该是 (2, 30, 110)）
            // 这很重要，因为之前的 start=false 分支可能已经改变了它
            this.instance.position.set(2, 30, 110)
            
            // 安全检查，确保 parallaxX 和 parallaxY 是有效数值
            const parallaxX = (window.parallaxX !== undefined && !isNaN(window.parallaxX)) ? window.parallaxX : 0
            const parallaxY = (window.parallaxY !== undefined && !isNaN(window.parallaxY)) ? window.parallaxY : 0
            
            // 计算 cameraGroup 位置
            // instance.position 是 (2, 30, 110)，所以 cameraGroup 需要偏移来保持初始位置一致
            // 初始位置应该是 (2, 10, 110)，所以 cameraGroup 应该是 (0, -20, 0) + 偏移
            this.cameraGroup.position.x = 0 + (20 * parallaxX)
            this.cameraGroup.position.y = -20 + (20 * parallaxY)
            window.camera = this.instance
        }
    }

    //Resize viewport
    resize()
    {
        this.instance.aspect = this.sizes.width / this.sizes.height
        this.instance.updateProjectionMatrix()
    }

    //Update Control (on each frame)
    update()
    {
        // this.controls.update()
    }
}