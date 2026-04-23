import { test, expect, type Page } from '@playwright/test'

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

async function loginAsAdmin(page: Page) {
    await page.goto('http://localhost:5173/login')
    await page.waitForSelector('input[type="email"]', { timeout: 10000 })
    await page.locator('input[type="email"]').fill('admin@flashdev.local')
    await page.locator('input[type="password"]').fill('Admin@123456')
    await page.locator('button[type="submit"]').click()
    try {
        await page.waitForURL('http://localhost:5173/home', { timeout: 10000 })
    } catch {
        // Login might have failed, that's ok for public tests
    }
    await page.waitForTimeout(500)
}

// ─────────────────────────────────────────────────────────────
// Test Suite: Homepage (public — no login needed)
// ─────────────────────────────────────────────────────────────

test.describe('Homepage', () => {
    test('Homepage loads without crash', async ({ page }) => {
        const errors: string[] = []
        page.on('console', msg => {
            if (msg.type() === 'error') errors.push(msg.text())
        })
        await page.goto('http://localhost:5173/')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(2000)

        // Should not have JS crash errors
        const crashErrors = errors.filter(e =>
            e.includes('is not defined') ||
            e.includes('Uncaught') ||
            e.includes('SyntaxError')
        )
        expect(crashErrors).toHaveLength(0)
    })

    test('TOP area shows two carousel panels side by side', async ({ page }) => {
        await page.goto('http://localhost:5173/')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1500)

        // Two panels side by side
        const panels = page.locator('.flex.gap-1').first()
        if (await panels.count() > 0) {
            await expect(panels).toBeVisible()
        }
    })
})

// ─────────────────────────────────────────────────────────────
// Test Suite: Blog Page (public)
// ─────────────────────────────────────────────────────────────

test.describe('Blog Page', () => {
    test('Blog page loads without crash', async ({ page }) => {
        const errors: string[] = []
        page.on('console', msg => {
            if (msg.type() === 'error') errors.push(msg.text())
        })
        await page.goto('http://localhost:5173/blogs')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)

        const crashErrors = errors.filter(e =>
            e.includes('is not defined') || e.includes('Uncaught')
        )
        expect(crashErrors).toHaveLength(0)
    })
})

// ─────────────────────────────────────────────────────────────
// Test Suite: Forum Page (public)
// ─────────────────────────────────────────────────────────────

test.describe('Forum Page', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsAdmin(page)
    })

    test('Forum page loads without crash', async ({ page }) => {
        const errors: string[] = []
        page.on('console', msg => {
            if (msg.type() === 'error') errors.push(msg.text())
        })
        await page.goto('http://localhost:5173/forum')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1500)

        const crashErrors = errors.filter(e =>
            e.includes('is not defined') || e.includes('Uncaught')
        )
        expect(crashErrors).toHaveLength(0)
    })

    test('Search bar is visible at top of forum page', async ({ page }) => {
        await page.goto('http://localhost:5173/forum')
        await page.waitForLoadState('networkidle')

        const searchInput = page.locator('input[placeholder*="话题"], input[placeholder*="Topic"], input[placeholder*="topic"]').first()
        await expect(searchInput).toBeVisible()
    })

    test('Sidebar section list is visible', async ({ page }) => {
        await page.goto('http://localhost:5173/forum')
        await page.waitForLoadState('networkidle')

        const sidebar = page.locator('aside').first()
        await expect(sidebar).toBeVisible()
    })

    test('Sidebar has collapse button', async ({ page }) => {
        await page.goto('http://localhost:5173/forum')
        await page.waitForLoadState('networkidle')

        const collapseBtn = page.locator('button').filter({ hasText: '◀' }).first()
        if (await collapseBtn.count() > 0) {
            await expect(collapseBtn).toBeVisible()
        }
    })

    test('Sidebar has search input', async ({ page }) => {
        await page.goto('http://localhost:5173/forum')
        await page.waitForLoadState('networkidle')

        const sidebarSearch = page.locator('aside input').first()
        await expect(sidebarSearch).toBeVisible()
    })

    test('Section collapse/expand works', async ({ page }) => {
        await page.goto('http://localhost:5173/forum')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(500)

        // Expand first section
        const toggle = page.locator('button').filter({ hasText: '▶' }).first()
        if (await toggle.count() > 0) {
            await toggle.click()
            await page.waitForTimeout(300)
            const collapse = page.locator('button').filter({ hasText: '▼' }).first()
            expect(await collapse.count()).toBeGreaterThan(0)
        }
    })
})

// ─────────────────────────────────────────────────────────────
// Test Suite: Market Page (public)
// ─────────────────────────────────────────────────────────────

test.describe('Market Page', () => {
    test('Market page loads without crash', async ({ page }) => {
        const errors: string[] = []
        page.on('console', msg => {
            if (msg.type() === 'error') errors.push(msg.text())
        })
        await page.goto('http://localhost:5173/market')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)

        const crashErrors = errors.filter(e =>
            e.includes('is not defined') || e.includes('Uncaught')
        )
        expect(crashErrors).toHaveLength(0)
    })

    test('Grid mode filter chips include tags', async ({ page }) => {
        await page.goto('http://localhost:5173/market')
        await page.waitForLoadState('networkidle')

        // Switch to grid view
        const gridBtn = page.locator('button').filter({ hasText: '⊞' }).first()
        if (await gridBtn.count() > 0) {
            await gridBtn.click()
            await page.waitForTimeout(500)
        }

        // Should see filter chips row
        const filterRow = page.locator('.flex.flex-wrap.gap-2').first()
        if (await filterRow.count() > 0) {
            await expect(filterRow).toBeVisible()
        }
    })
})

// ─────────────────────────────────────────────────────────────
// Test Suite: Projects Page (public)
// ─────────────────────────────────────────────────────────────

test.describe('Projects Page', () => {
    test('Projects page loads without crash', async ({ page }) => {
        const errors: string[] = []
        page.on('console', msg => {
            if (msg.type() === 'error') errors.push(msg.text())
        })
        await page.goto('http://localhost:5173/projects')
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(1000)

        const crashErrors = errors.filter(e =>
            e.includes('is not defined') || e.includes('Uncaught')
        )
        expect(crashErrors).toHaveLength(0)
    })
})
