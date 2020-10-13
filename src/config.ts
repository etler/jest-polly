import NodeHttpAdapter from '@pollyjs/adapter-node-http'
import { PollyConfig } from '@pollyjs/core'
import FSPersister from '@pollyjs/persister-fs'
import merge from 'lodash.merge'
import { dirname, join } from 'path'

import { POLLY_MODE, POLLY_RECORD_IF_MISSING } from './environment'

export type Secrets = Record<string, string> | (string | undefined)[]

interface PollyConfigWithSecrets extends PollyConfig {
  /**
   * Secrets to filter out before persisting the recording.
   *
   * Format:
   *
   * ```ts
   * secrets: {
   *   'my secret data': 'replace with'
   * }
   * ```
   *
   * or just use an array of secrets and they will be replaced with "x":
   *
   * ```ts
   * secrets: [process.env.SECRET, 'my secret data', 'another secret']
   * ```
   */
  secrets?: Secrets
}

export class JestPollyConfigService {
  private $config!: PollyConfigWithSecrets

  /**
   * Factory method is used to invoke config generation, because `global.jasmine` object is
   * only available inside a test or lifecycle methods (before, after).
   */
  // eslint-disable-next-line class-methods-use-this
  private factory(): PollyConfigWithSecrets {
    const recordingsRoot = dirname(global.jasmine.testPath)
    const recordingsDirectory = join(recordingsRoot, '__recordings__')

    return {
      adapters: [NodeHttpAdapter],
      persister: FSPersister,
      persisterOptions: {
        keepUnusedRequests: false,
        fs: {
          recordingsDir: recordingsDirectory,
        },
      },
      mode: POLLY_MODE,
      recordIfMissing: POLLY_RECORD_IF_MISSING,
      recordFailedRequests: true,
      matchRequestsBy: {
        headers: false,
        body: false,
      },
    }
  }

  private init() {
    if (!this.$config) {
      this.$config = this.factory()
    }
  }

  get config() {
    this.init()
    return this.$config
  }

  set config(config: PollyConfigWithSecrets) {
    this.init()
    merge(this.$config, config)
  }
}

export const jestPollyConfigService = new JestPollyConfigService()
