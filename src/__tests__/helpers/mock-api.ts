import { vi } from 'vitest'
import type { TodoistApi } from '@doist/todoist-api-typescript'

export function createMockApi(overrides: Partial<TodoistApi> = {}): TodoistApi {
  return {
    // Tasks
    getTasks: vi.fn().mockResolvedValue({ results: [], nextCursor: null }),
    getTask: vi.fn(),
    addTask: vi.fn(),
    updateTask: vi.fn(),
    closeTask: vi.fn(),
    deleteTask: vi.fn(),
    moveTask: vi.fn(),
    quickAddTask: vi.fn(),
    // Projects
    getProjects: vi.fn().mockResolvedValue({ results: [], nextCursor: null }),
    getProject: vi.fn(),
    // Sections
    getSections: vi.fn().mockResolvedValue({ results: [], nextCursor: null }),
    addSection: vi.fn(),
    deleteSection: vi.fn(),
    // Labels
    getLabels: vi.fn().mockResolvedValue({ results: [], nextCursor: null }),
    addLabel: vi.fn(),
    deleteLabel: vi.fn(),
    // Comments
    getComments: vi.fn().mockResolvedValue({ results: [], nextCursor: null }),
    addComment: vi.fn(),
    deleteComment: vi.fn(),
    // User
    getUser: vi.fn(),
    ...overrides,
  } as unknown as TodoistApi
}
