/**
 * @jest-environment node
 */
import { readAwsConfig } from '../src/config-reader'
import fs from 'node:fs'
// import path from 'node:path'
// import os from 'node:os'

jest.mock('node:fs')

const mockFs = fs as jest.Mocked<typeof fs>

describe('readAwsConfig', () => {
  // const cfgPath = path.join(os.homedir(), '.aws', 'config')

  afterEach(() => jest.resetAllMocks())

  it('parses multiple profiles', () => {
    mockFs.existsSync.mockReturnValue(true)
    mockFs.readFileSync.mockReturnValue(`
[profile dev]
aws_access_key_id = AAA
sso_account_id    = 123

[profile prod]
aws_access_key_id = BBB
`)

    const cfg = readAwsConfig()
    expect(cfg).toEqual({
      dev: { aws_access_key_id: 'AAA', sso_account_id: '123' },
      prod: { aws_access_key_id: 'BBB' },
    })
  })

  it('throws when file does not exist', () => {
    mockFs.existsSync.mockReturnValue(false)
    expect(() => readAwsConfig()).toThrow(/Config not found/)
  })
})
