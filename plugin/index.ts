import { createLogger, Plugin } from 'vite'

import { PLUGIN_NAME } from './lib/constant'
import { getDefaultHosts } from './lib/util'
import Mkcert, { MkcertOptions } from './mkcert'

export { BaseSource } from './mkcert/source'
export type { SourceInfo } from './mkcert/source'

export type ViteCertificateOptions = MkcertOptions & {
  /**
   * The hosts that needs to generate the certificate.
   */
  hosts?: string[]
}

const plugin = (options: ViteCertificateOptions = {}): Plugin => {
  return {
    name: PLUGIN_NAME,
    apply: 'serve',
    config: async ({ server = {}, logLevel }) => {
      if (server.https === false) {
        return
      }

      const { hosts = [], ...mkcertOptions } = options

      const logger = createLogger(logLevel, {
        prefix: PLUGIN_NAME
      })
      const mkcert = Mkcert.create({
        logger,
        ...mkcertOptions
      })

      await mkcert.init()

      const allHosts = [...getDefaultHosts(), ...hosts]

      if (typeof server.host === 'string') {
        allHosts.push(server.host)
      }

      const uniqueHosts = Array.from(new Set(allHosts)).filter(item => !!item)

      const certificate = await mkcert.install(uniqueHosts)

      return {
        server: {
          https: {
            ...certificate
          }
        },
        preview: {
          https: {
            ...certificate
          }
        }
      }
    }
  }
}

export default plugin
