/**
 * Playwright Global Teardown
 * Runs once after all tests
 */

export default async function globalTeardown() {
  console.log('Tearing down E2E test environment...')

  // Stop MongoDB Memory Server if it exists
  if (global.__MONGO_SERVER__) {
    await global.__MONGO_SERVER__.stop()
  }

  console.log('E2E test environment cleaned up')
}
