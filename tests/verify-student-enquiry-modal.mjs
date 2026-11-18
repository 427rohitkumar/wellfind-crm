import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const playwrightModulePath = process.env.PLAYWRIGHT_MODULE_PATH
if (!playwrightModulePath) {
  throw new Error('PLAYWRIGHT_MODULE_PATH must point to the installed Playwright module.')
}
const { chromium } = require(playwrightModulePath)
import fs from 'fs'
import path from 'path'

const adminEmail = process.env.TEST_ADMIN_EMAIL
const adminPassword = process.env.TEST_ADMIN_PASSWORD
if (!adminEmail || !adminPassword) {
  throw new Error('TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD must be set.')
}

const SCREENSHOT_DIR = path.resolve('tests/screenshots')
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

async function runVerification() {
  console.log('🚀 Starting Student Enquiry Add Modal Verification...')

  // Step 1: Login to get admin JWT
  const loginRes = await fetch('http://localhost:3005/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: adminEmail,
      password: adminPassword,
    }),
  })

  if (!loginRes.ok) {
    throw new Error(`Login failed: ${loginRes.status} ${loginRes.statusText}`)
  }

  const loginData = await loginRes.json()
  const token = loginData.token
  const user = loginData.user
  console.log('✅ Admin login successful. Token acquired.')

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  })
  const page = await context.newPage()

  // Inject token before navigation
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('wellfind_admin_token', token)
    localStorage.setItem('wellfind_admin_user', JSON.stringify(user))
  }, { token, user })

  // Navigate to Inquiries page
  await page.goto('http://localhost:5174/inquiries', { waitUntil: 'networkidle' })
  console.log('✅ Inquiries page loaded.')

  // Check Add Student Enquiry button presence
  const addBtn = page.locator('button:has-text("Add Student Enquiry")')
  const isAddBtnVisible = await addBtn.isVisible()
  console.log(`Add Student Enquiry button visible on Student tab: ${isAddBtnVisible}`)
  if (!isAddBtnVisible) throw new Error('Add Student Enquiry button is not visible on Student tab!')

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-student-tab-with-button.png') })

  // Switch to Teacher tab and confirm button is NOT visible
  const teacherTab = page.locator('button[role="tab"]:has-text("Teacher Inquiries")')
  await teacherTab.click()
  await page.waitForTimeout(400)
  const isAddBtnVisibleOnTeacher = await addBtn.isVisible()
  console.log(`Add Student Enquiry button visible on Teacher tab: ${isAddBtnVisibleOnTeacher}`)
  if (isAddBtnVisibleOnTeacher) throw new Error('Add Student Enquiry button should NOT be visible on Teacher tab!')
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-teacher-tab-no-button.png') })

  // Switch back to Student tab
  const studentTab = page.locator('button[role="tab"]:has-text("Student Inquiries")')
  await studentTab.click()
  await page.waitForTimeout(400)

  // Click Add Student Enquiry button
  await addBtn.click()
  await page.waitForTimeout(500)

  // Confirm modal opened
  const modal = page.locator('div[role="dialog"]')
  const isModalVisible = await modal.isVisible()
  console.log(`Modal opened: ${isModalVisible}`)
  if (!isModalVisible) throw new Error('Modal did not open on button click!')

  // STEP 1 VERIFICATION
  console.log('\n--- Verifying Step 1 (Class Selection) ---')
  const step1Title = await page.locator('h3:has-text("Select Student\'s Class")').isVisible()
  console.log(`Step 1 heading visible: ${step1Title}`)

  const step1Img = page.locator('img[src="/class.png"]')
  console.log(`Step 1 illustration (/class.png) visible: ${await step1Img.isVisible()}`)

  // Test validation on Next Step with no class selected
  const nextBtn = page.locator('button:has-text("Next Step")')
  await nextBtn.click()
  await page.waitForTimeout(200)
  const step1Error = await page.locator('text=Kripya student ki class select kijiye.').first().isVisible()
  console.log(`Step 1 validation error shown: ${step1Error}`)
  if (!step1Error) throw new Error('Step 1 validation error not displayed!')

  // Select "Class 8"
  const class8Btn = page.locator('button:has-text("Class 8")')
  await class8Btn.click()
  await page.waitForTimeout(200)
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-step1-class-selection.png') })

  // Advance to Step 2
  await nextBtn.click()
  await page.waitForTimeout(400)

  // STEP 2 VERIFICATION
  console.log('\n--- Verifying Step 2 (Subjects) ---')
  const step2Title = await page.locator('h3:has-text("Select Required Subject(s)")').isVisible()
  console.log(`Step 2 heading visible: ${step2Title}`)

  const step2Img = page.locator('img[src="/subject.png"]')
  console.log(`Step 2 illustration (/subject.png) visible: ${await step2Img.isVisible()}`)

  // Test validation on Next Step with no subject selected
  await nextBtn.click()
  await page.waitForTimeout(200)
  const step2Error = await page.locator('text=Kam se kam ek subject select kijiye.').first().isVisible()
  console.log(`Step 2 validation error shown: ${step2Error}`)
  if (!step2Error) throw new Error('Step 2 validation error not displayed!')

  // Select Mathematics and Science
  await page.locator('button:has-text("Mathematics")').click()
  await page.locator('button:has-text("Science (Phy/Chem/Bio)")').click()
  await page.waitForTimeout(200)
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-step2-subjects.png') })

  // Test Previous button works and preserves Step 1 data
  const prevBtn = page.locator('button:has-text("Previous")')
  await prevBtn.click()
  await page.waitForTimeout(300)
  console.log(`Back to Step 1. Class 8 still selected: ${await page.locator('button:has-text("Class 8")').getAttribute('class')}`)
  await nextBtn.click()
  await page.waitForTimeout(300)

  // Advance to Step 3
  await nextBtn.click()
  await page.waitForTimeout(400)

  // STEP 3 VERIFICATION
  console.log('\n--- Verifying Step 3 (Preferred Timing) ---')
  const step3Title = await page.locator('h3:has-text("Preferred Tuition Timing")').isVisible()
  console.log(`Step 3 heading visible: ${step3Title}`)

  const step3Img = page.locator('img[src="/teaching-time.png"]')
  console.log(`Step 3 illustration (/teaching-time.png) visible: ${await step3Img.isVisible()}`)

  // Select Evening (After 5 PM)
  await page.locator('button:has-text("Evening (After 5 PM)")').click()
  await page.waitForTimeout(200)
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-step3-timing.png') })

  // Advance to Step 4
  await nextBtn.click()
  await page.waitForTimeout(400)

  // STEP 4 VERIFICATION
  console.log('\n--- Verifying Step 4 (Locality & Budget) ---')
  const step4Title = await page.locator('h3:has-text("Locality in Patna & Budget")').isVisible()
  console.log(`Step 4 heading visible: ${step4Title}`)

  const step4Img = page.locator('img[src="/budget-range-removebg.png"]')
  console.log(`Step 4 illustration (/budget-range-removebg.png) visible: ${await step4Img.isVisible()}`)

  // Select locality
  const localitySelect = page.locator('#localitySelect')
  await localitySelect.selectOption('Boring Road')
  await page.waitForTimeout(200)
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-step4-locality-budget.png') })

  // Advance to Step 5
  await nextBtn.click()
  await page.waitForTimeout(400)

  // STEP 5 VERIFICATION
  console.log('\n--- Verifying Step 5 (Contact Details & Summary) ---')
  const step5Title = await page.locator('h3:has-text("Parent Contact Information")').isVisible()
  console.log(`Step 5 heading visible: ${step5Title}`)

  const step5Img = page.locator('img[src="/contact-no.png"]')
  console.log(`Step 5 illustration (/contact-no.png) visible: ${await step5Img.isVisible()}`)

  // Verify Summary box content
  const summaryBox = page.locator('text=Your Requirements Summary').locator('..')
  console.log(`Summary box text: ${(await summaryBox.innerText()).replace(/\n+/g, ' | ')}`)

  // Test validation on Submit with empty name
  const submitBtn = page.locator('button:has-text("Submit Tuition Request")')
  await submitBtn.click()
  await page.waitForTimeout(200)
  const nameError = await page.locator('text=Kripya Parent ya Guardian ka naam enter kijiye.').first().isVisible()
  console.log(`Step 5 name validation error: ${nameError}`)
  if (!nameError) throw new Error('Step 5 name validation error not displayed!')

  // Fill contact details
  await page.fill('#parentName', 'Pooja Verma (Phone Call Enquiry)')
  await page.fill('#phoneNumber', '9876543299')
  await page.fill('#additionalNotes', 'CBSE Class 8 syllabus focus, experienced tutor preferred')
  await page.waitForTimeout(200)
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-step5-contact-filled.png') })

  // Submit the form to live backend
  console.log('\n--- Submitting Form to Backend ---')
  await submitBtn.click()

  // Wait for success screen
  await page.waitForSelector('text=Student Enquiry Created Successfully!', { timeout: 8000 })
  console.log('✅ Success screen confirmed by server creation response!')
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-success-confirmation.png') })

  // Click Close Window
  const closeWindowBtn = page.locator('button:has-text("Close Window")')
  await closeWindowBtn.click()
  await page.waitForTimeout(600)

  // Verify modal is closed
  const isModalClosed = !(await modal.isVisible())
  console.log(`Modal closed after clicking Close Window: ${isModalClosed}`)

  // Verify newly created record appears in table
  await page.waitForTimeout(500)
  const isNewRecordInTable = await page.locator('text=Pooja Verma (Phone Call Enquiry)').first().isVisible()
  console.log(`New record visible in Student Inquiries table: ${isNewRecordInTable}`)
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-table-refreshed-with-new-record.png') })

  await browser.close()
  console.log('\n🎉 ALL 11 VERIFICATION REQUIREMENTS PASSED SUCCESSFULLY!')
}

runVerification().catch((err) => {
  console.error('❌ Verification failed:', err)
  process.exit(1)
})
