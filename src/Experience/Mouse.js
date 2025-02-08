import * as THREE from 'three'
import Experience from './Experience.js'

export default class Mouse
{
    constructor()
    {
        // Setup
        this.experience = new Experience()
        this.sizes = this.experience.sizes
        this.intersect_sun = 2
        this.intersect_planet = 5
        this.click = 0
        window.start = false
        this.gyroEnabled = true
        this.gyroEnabledTimer = null
        this.setInstance()  // Setup mouse
    }

    // Generate mouse
    setInstance()
    {
        this.mouse = new THREE.Vector2();
        window.addEventListener("mousemove", (event) => {
            this.handleMouseMove(event.clientX, event.clientY);
        });
        window.addEventListener("touchstart", (event) => {
            if (event.touches.length === 1) {
                const touch = event.touches[0];
                this.handleMouseMove(touch.clientX, touch.clientY);
            }
        });
        window.addEventListener("touchmove", (event) => {
            if (event.touches.length === 1) {
                this.enableGyroscopeDelayed(1000);

                const touch = event.touches[0];
                this.handleMouseMove(touch.clientX, touch.clientY);
            }
        });

        const u = navigator.userAgent;
        const isAndroid = u.indexOf('Android') > -1 || u.indexOf('Adr') > -1; // android terminal
        const isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); // ios terminal

        // Determine if it is iOS or Android
        if (isiOS) {
            if (window.DeviceOrientationEvent.requestPermission) {
                window.DeviceOrientationEvent.requestPermission().then(state => {
                    if (state === "granted") {
                        this.monitor();
                    }
                });
            } else {
                this.monitor();
            }
        } else if (isAndroid) {
            this.monitor();
        }

        window.addEventListener("click", () => {
            this.handleClick();
        });
    }

    /**
     * 延时启用陀螺仪
     * @param timeout 延时时间，单位ms
     */
    enableGyroscopeDelayed(timeout) {
        this.gyroEnabled = false;
        if (this.gyroEnabledTimer != null) {
            clearTimeout(this.gyroEnabledTimer)
        }
        this.gyroEnabledTimer = setTimeout(() => {
            this.gyroEnabled = true; // Re-enable gyroscope updates after a short delay
            this.gyroEnabledTimer = null;
        }, timeout);
    }

    // Gyroscope rotation event handling
    monitor() {
        if (window.DeviceMotionEvent) {
            window.addEventListener('deviceorientation', (event) => {
                if (this.gyroEnabled) {
                    this.handleDeviceOrientation(event.alpha, event.beta, event.gamma);
                }
            }, true);
        } else {
            // alert('Your device does not support gyroscope.');
        }
    }

    handleDeviceOrientation(alpha, beta, gamma) {
        window.start = true;
        this.mouse.x = (gamma / 90); // gamma is the rotation around the y-axis
        this.mouse.y = -(beta / 90); // beta is the rotation around the x-axis
        window.parallaxX = this.mouse.x * 0.5;
        window.parallaxY = -this.mouse.y * 0.5;
    }

    handleMouseMove(clientX, clientY) {
        window.start = true;
        this.mouse.x = (clientX / this.sizes.width) - 0.5;
        this.mouse.y = (clientY / this.sizes.height) - 0.5;
        window.parallaxX = this.mouse.x * 0.5;
        window.parallaxY = -this.mouse.y * 0.5;
    }

    handleClick() {
        this.enableGyroscopeDelayed(1000);

        if (this.intersect_sun == 1) {
            this.click++;
            if (this.click % 2 == 1) {
                this.experience.animate = 0;
                this.experience.blink = 1;
            } else if (this.click % 2 == 0) {
                this.experience.blink = 0;
                this.experience.animate = 1;
            }
        }

        if (this.intersect_planet == 1) {
            window.open("https://github.com/1962247851", "_blank");
            console.log("earth");
        } else if (this.intersect_planet == 2) {
            window.open("https://github.com/ordinaryroad-project", "_blank");
            console.log("jupiter");
        } else if (this.intersect_planet == 3) {
            window.open("https://blog.ordinaryroad.tech", "_blank");
            console.log("saturn");
        } else if (this.intersect_planet == 4) {
            window.open("https://barragefly.ordinaryroad.tech", "_blank");
            console.log("uranus");
        }
    }
}