import _ from 'lodash'
import postcss from 'postcss'

import substituteTailwindAtRules from './lib/substituteTailwindAtRules'
import evaluateTailwindFunctions from './lib/evaluateTailwindFunctions'
import substituteVariantsAtRules from './lib/substituteVariantsAtRules'
import substituteResponsiveAtRules from './lib/substituteResponsiveAtRules'
import convertLayerAtRulesToControlComments from './lib/convertLayerAtRulesToControlComments'
import substituteScreenAtRules from './lib/substituteScreenAtRules'
import substituteClassApplyAtRules from './lib/substituteClassApplyAtRules'
import applyImportantConfiguration from './lib/applyImportantConfiguration'
import purgeUnusedStyles from './lib/purgeUnusedStyles'

import corePlugins from './corePlugins'
import processPlugins from './util/processPlugins'
import cloneNodes from './util/cloneNodes'
import { issueFlagNotices } from './featureFlags.js'

let flagsIssued = null

export default function(getConfig) {
  return function(css) {
    const config = getConfig()

    if (!flagsIssued || !_.isEqual(flagsIssued, _.pick(config, ['future', 'experimental']))) {
      flagsIssued = _.pick(config, ['future', 'experimental'])
      issueFlagNotices(config)
    }

    const processedPlugins = processPlugins([...corePlugins(config), ...config.plugins], config)

    const getProcessedPlugins = function() {
      return {
        ...processedPlugins,
        base: cloneNodes(processedPlugins.base),
        components: cloneNodes(processedPlugins.components),
        utilities: cloneNodes(processedPlugins.utilities),
      }
    }

    return postcss([
      substituteTailwindAtRules(config, getProcessedPlugins()),
      evaluateTailwindFunctions(config),
      substituteVariantsAtRules(config, getProcessedPlugins()),
      substituteResponsiveAtRules(config),
      convertLayerAtRulesToControlComments(config),
      substituteScreenAtRules(config),
      substituteClassApplyAtRules(config, getProcessedPlugins),
      applyImportantConfiguration(config),
      purgeUnusedStyles(config),
    ]).process(css, { from: _.get(css, 'source.input.file') })
  }
}
