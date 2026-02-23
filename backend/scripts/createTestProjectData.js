import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Company from '../models/Company.js'
import Customer from '../models/Customer.js'
import User from '../models/User.js'
import Project from '../models/Project.js'
import ProjectPhase from '../models/ProjectPhase.js'
import ProjectActivity from '../models/ProjectActivity.js'
import ProjectTask from '../models/ProjectTask.js'
import ProjectTaskInstance from '../models/ProjectTaskInstance.js'

dotenv.config()

const testProjects = [
  {
    title: 'Luxury Penthouse Interior',
    description: 'Complete interior design for a 4BHK penthouse with modern aesthetics',
    category: 'interior',
    subCategory: 'residential',
    stage: 'production',
    status: 'active',
    priority: 'urgent',
    area: 2500,
    quotedAmount: 4500000,
    agreedAmount: 4200000,
    totalPaid: 2100000,
    completionTarget: 65 // Target completion percentage
  },
  {
    title: 'Corporate Office Renovation',
    description: 'Modern office space renovation for IT company with 50 workstations',
    category: 'interior',
    subCategory: 'commercial',
    stage: 'design',
    status: 'active',
    priority: 'high',
    area: 5000,
    quotedAmount: 8000000,
    agreedAmount: 7500000,
    totalPaid: 1500000,
    completionTarget: 25
  },
  {
    title: 'Boutique Hotel Lobby',
    description: 'Luxury lobby design for a boutique heritage hotel',
    category: 'interior',
    subCategory: 'hospitality',
    stage: 'installation',
    status: 'active',
    priority: 'high',
    area: 1200,
    quotedAmount: 3500000,
    agreedAmount: 3200000,
    totalPaid: 2560000,
    completionTarget: 85
  },
  {
    title: 'Startup Co-working Space',
    description: 'Vibrant co-working space with 30 hot desks and 5 private cabins',
    category: 'interior',
    subCategory: 'commercial',
    stage: 'handover',
    status: 'active',
    priority: 'medium',
    area: 3000,
    quotedAmount: 2500000,
    agreedAmount: 2300000,
    totalPaid: 2185000,
    completionTarget: 95
  },
  {
    title: 'Farmhouse Weekend Retreat',
    description: 'Rustic farmhouse interior with modern amenities',
    category: 'interior',
    subCategory: 'residential',
    stage: 'design',
    status: 'active',
    priority: 'low',
    area: 4000,
    quotedAmount: 6000000,
    agreedAmount: 5500000,
    totalPaid: 550000,
    completionTarget: 15
  }
]

async function createTestProjectData() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI
    await mongoose.connect(mongoUri)
    console.log('Connected to MongoDB')

    // Get company
    const company = await Company.findOne({ code: 'IP' }) || await Company.findOne({ isActive: true })
    if (!company) {
      console.error('No company found')
      process.exit(1)
    }
    console.log('Using company:', company.name)

    // Get or create test customers
    const customers = []
    const customerNames = [
      { name: 'Rajesh Sharma', email: 'rajesh.sharma@example.com', phone: '+91-9876543001' },
      { name: 'Priya Technologies Pvt Ltd', email: 'contact@priyatech.com', phone: '+91-9876543002' },
      { name: 'Heritage Hotels Group', email: 'projects@heritagehotels.com', phone: '+91-9876543003' },
      { name: 'InnoSpace Ventures', email: 'hello@innospace.co', phone: '+91-9876543004' },
      { name: 'Mehta Family Trust', email: 'trust@mehtafamily.com', phone: '+91-9876543005' }
    ]

    for (let i = 0; i < customerNames.length; i++) {
      let customer = await Customer.findOne({ email: customerNames[i].email })
      if (!customer) {
        customer = await Customer.create({
          company: company._id,
          customerId: `${company.code}-C-2026-${String(i + 10).padStart(5, '0')}`,
          name: customerNames[i].name,
          type: i === 0 || i === 4 ? 'individual' : 'business',
          email: customerNames[i].email,
          phone: customerNames[i].phone,
          segment: i < 2 ? 'platinum' : i < 4 ? 'gold' : 'silver',
          status: 'active'
        })
        console.log('Created customer:', customer.name)
      }
      customers.push(customer)
    }

    // Get user for project manager
    const user = await User.findOne({ role: 'super_admin' }) || await User.findOne({ isActive: true })
    if (!user) {
      console.error('No user found')
      process.exit(1)
    }

    // Get phase templates
    const phases = await ProjectPhase.find({ company: company._id, isTemplate: true }).sort({ order: 1 })
    if (phases.length === 0) {
      console.error('No phase templates found. Run createTestProjectWithTasks.js first.')
      process.exit(1)
    }

    console.log('\n=== Creating Test Projects ===')

    for (let i = 0; i < testProjects.length; i++) {
      const projectData = testProjects[i]
      const customer = customers[i]

      // Check if project exists
      let project = await Project.findOne({ title: projectData.title, company: company._id })

      if (!project) {
        project = await Project.create({
          company: company._id,
          customer: customer._id,
          projectId: await company.generateId('project'),
          title: projectData.title,
          description: projectData.description,
          category: projectData.category,
          subCategory: projectData.subCategory,
          stage: projectData.stage,
          status: projectData.status,
          priority: projectData.priority,
          location: {
            type: 'site',
            address: `${100 + i * 10} Test Street`,
            city: ['Mumbai', 'Bangalore', 'Delhi', 'Pune', 'Hyderabad'][i],
            state: ['Maharashtra', 'Karnataka', 'Delhi', 'Maharashtra', 'Telangana'][i],
            pincode: `${400000 + i * 1000}`
          },
          specifications: {
            area: { value: projectData.area, unit: 'sqft' },
            rooms: Math.floor(projectData.area / 500),
            propertyType: projectData.subCategory === 'residential' ? 'apartment' : 'commercial',
            style: ['Modern Minimalist', 'Contemporary', 'Heritage Fusion', 'Industrial Chic', 'Rustic Modern'][i]
          },
          timeline: {
            estimatedStartDate: new Date(Date.now() - (90 - i * 15) * 24 * 60 * 60 * 1000),
            estimatedEndDate: new Date(Date.now() + (90 + i * 30) * 24 * 60 * 60 * 1000),
            estimatedDuration: { value: 12 + i * 2, unit: 'weeks' }
          },
          financials: {
            quotedAmount: projectData.quotedAmount,
            agreedAmount: projectData.agreedAmount,
            finalAmount: projectData.agreedAmount,
            totalPaid: projectData.totalPaid,
            pendingAmount: projectData.agreedAmount - projectData.totalPaid
          },
          projectManager: user._id,
          completion: {
            completionPercentage: 0
          },
          createdBy: user._id
        })
        console.log(`\nCreated project: ${project.title} (${project.projectId})`)
      } else {
        console.log(`\nUsing existing project: ${project.title}`)
      }

      // Delete existing task instances
      await ProjectTaskInstance.deleteMany({ project: project._id })

      // Create task instances with varying completion based on target
      let taskOrder = 0
      const targetCompletion = projectData.completionTarget

      for (const phase of phases) {
        const activities = await ProjectActivity.find({ phase: phase._id, isTemplate: true }).sort({ order: 1 })

        for (const activity of activities) {
          const tasks = await ProjectTask.find({ activity: activity._id, isTemplate: true }).sort({ order: 1 })

          for (const task of tasks) {
            taskOrder++

            // Calculate completion based on task order and target
            const taskProgress = (taskOrder / 21) * 100 // Assuming 21 tasks total
            let completionPercentage = 0
            let status = 'not_started'

            if (taskProgress <= targetCompletion - 10) {
              completionPercentage = 100
              status = 'completed'
            } else if (taskProgress <= targetCompletion) {
              completionPercentage = Math.floor(Math.random() * 40) + 50 // 50-90%
              status = 'in_progress'
            } else if (taskProgress <= targetCompletion + 15) {
              completionPercentage = Math.floor(Math.random() * 30) // 0-30%
              status = completionPercentage > 0 ? 'in_progress' : 'not_started'
            }

            // Calculate estimated and actual costs
            const baseMaterialCost = (projectData.agreedAmount * 0.4) / 21 // 40% is materials
            const baseLaborCost = (projectData.agreedAmount * 0.25) / 21 // 25% is labor

            const estimatedMaterials = Math.floor(baseMaterialCost * (0.8 + Math.random() * 0.4))
            const estimatedLabor = Math.floor(baseLaborCost * (0.8 + Math.random() * 0.4))

            // Actual costs only for completed or in-progress tasks
            let actualMaterials = 0
            let actualLabor = 0
            if (status === 'completed' || status === 'in_progress') {
              const varianceFactor = 0.85 + Math.random() * 0.3 // -15% to +15% variance
              actualMaterials = Math.floor(estimatedMaterials * varianceFactor * (completionPercentage / 100))
              actualLabor = Math.floor(estimatedLabor * varianceFactor * (completionPercentage / 100))
            }

            await ProjectTaskInstance.create({
              company: company._id,
              project: project._id,
              customer: customer._id,
              phaseTemplate: phase._id,
              activityTemplate: activity._id,
              taskTemplate: task._id,
              entityType: 'interior_plus',
              phaseName: phase.name,
              phaseCode: phase.code,
              activityName: activity.name,
              activityCode: activity.code,
              taskName: task.name,
              taskCode: task.code,
              projectOwner: user._id,
              projectOwnerName: user.name,
              plannedStartDate: new Date(Date.now() - (60 - taskOrder * 3) * 24 * 60 * 60 * 1000),
              plannedEndDate: new Date(Date.now() + (taskOrder * 5) * 24 * 60 * 60 * 1000),
              actualStartDate: status !== 'not_started' ? new Date(Date.now() - (55 - taskOrder * 3) * 24 * 60 * 60 * 1000) : null,
              actualEndDate: status === 'completed' ? new Date(Date.now() - (taskOrder * 2) * 24 * 60 * 60 * 1000) : null,
              status,
              completionPercentage,
              weightage: task.defaultWeightage || 5,
              order: taskOrder,
              estimatedCost: {
                materials: estimatedMaterials,
                labor: estimatedLabor,
                total: estimatedMaterials + estimatedLabor
              },
              actualCost: {
                materials: actualMaterials,
                labor: actualLabor,
                total: actualMaterials + actualLabor
              }
            })
          }
        }
      }

      // Calculate and update project completion
      const overallCompletion = await ProjectTaskInstance.calculateProjectCompletion(project._id)
      const phaseCompletion = await ProjectTaskInstance.getPhaseCompletion(project._id)

      project.completion.completionPercentage = overallCompletion
      await project.save()

      console.log(`  Tasks created: 21`)
      console.log(`  Overall Completion: ${overallCompletion}%`)
      console.log(`  Budget: ${(projectData.agreedAmount / 100000).toFixed(1)}L | Paid: ${(projectData.totalPaid / 100000).toFixed(1)}L`)
      console.log(`  Phase-wise:`)
      for (const phase of phaseCompletion) {
        console.log(`    ${phase.phaseName}: ${Math.round(phase.avgCompletion)}%`)
      }
    }

    console.log('\n=== SUMMARY ===')
    console.log(`Created ${testProjects.length} test projects with tasks and budget data`)
    console.log('\nProject URLs:')
    const allProjects = await Project.find({ company: company._id, title: { $in: testProjects.map(p => p.title) } })
    for (const proj of allProjects) {
      console.log(`  ${proj.title}: http://localhost:5173/admin/projects/${proj._id}`)
    }

    await mongoose.connection.close()
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    await mongoose.connection.close()
    process.exit(1)
  }
}

createTestProjectData()
