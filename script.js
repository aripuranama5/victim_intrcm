class IntercomTester {
    constructor() {
        this.logs = [];
        this.isInitialized = false;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            message,
            type
        };
        
        this.logs.push(logEntry);
        this.updateLogDisplay();
        
        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    updateLogDisplay() {
        const logsContainer = document.getElementById('logs');
        const recentLogs = this.logs.slice(-20); // Show last 20 entries
        
        logsContainer.innerHTML = recentLogs.map(log => 
            `<div class="log-entry log-${log.type}">[${log.timestamp}] ${log.message}</div>`
        ).join('');
        
        logsContainer.scrollTop = logsContainer.scrollHeight;
    }

    loadIntercomScript(appId) {
        return new Promise((resolve, reject) => {
            // Remove existing script
            const existingScript = document.querySelector('script[src*="intercom.io"]');
            if (existingScript) {
                existingScript.remove();
            }

            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.async = true;
            script.src = `https://widget.intercom.io/widget/${appId}`;
            script.onload = () => {
                this.log(`Intercom script loaded for app: ${appId}`, 'success');
                resolve();
            };
            script.onerror = () => {
                this.log('Failed to load Intercom script', 'error');
                reject(new Error('Failed to load Intercom script'));
            };

            document.getElementById('intercomScriptContainer').appendChild(script);
        });
    }

    async initializeIntercom() {
        const appId = document.getElementById('appId').value;
        const userId = document.getElementById('userId').value;
        const userEmail = document.getElementById('userEmail').value;
        const userName = document.getElementById('userName').value;
        
        let customData = {};
        try {
            customData = JSON.parse(document.getElementById('customData').value);
        } catch (e) {
            this.log('Invalid JSON in custom data', 'error');
            return;
        }

        try {
            await this.loadIntercomScript(appId);
            
            // Wait a bit for the script to initialize
            await new Promise(resolve => setTimeout(resolve, 1000));

            window.Intercom('boot', {
                api_base: "https://api-iam.intercom.io",
                app_id: appId,
                user_id: userId,
                email: userEmail,
                name: userName,
                ...customData
            });

            this.isInitialized = true;
            this.log('Intercom initialized successfully', 'success');
            
        } catch (error) {
            this.log(`Failed to initialize Intercom: ${error.message}`, 'error');
        }
    }

    updateIntercom() {
        if (!this.isInitialized) {
            this.log('Intercom not initialized. Please initialize first.', 'warning');
            return;
        }

        const customData = document.getElementById('customData').value;
        let additionalData = {};
        
        try {
            additionalData = JSON.parse(customData);
        } catch (e) {
            this.log('Invalid JSON in custom data', 'error');
            return;
        }

        window.Intercom('update', additionalData);
        this.log('Intercom updated with new data', 'success');
    }

    shutdownIntercom() {
        if (window.Intercom) {
            window.Intercom('shutdown');
            this.isInitialized = false;
            this.log('Intercom shutdown', 'success');
        } else {
            this.log('Intercom not found', 'warning');
        }
    }

    testXSS(type) {
        const payloads = {
            basic: '<script>alert("XSS")</script>',
            img: '<img src=x onerror=alert("XSS")>',
            svg: '<svg onload=alert("XSS")>',
            script: '";alert("XSS");//',
            json: '{"test":"</script><script>alert(1)</script>"}'
        };

        const payload = payloads[type] || payloads.basic;
        document.getElementById('customPayload').value = payload;
        this.log(`Loaded ${type} XSS payload: ${payload}`, 'warning');
    }

    testCustomPayload() {
        const payload = document.getElementById('customPayload').value;
        
        // Test in user name
        document.getElementById('userName').value = payload;
        this.log(`Testing payload in user name: ${payload}`, 'warning');
        
        // Re-initialize with payload
        this.initializeIntercom();
    }

    async testEndpoints() {
        const appId = document.getElementById('appId').value;
        const endpoints = [
            `https://widget.intercom.io/widget/${appId}`,
            `https://api-iam.intercom.io/messenger/web/ping`,
            `https://api-iam.intercom.io/messenger/web/localization`
        ];

        const resultsContainer = document.getElementById('apiResults');
        resultsContainer.innerHTML = '<h3>Endpoint Test Results:</h3>';

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint, {
                    method: 'GET',
                    mode: 'no-cors'
                });
                
                resultsContainer.innerHTML += `
                    <div class="log-entry log-success">
                        ✅ ${endpoint} - Reachable
                    </div>
                `;
                this.log(`Endpoint ${endpoint} is reachable`, 'success');
            } catch (error) {
                resultsContainer.innerHTML += `
                    <div class="log-entry log-error">
                        ❌ ${endpoint} - Unreachable
                    </div>
                `;
                this.log(`Endpoint ${endpoint} is unreachable`, 'error');
            }
        }
    }
}

// Initialize tester
const tester = new IntercomTester();

// Global functions for buttons
function initializeIntercom() {
    tester.initializeIntercom();
}

function updateIntercom() {
    tester.updateIntercom();
}

function shutdownIntercom() {
    tester.shutdownIntercom();
}

function testXSS(type) {
    tester.testXSS(type);
}

function testCustomPayload() {
    tester.testCustomPayload();
}

function testEndpoints() {
    tester.testEndpoints();
}

// Add some initial logging
tester.log('Intercom Testing Platform Ready', 'success');
tester.log('Configure your App ID and test various payloads', 'info');
