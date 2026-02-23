import dbHandler from './db-handler.js'

// Connect to a new in-memory database before running any tests
beforeAll(async () => {
  await dbHandler.connect()
}, 30000)

// Clear all test data after every test
afterEach(async () => {
  await dbHandler.clearDatabase()
})

// Remove and close the db and server after all tests
afterAll(async () => {
  await dbHandler.closeDatabase()
})

// Suppress console logs during tests unless DEBUG is set
if (!process.env.DEBUG) {
  global.console = {
    ...console,
    log: () => {},
    debug: () => {},
    info: () => {},
    warn: () => {}
  }
}
