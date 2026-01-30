// tests/e2e/auth-chat.spec.js
import { test, expect } from '@playwright/test';

test.describe('Authentication & Chat Flow', () => {

  test('should redirect to login when accessing chat without session', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Enter your details to join')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should register and verify chat UI', async ({ page }) => {
    // 1. Go to login
    await page.goto('/login');

    // 2. Switch to Register Tab
    await page.click('button:has-text("Register")');

    // 3. Fill details with unique email
    const uniqueId = Date.now();
    await page.fill('input[placeholder="cooluser123"]', `User${uniqueId}`);
    await page.fill('form:has-text("Username") input[type="email"]', `test${uniqueId}@example.com`);
    await page.fill('form:has-text("Username") input[type="password"]', 'password123');

    // 4. Click Sign Up
    await page.click('button:has-text("Sign Up")');

    // 5. Wait for potential navigation or success message
    // If auto-login happens, sidebar should appear.
    // If email confirmation needed, we might see a success message.
    
    // We try to wait for Sidebar OR success message
    const sidebar = page.locator('aside');
    const successMsg = page.locator('text=Account created!');
    
    await expect(sidebar.or(successMsg)).toBeVisible({ timeout: 20000 });
    
    if (await sidebar.isVisible()) {
        console.log("Logged in automatically");
        await expect(page.locator('textarea[placeholder*="Type a message"]')).toBeVisible();
    } else {
        console.log("Registration required confirmation");
    }
  });

});
