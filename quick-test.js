/**
 * Simple API Test - Check basic endpoints
 */

const http = require('http');

function makeRequest(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 4000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 5000,
        };

        if (token) {
            options.headers.Authorization = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Timeout'));
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function quickTest() {
    console.log('🧪 Quick API Test\n');

    try {
        // Test 1: Server is running
        console.log('1️⃣ Testing server connectivity...');
        const rootRes = await makeRequest('GET', '/');
        console.log(`   Status: ${rootRes.status}`);
        console.log(`   Message: ${rootRes.data.message}\n`);

        // Test 2: Admin login
        console.log('2️⃣ Testing admin login...');
        const loginRes = await makeRequest('POST', '/api/auth/login', {
            username: 'admin',
            password: 'admin123',
        });
        console.log(`   Status: ${loginRes.status}`);

        if (loginRes.status === 200) {
            console.log(`   ✅ Login successful`);
            console.log(`   Token: ${loginRes.data.token.substring(0, 20)}...`);
            console.log(`   User: ${loginRes.data.user.email}\n`);

            const token = loginRes.data.token;

            // Test 3: Get profile with token
            console.log('3️⃣ Testing GET /api/auth/me with token...');
            const profileRes = await makeRequest('GET', '/api/auth/me', null, token);
            console.log(`   Status: ${profileRes.status}`);
            if (profileRes.status === 200) {
                console.log(`   ✅ Profile retrieved`);
                console.log(`   User: ${profileRes.data.user.full_name}\n`);
            } else {
                console.log(`   ❌ Failed: ${JSON.stringify(profileRes.data)}\n`);
            }

            // Test 4: Get users (admin)
            console.log('4️⃣ Testing GET /api/users (admin only)...');
            const usersRes = await makeRequest('GET', '/api/users?page=1&limit=5', null, token);
            console.log(`   Status: ${usersRes.status}`);
            if (usersRes.status === 200) {
                console.log(`   ✅ Users list retrieved`);
                console.log(`   Count: ${usersRes.data.data.length}\n`);
            } else {
                console.log(`   ❌ Failed: ${JSON.stringify(usersRes.data).substring(0, 100)}\n`);
            }

            // Test 5: Get dashboard
            console.log('5️⃣ Testing GET /api/statistics/dashboard...');
            const dashRes = await makeRequest('GET', '/api/statistics/dashboard', null, token);
            console.log(`   Status: ${dashRes.status}`);
            if (dashRes.status === 200) {
                console.log(`   ✅ Dashboard retrieved`);
                console.log(`   Total users: ${dashRes.data.data.summary.totalUsers}\n`);
            } else {
                console.log(`   ❌ Failed: ${JSON.stringify(dashRes.data).substring(0, 100)}\n`);
            }

            // Test 6: Create appointment
            console.log('6️⃣ Testing POST /api/appointments (register customer first)...');

            // Register a customer
            const regRes = await makeRequest('POST', '/api/auth/register', {
                username: `test_${Date.now()}`,
                email: `test_${Date.now()}@test.com`,
                password: 'test123',
                full_name: 'Test User',
            });

            if (regRes.status === 201) {
                const custToken = regRes.data.token;
                const custId = regRes.data.user.id;

                console.log(`   ✅ Customer registered`);

                // Create a pet first
                const petRes = await makeRequest('POST', '/api/pets', {
                    name: 'Test Pet',
                    species: 'Dog',
                    owner_id: custId,
                }, custToken);

                if (petRes.status === 201) {
                    const petId = petRes.data.data.id;
                    console.log(`   ✅ Pet created`);

                    // Now create appointment
                    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
                    const apptRes = await makeRequest('POST', '/api/appointments', {
                        pet_id: petId,
                        appointment_date: futureDate,
                        priority_level: 'NORMAL',
                        reason: 'Test',
                    }, custToken);

                    console.log(`   Status: ${apptRes.status}`);
                    if (apptRes.status === 201) {
                        console.log(`   ✅ Appointment created\n`);
                    } else {
                        console.log(`   ❌ Failed: ${JSON.stringify(apptRes.data).substring(0, 100)}\n`);
                    }
                }
            }

        } else {
            console.log(`   ❌ Login failed: ${JSON.stringify(loginRes.data)}\n`);
        }

        console.log('✅ Quick test complete!\n');
    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    process.exit(0);
}

quickTest();
