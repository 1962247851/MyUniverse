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
        this.gyroPermissionGranted = false  // 标记陀螺仪权限是否已授予
        this.isMobile = this.detectMobile()  // 检测是否为移动设备
        
        // 初始化画面偏移变量，避免相机位置计算为 NaN
        window.parallaxX = 0
        window.parallaxY = 0
        
        this.setInstance()  // Setup mouse
    }

    // 检测是否为移动设备
    detectMobile() {
        const u = navigator.userAgent;
        const isAndroid = u.indexOf('Android') > -1 || u.indexOf('Adr') > -1;
        const isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(u);
        return isAndroid || isiOS || isMobile;
    }

    // Generate mouse
    setInstance()
    {
        this.mouse = new THREE.Vector2();
        
        // 桌面端：监听鼠标移动
        if (!this.isMobile) {
            window.addEventListener("mousemove", (event) => {
                this.handleMouseMove(event.clientX, event.clientY);
            });
        }
        
        // 移动端：触摸事件用于点击检测和射线检测，但不用于画面偏移
        if (this.isMobile) {
            window.addEventListener("touchstart", (event) => {
                if (event.touches.length === 1) {
                    const touch = event.touches[0];
                    // 更新鼠标位置用于射线检测，但不设置画面偏移
                    this.handleMouseMove(touch.clientX, touch.clientY);
                }
            });
            window.addEventListener("touchmove", (event) => {
                if (event.touches.length === 1) {
                    // 只有在陀螺仪权限已授予时才延时禁用
                    if (this.gyroPermissionGranted) {
                        this.enableGyroscopeDelayed(1000);
                    }
                    const touch = event.touches[0];
                    // 更新鼠标位置用于射线检测，但不设置画面偏移
                    this.handleMouseMove(touch.clientX, touch.clientY);
                }
            });
        } else {
            // 桌面端：触摸事件（如触摸屏）也支持位置偏移
            window.addEventListener("touchstart", (event) => {
                if (event.touches.length === 1) {
                    const touch = event.touches[0];
                    this.handleMouseMove(touch.clientX, touch.clientY);
                }
            });
            window.addEventListener("touchmove", (event) => {
                if (event.touches.length === 1) {
                    const touch = event.touches[0];
                    this.handleMouseMove(touch.clientX, touch.clientY);
                }
            });
        }

        const u = navigator.userAgent;
        const isAndroid = u.indexOf('Android') > -1 || u.indexOf('Adr') > -1; // android terminal
        const isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); // ios terminal

        // Determine if it is iOS or Android
        if (isiOS) {
            // 先检查 DeviceOrientationEvent 是否存在
            if (window.DeviceOrientationEvent && typeof window.DeviceOrientationEvent.requestPermission === 'function') {
                // iOS 13+ 需要请求权限
                window.DeviceOrientationEvent.requestPermission().then(state => {
                    if (state === "granted") {
                        this.gyroPermissionGranted = true;
                        this.monitor();
                    } else {
                        // 权限被拒绝，不启用陀螺仪
                        this.gyroPermissionGranted = false;
                        console.log('陀螺仪权限被拒绝，将使用触摸控制');
                    }
                }).catch(error => {
                    // 请求权限失败
                    this.gyroPermissionGranted = false;
                    console.log('陀螺仪权限请求失败:', error);
                });
            } else if (window.DeviceOrientationEvent) {
                // iOS 13 以下版本或支持但不需要权限，直接启用
                this.gyroPermissionGranted = true;
                this.monitor();
            } else {
                // 不支持 DeviceOrientationEvent
                this.gyroPermissionGranted = false;
                console.log('设备不支持陀螺仪 API');
            }
        } else if (isAndroid) {
            // Android 上尝试启用，但需要检查是否真正可用
            this.monitor();
        } else {
            // 其他平台，尝试启用
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
        if (window.DeviceOrientationEvent) {
            // 检查设备是否真正支持陀螺仪
            let orientationListener = null;
            let hasReceivedEvent = false;
            
            // 设置一个测试监听器，检查是否能接收到事件
            const testListener = (event) => {
                if (event.alpha !== null && event.beta !== null && event.gamma !== null) {
                    hasReceivedEvent = true;
                    // 移除测试监听器
                    window.removeEventListener('deviceorientation', testListener, true);
                    
                    // 添加真正的监听器
                    orientationListener = (event) => {
                        if (this.gyroEnabled && this.gyroPermissionGranted) {
                            this.handleDeviceOrientation(event.alpha, event.beta, event.gamma);
                        }
                    };
                    window.addEventListener('deviceorientation', orientationListener, true);
                    this.gyroPermissionGranted = true;
                }
            };
            
            // 添加测试监听器，等待一段时间检查是否收到事件
            window.addEventListener('deviceorientation', testListener, true);
            
            // 如果 2 秒内没有收到事件，认为设备不支持或权限未授予
            setTimeout(() => {
                if (!hasReceivedEvent) {
                    window.removeEventListener('deviceorientation', testListener, true);
                    this.gyroPermissionGranted = false;
                    console.log('设备不支持陀螺仪或权限未授予');
                }
            }, 2000);
        } else {
            this.gyroPermissionGranted = false;
            console.log('设备不支持陀螺仪 API');
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
        // 移动端禁用鼠标位置偏移功能，但需要更新鼠标位置用于射线检测
        if (this.isMobile) {
            // 移动端：只更新鼠标位置用于射线检测，不设置画面偏移
            const wasStartFalse = window.start === false;
            window.start = true;
            this.mouse.x = (clientX / this.sizes.width) - 0.5;
            this.mouse.y = (clientY / this.sizes.height) - 0.5;
            // 移动端不根据触摸位置设置画面偏移，保持为 0 或使用陀螺仪的值
            // 如果是第一次启动（从 false 变为 true），强制设置为 0，避免画面跳变
            // 即使陀螺仪已授予权限，第一次触摸时也要重置为 0，确保平滑过渡
            if (wasStartFalse) {
                window.parallaxX = 0;
                window.parallaxY = 0;
            } else if (!this.gyroPermissionGranted) {
                // 如果陀螺仪未启用，也设置为 0
                window.parallaxX = 0;
                window.parallaxY = 0;
            }
            return;
        }
        
        // 桌面端：更新鼠标位置并设置画面偏移
        window.start = true;
        this.mouse.x = (clientX / this.sizes.width) - 0.5;
        this.mouse.y = (clientY / this.sizes.height) - 0.5;
        window.parallaxX = this.mouse.x * 0.5;
        window.parallaxY = -this.mouse.y * 0.5;
    }

    handleClick() {
        // 只有在陀螺仪权限已授予时才延时禁用，避免点击时画面闪动
        if (this.gyroPermissionGranted) {
            this.enableGyroscopeDelayed(1000);
        }

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