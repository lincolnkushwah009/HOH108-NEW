import mongoose from 'mongoose'
import ProjectPhase from '../models/ProjectPhase.js'
import ProjectActivity from '../models/ProjectActivity.js'
import ProjectTask from '../models/ProjectTask.js'

/**
 * Interior Plus Project Template Seeder
 * Based on the standard interior design project workflow
 */

// Interior Plus Phases, Activities, and Tasks
const interiorPlusTemplate = {
  phases: [
    {
      name: 'Design Phase',
      code: 'DESIGN',
      description: 'Initial design and planning phase',
      order: 1,
      defaultWeightage: 15,
      color: '#6366f1',
      icon: 'Palette',
      activities: [
        {
          name: 'Initial Design Discussion',
          code: 'IDD',
          order: 1,
          defaultWeightage: 10,
          tasks: [
            { name: 'Pre-Closure CX Review', code: 'PRECX', order: 1, defaultWeightage: 30 },
            { name: 'Design Brief Collection', code: 'DBRIEF', order: 2, defaultWeightage: 40 },
            { name: 'Property Details Capture', code: 'PROPCAP', order: 3, defaultWeightage: 30 }
          ]
        },
        {
          name: 'MMT',
          code: 'MMT',
          order: 2,
          defaultWeightage: 10,
          tasks: [
            { name: 'MMT Booking', code: 'MMTBK', order: 1, defaultWeightage: 30 },
            { name: 'MMT Completion', code: 'MMTCMP', order: 2, defaultWeightage: 40 },
            { name: 'Site Measurement Report', code: 'MMTRPT', order: 3, defaultWeightage: 30 }
          ]
        },
        {
          name: 'Sketch Up Shell',
          code: 'SKETCH',
          order: 3,
          defaultWeightage: 10,
          tasks: [
            { name: 'SKP Shell Creation', code: 'SKPCRE', order: 1, defaultWeightage: 40 },
            { name: 'SKP Shell Review & Approval', code: 'SKPREV', order: 2, defaultWeightage: 60 }
          ]
        },
        {
          name: 'Material Selection',
          code: 'MATSEL',
          order: 4,
          defaultWeightage: 10,
          tasks: [
            { name: 'Colour Selection', code: 'COLSEL', order: 1, defaultWeightage: 30 },
            { name: 'Material Board Preparation', code: 'MATBRD', order: 2, defaultWeightage: 35 },
            { name: 'Material Finalization', code: 'MATFIN', order: 3, defaultWeightage: 35 }
          ]
        },
        {
          name: 'Iterations of Designs to be logged',
          code: 'ITER',
          order: 5,
          defaultWeightage: 15,
          tasks: [
            { name: '2D Design Completion', code: '2DCOMP', order: 1, defaultWeightage: 30 },
            { name: '3D Rendering', code: '3DREND', order: 2, defaultWeightage: 40 },
            { name: 'Client Design Presentation', code: 'CLIPRES', order: 3, defaultWeightage: 30 }
          ]
        },
        {
          name: 'Design Sign Off',
          code: 'SIGNOFF',
          order: 6,
          defaultWeightage: 10,
          tasks: [
            { name: 'Internal Design Review', code: 'INTREV', order: 1, defaultWeightage: 30 },
            { name: 'Client Approval', code: 'CLIAPP', order: 2, defaultWeightage: 40 },
            { name: 'Design Head Sign Off', code: 'DHSIGN', order: 3, defaultWeightage: 30 }
          ]
        },
        {
          name: 'Validation',
          code: 'VALID',
          order: 7,
          defaultWeightage: 10,
          tasks: [
            { name: 'Validation Drawing Started', code: 'VDWGS', order: 1, defaultWeightage: 30 },
            { name: 'Validation Drawing Completed', code: 'VDWGC', order: 2, defaultWeightage: 40 },
            { name: 'Site Validation', code: 'SITEVAL', order: 3, defaultWeightage: 30 }
          ]
        },
        {
          name: 'Push to Production (P2P)',
          code: 'P2PDESIGN',
          order: 8,
          defaultWeightage: 15,
          tasks: [
            { name: '10% Payment Collection', code: 'PAY10', order: 1, defaultWeightage: 8 },
            { name: 'Quote & Requirements', code: 'QUOTREQ', order: 2, defaultWeightage: 8 },
            { name: 'P2P Drawing Started', code: 'P2PDWGS', order: 3, defaultWeightage: 10 },
            { name: 'P2P Drawing Completed', code: 'P2PDWGC', order: 4, defaultWeightage: 12 },
            { name: 'QC Review', code: 'QCREV', order: 5, defaultWeightage: 12 },
            { name: 'QC Approval', code: 'QCAPP', order: 6, defaultWeightage: 10 },
            { name: 'SOD Approval', code: 'SODAPP', order: 7, defaultWeightage: 10 },
            { name: '60% Payment Collection', code: 'PAY60', order: 8, defaultWeightage: 10 },
            { name: 'GFC Sign-off', code: 'GFCSIGN', order: 9, defaultWeightage: 10 },
            { name: 'P2P Handover', code: 'P2PHAND', order: 10, defaultWeightage: 10, isMilestone: true }
          ]
        },
        {
          name: 'CX Status & Tracking',
          code: 'CXTRACK',
          order: 9,
          defaultWeightage: 10,
          tasks: [
            { name: 'CX Status Update', code: 'CXSTAT', order: 1, defaultWeightage: 25 },
            { name: 'Design Dependency Review', code: 'DESDEP', order: 2, defaultWeightage: 25 },
            { name: 'WIP Status Review', code: 'WIPREV', order: 3, defaultWeightage: 25 },
            { name: 'P2P Projection vs Actual', code: 'PVA', order: 4, defaultWeightage: 25 }
          ]
        }
      ]
    },
    {
      name: 'P2P Phase',
      code: 'P2P',
      description: 'Production to Project phase - Factory and Installation',
      order: 2,
      defaultWeightage: 60,
      color: '#8b5cf6',
      icon: 'Factory',
      activities: [
        {
          name: 'Factory Production',
          code: 'FACTORY',
          order: 1,
          defaultWeightage: 40,
          estimatedDuration: { value: 15, unit: 'days' },
          tasks: [
            { name: 'Creation of BOM', code: 'BOM', order: 1, defaultWeightage: 10, requiresMaterial: true },
            { name: 'Pasting', code: 'PASTE', order: 2, defaultWeightage: 10, requiresVendor: true },
            { name: 'Cutting', code: 'CUT', order: 3, defaultWeightage: 10, requiresVendor: true },
            { name: 'Edge Banding', code: 'EDGE', order: 4, defaultWeightage: 10, requiresVendor: true },
            { name: 'Drilling', code: 'DRILL', order: 5, defaultWeightage: 10, requiresVendor: true },
            { name: 'Assembly', code: 'ASSEM', order: 6, defaultWeightage: 15, requiresVendor: true },
            { name: 'QC', code: 'QC1', order: 7, defaultWeightage: 10, isQCCheckpoint: true },
            { name: 'Snags', code: 'SNAG1', order: 8, defaultWeightage: 5 },
            { name: 'Packaging', code: 'PACK', order: 9, defaultWeightage: 10, requiresVendor: true },
            { name: 'Dispatch', code: 'DISP', order: 10, defaultWeightage: 10, isMilestone: true }
          ]
        },
        {
          name: 'Installation',
          code: 'INSTALL',
          order: 2,
          defaultWeightage: 60,
          estimatedDuration: { value: 20, unit: 'days' },
          tasks: [
            { name: 'False Ceiling', code: 'FC', order: 1, defaultWeightage: 8, requiresVendor: true },
            { name: 'Plumbing', code: 'PLUMB', order: 2, defaultWeightage: 5, requiresVendor: true },
            { name: 'Electrical', code: 'ELEC', order: 3, defaultWeightage: 8, requiresVendor: true },
            { name: 'Initial Painting', code: 'PAINT1', order: 4, defaultWeightage: 5, requiresVendor: true },
            { name: 'Wood Works Installation', code: 'WOOD', order: 5, defaultWeightage: 15, requiresVendor: true, requiresMaterial: true },
            { name: 'Onsite Carpentry', code: 'CARP', order: 6, defaultWeightage: 8, requiresVendor: true },
            { name: 'Granite & Tiling', code: 'TILE', order: 7, defaultWeightage: 8, requiresVendor: true, requiresMaterial: true },
            { name: 'Glass Works', code: 'GLASS', order: 8, defaultWeightage: 5, requiresVendor: true, requiresMaterial: true },
            { name: 'Lightings', code: 'LIGHT', order: 9, defaultWeightage: 5, requiresVendor: true, requiresMaterial: true },
            { name: 'Final Painting', code: 'PAINT2', order: 10, defaultWeightage: 5, requiresVendor: true },
            { name: 'Wall Paper', code: 'WALLP', order: 11, defaultWeightage: 3, requiresVendor: true, requiresMaterial: true },
            { name: 'Miscellaneous', code: 'MISC1', order: 12, defaultWeightage: 5 },
            { name: 'Snags', code: 'SNAG2', order: 13, defaultWeightage: 5 },
            { name: 'Deep Cleaning', code: 'CLEAN', order: 14, defaultWeightage: 5, requiresVendor: true },
            { name: 'Handover', code: 'HAND', order: 15, defaultWeightage: 5, isMilestone: true },
            { name: 'CSAT', code: 'CSAT', order: 16, defaultWeightage: 5 }
          ]
        }
      ]
    },
    {
      name: 'Construction',
      code: 'CONST',
      description: 'Civil construction phase',
      order: 3,
      defaultWeightage: 25,
      color: '#f59e0b',
      icon: 'Building2',
      activities: [
        {
          name: 'Site Preparation',
          code: 'SITEPREP',
          order: 1,
          defaultWeightage: 10,
          estimatedDuration: { value: 5, unit: 'days' },
          tasks: [
            { name: 'Site Cleaning', code: 'SCLEAN', order: 1, defaultWeightage: 25, requiresVendor: true },
            { name: 'Labor Shed', code: 'LSHED', order: 2, defaultWeightage: 25 },
            { name: 'Electrical Connection', code: 'ECON', order: 3, defaultWeightage: 25, requiresVendor: true },
            { name: 'Water Connection', code: 'WCON', order: 4, defaultWeightage: 25, requiresVendor: true }
          ]
        },
        {
          name: 'Earth Works',
          code: 'EARTH',
          order: 2,
          defaultWeightage: 10,
          estimatedDuration: { value: 7, unit: 'days' },
          tasks: [
            { name: 'Excavation', code: 'EXCAV', order: 1, defaultWeightage: 60, requiresVendor: true },
            { name: 'Back Filling', code: 'BFILL', order: 2, defaultWeightage: 40, requiresVendor: true }
          ]
        },
        {
          name: 'Sub Structure',
          code: 'SUBST',
          order: 3,
          defaultWeightage: 20,
          estimatedDuration: { value: 15, unit: 'days' },
          tasks: [
            { name: 'Footing', code: 'FOOT', order: 1, defaultWeightage: 20, requiresVendor: true, requiresMaterial: true },
            { name: 'PCC', code: 'PCC', order: 2, defaultWeightage: 15, requiresVendor: true, requiresMaterial: true },
            { name: 'Ledge Walls', code: 'LEDGE', order: 3, defaultWeightage: 20, requiresVendor: true },
            { name: 'Plinth', code: 'PLINTH', order: 4, defaultWeightage: 20, requiresVendor: true },
            { name: 'QC', code: 'QC2', order: 5, defaultWeightage: 25, isQCCheckpoint: true }
          ]
        },
        {
          name: 'Super Structure',
          code: 'SUPER',
          order: 4,
          defaultWeightage: 35,
          estimatedDuration: { value: 30, unit: 'days' },
          tasks: [
            { name: 'Columns', code: 'COL', order: 1, defaultWeightage: 12, requiresVendor: true, requiresMaterial: true },
            { name: 'Slabs', code: 'SLAB', order: 2, defaultWeightage: 15, requiresVendor: true, requiresMaterial: true },
            { name: 'Conduting', code: 'COND', order: 3, defaultWeightage: 8, requiresVendor: true },
            { name: 'Brick Work', code: 'BRICK', order: 4, defaultWeightage: 12, requiresVendor: true, requiresMaterial: true },
            { name: 'Plastering - External', code: 'PLEXT', order: 5, defaultWeightage: 10, requiresVendor: true },
            { name: 'Plastering - Internal', code: 'PLINT', order: 6, defaultWeightage: 10, requiresVendor: true },
            { name: 'Overhead Tank', code: 'OHT', order: 7, defaultWeightage: 8, requiresVendor: true },
            { name: 'Parapet', code: 'PARA', order: 8, defaultWeightage: 8, requiresVendor: true },
            { name: 'QC', code: 'QC3', order: 9, defaultWeightage: 17, isQCCheckpoint: true }
          ]
        },
        {
          name: 'Finishing Works',
          code: 'FINISH',
          order: 5,
          defaultWeightage: 25,
          estimatedDuration: { value: 25, unit: 'days' },
          tasks: [
            { name: 'Electrical Work', code: 'ELECW', order: 1, defaultWeightage: 12, requiresVendor: true },
            { name: 'Plumbing Works', code: 'PLUMBW', order: 2, defaultWeightage: 10, requiresVendor: true },
            { name: 'Sanitary', code: 'SANIT', order: 3, defaultWeightage: 8, requiresVendor: true, requiresMaterial: true },
            { name: 'Tiling', code: 'TILE2', order: 4, defaultWeightage: 12, requiresVendor: true, requiresMaterial: true },
            { name: 'Wood Works', code: 'WOODW', order: 5, defaultWeightage: 10, requiresVendor: true },
            { name: 'UPVC', code: 'UPVC', order: 6, defaultWeightage: 8, requiresVendor: true, requiresMaterial: true },
            { name: 'Glass Works', code: 'GLASSW', order: 7, defaultWeightage: 6, requiresVendor: true, requiresMaterial: true },
            { name: 'Fabrication', code: 'FAB', order: 8, defaultWeightage: 8, requiresVendor: true },
            { name: 'Miscellaneous', code: 'MISC2', order: 9, defaultWeightage: 6 },
            { name: 'QC', code: 'QC4', order: 10, defaultWeightage: 10, isQCCheckpoint: true },
            { name: 'Snags', code: 'SNAG3', order: 11, defaultWeightage: 5 },
            { name: 'Miscellaneous', code: 'MISC3', order: 12, defaultWeightage: 5 }
          ]
        }
      ]
    }
  ]
}

/**
 * Seed project templates for a company
 */
export const seedProjectTemplates = async (companyId, userId) => {
  try {
    console.log('Starting project template seeding...')

    // Check if templates already exist for this company
    const existingPhases = await ProjectPhase.countDocuments({
      company: companyId,
      entityType: 'interior_plus',
      isTemplate: true
    })

    if (existingPhases > 0) {
      console.log('Templates already exist for this company. Skipping...')
      return { success: true, message: 'Templates already exist', skipped: true }
    }

    let phasesCreated = 0
    let activitiesCreated = 0
    let tasksCreated = 0

    // Create phases, activities, and tasks
    for (const phaseData of interiorPlusTemplate.phases) {
      // Create Phase
      const phase = await ProjectPhase.create({
        company: companyId,
        entityType: 'interior_plus',
        name: phaseData.name,
        code: phaseData.code,
        description: phaseData.description,
        order: phaseData.order,
        defaultWeightage: phaseData.defaultWeightage,
        color: phaseData.color,
        icon: phaseData.icon,
        isTemplate: true,
        isActive: true,
        createdBy: userId
      })
      phasesCreated++
      console.log(`Created phase: ${phase.name}`)

      // Create Activities for this phase
      for (const activityData of phaseData.activities) {
        const activity = await ProjectActivity.create({
          company: companyId,
          phase: phase._id,
          entityType: 'interior_plus',
          name: activityData.name,
          code: activityData.code,
          order: activityData.order,
          defaultWeightage: activityData.defaultWeightage,
          estimatedDuration: activityData.estimatedDuration || { value: 0, unit: 'days' },
          isTemplate: true,
          isActive: true,
          createdBy: userId
        })
        activitiesCreated++
        console.log(`  Created activity: ${activity.name}`)

        // Create Tasks for this activity
        if (activityData.tasks && activityData.tasks.length > 0) {
          for (const taskData of activityData.tasks) {
            await ProjectTask.create({
              company: companyId,
              activity: activity._id,
              phase: phase._id,
              entityType: 'interior_plus',
              name: taskData.name,
              code: taskData.code,
              order: taskData.order,
              defaultWeightage: taskData.defaultWeightage,
              requiresVendor: taskData.requiresVendor || false,
              requiresMaterial: taskData.requiresMaterial || false,
              isQCCheckpoint: taskData.isQCCheckpoint || false,
              isMilestone: taskData.isMilestone || false,
              isTemplate: true,
              isActive: true,
              createdBy: userId
            })
            tasksCreated++
          }
          console.log(`    Created ${activityData.tasks.length} tasks`)
        }
      }
    }

    console.log(`\nSeeding complete:`)
    console.log(`  Phases: ${phasesCreated}`)
    console.log(`  Activities: ${activitiesCreated}`)
    console.log(`  Tasks: ${tasksCreated}`)

    return {
      success: true,
      message: 'Templates created successfully',
      stats: { phasesCreated, activitiesCreated, tasksCreated }
    }
  } catch (error) {
    console.error('Error seeding project templates:', error)
    throw error
  }
}

/**
 * Delete all templates for a company
 */
export const deleteProjectTemplates = async (companyId) => {
  try {
    await ProjectTask.deleteMany({ company: companyId, isTemplate: true })
    await ProjectActivity.deleteMany({ company: companyId, isTemplate: true })
    await ProjectPhase.deleteMany({ company: companyId, isTemplate: true })

    return { success: true, message: 'Templates deleted successfully' }
  } catch (error) {
    console.error('Error deleting project templates:', error)
    throw error
  }
}

export default { seedProjectTemplates, deleteProjectTemplates }
