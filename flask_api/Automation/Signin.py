from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

# --- Configuration ---
URL = "https://qa.systemisers.in/"
EMAIL = "lalitha@gmail.com"
PASSWORD = "Testing@12345"

# --- Setup WebDriver ---
driver = webdriver.Chrome()   # Make sure you have ChromeDriver installed
driver.maximize_window()
driver.get(URL)

# --- Wait object ---
wait = WebDriverWait(driver, 10)

# 1. Click on Sign In button (navbar)
sign_in_nav_btn = wait.until(
    EC.element_to_be_clickable((By.XPATH, '//*[@id="navbarSupportedContent"]/button[2]'))
)
sign_in_nav_btn.click()

# 2. Enter email
email_input = wait.until(
    EC.visibility_of_element_located((By.XPATH, '//form/div[1]/input[@placeholder="Enter Your Email Address"]'))
)
email_input.clear()
email_input.send_keys(EMAIL)

# 3. Enter password
password_input = driver.find_element(By.XPATH, '//form/div[2]/input[@placeholder="Enter Your Password"]')
password_input.clear()
password_input.send_keys(PASSWORD)

# 4. Click Sign In button (inside popup)
sign_in_btn = driver.find_element(By.XPATH, '//form/button[text()="Sign In"]')
sign_in_btn.click()

# --- Optional: wait to see result ---
time.sleep(5)

# Close browser
driver.quit()
