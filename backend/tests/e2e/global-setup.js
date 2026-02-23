/**
 * Playwright Global Setup
 * Runs once before all tests
 */

import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'

let mongoServer

export default async function globalSetup() {
  console.log('Setting up E2E test environment...')

  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create()
  const uri = mongoServer.getUri()

  // Store the URI for tests to use
  process.env.MONGODB_URI_TEST = uri
  process.env.TEST_MONGO_SERVER_ID = mongoServer.instanceInfo.port.toString()

  // Store the MongoDB server instance globally for teardown
  global.__MONGO_SERVER__ = mongoServer

  console.log('E2E test environment ready')
}
