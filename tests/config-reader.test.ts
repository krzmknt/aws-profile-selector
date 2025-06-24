/**
 * @jest-environment node
 */
import { jest } from '@jest/globals'
import { readAwsConfig } from '../src/config-reader'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

describe('readAwsConfig', () => {
  const originalExistsSync = fs.existsSync
  const originalReadFileSync = fs.readFileSync
  const originalHomedir = os.homedir

  beforeEach(() => {
    // Mock os.homedir
    os.homedir = jest.fn(() => '/test/home')
  })

  afterEach(() => {
    // Restore original functions
    fs.existsSync = originalExistsSync
    fs.readFileSync = originalReadFileSync
    os.homedir = originalHomedir
    jest.clearAllMocks()
  })

  it('parses multiple profiles', () => {
    const expectedPath = path.join('/test/home', '.aws', 'config')
    
    // Mock fs functions
    fs.existsSync = jest.fn((filePath) => filePath === expectedPath) as any
    fs.readFileSync = jest.fn((filePath) => {
      if (filePath === expectedPath) {
        return `
[profile dev]
aws_access_key_id = AAA
sso_account_id    = 123

[profile prod]
aws_access_key_id = BBB
`
      }
      throw new Error('Unexpected file path')
    }) as any

    const cfg = readAwsConfig()
    
    expect(fs.existsSync).toHaveBeenCalledWith(expectedPath)
    expect(fs.readFileSync).toHaveBeenCalledWith(expectedPath, 'utf8')
    expect(cfg).toEqual({
      dev: { aws_access_key_id: 'AAA', sso_account_id: '123' },
      prod: { aws_access_key_id: 'BBB' },
    })
  })

  it('throws when file does not exist', () => {
    const expectedPath = path.join('/test/home', '.aws', 'config')
    
    // Mock fs.existsSync to return false
    fs.existsSync = jest.fn(() => false) as any
    
    expect(() => readAwsConfig()).toThrow(/Config not found/)
    expect(fs.existsSync).toHaveBeenCalledWith(expectedPath)
  })
})