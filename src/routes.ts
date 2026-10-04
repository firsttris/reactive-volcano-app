/**
 * Type-safe route definitions and navigation helpers
 *
 * This file centralizes all route paths and provides type-safe helper functions
 * to prevent typos and ensure correct route usage throughout the application.
 */

/**
 * Route path constants for Router configuration
 * These use relative paths for nested routes in SolidJS Router
 */
export const ROUTES = {
  // Root routes
  ROOT: "/",
  CONNECT: "/connect",

  // Device routes (for Router definitions - relative paths)
  DEVICE: {
    BASE: "/device",
    VOLCANO: {
      BASE: "/volcano",
      ROOT: "/",
      WORKFLOWS: "/workflows",
      HISTORY: "/history",
      SETTINGS: "/settings",
      WORKFLOW: {
        BASE: "/workflow",
        LIST: "/list/:workflowListId",
        FORM: "/form/:workflowListId/:workflowStepId",
      },
    },
    VENTY_VEAZY: {
      BASE: "/venty-veazy",
      ROOT: "/",
      HISTORY: "/history",
      SETTINGS: "/settings",
    },
    CRAFTY: {
      BASE: "/crafty",
      ROOT: "/",
      HISTORY: "/history",
      SETTINGS: "/settings",
    },
  },
} as const;

/**
 * Type-safe route builder functions for navigation
 * These return absolute paths for use with navigate()
 */
export const buildRoute = {
  /**
   * Build a route to the Volcano device main view
   */
  volcanoRoot: () => "/device/volcano" as const,

  /**
   * Build a route to the Volcano workflow overview
   */
  volcanoWorkflows: () => "/device/volcano/workflows" as const,

  /**
   * Build a route to the Volcano settings
   */
  volcanoSettings: () => "/device/volcano/settings" as const,

  /**
   * Build a route to the session history of a device
   */
  volcanoHistory: () => "/device/volcano/history" as const,
  ventyVeazyHistory: () => "/device/venty-veazy/history" as const,
  craftyHistory: () => "/device/crafty/history" as const,

  /**
   * Build a route to the workflow list for a specific workflow
   * @param workflowListId - The ID of the workflow list to display
   */
  workflowList: (workflowListId: string) =>
    `/device/volcano/workflow/list/${workflowListId}`,

  /**
   * Build a route to edit a specific workflow step
   * @param workflowListId - The ID of the workflow list
   * @param workflowStepId - The ID of the workflow step to edit
   */
  workflowForm: (workflowListId: string, workflowStepId: string) =>
    `/device/volcano/workflow/form/${workflowListId}/${workflowStepId}`,

  /**
   * Build a route to the Venty/Veazy device view
   */
  ventyVeazyRoot: () => "/device/venty-veazy" as const,

  /**
   * Build a route to the Venty/Veazy settings
   */
  ventyVeazySettings: () => "/device/venty-veazy/settings" as const,

  /**
   * Build a route to the Crafty device view
   */
  craftyRoot: () => "/device/crafty" as const,

  /**
   * Build a route to the Crafty settings
   */
  craftySettings: () => "/device/crafty/settings" as const,

  /**
   * Build a route to the connection screen
   */
  connect: () => "/connect" as const,

  /**
   * Build a route to the root/home screen
   */
  root: () => "/" as const,
} as const;
