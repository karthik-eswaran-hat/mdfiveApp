#!/usr/bin/env python3
"""
Standalone Flask server for automation functionality
This server only handles the automation sign-in endpoint without database dependencies
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import threading
import time
import os

app = Flask(__name__)
CORS(app)

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'success',
        'message': 'Automation Flask API is running',
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
    }), 200

@app.route('/api/automation/signin', methods=['POST'])
def automation_signin():
    """Execute Selenium sign-in automation"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'No JSON data received'
            }), 400

        email = data.get('email')
        password = data.get('password')
        url = data.get('url', 'https://qa.systemisers.in/')

        if not email or not password:
            return jsonify({
                'success': False,
                'message': 'Email and password are required'
            }), 400

        print(f"Received sign-in request for: {email}")

        # Run the Selenium script in a separate thread
        def run_selenium_script():
            try:
                # Create a temporary script with the provided credentials
                temp_script_content = f'''from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

# --- Configuration ---
URL = "{url}"
EMAIL = "{email}"
PASSWORD = "{password}"

print(f"Starting automation for {{EMAIL}}")

# --- Setup WebDriver ---
try:
    driver = webdriver.Chrome()
    driver.maximize_window()
    driver.get(URL)
    print("Browser opened and navigated to URL")

    # --- Wait object ---
    wait = WebDriverWait(driver, 10)

    # 1. Click on Sign In button (navbar)
    sign_in_nav_btn = wait.until(
        EC.element_to_be_clickable((By.XPATH, '//*[@id="navbarSupportedContent"]/button[2]'))
    )
    sign_in_nav_btn.click()
    print("Clicked sign-in button")

    # 2. Enter email
    email_input = wait.until(
        EC.visibility_of_element_located((By.XPATH, '//form/div[1]/input[@placeholder="Enter Your Email Address"]'))
    )
    email_input.clear()
    email_input.send_keys(EMAIL)
    print("Entered email")

    # 3. Enter password
    password_input = driver.find_element(By.XPATH, '//form/div[2]/input[@placeholder="Enter Your Password"]')
    password_input.clear()
    password_input.send_keys(PASSWORD)
    print("Entered password")

    # 4. Click Sign In button (inside popup)
    sign_in_btn = driver.find_element(By.XPATH, '//form/button[text()="Sign In"]')
    sign_in_btn.click()
    print("Clicked submit button")

    # --- Wait to see result ---
    time.sleep(5)
    
    # Check if sign-in was successful by looking for a success indicator
    try:
        # Look for elements that indicate successful login
        success_indicators = [
            '//a[contains(text(), "Logout")]',
            '//a[contains(text(), "Dashboard")]',
            '//div[contains(@class, "user-menu")]',
            '//span[contains(text(), "Welcome")]'
        ]
        
        signin_successful = False
        for indicator in success_indicators:
            try:
                element = driver.find_element(By.XPATH, indicator)
                if element:
                    signin_successful = True
                    print(f"Found success indicator: {{indicator}}")
                    break
            except:
                continue
        
        if signin_successful:
            print("✅ Sign-in successful!")
        else:
            print("⚠️ Sign-in may have failed - no success indicators found")
            
    except Exception as e:
        print(f"Error checking sign-in status: {{e}}")

except Exception as e:
    print(f"❌ Error during sign-in process: {{e}}")

finally:
    # Close browser
    try:
        driver.quit()
        print("Browser closed")
    except:
        pass
'''
                    
                    # Write temporary script
                    temp_script_path = f'/tmp/signin_{int(time.time())}.py'
                    with open(temp_script_path, 'w') as f:
                        f.write(temp_script_content)
                    
                    print(f"Created temporary script: {temp_script_path}")
                    
                    # Execute the script
                    result = subprocess.run(['python3', temp_script_path], 
                                          capture_output=True, text=True, timeout=60)
                    
                    print(f"Script execution result: {result.returncode}")
                    print(f"Script stdout: {result.stdout}")
                    print(f"Script stderr: {result.stderr}")
                    
                    # Clean up temporary script
                    try:
                        os.remove(temp_script_path)
                    except:
                        pass
                    
                    return result.returncode == 0, result.stdout, result.stderr
                    
                except subprocess.TimeoutExpired:
                    return False, "", "Script execution timed out"
                except Exception as e:
                    return False, "", str(e)

            # Run the automation in a separate thread
            result_queue = []
            
            def automation_worker():
                success, stdout, stderr = run_selenium_script()
                result_queue.append({
                    'success': success,
                    'stdout': stdout,
                    'stderr': stderr
                })

            thread = threading.Thread(target=automation_worker)
            thread.daemon = True
            thread.start()
            thread.join(timeout=70)  # Wait up to 70 seconds

            if thread.is_alive():
                return jsonify({
                    'success': False,
                    'message': 'Automation timed out. Please check if ChromeDriver is installed and accessible.'
                }), 408

            if not result_queue:
                return jsonify({
                    'success': False,
                    'message': 'Automation execution failed to complete'
                }), 500

            result = result_queue[0]
            
            if result['success']:
                return jsonify({
                    'success': True,
                    'message': 'Sign-in automation completed successfully',
                    'output': result['stdout']
                }), 200
            else:
                return jsonify({
                    'success': False,
                    'message': 'Sign-in automation failed',
                    'error': result['stderr'] or 'Unknown error occurred'
                }), 500

        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Error executing automation: {str(e)}'
            }), 500

if __name__ == '__main__':
    print("Starting Automation Flask Server...")
    print("Server will be available at: http://localhost:5000")
    print("API endpoints:")
    print("  GET  /api/health - Health check")
    print("  POST /api/automation/signin - Execute sign-in automation")
    app.run(debug=True, host='0.0.0.0', port=5000)
