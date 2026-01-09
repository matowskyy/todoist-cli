import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'

vi.mock('../lib/api.js', () => ({
  getApi: vi.fn(),
}))

import { getApi } from '../lib/api.js'
import { registerProjectCommand } from '../commands/project.js'

const mockGetApi = vi.mocked(getApi)

function createMockApi() {
  return {
    getProjects: vi.fn().mockResolvedValue({ results: [], nextCursor: null }),
    getProject: vi.fn(),
    getTasks: vi.fn().mockResolvedValue({ results: [], nextCursor: null }),
  }
}

function createProgram() {
  const program = new Command()
  program.exitOverride()
  registerProjectCommand(program)
  return program
}

describe('project list', () => {
  let mockApi: ReturnType<typeof createMockApi>
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockApi = createMockApi()
    mockGetApi.mockResolvedValue(mockApi as any)
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  it('lists all projects', async () => {
    const program = createProgram()

    mockApi.getProjects.mockResolvedValue({
      results: [
        { id: 'proj-1', name: 'Work', isFavorite: false },
        { id: 'proj-2', name: 'Personal', isFavorite: false },
      ],
      nextCursor: null,
    })

    await program.parseAsync(['node', 'td', 'project', 'list'])

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Work'))
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Personal'))
  })

  it('outputs JSON with --json flag', async () => {
    const program = createProgram()

    mockApi.getProjects.mockResolvedValue({
      results: [{ id: 'proj-1', name: 'Work', isFavorite: true }],
      nextCursor: null,
    })

    await program.parseAsync(['node', 'td', 'project', 'list', '--json'])

    const output = consoleSpy.mock.calls[0][0]
    const parsed = JSON.parse(output)
    expect(parsed.results).toBeDefined()
    expect(parsed.results[0].name).toBe('Work')
  })

  it('outputs NDJSON with --ndjson flag', async () => {
    const program = createProgram()

    mockApi.getProjects.mockResolvedValue({
      results: [
        { id: 'proj-1', name: 'Work' },
        { id: 'proj-2', name: 'Personal' },
      ],
      nextCursor: null,
    })

    await program.parseAsync(['node', 'td', 'project', 'list', '--ndjson'])

    const output = consoleSpy.mock.calls[0][0]
    const lines = output.split('\n')
    expect(lines).toHaveLength(2)
  })

  it('shows cursor footer when more results exist', async () => {
    const program = createProgram()

    mockApi.getProjects.mockResolvedValue({
      results: [{ id: 'proj-1', name: 'Work' }],
      nextCursor: 'cursor-123',
    })

    await program.parseAsync(['node', 'td', 'project', 'list'])

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('more items exist'))
  })
})

describe('project view', () => {
  let mockApi: ReturnType<typeof createMockApi>
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockApi = createMockApi()
    mockGetApi.mockResolvedValue(mockApi as any)
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  it('resolves project by name', async () => {
    const program = createProgram()

    mockApi.getProjects.mockResolvedValue({
      results: [{ id: 'proj-1', name: 'Work', color: 'blue', isFavorite: true, url: 'https://...' }],
      nextCursor: null,
    })
    mockApi.getTasks.mockResolvedValue({ results: [], nextCursor: null })

    await program.parseAsync(['node', 'td', 'project', 'view', 'Work'])

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Work'))
  })

  it('resolves project by id: prefix', async () => {
    const program = createProgram()

    mockApi.getProject.mockResolvedValue({
      id: 'proj-1',
      name: 'Work',
      color: 'blue',
      isFavorite: false,
      url: 'https://...',
    })
    mockApi.getTasks.mockResolvedValue({ results: [], nextCursor: null })

    await program.parseAsync(['node', 'td', 'project', 'view', 'id:proj-1'])

    expect(mockApi.getProject).toHaveBeenCalledWith('proj-1')
  })

  it('shows project details', async () => {
    const program = createProgram()

    mockApi.getProject.mockResolvedValue({
      id: 'proj-1',
      name: 'Work',
      color: 'blue',
      isFavorite: true,
      url: 'https://todoist.com/app/project/proj-1',
    })
    mockApi.getTasks.mockResolvedValue({ results: [], nextCursor: null })

    await program.parseAsync(['node', 'td', 'project', 'view', 'id:proj-1'])

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('ID:'))
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Color:'))
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Favorite:'))
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('URL:'))
  })

  it('lists tasks in project', async () => {
    const program = createProgram()

    mockApi.getProject.mockResolvedValue({
      id: 'proj-1',
      name: 'Work',
      color: 'blue',
      isFavorite: false,
      url: 'https://...',
    })
    mockApi.getTasks.mockResolvedValue({
      results: [
        { id: 'task-1', content: 'Task A', priority: 4 },
        { id: 'task-2', content: 'Task B', priority: 1 },
      ],
      nextCursor: null,
    })

    await program.parseAsync(['node', 'td', 'project', 'view', 'id:proj-1'])

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Tasks (2)'))
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Task A'))
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Task B'))
  })

  it('throws for non-existent project', async () => {
    const program = createProgram()

    mockApi.getProjects.mockResolvedValue({ results: [], nextCursor: null })

    await expect(
      program.parseAsync(['node', 'td', 'project', 'view', 'nonexistent'])
    ).rejects.toThrow('not found')
  })
})
