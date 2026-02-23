import mongoose from 'mongoose'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Project from '../models/Project.js'
import ProjectTaskInstance from '../models/ProjectTaskInstance.js'

dotenv.config()

async function testProgressAPI() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI
    await mongoose.connect(mongoUri)
    console.log('Connected to MongoDB')

    // Get the user and generate token
    const user = await User.findOne({ role: 'super_admin' })
    if (!user) {
      console.error('Super admin user not found')
      process.exit(1)
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' })
    console.log('\n=== JWT Token for API Testing ===')
    console.log(token)

    // Get test project
    const project = await Project.findOne({ title: 'Modern Living Room Renovation' })
    if (!project) {
      console.error('Test project not found. Run createTestProjectWithTasks.js first.')
      process.exit(1)
    }

    console.log('\n=== Project Details ===')
    console.log('Project ID:', project._id)
    console.log('Project Title:', project.title)
    console.log('Stored Completion:', project.completion?.completionPercentage + '%')

    // Calculate completion from tasks
    const overallCompletion = await ProjectTaskInstance.calculateProjectCompletion(project._id)
    const phaseCompletion = await ProjectTaskInstance.getPhaseCompletion(project._id)

    console.log('\n=== Calculated Completion ===')
    console.log('Overall Completion:', overallCompletion + '%')

    console.log('\n=== Phase-wise Completion ===')
    for (const phase of phaseCompletion) {
      console.log(`  ${phase.phaseName}: ${Math.round(phase.avgCompletion)}% (${phase.completedTasks}/${phase.totalTasks} tasks)`)
    }

    // Get all tasks for this project
    const tasks = await ProjectTaskInstance.find({ project: project._id }).sort({ order: 1 })
    console.log('\n=== Task Details ===')
    console.log('Total Tasks:', tasks.length)

    let currentPhase = ''
    for (const task of tasks) {
      if (task.phaseName !== currentPhase) {
        currentPhase = task.phaseName
        console.log(`\n[${task.phaseCode}] ${task.phaseName}`)
      }
      const statusIcon = task.status === 'completed' ? '✓' : task.status === 'in_progress' ? '→' : '○'
      console.log(`  ${statusIcon} ${task.taskName}: ${task.completionPercentage}%`)
    }

    console.log('\n=== API Test URLs ===')
    console.log(`GET http://localhost:5001/api/project-workflow/projects/${project._id}/completion`)
    console.log(`GET http://localhost:5001/api/project-workflow/projects/${project._id}/tasks`)
    console.log(`GET http://localhost:5001/api/project-workflow/projects/${project._id}/gantt`)

    console.log('\n=== Frontend URLs ===')
    console.log(`Project Detail: http://localhost:5173/admin/projects/${project._id}`)
    console.log(`Project Tasks: http://localhost:5173/admin/projects/${project._id}/tasks`)
    console.log(`Project Gantt: http://localhost:5173/admin/projects/${project._id}/gantt`)

    await mongoose.connection.close()
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    await mongoose.connection.close()
    process.exit(1)
  }
}

testProgressAPI()
