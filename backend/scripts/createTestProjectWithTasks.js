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

async function createTestProjectWithTasks() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI
    await mongoose.connect(mongoUri)
    console.log('Connected to MongoDB')

    // Get the company
    const company = await Company.findOne({ code: 'IP' })
    if (!company) {
      console.error('Company not found. Please create a company first.')
      process.exit(1)
    }
    console.log('Using company:', company.name)

    // Get or create a test customer
    let customer = await Customer.findOne({ company: company._id })
    if (!customer) {
      customer = await Customer.create({
        company: company._id,
        customerId: 'IP-C-2025-00001',
        name: 'Test Customer',
        type: 'individual',
        email: 'testcustomer@example.com',
        phone: '+91-9876543210',
        segment: 'gold',
        status: 'active'
      })
      console.log('Created test customer:', customer.name)
    } else {
      console.log('Using existing customer:', customer.name)
    }

    // Get super admin user
    const user = await User.findOne({ role: 'super_admin' })
    if (!user) {
      console.error('Super admin user not found')
      process.exit(1)
    }

    // Check if test project already exists
    let project = await Project.findOne({ title: 'Modern Living Room Renovation', company: company._id })

    if (!project) {
      // Create test project
      project = await Project.create({
        company: company._id,
        customer: customer._id,
        projectId: await company.generateId('project'),
        title: 'Modern Living Room Renovation',
        description: 'Complete renovation of living room with modern interior design',
        category: 'interior',
        subCategory: 'residential',
        stage: 'design',
        status: 'active',
        priority: 'high',
        location: {
          type: 'site',
          address: '123 Test Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        },
        specifications: {
          area: { value: 500, unit: 'sqft' },
          rooms: 1,
          propertyType: 'apartment',
          style: 'Modern Minimalist'
        },
        timeline: {
          estimatedStartDate: new Date(),
          estimatedEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
          estimatedDuration: { value: 12, unit: 'weeks' }
        },
        financials: {
          quotedAmount: 1500000,
          agreedAmount: 1400000,
          finalAmount: 1400000,
          totalPaid: 420000,
          pendingAmount: 980000
        },
        milestones: [
          { name: 'Design Approval', status: 'completed', completionPercentage: 100, order: 1 },
          { name: 'Material Procurement', status: 'in_progress', completionPercentage: 40, order: 2 },
          { name: 'Production', status: 'pending', completionPercentage: 0, order: 3 },
          { name: 'Installation', status: 'pending', completionPercentage: 0, order: 4 },
          { name: 'Final Handover', status: 'pending', completionPercentage: 0, order: 5 }
        ],
        projectManager: user._id,
        completion: {
          completionPercentage: 25
        },
        createdBy: user._id
      })
      console.log('Created test project:', project.title, '(', project.projectId, ')')
    } else {
      console.log('Using existing project:', project.title)
    }

    // Delete existing task instances for this project
    await ProjectTaskInstance.deleteMany({ project: project._id })
    console.log('Cleared existing task instances')

    // Check for existing templates, create if not exist
    let phases = await ProjectPhase.find({ company: company._id, isTemplate: true })

    if (phases.length === 0) {
      console.log('Creating project phase templates...')

      // Create Design Phase
      const designPhase = await ProjectPhase.create({
        company: company._id,
        name: 'Design Phase',
        code: 'DESIGN',
        description: 'All design related activities',
        entityType: 'interior_plus',
        order: 1,
        defaultWeightage: 25,
        isTemplate: true,
        isActive: true
      })

      // Create Production Phase
      const productionPhase = await ProjectPhase.create({
        company: company._id,
        name: 'Production Phase',
        code: 'PRODUCTION',
        description: 'Manufacturing and production activities',
        entityType: 'interior_plus',
        order: 2,
        defaultWeightage: 30,
        isTemplate: true,
        isActive: true
      })

      // Create Installation Phase
      const installationPhase = await ProjectPhase.create({
        company: company._id,
        name: 'Installation Phase',
        code: 'INSTALLATION',
        description: 'On-site installation activities',
        entityType: 'interior_plus',
        order: 3,
        defaultWeightage: 35,
        isTemplate: true,
        isActive: true
      })

      // Create Handover Phase
      const handoverPhase = await ProjectPhase.create({
        company: company._id,
        name: 'Handover Phase',
        code: 'HANDOVER',
        description: 'QC and final handover',
        entityType: 'interior_plus',
        order: 4,
        defaultWeightage: 10,
        isTemplate: true,
        isActive: true
      })

      phases = [designPhase, productionPhase, installationPhase, handoverPhase]
      console.log('Created', phases.length, 'phase templates')

      // Create Activities and Tasks for each phase
      const phaseStructure = {
        'DESIGN': [
          {
            name: 'Concept Development',
            code: 'CONCEPT',
            tasks: [
              { name: 'Client Requirement Gathering', code: 'REQ', weightage: 5 },
              { name: 'Mood Board Creation', code: 'MOOD', weightage: 5 },
              { name: 'Initial Concept Presentation', code: 'PRES', weightage: 5 }
            ]
          },
          {
            name: '3D Design',
            code: '3DDESIGN',
            tasks: [
              { name: '3D Model Creation', code: '3DMODEL', weightage: 5 },
              { name: 'Material Selection', code: 'MATSEL', weightage: 5 },
              { name: 'Design Finalization', code: 'FINAL', weightage: 5 }
            ]
          }
        ],
        'PRODUCTION': [
          {
            name: 'Material Procurement',
            code: 'PROCURE',
            tasks: [
              { name: 'Vendor Quotation', code: 'QUOTE', weightage: 5 },
              { name: 'PO Generation', code: 'PO', weightage: 5 },
              { name: 'Material Receipt', code: 'GRN', weightage: 5 }
            ]
          },
          {
            name: 'Manufacturing',
            code: 'MFG',
            tasks: [
              { name: 'Carpentry Work', code: 'CARP', weightage: 10 },
              { name: 'Finishing Work', code: 'FINISH', weightage: 10 },
              { name: 'Quality Check', code: 'QC', weightage: 5 }
            ]
          }
        ],
        'INSTALLATION': [
          {
            name: 'Site Preparation',
            code: 'SITEPREP',
            tasks: [
              { name: 'Site Clearance', code: 'CLEAR', weightage: 5 },
              { name: 'Marking & Layout', code: 'MARK', weightage: 5 }
            ]
          },
          {
            name: 'Installation Work',
            code: 'INSTALL',
            tasks: [
              { name: 'Modular Installation', code: 'MODINST', weightage: 10 },
              { name: 'Electrical Fixtures', code: 'ELEC', weightage: 5 },
              { name: 'Touch-up & Cleaning', code: 'TOUCH', weightage: 5 }
            ]
          }
        ],
        'HANDOVER': [
          {
            name: 'Final QC',
            code: 'FINALQC',
            tasks: [
              { name: 'Punch List Items', code: 'PUNCH', weightage: 3 },
              { name: 'Client Walkthrough', code: 'WALK', weightage: 2 }
            ]
          },
          {
            name: 'Handover',
            code: 'HAND',
            tasks: [
              { name: 'Documentation Handover', code: 'DOCS', weightage: 2 },
              { name: 'Final Signoff', code: 'SIGN', weightage: 3 }
            ]
          }
        ]
      }

      for (const phase of phases) {
        const activitiesData = phaseStructure[phase.code] || []

        for (let i = 0; i < activitiesData.length; i++) {
          const actData = activitiesData[i]

          const activity = await ProjectActivity.create({
            company: company._id,
            phase: phase._id,
            name: actData.name,
            code: actData.code,
            entityType: 'interior_plus',
            order: i + 1,
            isTemplate: true,
            isActive: true
          })

          for (let j = 0; j < actData.tasks.length; j++) {
            const taskData = actData.tasks[j]

            await ProjectTask.create({
              company: company._id,
              phase: phase._id,
              activity: activity._id,
              name: taskData.name,
              code: taskData.code,
              entityType: 'interior_plus',
              order: j + 1,
              defaultWeightage: taskData.weightage,
              isTemplate: true,
              isActive: true
            })
          }
        }
      }
      console.log('Created activity and task templates')
    }

    // Refresh phases with activities and tasks
    phases = await ProjectPhase.find({ company: company._id, isTemplate: true }).sort({ order: 1 })

    // Create task instances for the project
    console.log('\nCreating task instances for project...')
    let taskOrder = 0
    let totalTasks = 0

    for (const phase of phases) {
      const activities = await ProjectActivity.find({ phase: phase._id, isTemplate: true }).sort({ order: 1 })

      for (const activity of activities) {
        const tasks = await ProjectTask.find({ activity: activity._id, isTemplate: true }).sort({ order: 1 })

        for (const task of tasks) {
          taskOrder++

          // Set varying progress for demonstration
          let completionPercentage = 0
          let status = 'not_started'

          if (phase.code === 'DESIGN') {
            completionPercentage = 100
            status = 'completed'
          } else if (phase.code === 'PRODUCTION') {
            if (activity.code === 'PROCURE') {
              completionPercentage = Math.floor(Math.random() * 40) + 60 // 60-100%
              status = completionPercentage === 100 ? 'completed' : 'in_progress'
            } else {
              completionPercentage = Math.floor(Math.random() * 30) // 0-30%
              status = completionPercentage > 0 ? 'in_progress' : 'not_started'
            }
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
            plannedStartDate: new Date(),
            plannedEndDate: new Date(Date.now() + (taskOrder * 7) * 24 * 60 * 60 * 1000),
            status,
            completionPercentage,
            weightage: task.defaultWeightage || 5,
            order: taskOrder,
            estimatedCost: {
              materials: Math.floor(Math.random() * 50000) + 10000,
              labor: Math.floor(Math.random() * 20000) + 5000,
              total: 0
            }
          })

          totalTasks++
        }
      }
    }

    console.log(`Created ${totalTasks} task instances for project`)

    // Calculate and update project completion
    const overallCompletion = await ProjectTaskInstance.calculateProjectCompletion(project._id)
    const phaseCompletion = await ProjectTaskInstance.getPhaseCompletion(project._id)

    project.completion.completionPercentage = overallCompletion
    await project.save()

    console.log('\n=== PROJECT PROGRESS SUMMARY ===')
    console.log('Project:', project.title)
    console.log('Project ID:', project.projectId)
    console.log('Overall Completion:', overallCompletion + '%')
    console.log('\nPhase-wise Completion:')
    for (const phase of phaseCompletion) {
      console.log(`  ${phase.phaseName}: ${Math.round(phase.avgCompletion)}% (${phase.completedTasks}/${phase.totalTasks} tasks)`)
    }

    console.log('\n=== SUCCESS ===')
    console.log('Test project with tasks created successfully!')
    console.log('You can now view the project at: /admin/projects/' + project._id)

    await mongoose.connection.close()
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    await mongoose.connection.close()
    process.exit(1)
  }
}

createTestProjectWithTasks()
